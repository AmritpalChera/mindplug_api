// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import authHandler from '@/utils/authHandler';
import initializePinecone from '@/utils/setup/pinecone';
import runMiddleware from '@/utils/setup/middleware';
import supabase from '@/utils/setup/supabase';

type Data = {
  success?: boolean,
  error?: string,
  projects?: any,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  await runMiddleware(req, res);

  //Extract token
  let userData: any;
  try {
    userData = await authHandler(req);
  } catch (e: any) {
    return res.status(403).json({error: e})
  }
  if (!userData) return res.status(403).json({ error: 'Invalid auth' });

  if (req.method === 'POST') {

    try {
      const projects = await supabase.from("dbs").select('projectName, lastUpdated, totalVectors').eq('userId', userData.userId);
      if (projects.error) {
        console.log('could not get user projects');
        return res.status(500).send({ error: 'Could not get user projects. Please contact support' });
      }
      const toSend = await Promise.all(projects.data.map(async (proj) => {
        const totalCollec = await supabase.from('collections').select('totalVectors').eq('projectName', proj.projectName).eq('userId', userData.userId);
        return {
          ...proj, 
          collectionCount: totalCollec.data?.length || 0
        }

      }))
      
   
      return res.status(200).json({ success: true, projects: toSend });
    } catch (e) {
      console.log('unable to list indecies: ', e);
      return res.status(500).json({success: false, error: 'unable to query list'})
    }
    

  } else {
    // if not post request
    return res.status(500).json({ error: 'invalid request' });
  }
}
