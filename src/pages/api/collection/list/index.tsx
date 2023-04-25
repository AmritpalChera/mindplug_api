// lists the namespaces for the user given a db (index)

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import supabase from '@/utils/setup/supabase';

type Data = {
  data?: any | null,
  error?: string
}

const bodySchema = object({
  db: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  

  if (req.method === 'POST') {

    // Extract token
    const userData = await authHandler(req);
    if (!userData) return res.status(403).json({ error: 'Invalid auth' });

    // parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({error: 'Invalid required parameters', data: null});

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { db } = req.body;

    try {
      const userCollections = await supabase.from('collections').select('collection').eq('db', db).eq('_id', userData._id)
      .then(res => {
        const list = res.data?.map((collection) => collection.collection);
        return list
      });

      return res.status(200).json({ data: userCollections })
    } catch (e) {
      return res.status(500).send({error: 'Could not query collections'})
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request' })
  }

    
  
}