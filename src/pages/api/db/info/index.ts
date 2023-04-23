// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, number, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import Pinecone from '@/utils/setup/pinecone';

type Data = {
  error?: string | undefined,
  success?: string | undefined,
  data?: any
}

const bodySchema = object({
  name: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  const token = authHandler(req);
  if (!token) return res.status(403).json({ error: 'Invalid Request' });
  
  console.log(token)

  if (req.method === 'POST') {

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({error: 'Invalid Data'});

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { name } = req.body;
    const pinecone  = await Pinecone("us-central1-gcp", "53e7223a-a1c0-4c70-b4a7-3efe310092ee")
    const info  = await pinecone.describeIndex({ 
     indexName: name
    }).then(res => res).catch(err => {
      return res.status(500).json({ error: 'Something went wrong' });
    });

    return res.status(200).json({ data: info });

  }
  res.status(200).json({ success: 'Success' });
}
