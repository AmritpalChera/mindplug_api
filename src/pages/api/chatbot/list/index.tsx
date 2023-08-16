import authHandler from '@/utils/authHandler';

import runMiddleware from '@/utils/setup/middleware';
import { reportError } from '@/utils/setup/mixpanel';
import supabase from '@/utils/setup/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';




export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res);
    //parse request
  let userData;
  try {
    userData = await authHandler(req);
  } catch (e: any) {
    return res.status(403).json({ error: e })
  }
  if (!userData) return res.status(403).json({ error: 'Invalid auth' });

  //parse request
  try {
    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const botDetails = await supabase.from('chatbot').select('db, name, goal, collection, created_at').eq('userId', userData.userId);
    if (botDetails.error) {
      reportError(userData.userId, botDetails.error, 'Could not get bot details');
      throw 'Could not fetch bot details'
    }


    // use memory context to repond to the search
    return res.json({data: botDetails.data});
  } catch (e) {
    reportError(userData.userId, e, 'could not generate chat completion')
    return res.status(400).send({ error: 'Could not generate chat completion' });
  } 
  
}