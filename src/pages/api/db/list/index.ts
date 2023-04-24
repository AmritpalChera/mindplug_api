// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import authHandler from '@/utils/authHandler';
import initializePinecone from '@/utils/setup/pinecone';

type Data = {
  success?: boolean,
  error?: string,
  list?: string[],
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  //Extract token
  const userData = await authHandler(req);
  if (!userData) return res.status(403).json({ error: 'Invalid auth' });

  if (req.method === 'POST') {

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
