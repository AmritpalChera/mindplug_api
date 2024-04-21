
import { Document } from "langchain/dist/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import initializeOpenai from "../setup/openai";
import OpenAI from "openai";
import initializeAnyscale from "../setup/anyscale";
import axios from "axios";


export default async function chunkRawData(content: string[], chunkSize?: number) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize || 1024,
    chunkOverlap: chunkSize? Math.round(chunkSize/20) : 70,
  });

  const chunks = await splitter.createDocuments(content);
  return chunks;
}

export const chunkDocuments = async (documents: Document[], chunkSize?: number) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize || 1024,
    chunkOverlap: chunkSize? Math.round(chunkSize/20) : 70,
  });
  const docOutput = await splitter.splitDocuments(documents);
  return docOutput
}


function isJsonString(str: string) {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}


export const OPENAI_BASE_URL="https://api.endpoints.anyscale.com/v1"

const callMistralBeta  = async (textString: any) => {
  const messages: any = [
    {role: 'system', content: 'You are text splliter who splits given text to small chunks.'},
    {role: 'user', content: `
      You are given the following text:

      ${textString}

      Can you split this up into small chunks with format:
      JSON {
        chunks: {
          [chunk x]: "content",
          ....
        }
        keywords: ["keyword 1", "keyword 2", ...yarn]
      }

      Keep all original text.
    `}
  ]
  const anyscale = initializeAnyscale();
  const completion = await anyscale.chat.completions.create({
    model: "meta-llama/Llama-2-70b-chat-hf",
    messages,
    temperature: 0.7,
    max_tokens: 4000,
    response_format: {"type": "json_object"}
  });
  console.log(`__________________`);
  console.log('completion is: ', completion.choices[0]?.message);

}

const formatBuffer = async (buffer: Array<string>, openai: OpenAI) => {
  let textString = buffer.join("").trim();
  // replace newlines with a dot
  textString = textString.replace(/(?:\r\n|\r|\n)/g, '. ');
  // replace dots after numbers with colons
  textString = textString.replace(/(\d+)\./g, '$1:');

  // Check if the overall length of the (text String)*1.25  > 7000; If so split.
  console.log(`text string is: ${textString}***********`);
 
  const smartChunks = await axios.post('http://localhost:6000/processText', {text: textString}).then(res => res.data);
  return smartChunks || [];
}

export const smartChunkDocuments = async (documents: Document[], openai: OpenAI) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 0,
  });
  const docOutput = await splitter.splitDocuments(documents);

  let currPage = 1;
  let bufferChunk = {};
  let buffer: Array<string> = []; // stores the temp chunks from the current page
  const newChunks: Array<Document> = []; // stores the finalized chunks

  // for each Document output, combine the strings of the page n + 1;
  for (let a = 0; a < documents.length; a++) {
      buffer.push(documents[a].pageContent)
  }

  const formattedStrings = await formatBuffer(buffer, openai);
  // console.log(formattedStrings);
  if (formattedStrings && formattedStrings.length > 0) {
    
    formattedStrings.forEach((chunkString: string) => {
      newChunks.push({
        pageContent: chunkString,
        metadata: {
          fileName: documents[0].metadata.fileName,
          totalPages: documents[0].metadata.totalPages,
          pageNumber: 0
        }
      } as Document);
    });
  }
  console.log('new chunks: ', newChunks)

  return newChunks;
}