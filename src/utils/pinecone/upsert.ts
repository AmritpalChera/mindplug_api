import { Vector } from "@pinecone-database/pinecone";
import initializePinecone from "../setup/pinecone";
import supabase from "../setup/supabase";

// maximum of 2MB of vectors we can set, so we can chunk our vectors array if we are inserting more than 10 vectors vectors at a time.
const sliceIntoChunks = (arr: Vector[], chunkSize: number) => {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, (i + 1) * chunkSize)
  );
};


type UpsertData = {
  vectors: Vector [],
  collection: string | undefined,
  customPineconeKey?: string,
  customPineconeEnv?: string,
}

const checkMindplugIndex = async (pinecone: any) => {
  let log = ``;
  const pineconeIndices = await pinecone.listIndexes();
  log += `Total projects: ${pineconeIndices.length}\n
    ${pineconeIndices.map((ind: string, key: number) => `${key+1}. ${ind}\n`)}
  `;

  if (!pineconeIndices.includes('mindplug')) {
    log += `\nNo mindplug index found, creating new index`;
    await pinecone.createIndex({
      createRequest: {
        name: 'mindplug',
        dimension: 1536
      }
    }).catch((err: any) => {
      log += 'Could not create index, please review pinecone plan. Delete existing indicies.'
      throw new Error(log);
    });
  }
}

export default async function upsertData(data: UpsertData) {
  const pinecone = await initializePinecone();

  await checkMindplugIndex(pinecone);


  // retrieve index from pinecone
  const index = pinecone.Index('mindplug');

  // splice vectors into chunks
  const chunks = sliceIntoChunks(data.vectors, 10);

  // upsert vectors and data
  await Promise.all(
    chunks.map(async (chunk) => {
      return await index!.upsert({
        upsertRequest: {
          vectors: chunk as Vector[],
          namespace: data.collection,
        },
      });
    })
  );
  return true;
}

