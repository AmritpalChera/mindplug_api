// Axios instance with mindplug auth
import axios from 'axios';

const cx = process.env.NEXT_PUBLIC_GOOGLE_CX;
const key = process.env.NEXT_PUBLIC_GOOGLE_KEY;

const googleSearch = axios.create({
    baseURL: `https://customsearch.googleapis.com/customsearch/v1?cx=${cx}&key=${key}&q=`,
    headers: {
      "Content-Type": "application/json",
    }
});

 export default googleSearch; 