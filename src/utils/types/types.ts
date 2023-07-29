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
  [CustomerPlans.LITE]: 0,
  [CustomerPlans.BASIC]: 3000,
  [CustomerPlans.CUSTOM]: 30000
}

export const CustomerVectorLimits = {
  [CustomerPlans.LITE]: 100,
  [CustomerPlans.BASIC]: 3000,
  [CustomerPlans.CUSTOM]: Infinity
}

export const CustomerProjectLimits = {
  [CustomerPlans.LITE]: 1,
  [CustomerPlans.BASIC]: 10,
  [CustomerPlans.CUSTOM]: Infinity
}