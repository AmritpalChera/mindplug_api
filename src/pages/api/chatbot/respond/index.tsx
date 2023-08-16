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
  search: string(),
  customPrompt: string().optional(),
  chatHistory: array(object({
    role: string(),
    content: string()
  })).optional()
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
      const { botId, search, chatHistory, customPrompt } = req.body;
      const botDetails = await supabase.from('chatbot').select('userId, db, name, goal, collection').eq('botId', botId).single();
      if (botDetails.error) {
        reportError(userData.userId, botDetails.error, 'Could not get bot details');
        throw 'Could not fetch bot details'
      }
      const { db, collection } = botDetails.data;
      // query results
      const database = await supabase.from('dbs').select('internalStorage, index').eq('userId', userData.userId).eq('projectName', db).single();
      if (database.data?.internalStorage) userData.pineconeKey = '';
      
      const embeds: EmbedType[] = await embeddingGenerator({ content: [search] });
      // get memory context
      const memoryData = await queryData({
        search: embeds[0].embedding,
        collection: `${db}-${collection}-${userData.userId}`,
        numberResults: 1,
        customPineconeKey: userData.pineconeKey,
        customPineconeEnv: userData.pineconeEnv,
        customIndex: database.data?.index
      });

      // use memory context to repond to the search
      const response = await callChatGpt({ chatHistory: (chatHistory || []), search, context: memoryData[0]?.metadata?.content, customTemplate: customPrompt });
      return res.json({ response });
    } catch (e) {
      reportError(userData.userId, e, 'could not generate chat completion')
      return res.status(400).send({ error: 'Could not generate chat completion' });
    } 
  }
}