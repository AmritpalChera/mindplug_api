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
  openaiKey: string,
  pineconeKey: string,
  pineconeEnv: string,
  userId: string,
  plan: string
}

export const CustomerPlans = {
  LITE: 'lite',
  BASIC: 'basic',
  CUSTOM: 'custom'
}

export const CustomerPlanAmounts = {
  LITE: 0,
  BASIC: 3000,
  CUSTOM: 30000
}