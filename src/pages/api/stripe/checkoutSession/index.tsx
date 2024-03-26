"use client";

import runMiddleware from "@/utils/setup/middleware";
import stripe from "@/utils/setup/stripe";
import { CustomerPlans, priceIds } from "@/utils/types/types";
import { NextApiRequest, NextApiResponse } from "next";
import { TypeOf, object, string } from "zod";

const development = process.env.NODE_ENV === 'development';
export const DOMAIN = development ? 'http://localhost:9000' : 'https://mindplug.io';


const bodySchema = object({
  priceId: string(),
  email: string(),
  userId: string()
})

interface CheckoutReq extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}


export default async function handler(req: CheckoutReq, res: NextApiResponse) {
  await runMiddleware(req, res);
  
  const priceString = req.body.priceId;
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    line_items: [
      {
        price: priceIds[priceString],
        // For metered billing, do not pass quantity
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    mode: (priceString === CustomerPlans.CUSTOM) ? 'payment' : 'subscription',
    customer_email: req.body.email,
    client_reference_id: req.body.userId,
    success_url: `https://mindplug.io/pricing`,
    cancel_url: `${DOMAIN}?canceled=true`,
  });

  res.send(session.url!);
}


