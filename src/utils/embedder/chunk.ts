

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export default async function chunkRawData(content: string[]) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 50,
  });

  const chunks = await splitter.createDocuments(content);
  return chunks;
}