
import initializeOpenai from "../setup/openai";
import { EmbedType } from "../types/types";
import chunkRawData from "./chunk";
import Bottleneck from "bottleneck";


const limiter = new Bottleneck({
  minTime: 21
});


type Data = {
  content: string[];
  openaiKey: string;
}

export default async function embeddingGenerator({ openaiKey, content }: Data) {
  const openai = initializeOpenai(openaiKey)

  const chunks = await chunkRawData(content);
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