
import { v4 as uuidv4 } from 'uuid';
import { EmbedType } from '../types/types';

type embeddingType = {
  data: EmbedType[];
}

export default function generateVector(embeddingsData: embeddingType, uploadId: string, metadata?: any, vectorId?: any) {
  const { data } = embeddingsData;
  let vectorIdUsed = false;
  let pineconeNormalized = data.map((embedding) => {
    let uniqueId = uuidv4();
    if (vectorId && !vectorIdUsed) uniqueId = vectorId; 
    return {
      id: uniqueId,
      values: embedding.embedding,
      metadata: {
        ...metadata,
        ...embedding.metadata,
        content: embedding.content,
        uploadId: uploadId
      }
    }
  });
  return pineconeNormalized;
}