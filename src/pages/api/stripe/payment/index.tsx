import stripe from "@/utils/setup/stripe";
import supabase from "@/utils/setup/supabase";
import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.body;
  if (type === 'checkout.session.completed') {
    const { customer_details, client_reference_id, amount_total, customer, payment_status } = req.body?.data?.object;
    if (payment_status !== 'paid') return res.status(200).send({ success: true });
    if (!client_reference_id) return res.status(500).send({ error: 'Missing client identification' });
    await supabase.from('customers').upsert({
      _id: client_reference_id,
      email: customer_details.email,
      amount: amount_total,
      active: true,
      customer: customer
    });
  } else if (type === 'customer.subscription.deleted') {
    const { customer } = req.body?.data?.object;
    const {email} = await stripe.customers.retrieve(customer);
    await supabase.from('customers').update({ active: false }).eq('email', email);
  } else if (type === 'customer.subscription.updated') {
    // TODO: do something
  }
  res.status(200).json({success: true});
}

