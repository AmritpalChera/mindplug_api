// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { any, number, object, record, string, TypeOf } from "zod";
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
  content: any(),
  db: string(),
  metadata: record(any()),
  chunkSize: number().optional(),
  vectorId: string().optional(), // you can only update one vector at a time (for now)
  type: string().optional(),
})

interface FetchRequest extends NextApiRequest {
  body: TypeOf<typeof bodySchema>,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  //Extract token
  await runMiddleware(req, res);
  console.log('req body is: ', req.body)
  const file: File = req.body?.file;
  console.log(file?.name)

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
    const { collection, db, chunkSize, metadata, vectorId, type } = req.body;
    let { content } = req.body;

    // parse data based on the type
    try {
      console.log('req body is: ', req.body)
      // console.log('req.file is: ', req)
    } catch (e) {
      
    }

    return res.json({data: {success: true}})

    // collection is an eq of namespace and content is the metadata of the embedidngs
    // id should match the id in the supabase database

    try {

      const embeds: EmbedType[] | null = await embeddingGenerator({ content: [content], chunkSize: chunkSize, customKey: userData.decrypted_openaiKey }).catch((err) => {
        return null
      });

      if (!embeds) {
        return res.status(403).send({error: `Could not generate embeddings. ${userData.decrypted_openaiKey && 'Please check your openai key in settings.'} Please contact support if needed`})
      }

      const pineconeVectors = generateVector({ data: embeds }, metadata, vectorId);
      const collecName = `${db}-${collection}-${userData.userId}`;

      const totalVectors = pineconeVectors.length;
  
      const upsertSuccess: boolean = await upsertData({
        vectors: pineconeVectors,
        collection: collecName,
        customPineconeKey: userData.decrypted_pineconeKey,
        customPineconeEnv: userData.pineconeEnv,
      });

      if (!upsertSuccess) {
        res.status(500).send({error : 'Could not store data. Please contact support'})
        return;
      }

      const upsertedIds = pineconeVectors.map(vec => vec.id);


      // UPDATE DB, related collection and vector tables
      const proj = await supabase.from('dbs').select('totalVectors').eq('userId', userData.userId).eq('projectName', db).single();

      let totalProjects = (userData.analytics?.totalProjects || 0);
      if (proj.error) {
        totalProjects +=1
      }

      const project = await supabase.from("dbs").upsert({ lastUpdated: (new Date().toISOString()), projectName: db, userId: userData.userId, index: 'mindplug', totalVectors: (proj?.data?.totalVectors || 0 )+ totalVectors }).select().single();
      if (project.error) {
        console.log('project error: ', project.error)
        res.status(403).send({ error: 'Could not find project in db' });
        return;
      }

      // add the namespace as a collection to user data if it doesn't already exist
      const prevCollec = await supabase.from('collections').select('totalVectors').eq('projectName', db).eq('userId', userData.userId).eq('collection', collection).single();
      let collectionCount = userData.analytics?.totalCollections || 0;
      if (prevCollec.error) {
        collectionCount += 1;
      }
      const upserted = await supabase.from('collections').upsert({ userId: userData.userId, projectName: db, collection: collection, index: 'mindplug', projectId: project.data?.id, totalVectors: (prevCollec.data?.totalVectors || 0) + totalVectors }).select('collectionId').single();
      if (upserted.error) {
        console.log('could not upsert vectors in supabase: ', upserted.error)
      }

      await Promise.all(upsertedIds.map((id) => {
        return supabase.from('vectors').upsert({ vectorId: id, collectionId: upserted.data?.collectionId})
      }));

      const overallVectors: number = (userData.analytics?.totalVectors || 0) + totalVectors;
      await supabase.from('analytics').update({totalProjects: totalProjects, totalVectors: overallVectors, totalCollections: collectionCount}).eq('mindplugKey', userData.mindplugKey)

      return res.status(200).json({
        data: {
          success: upsertSuccess,
          vectorIds: upsertedIds
        }
      });
      
    } catch (e) {

      console.log("indexing error: ", e)
      return res.status(500).json({error: 'Unable to index data. Please contact support.'})
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request type' })
  }  
}
