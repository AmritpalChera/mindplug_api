// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, number, TypeOf, array, nullable, undefined } from "zod";
import authHandler from '@/utils/authHandler';
import embeddingGenerator from '@/utils/embedder/embeddingGenerator';
import queryData from '@/utils/pinecone/query';
import { EmbedType } from '@/utils/types/types';

type Data = {
  data?: object,
  error?:  string
}

const bodySchema = object({
  db: string(),
  inquiry: string(),
  collection: ( string().optional() )
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  const userData = await authHandler(req);
  if (!userData) return res.status(403).json({ error: 'Invalid Request' });

  if (req.method === 'POST') {

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send({ error: 'Invalid request parameters' });
    }

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { db, inquiry, collection } = req.body;

    const embeds: EmbedType[] = await embeddingGenerator({ openaiKey: userData.openaiKey, content: [inquiry] });

    try {
      const data = await queryData({
        inquiry: embeds[0].embedding,
        pineconeKey: userData.pineconeKey,
        pineconeKeyEnv: userData.pineconeKeyEnv,
        indexName: db,
        collection: collection
      })

      return res.status(200).send({data: data})
    } catch (err) {
      console.log(err);
      return res.status(500).send({error: 'Could not fetch data'})
    }
    
  }
  res.status(400).json({ error: 'Invalid request' })
}
