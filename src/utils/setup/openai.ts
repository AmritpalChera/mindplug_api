import Bottleneck from 'bottleneck';
import OpenAI from 'openai';





export const limiterOpenai = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100
});


export default function initializeOpenai (key: string) {
  const configuration = {
    apiKey: key,
  };
  const openai = new OpenAI(configuration);
  return openai;
}
