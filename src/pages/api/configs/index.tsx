// lists the namespaces for the user given a db (index)

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, TypeOf } from "zod";
import runMiddleware from '@/utils/setup/middleware';
import { CustomerPlanAmounts, CustomerPlans } from '@/utils/types/types';

const bodySchema = object({
  db: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse) {
  await runMiddleware(req, res);


  res.json({
    pricings: {
      basic: {
        amount: CustomerPlanAmounts[CustomerPlans.BASIC]
      },
      custom: {
        amount: CustomerPlanAmounts[CustomerPlans.CUSTOM]
      }
    }
  })
};
