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
  success?: boolean
  error?: string,
  data?: any
}

const bodySchema = object({
  db: string(),
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  await runMiddleware(req, res);

  if (req.method === 'POST') {

    // Extract token
    let userData: any;
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
    const { db } = req.body;

    try {
      const database = await supabase.from('dbs').select('internalStorage, index').eq('userId', userData.userId).eq('projectName', db).single();
      if (database.data?.internalStorage) userData.pineconeKey = '';

      const pinecone = await initializePinecone(userData.pineconeKey, userData.pineconeEnv);
      const index = pinecone.Index(database.data?.index);

      const collections = await supabase.from('collections').select('collection, collectionId').eq('projectName', db).eq('userId', userData.userId);
      if (collections.error) {
        console.log('could not get project collections: ', collections.error);
        return res.status(500).send({ error: 'could not get collections for project' });
      }

      await Promise.all(collections.data.map(async (collection) => {
        await index.delete1({
          deleteAll: true,
          namespace: `${db}-${collection.collection}-${userData.userId}`
        });
        await supabase.from('vectors').delete().eq('collectionId', collection.collectionId);
      }));

      // now delete the project and all collections associated with this project in sb

      
      await supabase.from('collections').delete().eq('userId', userData.userId).eq('projectName', db);
      const deletedProject = await supabase.from('dbs').delete().eq('userId', userData.userId).eq('projectName', db).select('totalVectors, totalCollections').single();
      await subtractAnalyticsCount({ totalCollections: deletedProject.data?.totalCollections, totalVectors: deletedProject.data?.totalVectors, totalProjects: 1, analytics: userData.analytics });

      return res.status(200).json({
        success: true, data: {
          deletedCount: {
            totalCollections: deletedProject.data?.totalCollections,
            totalVectors: deletedProject.data?.totalVectors,
            totalProjects: 1
          }
      }});

    } catch (e) {
      console.log(e)
      return res.status(500).json({ error: `unable to create index: ${e}` });
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request' })
  }

    
  
}
