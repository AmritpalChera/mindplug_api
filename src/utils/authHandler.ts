import type { NextApiRequest } from 'next';
import supabase from './setup/supabase';
import requestTracker from './analytics/requestTracker';

// validates the token and returns a boolean
export default async function authHandler(req: NextApiRequest, noTrack?: boolean) {
  const authHeader = req.headers.authorization;
  if (!authHeader)  throw "Invalid authorization";;
  // the token is the mindplug key
  const token = authHeader!.split(' ')[1];
  const { data, error } = await supabase.from('decrypted_keys').select('mindplugKey, decrypted_openaiKey, decrypted_pineconeKey, pineconeEnv, userId, mindplugKey, plan').eq('mindplugKey', token);
  if (error || !data || !data[0]) throw "Invalid authorization";

  if (data[0].plan !== 'plus') {
    data[0].decrypted_openaiKey = null;
    data[0].decrypted_pineconeKey = null;
    data[0].pineconeEnv = null;
  }

  const analytics = noTrack ? {totalProjects: null, totalCollections: null, totalRequests: null, totalVectors: null} : await requestTracker(token, data[0].userId);
  return {...data[0], analytics: analytics};
}