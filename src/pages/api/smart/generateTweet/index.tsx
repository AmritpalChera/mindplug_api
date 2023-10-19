// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, number, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import runMiddleware from '@/utils/setup/middleware';
import loadWebpage from '@/utils/webParsers/loadWebpage';
import summarizeText, { generateTags, generateTweet, oneLiner } from '@/utils/chatbot/summarizer';

type Data = {
  data?: any,
  error?: any
}

const bodySchema = object({
  text: string(),
  tone: string().optional()
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

    const { text, tone } = req.body;

    try {
      const content = await generateTweet({ text, tone });
      res.json({data: content});
    } catch (e) {
      console.log(e)
      return res.status(500).json({ error: `Unable to generate tags` });
    }

  } else {
    return res.status(500).json({ error: 'invalid request' });
  }
}
