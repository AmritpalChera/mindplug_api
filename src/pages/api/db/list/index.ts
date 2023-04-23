// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, number, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import initializePinecone from '@/utils/setup/pinecone';

type Data = {
  success?: boolean,
  error?: string,
  list?: string[],
}

const bodySchema = object({})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  const userData = await authHandler(req);
  if (!userData) return res.status(403).json({ error: 'Invalid auth' });

  if (req.method === 'POST') {

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({error: 'Invalid request parameters'});

    try {
      const pinecone  = await initializePinecone(userData.pineconeKeyEnv, userData.pineconeKey)
      const list = await pinecone.listIndexes().then((res) => {
        return res;
      });
   
      return res.status(200).json({ success: true, list: list });
    } catch (e) {
      console.log('unable to list indecies: ', e);
      return res.status(500).json({success: false, error: 'unable to query list'})
    }
    

  } else {
    // if not post request
    return res.status(500).json({ error: 'invalid request' });
  }
}
