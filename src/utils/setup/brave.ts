// Axios instance with mindplug auth
import axios from 'axios';

const key = process.env.NEXT_PUBLIC_BRAVE_SEARCH;

const env = process.env.NODE_ENV;


const braveSearch = axios.create({
    baseURL: 'https://api.search.brave.com/res/v1/web/search?q=',
    headers: {
      "Accept": "application/json",
      "X-Subsctiption-Token": `${key}`,
    }
});

 export default braveSearch; 