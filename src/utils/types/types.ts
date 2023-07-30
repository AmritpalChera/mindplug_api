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

const development = process.env.NODE_ENV === 'development';

export const CustomerPlans = {
  LITE: 'lite',
  BASIC: 'basic',
  CUSTOM: 'custom'
}

export const CustomerPlanAmounts = {
  [CustomerPlans.LITE]: 0,
  [CustomerPlans.BASIC]: 3000,
  [CustomerPlans.CUSTOM]: 15000
}

export const CustomerVectorLimits = {
  [CustomerPlans.LITE]: 100,
  [CustomerPlans.BASIC]: 10000,
  [CustomerPlans.CUSTOM]: Infinity
}

export const CustomerProjectLimits = {
  [CustomerPlans.LITE]: 1,
  [CustomerPlans.BASIC]: 10,
  [CustomerPlans.CUSTOM]: Infinity
}

export const priceIds = {
  [CustomerPlans.LITE]: development? '-' : '-',
  [CustomerPlans.BASIC]: development? 'price_1NZ2T4JgAg8HpO3H6xU39IKb' : 'price_1NZ5rGJgAg8HpO3Hyusyoi2m',
  [CustomerPlans.CUSTOM]: development? 'price_1NZQBKJgAg8HpO3H92NRy4y1' : 'price_1NZQ7nJgAg8HpO3HVNPO2NwB'
}