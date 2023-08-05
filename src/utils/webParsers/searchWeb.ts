import axios from 'axios';
import formatResponse from '../webFormat/google';

const GOOGLE_URL = `https://www.googleapis.com/customsearch/v1/siterestrict?key=${process.env.NEXT_PUBLIC_GOOGLE_KEY}&cx=${process.env.NEXT_PUBLIC_GOOGLE_CX}&num=3`

export default async function searchWeb(query: string) {
  const data = await axios.get(`${GOOGLE_URL}&q=${query}`).then(res => res.data);
  return formatResponse(data);
}