// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { any, number, object, record, string, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import embeddingGenerator from '@/utils/embedder/embeddingGenerator';
import generateVector from '@/utils/pinecone/generateVector';
import upsertData from '@/utils/pinecone/upsert';
import { EmbedType } from '@/utils/types/types';
import runMiddleware from '@/utils/setup/middleware';
import updateSupabaseStore, { checkStoreLimits } from '@/utils/supabase/storeHelper';
import loadWebpage from '@/utils/webParsers/loadWebpage';
import { v4 as uuidv4 } from 'uuid';
import { reportError } from '@/utils/setup/mixpanel';

type Data = {
  data?: object,
  error?:  any
}

const bodySchema = object({
  collection: string(),
  url: string(),
  db: string(),
  metadata: record(any()).optional(),
  chunkSize: number().optional(),
  vectorId: string().optional(), // you can only update one vector at a time (for now)
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>,
}

export default async function handler(req: FetchRequest, res: NextApiResponse<Data>) {
  //Extract token
  await runMiddleware(req, res);

  if (req.method === 'POST') {

    //parse request
    let userData;
    try {
      userData = await authHandler(req);
    } catch (e: any) {
      return res.status(403).json({error: e})
    }
    if (!userData) return res.status(403).json({ error: 'Invalid auth' });

    

    //parse request
    const result = bodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send({error: result.error});

    // Generate embeddings and store data to pinecone. Return the stored data _id from Supabase or MongoDB
    const { collection, db, chunkSize, metadata, vectorId, url } = req.body;

    // collection is an eq of namespace and content is the metadata of the embedidngs
    // id should match the id in the supabase database
    let content: string = '';
    try {
      content = await loadWebpage(url);
    } catch (e) {
      console.log('could not get web content: ', e);
      return res.status(403).send({ error: 'Could not get content from URL.' });
    }
    

    try {
      const uploadId = uuidv4(); //upload id
      const embeds: EmbedType[] | null = await embeddingGenerator({ content: [content], chunkSize: chunkSize, customKey: userData.openaiKey }).catch((err) => {
        return null
      });

      if (!embeds) {
        throw `Could not generate embeddings. ${userData.analytics.customPlan && 'Please check your openai key in settings.'} Please contact support if needed`;
      }

      const pineconeVectors = generateVector({ data: embeds, uploadId, metadata, vectorId, url } );
      const collecName = `${db}-${collection}-${userData.userId}`;
      const totalVectors = pineconeVectors.length;

      const { newProject, proj } = await checkStoreLimits({db, totalVectors, userData})
  
      const upsertSuccess: boolean = await upsertData({
        vectors: pineconeVectors,
        collection: collecName,
        customPineconeKey: userData.pineconeKey,
        customPineconeEnv: userData.pineconeEnv,
        customIndex: proj.data?.index,
      });

      if (!upsertSuccess) {
        throw "Could not upsert data in pinecone DB."
      }

      const upsertedIds = pineconeVectors.map(vec => vec.id);

      // UPDATE DB, related collection and vector tables
      await updateSupabaseStore({ db, collection, userData, upsertedIds, newProject, totalVectors, proj, uploadId });

      return res.status(200).json({
        data: {
          success: upsertSuccess,
          vectorIds: upsertedIds,
          uploadId: uploadId
        }
      });

      
    } catch (e) {
      reportError(userData.userId, e);
      return res.status(500).json({error: e})
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request type' })
  }  
}
