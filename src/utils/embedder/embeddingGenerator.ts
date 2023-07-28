
import initializeOpenai from "../setup/openai";
import { EmbedType, FileContentType } from "../types/types";
import chunkRawData, { chunkDocuments } from "./chunk";
import Bottleneck from "bottleneck";


const limiter = new Bottleneck({
  minTime: 21
});


type Data = {
  content: string[];
  chunkSize?: number,
  customKey?: string
}

export default async function embeddingGenerator({ content, chunkSize, customKey }: Data) {
  const openai = initializeOpenai(customKey || process.env.NEXT_PUBLIC_OPENAI_KEY!);

  const chunks = await chunkRawData(content, chunkSize);
  // console.log(response.data);

  let chunkEmbeddings = await Promise.all(chunks.map(async (chunk) => {

    const openaiEmbedder = () => openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: chunk.pageContent
    });

    const embedding = await limiter.schedule(() => openaiEmbedder().catch(e => openaiEmbedder()));

    return { content: chunk.pageContent, embedding: embedding?.data?.data[0].embedding } as EmbedType;
  }));

  

  return chunkEmbeddings;
    
}

type FileData = {
  content: FileContentType[],
  chunkSize?: number,
  customKey?: string
}

export async function embeddingGeneratorFile({ content, chunkSize, customKey }: FileData) {
  const openai = initializeOpenai(customKey || process.env.NEXT_PUBLIC_OPENAI_KEY!);

  const chunks = await chunkDocuments(content, chunkSize);
  // console.log(response.data);

  let chunkEmbeddings = await Promise.all(chunks.map(async (chunk) => {

    const openaiEmbedder = () => openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: chunk.pageContent
    });

    const embedding = await limiter.schedule(() => openaiEmbedder().catch(e => openaiEmbedder()));

    return {
      content: chunk.pageContent, embedding: embedding?.data?.data[0].embedding,
      metadata: {
        pageNumber: chunk.metadata?.pageNumber,
        totalPages: chunk.metadata?.totalPages
      }
    } as EmbedType;
  }));

  

  return chunkEmbeddings;
    
}
