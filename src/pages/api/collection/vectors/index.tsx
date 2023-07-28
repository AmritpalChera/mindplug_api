// lists the namespaces for the user given a db (index)

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import supabase from '@/utils/setup/supabase';
import runMiddleware from '@/utils/setup/middleware';
import queryVectors from '@/utils/pinecone/queryVectors';
import { addAnalyticsCount } from '@/utils/analytics/requestTracker';

type Data = {
  data?: any | null,
  error?: string
  count?: number
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
    if (!result.success) return res.status(400).send({error: 'Invalid required parameters', data: null});

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { db, collection } = req.body;

    try {
      const userCollection = await supabase.from('collections').select('collectionId, totalVectors').eq('projectName', db).eq('userId', userData.userId).eq('collection', collection).single();

      if (userCollection.error) {
        console.log('user collection: ', userCollection.error)
        res.status(500).send({ error: 'Could not find collection in DB' });
        return;
      }

      // use the id to get userCollection
      const vectorsData = (await supabase.from('vectors').select('vectorId').eq('collectionId', userCollection.data.collectionId).order('created_at', {ascending: false}).limit(10));
      
      if (vectorsData.error) {
        console.log('could not get vectors');
        return res.status(500).send({ error: 'Could not get vectors for collection' })
      }

      const vectors = vectorsData.data.map((vectorDetail) => vectorDetail.vectorId);
      
      const data = await queryVectors({
        vectorIds: vectors,
        customPineconeKey: userData.pineconeKey,
        customPineconeEnv: userData.pineconeEnv,
        namespace: `${db}-${collection}-${userData.userId}`,
      });

      await addAnalyticsCount({ analytics: userData.analytics });
      return res.json({data: data, count: userCollection.data.totalVectors })

    } catch (e) {
      return res.status(500).send({error: 'Could not query collections'})
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request' })
  }

    
  
}
