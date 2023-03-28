// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, TypeOf } from "zod";


type Data = {
  data: string
}

const bodySchema = object({
  title: string(),
  content: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ data: 'Invalid Request' })
  const token = authHeader!.split(' ')[1];

  //
  console.log(token)

  if (req.method === 'POST') {

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send({
        data: result.error.message
      });
    }

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { title, content } = req.body;
    console.log('title is: ', title)
    console.log('content is: ', content)
  }
  res.status(200).json({ data: 'Fetch user data' })
}
