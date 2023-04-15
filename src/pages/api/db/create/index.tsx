// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, number, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import Pinecone from '@/utils/pinecone';

type Data = {
  data: string
}

const bodySchema = object({
  name: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  const userData = authHandler(req);
  if (!userData) return res.status(403).json({ data: 'Invalid Request' });
  
  console.log(userData)

  if (req.method === 'POST') {

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({data: 'Invalid Data'});

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { name } = req.body;
    const pinecone  = await Pinecone("us-central1-gcp", "53e7223a-a1c0-4c70-b4a7-3efe310092ee")
    await pinecone.createIndex({ 
      createRequest: {
        name: name,
        dimension: 1536
      }
    }).catch(err => {
      return res.status(500).json({ data: 'Something went wrong' });
    });

  }
  res.status(200).json({ data: 'Success' });
}
