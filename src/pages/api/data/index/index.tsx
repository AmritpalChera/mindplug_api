// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';

type Data = {
  data: string
}

const bodySchema = object({
  collection: string(),
  content: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  const userData = await authHandler(req);
  if (!userData) return res.status(403).json({ data: 'Invalid Request' });

  //
  console.log(userData)

  if (req.method === 'POST') {

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send({
        data: result.error.message
      });
    }

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { collection, content } = req.body;
    // collection is an eq of namespace and content is the metadata of the embedidngs
    // id should match the id in the supabase database
    console.log('collection is: ', collection)
    console.log('content is: ', content)
  }
  res.status(200).json({ data: 'Fetch user data' })
}
