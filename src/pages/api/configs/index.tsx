// lists the namespaces for the user given a db (index)

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, TypeOf } from "zod";
import runMiddleware from '@/utils/setup/middleware';
import { CustomerPlanAmounts, CustomerPlans, CustomerProjectLimits, CustomerVectorLimits } from '@/utils/types/types';

const bodySchema = object({
  db: string()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
}

export default async function handler(req: FetchRequest, res: NextApiResponse) {
  await runMiddleware(req, res);


  res.json({
    plans: {
      lite: {
        amount: CustomerPlanAmounts[CustomerPlans.LITE],
        vectorLimit: CustomerVectorLimits[CustomerPlans.LITE],
        projectLimit: CustomerProjectLimits[CustomerPlans.LITE]
      },
      basic: {
        amount: CustomerPlanAmounts[CustomerPlans.BASIC],
        vectorLimit: CustomerVectorLimits[CustomerPlans.BASIC],
        projectLimit: CustomerProjectLimits[CustomerPlans.BASIC]
      },
      custom: {
        amount: CustomerPlanAmounts[CustomerPlans.CUSTOM],
        vectorLimit: CustomerVectorLimits[CustomerPlans.CUSTOM],
        projectLimit: CustomerProjectLimits[CustomerPlans.CUSTOM]
      }
    }
  })
};
