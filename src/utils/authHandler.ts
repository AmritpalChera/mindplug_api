import type { NextApiRequest } from 'next';
import supabase from './supabase';

// validates the token and returns a boolean
export default async function authHandler(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  // the token is the mindplug key
  const token = authHeader!.split(' ')[1];
  const {data, error}= await supabase.from('keys').select().eq('mindplugKey', token);
  if (error || !data || !data[0]) return false;
  else return data[0];
}