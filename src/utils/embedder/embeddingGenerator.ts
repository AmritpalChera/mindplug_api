
import initializeOpenai from "../setup/openai";
import { EmbedType } from "../types/types";
import chunkRawData from "./chunk";
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