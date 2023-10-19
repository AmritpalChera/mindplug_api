import Bottleneck from 'bottleneck';
import { Configuration, OpenAIApi } from 'openai';


export const limiterOpenai = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100
});


export default function initializeOpenai (key: string) {
  const configuration = new Configuration({
    apiKey: key,
  });
  const openai = new OpenAIApi(configuration);
  return openai;
}
