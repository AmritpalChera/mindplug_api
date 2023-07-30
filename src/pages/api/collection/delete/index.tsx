// lists the namespaces for the user given a db (index)

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import initializePinecone from '@/utils/setup/pinecone';
import runMiddleware from '@/utils/setup/middleware';
import supabase from '@/utils/setup/supabase';
import { subtractAnalyticsCount } from '@/utils/analytics/requestTracker';

type Data = {
  success?: boolean,
  data?: any,
  error?: string
}

const bodySchema = object({
  db: string(),
  collection: string()
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
    const { db, collection } = req.body;
    let deleted;
    try {

      const database = await supabase.from('dbs').select('internalStorage, index').eq('userId', userData.userId).eq('projectName', db).single();
      if (database.data?.internalStorage) userData.pineconeKey = '';
      

      const pinecone = await initializePinecone(userData.pineconeKey, userData.pineconeEnv);

      const index = pinecone.Index('mindplug');
      await index.delete1({
        deleteAll: true,
        namespace: `${db}-${collection}-${userData.userId}`
      });
      const delCollec = await supabase.from('collections').delete().eq('userId', userData.userId).eq('collection', collection).eq('projectName', db).select('collectionId, totalVectors').single();
      if (delCollec.data) {
        // update project details
        const proj = await supabase.from('dbs').select('totalVectors').eq('userId', userData.userId).eq('projectName', db).single();
        await supabase.from('dbs').update({ totalVectors: proj.data?.totalVectors - delCollec.data.totalVectors }).eq('userId', userData.userId).eq('projectName', db);

        //delete vectors
        deleted = await supabase.from('vectors').delete().eq('collectionId', delCollec.data?.collectionId).select('vectorId');
        if (deleted.error) {
          console.log('could not delete vectors: ', deleted.error)
        }
        await subtractAnalyticsCount({totalCollections: 1, totalProjects: 0, totalVectors: deleted.data!.length, analytics: userData.analytics})
      } else {
        console.log('could not delte collection: ', delCollec.error)
      }

      

      return res.status(200).json({ success: true, data: {deletedVectors: deleted?.data} });

    } catch (e) {
      console.log(e)
      return res.status(500).json({ error: `unable to create index: ${e}` });
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request' })
  }

    
  
}
