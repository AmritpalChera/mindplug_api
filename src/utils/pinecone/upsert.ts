import { Vector } from "@pinecone-database/pinecone";
import initializePinecone from "../setup/pinecone";
import supabase from "../setup/supabase";

const sliceIntoChunks = (arr: Vector[], chunkSize: number) => {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, (i + 1) * chunkSize)
  );
};


type UpsertData = {
  pineconeKey: string,
  pineconeKeyEnv:string,
  vectors: Vector [],
  indexName: string,
  collection: string | undefined,
}

export default async function upsertData(data: UpsertData) {
  const pinecone = await initializePinecone(data.pineconeKeyEnv, data.pineconeKey);

  // retrieve index from pinecone
  const index = pinecone.Index(data.indexName);

  // splice vectors into chunks
  const chunks = sliceIntoChunks(data.vectors, 10);

  // upsert vectors and data
  await Promise.all(
    chunks.map(async (chunk) => {
      await index!.upsert({
        upsertRequest: {
          vectors: chunk as Vector[],
          namespace: data.collection
        },
      });
    })
  );

  return true;
}

