import type { NextApiRequest } from 'next';

export default function handler(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader!.split(' ')[1];
  return token;
}