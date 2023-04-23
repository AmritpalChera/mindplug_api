
import { v4 as uuidv4 } from 'uuid';
import { EmbedType } from '../types/types';

type embeddingType = {
  data: EmbedType[];
}

export default function generateVector(embeddingsData: embeddingType) {
  const { data } = embeddingsData;
  let pineconeNormalized = data.map((embedding) => {
    return {
      id: uuidv4(),
      values: embedding.embedding,
      metadata: {
        content: embedding.content
      }
    }
  });
  return pineconeNormalized;
}