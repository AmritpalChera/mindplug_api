// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, number, TypeOf, any } from "zod";
import authHandler from '@/utils/authHandler';
import embeddingGenerator from '@/utils/embedder/embeddingGenerator';
import queryData from '@/utils/pinecone/query';
import { EmbedType } from '@/utils/types/types';
import runMiddleware from '@/utils/setup/middleware';
import { addAnalyticsCount } from '@/utils/analytics/requestTracker';
import supabase from '@/utils/setup/supabase';

type Data = {
  data?: object,
  error?:  string
}

const bodySchema = object({
  db: string(),
  search: string(),
  collection: (string().optional()),
  count: number().optional(),
  metadataFilters: any().optional(),
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
      console.log('error with data types: ', result)
      return res.status(400).send({ error: 'Invalid request parameters' });
    }

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { db, search, collection, count, metadataFilters } = req.body;

    const embeds: EmbedType[] = await embeddingGenerator({ content: [search] });

    try {
      const database = await supabase.from('dbs').select('internalStorage, index').eq('userId', userData.userId).eq('projectName', db).single();
      if (database.data?.internalStorage) userData.pineconeKey = '';
      

      const data = await queryData({
        search: embeds[0].embedding,
        collection: `${db}-${collection}-${userData.userId}`,
        numberResults: count,
        customPineconeKey: userData.pineconeKey,
        customPineconeEnv: userData.pineconeEnv,
        metadataFilters: metadataFilters,
        customIndex: database.data?.index
      }).catch(err => {
        console.log('querying data failed');
        return {};
      });
      
      await addAnalyticsCount({analytics: userData.analytics})
      return res.status(200).send({data: data})
    } catch (e) {
      let toSend = typeof (e) === 'string' ? e : 'Unable to query data. Please contact support';
      return res.status(500).json({error: toSend})
    }
    
  }
  res.status(400).json({ error: 'Invalid request' })
}
