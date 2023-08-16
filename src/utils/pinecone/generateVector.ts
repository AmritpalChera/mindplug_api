
import { v4 as uuidv4 } from 'uuid';
import { EmbedType } from '../types/types';

type embeddingType = {
  data: EmbedType[];
  uploadId: string,
  metadata?: any,
  vectorId?: string,
  url?: string
}

export default function generateVector(embeddingsData: embeddingType) {
  const { data, uploadId, metadata, vectorId, url } = embeddingsData;
  let vectorIdUsed = false;
  let pineconeNormalized = data.map((embedding) => {
    let uniqueId = uuidv4();
    if (vectorId && !vectorIdUsed) uniqueId = vectorId; 
    return {
      id: uniqueId,
      values: embedding.embedding,
      metadata: {
        ...(metadata || {}),
        ...embedding.metadata,
        content: embedding.content,
        uploadId: uploadId,
        url: url
      }
    }
  });
  return pineconeNormalized;
}