import stripe from "@/utils/setup/stripe";
import supabase from "@/utils/setup/supabase";
import { CustomerPlanAmounts } from "@/utils/types/types";
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
    const plan = amount_total === CustomerPlanAmounts.BASIC ? 'basic' : 'custom';
    
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
  }
  else if (type === 'customer.subscription.deleted') {
    const { customer } = req.body?.data?.object;
    const userData: any = await stripe.customers.retrieve(customer);
    const email = userData?.email;
    await supabase.from('customers').update({ amount: 0 }).eq('email', email);

    // CHANGE LIMIT IN THE ANALYTICS PLAN

  } else if (type === 'customer.subscription.updated') {
    // TODO: update the amount for the subscription

    // CHANGE LIMIT IN THE ANALYTICS PLAN
  }

    // Return a 200 response to acknowledge receipt of the event
    res.send(200);
}

