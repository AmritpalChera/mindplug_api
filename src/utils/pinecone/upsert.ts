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
  customIndex?: string
}

const checkMindplugIndex = async (pinecone: any, index: string) => {
  let log = ``;
  const pineconeIndices = await pinecone.listIndexes();

  if (!pineconeIndices.includes(index)) {
    await pinecone.createIndex({
      createRequest: {
        name: index,
        dimension: 1536
      }
    }).catch((err: any) => {
      log += `Could not create index, please review pinecone plan. Delete existing indicies. Found "${pineconeIndices[0]}"`
      throw log;
    });
    const pineconeIndex = await pinecone.listIndexes();
    if (!pineconeIndex.includes(index)) {
      throw `Could not create index. Please create index "mindplug" manually`
    }
  }
}

export default async function upsertData(data: UpsertData) {
  const pinecone = await initializePinecone(data.customPineconeKey, data.customPineconeEnv).catch(err => {
    throw "Could not initialize pinecone";
  });


  await checkMindplugIndex(pinecone, (data.customIndex || 'mindplug'));


  // retrieve index from pinecone
  const index = pinecone.Index((data.customIndex || 'mindplug'));

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
  ).catch(err => {
    console.log(err);
    throw "Could not find index 'mindplug'. Please delete existing indicies"
  });
  return true;
}

