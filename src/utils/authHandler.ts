import type { NextApiRequest } from 'next';
import supabase from './setup/supabase';
import requestTracker from './analytics/requestTracker';

// validates the token and returns a boolean
export default async function authHandler(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  // the token is the mindplug key
  const token = authHeader!.split(' ')[1];
  const {data, error}= await supabase.from('keys').select().eq('mindplugKey', token);
  if (error || !data || !data[0]) throw "Invalid authorization";
  
  await requestTracker(token, data[0]._id);
  return data[0];
}