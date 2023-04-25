import supabase from "../setup/supabase";
const quotaLimit = 300;

export default async function requestTracker(mindplugKey: string, _id: string) {
  // adds a request to the given mindplug key
  const {data: current} = await supabase.from('analytics').select().eq('mindplugKey', mindplugKey).single();
  if (!current) {
    await supabase.from('analytics').upsert({mindplugKey: mindplugKey, monthRequests: 1})
  } else if (current.monthRequests >= quotaLimit) { 
    const {data: customer} = await supabase.from('customers').select().eq("_id", _id).single();
    if (!customer || !customer.active) {
      throw "Monthly quota reached for free plan"
    }
  } else {
    const newCount = current.monthRequests + 1;
    await supabase.from('analytics').upsert({mindplugKey: mindplugKey, monthRequests: newCount})  
  }
}