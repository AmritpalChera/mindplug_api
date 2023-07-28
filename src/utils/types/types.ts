import PersistentFile from "formidable/PersistentFile"
import { LimiterType } from "../analytics/requestTracker";

export type EmbedType = {
  content: string,
  embedding: number[],
  metadata?: {
    pageNumber?: number,
    totalPages?: number
  }
}

export type FileContentType = {
  pageContent: string,
  metadata: {
    pageNumber?: number,
    totalPages?: number
  }
};

export type UserDataType = {
  analytics: LimiterType,
  mindplugKey: string,
  decrypted_openaiKey: string,
  decrypted_pineconeKey: string,
  pineconeEnv: string,
  userId: string,
  plan: string
}