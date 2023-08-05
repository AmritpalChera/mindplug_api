import axios from 'axios';


const loadWebpage = async (url: string) => {
  const textContents = await axios.post('https://us-central1-experai.cloudfunctions.net/function-1', { url }, {
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => res.data);
  return textContents;
}

export default loadWebpage;