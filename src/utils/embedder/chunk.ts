

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export default async function chunkRawData(content: string[], chunkSize?: number) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize || 1000,
    chunkOverlap: chunkSize? (chunkSize/20) : 50,
  });

  const chunks = await splitter.createDocuments(content);
  return chunks;
}