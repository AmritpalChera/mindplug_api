import supabase from "../setup/supabase";
const quotaLimit = 300;


export default async function requestTracker(mindplugKey: string, _id: string) {
  // adds a request to the given mindplug key
  let { data: current } = await supabase.from('analytics').select().eq('mindplugKey', mindplugKey).single();
  if (!current) {
    current = await supabase.from('analytics').upsert({ mindplugKey: mindplugKey, totalRequests: 1, userId: _id}).select().single();
  } else if (current.totalProjects >= quotaLimit) { 
    const {data: customer} = await supabase.from('customers').select().eq("_id", _id).single();
    if (!customer || !customer.active) {
      throw "Monthly quota reached for free plan"
    }
  }
  const newCount = current.totalRequests + 1;
  const analytics = await supabase.from('analytics').upsert({ mindplugKey: mindplugKey, totalRequests: newCount }).select('totalProjects, totalVectors, totalCollections').single();
  return analytics.data;
}