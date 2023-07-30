import { PineconeClient } from "@pinecone-database/pinecone";

const envKey = process.env.NEXT_PUBLIC_PINECONE_ENV!
const apiKey =  process.env.NEXT_PUBLIC_PINECONE_KEY!

export default async function initializePinecone(customKey?: string, customEnv?: string) {
  const pinecone = new PineconeClient();
  const useCustom = customEnv && customKey;
  await pinecone.init({
      environment: useCustom ? customEnv : envKey,
      apiKey: useCustom?  customKey : apiKey,
  });
  return pinecone;
}

