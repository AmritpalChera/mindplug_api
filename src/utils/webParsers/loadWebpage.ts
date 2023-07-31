import axios from 'axios';
const loadWebContent = async (url: string) => {
  const textContents = await axios.post('https://us-central1-experai.cloudfunctions.net/function-1', { url }, {
    headers: {
      "Content-Type": "application/json"
    }
  })
  return textContents;
}

export default loadWebContent;