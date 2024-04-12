// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, TypeOf, array } from "zod";
import authHandler from '@/utils/authHandler';
import runMiddleware from '@/utils/setup/middleware';
import queryVectors from '@/utils/pinecone/queryVectors';
import supabase from '@/utils/setup/supabase';

type Data = {
  data?: object,
  error?:  string
}

const bodySchema = object({
  vectorIds: array(string()),
  db: string(),
  collection: string(),
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  await runMiddleware(req, res);

  //Extract token
  let userData;
  try {
    userData = await authHandler(req);
  } catch (e: any) {
    return res.status(403).json({error: e})
  }
  if (!userData) return res.status(403).json({ error: 'Invalid Request' });

  if (req.method === 'POST') {

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send({ error: 'Invalid request parameters' });
    }

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { vectorIds, db, collection } = req.body;


    try {
      const database = await supabase.from('dbs').select('internalStorage, index').eq('userId', userData.userId).eq('projectName', db).single();
      if (database.data?.internalStorage) userData.pineconeKey = '';
      

      const data = await queryVectors({
        vectorIds: vectorIds,
        customPineconeKey: userData.pineconeKey,
        customPineconeEnv: userData.pineconeEnv,
        namespace: `${db}-${collection}-${userData.userId}`,
        customIndex: database.data?.index
      });
      
      return res.status(200).send({data: data})
    } catch (err) {
      console.log(err);
      return res.status(500).send({error: 'Could not fetch data'})
    }
    
  }
  res.status(400).json({ error: 'Invalid request' })
}
