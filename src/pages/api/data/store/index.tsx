// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { array, object, string, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import embeddingGenerator from '@/utils/embedder/embeddingGenerator';
import generateVector from '@/utils/pinecone/generateVector';
import upsertData from '@/utils/pinecone/upsert';
import supabase from '@/utils/setup/supabase';
import { EmbedType } from '@/utils/types/types';
import runMiddleware from '@/utils/setup/middleware';

type Data = {
  data?: object,
  error?:  string
}

const bodySchema = object({
  collection: string().optional(),
  content: array(string()),
  db: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  await runMiddleware(req, res);

  if (req.method === 'POST') {

    //parse request
    let userData;
    try {
      userData = await authHandler(req);
    } catch (e: any) {
      return res.status(403).json({error: e})
    }
    if (!userData) return res.status(403).json({ error: 'Invalid auth' });

    

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({error: 'Invalid request parameters'});

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { collection, content, db } = req.body;


    // collection is an eq of namespace and content is the metadata of the embedidngs
    // id should match the id in the supabase database

    try {
      const embeds: EmbedType[] = await embeddingGenerator({ openaiKey: userData.openaiKey, content: content });
      const pineconeVectors = generateVector({ data: embeds });
  
  
      const upsertSuccess: boolean = await upsertData({
        vectors: pineconeVectors,
        collection: collection,
        indexName: db,
        pineconeKey: userData.pineconeKey,
        pineconeKeyEnv: userData.pineconeKeyEnv
      });

      // add the namespace as a collection to user data if it doesn't already exist
      await supabase.from('collections').upsert({_id: userData._id, db: db, collection: collection})

      return res.status(200).json({ data: {success: upsertSuccess} });
      
    } catch (e) {

      console.log("indexing error: ", e)
      return res.status(500).json({error: 'Unable to index data'})
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request type' })
  }

    
  
  
}
