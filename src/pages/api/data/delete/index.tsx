// lists the namespaces for the user given a db (index)

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { array, object, string, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import initializePinecone from '@/utils/setup/pinecone';
import runMiddleware from '@/utils/setup/middleware';
import supabase from '@/utils/setup/supabase';
import { subtractAnalyticsCount } from '@/utils/analytics/requestTracker';

type Data = {
  success?: boolean
  error?: string
}

const bodySchema = object({
  db: string(),
  collection: string(),
  vectorIds: array(string())
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  await runMiddleware(req, res);

  if (req.method === 'POST') {

    // Extract token
    let userData;
    try {
      userData = await authHandler(req);
    } catch (e: any) {
      return res.status(403).json({error: e})
    }
   
    if (!userData) return res.status(403).json({ error: 'Invalid auth' });

    // parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({error: 'Invalid required parameters', success: false});

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { db, collection, vectorIds } = req.body;

    try {
      const pinecone = await initializePinecone(userData.pineconeKey, userData.pineconeEnv);

      const index = pinecone.Index('mindplug');
      await index.delete1({
        ids: vectorIds,
        namespace: `${db}-${collection}-${userData.userId}`
      });

      const prevCollec = await supabase.from('collections').select('totalVectors, collectionId').eq('projectName', db).eq('userId', userData.userId).eq('collection', collection).single();
      await supabase.from('collections').update({ totalVectors: prevCollec.data?.totalVectors - vectorIds.length }).eq('userId', userData.userId).eq('collection', collection).eq('projectName', db);
      
      const proj = await supabase.from('dbs').select('totalVectors').eq('userId', userData.userId).eq('projectName', db).single();
      await supabase.from('dbs').update({ totalVectors: proj.data?.totalVectors - vectorIds.length }).eq('userId', userData.userId).eq('projectName', db);

      await Promise.all(vectorIds.map(async (id) => {
        return await supabase.from('vectors').delete().eq('collectionId', prevCollec.data?.collectionId).eq('vectorId', id);
      }))

      
      await subtractAnalyticsCount({ totalVectors: vectorIds.length, analytics: userData.analytics });
      return res.status(200).json({ success: true });

    } catch (e) {
      let toSend = typeof (e) === 'string' ? e : 'Unable to delete data. Please contact support';
      return res.status(500).json({ error: toSend });
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request' })
  }

    
  
}
