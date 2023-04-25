// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, number, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import initializePinecone from '@/utils/setup/pinecone';

type Data = {
  success?: boolean,
  error?: string
}

const bodySchema = object({
  name: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  let userData;
  try {
    userData = await authHandler(req);
  } catch (e: any) {
    return res.status(403).json({error: e})
  }
  if (!userData) return res.status(403).json({ error: 'Invalid auth' });

  if (req.method === 'POST') {

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({error: 'Invalid request parameters'});

    const { name } = req.body;

    try {
      const pinecone  = await initializePinecone(userData.pineconeKeyEnv, userData.pineconeKey)
      await pinecone.deleteIndex({ 
        indexName: name
      })
      return res.status(200).json({ success: true });

    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: `Unable to delete index: ${e}` });
    }
    


  } else {
    return res.status(500).json({ error: 'invalid request' });
  }
}
