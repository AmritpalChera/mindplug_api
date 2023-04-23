import { PineconeClient } from "@pinecone-database/pinecone";


export default async function initializePinecone(env: string, key: string) {
  const pinecone = new PineconeClient();
  await pinecone.init({
      environment: env,
      apiKey: key,
  });
  return pinecone;
}

