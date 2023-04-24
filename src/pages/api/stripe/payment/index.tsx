import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.body;
  console.log('called stripe endpoint: ', req.body)
  if (type === 'payment_intent.succeeded') {
    console.log("Payment success")
  }
}

