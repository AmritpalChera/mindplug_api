import authHandler from '@/utils/authHandler';
import callChatGpt from '@/utils/chatbot/responder';
import embeddingGenerator from '@/utils/embedder/embeddingGenerator';
import queryData from '@/utils/pinecone/query';
import runMiddleware from '@/utils/setup/middleware';
import { reportError } from '@/utils/setup/mixpanel';
import supabase from '@/utils/setup/supabase';
import { EmbedType } from '@/utils/types/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import { TypeOf, array, object, string } from 'zod';


const bodySchema = object({
  botId: string(),
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
      const { botId } = req.body;

      // get bot and check creator - if creator the same as deletor good
      const bot = await supabase.from('chatbot').select().eq('botId', botId).eq('userId', userData.userId).single();
      if (bot.error) throw bot.error;

      const deleted = await supabase.from('chatbot').delete().eq('botId', botId);
      if (deleted.error) throw bot.error

      // use memory context to repond to the search
      return res.json({ success: true });
    } catch (e) {
      reportError(userData.userId, e, 'could not delete chatbot')
      return res.status(400).send({ error: 'Could not delete chatbot' });
    } 
  }
}