// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { any, array, number, object, record, string, TypeOf } from "zod";
import authHandler from '@/utils/authHandler';
import embeddingGenerator from '@/utils/embedder/embeddingGenerator';
import generateVector from '@/utils/pinecone/generateVector';
import upsertData from '@/utils/pinecone/upsert';
import supabase from '@/utils/setup/supabase';
import { EmbedType } from '@/utils/types/types';
import runMiddleware from '@/utils/setup/middleware';

type Data = {
  data?: object,
  error?:  any
}

const bodySchema = object({
  collection: string().optional(),
  content: string(),
  db: string(),
  metadata: record(any()),
  chunkSize: number().optional()
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>
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
    const { collection, content, db, chunkSize, metadata } = req.body;


    // collection is an eq of namespace and content is the metadata of the embedidngs
    // id should match the id in the supabase database

    try {
      const embeds: EmbedType[] = await embeddingGenerator({ content: [content], chunkSize: chunkSize });
      const pineconeVectors = generateVector({ data: embeds }, metadata);
      const collecName = `${db}-${collection}`;

      const totalVectors = pineconeVectors.length;
  
      const upsertSuccess: boolean = await upsertData({
        vectors: pineconeVectors,
        collection: collecName
      });

      if (!upsertSuccess) {
        res.status(500).send({error : 'Could not store data. Please contact support'})
        return;
      }

      const upsertedIds = pineconeVectors.map(vec => vec.id);

      const proj = await supabase.from('dbs').select('totalVectors').eq('userId', userData.userId).eq('projectName', db).single();

      if (proj.error) {
        res.status(403).send({ error: 'Could not get project details' });
        return;
      }

      const project = await supabase.from("dbs").upsert({ lastUpdated: (new Date().toISOString()), projectName: db, userId: userData.userId, index: 'mindplug', totalVectors: proj.data.totalVectors + totalVectors }).select().single();
      if (project.error) {
        console.log('project error: ', project.error)
        res.status(403).send({ error: 'Could not find project in db' });
        return;
      }

      // add the namespace as a collection to user data if it doesn't already exist
      const prevCollec = await supabase.from('collections').select('totalVectors').eq('projectName', db).eq('userId', userData.userId).eq('collection', collection).single();
      const upserted = await supabase.from('collections').upsert({ userId: userData.userId, projectName: db, collection: collection, index: 'mindplug', projectId: project.data?.id, totalVectors: (prevCollec.data?.totalVectors || 0) + totalVectors });
      if (upserted.error) {
        console.log('could not upsert vectors in supabase: ', upserted.error)
      }

      return res.status(200).json({
        data: {
          success: upsertSuccess,
          vectorIds: upsertedIds
        }
      });
      
    } catch (e) {

      console.log("indexing error: ", e)
      return res.status(500).json({error: 'Unable to index data'})
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request type' })
  }

    
  
  
}
