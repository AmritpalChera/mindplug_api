// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, number, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import initializePinecone from '@/utils/setup/pinecone';
import runMiddleware from '@/utils/setup/middleware';
import braveSearch from '@/utils/setup/brave';
import googleSearch from '@/utils/setup/google';
import formatResponse from '@/utils/webFormat/google';

type Data = {
  data?: object,
  error?: any
}

const bodySchema = object({
  input: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  await runMiddleware(req, res);

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

    const { input } = req.body;

    try {
      const data = await googleSearch.get(input).then(res => res?.data).catch(err => {
        console.log(err?.response?.data)
        return err?.response?.data;
      });

      const toReturn = formatResponse(data);

      res.json({ data: toReturn });

    } catch (e) {
      console.log(e)
      return res.status(500).json({ error: `Unable to search web` });
    }

  } else {
    return res.status(500).json({ error: 'invalid request' });
  }
}
