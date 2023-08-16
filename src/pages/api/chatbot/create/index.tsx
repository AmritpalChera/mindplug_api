import authHandler from '@/utils/authHandler';
import callChatGpt from '@/utils/chatbot/responder';
import embeddingGenerator from '@/utils/embedder/embeddingGenerator';
import queryData from '@/utils/pinecone/query';
import runMiddleware from '@/utils/setup/middleware';
import { reportError } from '@/utils/setup/mixpanel';
import supabase from '@/utils/setup/supabase';
import { EmbedType } from '@/utils/types/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import { TypeOf, object, string } from 'zod';


const bodySchema = object({
  collection: string(),
  db: string(),
  goal: string(),
  name: string(),
});

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>,
}

export default async function handler(req: FetchRequest, res: NextApiResponse) {
  await runMiddleware(req, res);

  if (req.method === 'POST') {

    //parse request
    let userData;
    try {
      userData = await authHandler(req);
    } catch (e: any) {
      return res.status(403).json({ error: e })
    }
    if (!userData) return res.status(403).json({ error: 'Invalid auth' });

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({ error: result.error });

    try {
      // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
      const { collection, db, goal, name } = req.body;
      // create bot
      const generatedBot = await supabase.from('chatbot').upsert({ userId: userData.userId, db, collection, name, goal }).select('botId').single();
      if (generatedBot.error) throw generatedBot.error;
      // get the response on the context
      res.json(generatedBot);
    } catch (e) {
      reportError(userData.userId, e)
      return res.status(400).send({ error: 'Could not create chatbot' });
    } 
  }
}