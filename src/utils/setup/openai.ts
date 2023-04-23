import { Configuration, OpenAIApi } from 'openai';

export default function initializeOpenai (key: string) {
  const configuration = new Configuration({
    apiKey: key,
  });
  const openai = new OpenAIApi(configuration);
  return openai;
}
