
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";


export default async function chunkRawData(content: string[], chunkSize?: number) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize || 1024,
    chunkOverlap: chunkSize? Math.round(chunkSize/20) : 70,
  });

  const chunks = await splitter.createDocuments(content);
  return chunks;
}

export const chunkDocuments = async (documents: any, chunkSize?: number) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize || 1024,
    chunkOverlap: chunkSize? Math.round(chunkSize/20) : 70,
  });
  const docOutput = await splitter.splitDocuments(documents);
  return docOutput
}