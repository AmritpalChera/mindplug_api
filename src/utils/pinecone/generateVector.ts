
import { v4 as uuidv4 } from 'uuid';
import { EmbedType } from '../types/types';

type embeddingType = {
  data: EmbedType[];
}

export default function generateVector(embeddingsData: embeddingType, metadata?: any, vectorId?: any) {
  const { data } = embeddingsData;
  let pineconeNormalized = data.map((embedding) => {
    return {
      id: vectorId || uuidv4(),
      values: embedding.embedding,
      metadata: {
        ...metadata,
        content: embedding.content
      }
    }
  });
  if (pineconeNormalized.length > 1 && vectorId) throw new Error('Too much content for one vector');
  return pineconeNormalized;
}