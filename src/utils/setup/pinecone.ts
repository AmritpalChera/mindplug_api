import { PineconeClient } from "@pinecone-database/pinecone";

const envKey = process.env.NEXT_PUBLIC_PINECONE_ENV!
const apiKey =  process.env.NEXT_PUBLIC_PINECONE_KEY!

export default async function initializePinecone() {
  const pinecone = new PineconeClient();
  await pinecone.init({
      environment: envKey,
      apiKey: apiKey,
  });
  return pinecone;
}

