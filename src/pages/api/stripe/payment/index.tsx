import stripe from "@/utils/setup/stripe";
import supabase from "@/utils/setup/supabase";
import { CustomerPlanAmounts, CustomerPlans } from "@/utils/types/types";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.body;
  if (type === 'customer.subscription.trial_will_end') {
    console.log("customer subscription about to end", req.body);
  }
  else if (type === 'checkout.session.completed') {
    const { customer_details, client_reference_id, amount_total, customer, payment_status } = req.body?.data?.object;
    if (payment_status !== 'paid') return res.status(200).send({ success: true });
    if (!client_reference_id) return res.status(500).send({ error: 'Missing client identification' });

    // console.log('client refrence id: ', client_reference_id)
    // console.log('customer details: ', customer_details)
    // console.log('amount total: ', amount_total)
    // console.log('customer: ', customer);
    const plan = amount_total === CustomerPlanAmounts[CustomerPlans.BASIC] ?  CustomerPlans.BASIC : CustomerPlans.CUSTOM;
    
    const creation = await supabase.from('customers').upsert({
      userId: client_reference_id,
      email: customer_details.email,
      amount: amount_total,
      stripeId: customer || "",
      plan: plan
    });

    // SAVE ERRORS IN DB LATER
    if (creation.error) console.log(creation.error)

    // No matter what they pay for now,the message limit increases to 1000
    // CHANGE LIMIT IN ANALYTICS PLAN
    await supabase.from('analytics').update({ plan }).eq('userId', client_reference_id);
    
    // delete api keys for non custom plan
    // await supabase.from('keys').update({ openaiKey: null, pineconeKey: null, pineconeEnv: null }).eq('userId', client_reference_id);
  }
  else if (type === 'customer.subscription.deleted') {
    const { customer } = req.body?.data?.object;
    const userData: any = await stripe.customers.retrieve(customer);
    const email = userData?.email;
    const user = await supabase.from('customers').update({ amount: 0 }).eq('email', email).select('userId').single();

    // CHANGE LIMIT IN THE ANALYTICS PLAN
    await supabase.from('analytics').update({
      plan: CustomerPlans.LITE
    }).eq('userId', user.data?.userId);

  } else if (type === 'customer.subscription.updated') {
    // TODO: update the amount for the subscription

    // CHANGE LIMIT IN THE ANALYTICS PLAN
  }

    // Return a 200 response to acknowledge receipt of the event
    res.send(200);
}

