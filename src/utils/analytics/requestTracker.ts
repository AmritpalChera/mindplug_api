import supabase from "../setup/supabase";
import { CustomerPlans, CustomerProjectLimits, CustomerVectorLimits } from "../types/types";

type analyticsType = {
  totalProjects: number,
  totalVectors: number,
  totalCollections: number,
  mindplugKey: string,
  totalRequests: number,
  plan: string,
}

type analyticMetricsCount = {
  totalProjects?: number,
  totalVectors?: number,
  totalCollections?: number,
  analytics: analyticsType,
}

export interface LimiterType extends analyticsType {
  quotaExceeded: boolean,
  customPlan: boolean
}

export const subtractAnalyticsCount = async ({ totalProjects = 0, totalVectors = 0, totalCollections = 0, analytics }: analyticMetricsCount) => {
  await supabase.from('analytics').update({
    totalProjects: analytics.totalProjects - totalProjects,
    totalVectors: analytics.totalVectors - totalVectors,
    totalCollections: analytics.totalCollections - totalCollections,
    totalRequests: analytics.totalRequests + 1
  }).eq('mindplugKey', analytics.mindplugKey);
}

export const addAnalyticsCount = async ({ totalProjects = 0, totalVectors = 0, totalCollections = 0, analytics }: analyticMetricsCount) => {
  await supabase.from('analytics').update({
    totalProjects: analytics.totalProjects + totalProjects,
    totalVectors: analytics.totalVectors + totalVectors,
    totalCollections: analytics.totalCollections + totalCollections,
    totalRequests: analytics.totalRequests + 1
  }).eq('mindplugKey', analytics.mindplugKey);
}


export default async function requestLimiter(mindplugKey: string, _id: string) {
  // adds a request to the given mindplug key
  let currData = await supabase.from('analytics').select().eq('mindplugKey', mindplugKey).single();
  let quotaExceeded: boolean = false;
  let customPlan = true;
  let current = currData.data as analyticsType;
  if (!current) {
    const newData = await supabase.from('analytics').upsert({ mindplugKey: mindplugKey, totalRequests: 1, userId: _id}).select().single();
    if (newData.error) {
      throw "Failed to connect to db";
    }
    current = newData.data as analyticsType;

  } else if (current && current.totalProjects >= CustomerProjectLimits[current.plan] || current.totalVectors >= CustomerVectorLimits[current.plan]) { 
    const {data: customer} = await supabase.from('customers').select().eq("userId", _id).single();
    if (!customer || customer.plan !== CustomerPlans.CUSTOM) {
      // only throw this error if the customer is not on the self hosted plan
      quotaExceeded = true;
      customPlan = false;
    }
  }
  return {...current, quotaExceeded, customPlan} as LimiterType;
}