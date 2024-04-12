import Bottleneck from 'bottleneck';
import OpenAI from 'openai';





export const limiterOpenai = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100
});


export default function initializeAnyscale () {
  const openai = new OpenAI({
    apiKey: process.env.ANYSCALE_KEY,
    baseURL: "https://api.endpoints.anyscale.com/v1"
  });
  return openai;
}
