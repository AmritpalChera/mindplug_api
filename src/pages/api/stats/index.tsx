// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import authHandler from '@/utils/authHandler';
import runMiddleware from '@/utils/setup/middleware';
import supabase from '@/utils/setup/supabase';

type Data = {
  success?: boolean,
  error?: any,
  data?:any,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  await runMiddleware(req, res);
  //Extract token
  let userData;
  try {
    userData = await authHandler(req, true);
  } catch (e: any) {
    return res.status(403).json({error: e})
  }
  if (!userData) return res.status(403).json({ error: 'Invalid auth' });

  if (req.method === 'POST') {

    //parse request
    try {
      const analyticsData = await supabase.from('analytics').select('totalRequests, totalProjects, totalVectors, totalCollections').eq('mindplugKey', userData.mindplugKey).single();
      if (analyticsData.error) {
        return res.status(403).send({ error: 'Could not get analytics data' });
      }
      return res.status(200).json({ success: true, data: analyticsData.data });

    } catch (e) {
      console.log(e)
      return res.status(500).json({ error: `unable to create index: ${e}` });
    }

  } else {
    return res.status(500).json({ error: 'invalid request' });
  }
}
