// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import runMiddleware from '@/utils/setup/middleware';
import { EmbedType, FileContentType } from '@/utils/types/types';
import { any, number, object, record, string } from 'zod';
import loadPDF from '@/utils/fileParsers/pdfParser';
import { parseFileData } from '@/utils/fileParsers';
import authHandler from '@/utils/authHandler';
import { embeddingGeneratorFile } from '@/utils/embedder/embeddingGenerator';
import generateVector from '@/utils/pinecone/generateVector';
import upsertData from '@/utils/pinecone/upsert';
import updateSupabaseStore, { checkStoreLimits } from '@/utils/supabase/storeHelper';

//set bodyparser
export const config = {
  api: {
    bodyParser: false,
  },
}

type Data = {
  data?: object,
  error?:  any
}


const bodySchema = object({
  collection: string().optional(),
  db: string(),
  metadata: record(any()),
  chunkSize: number().optional(),
  type: string().optional(),
})



export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  //Extract token
  await runMiddleware(req, res);

  if (req.method === 'POST') {

    let userData;
    try {
      userData = await authHandler(req);
    } catch (e: any) {
      return res.status(403).json({error: e})
    }
    if (!userData) return res.status(403).json({ error: 'Invalid auth' });

    // parse data
    let data;
    try {
      data = await parseFileData(req);
    } catch (e) {
      console.log('error parsing file: ', e)
      return res.status(403).send({ error: 'Could not parse data.' });
    }


    // safe parse fields
    const result = bodySchema.safeParse(data.fields);
    if (!result.success) return res.status(400).send({ error: result.error });
    
    const { collection, db, chunkSize, metadata, type } = data.fields;
    const { file } = data;


    // parse the file into plain text
    let content: FileContentType[] = [];
    try {
      if (type === 'pdf') {
        content = await loadPDF(file as Blob);
      } 
    } catch (e: any) {
      console.log('could not parse file data: ', e?.response?.data);
      return res.status(403).send({ error: 'Could not parse file data' });
    }

    // content is now loaded as documents
    try {
      const embeds: EmbedType[] | null = await embeddingGeneratorFile({ content: content, chunkSize: chunkSize, customKey: userData.openaiKey });
      if (!embeds) {
        throw `Could not generate embeddings. ${userData.openaiKey && 'Please check your openai key in settings.'} Please contact support if needed`;
      }

      const pineconeVectors = generateVector({ data: embeds }, metadata);
      const collecName = `${db}-${collection}-${userData.userId}`;

      const totalVectors = pineconeVectors.length;
      
      const { newProject, proj } = await checkStoreLimits({totalVectors, userData, db})
  
      const upsertSuccess: boolean = await upsertData({
        vectors: pineconeVectors,
        collection: collecName,
        customPineconeKey: userData.pineconeKey,
        customPineconeEnv: userData.pineconeEnv,
        customIndex: proj.data?.index
      });

      if (!upsertSuccess) {
        throw 'Could not store store vectors in pinecone db.'
      }

      const upsertedIds = pineconeVectors.map(vec => vec.id);

      await updateSupabaseStore({ db, collection, totalVectors, upsertedIds, newProject, userData, proj });

      return res.status(200).json({
        data: {
          success: upsertSuccess,
          vectorIds: upsertedIds
        }
      });

    } catch (e) {
      let toSend = typeof (e) === 'string' ? e : 'Unable to store data. Please contact support';
      return res.status(500).json({error: toSend})
    }
    
  } else {
    res.status(400).json({ error: 'Invalid request type' })
  }  
}
