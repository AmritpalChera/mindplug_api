
import { Document } from "langchain/dist/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import initializeOpenai from "../setup/openai";
import OpenAI from "openai";
import initializeAnyscale from "../setup/anyscale";


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

const formatBuffer = async (buffer: Array<Document>, openai: OpenAI) => {
  const textString = buffer.map((item) => item.pageContent).join("  ").trim();
  // Check if the overall length of the (text String)*1.25  > 7000; If so split.
  console.log(`text string is: ${textString}***********`);
  const messages: any = [
    {role: 'system', content: `
      You split of the given input in small passages.

      You respond with a JSON {
        chunks : {
            [chunk x]: "content"
          ...
        }
        keywords: [keyword 1, keyword  2, ...]
      }
      
      You keep all the information in the input.
      
    `},
    {role: 'user', content: ` 
      ${textString}
      

      Could you split the above passage into small chunks. Keep all text.  Group related text (representing same idea) into one chunk .  Max chunk length is 300 words.

      Return JSON {
        chunks: {
          [chunk x]: "content",
          ....
        }
          keyworks: [keyword 1, keyword 2, ...]
      }
    `
    }
  ];
  // await callMistralBeta(textString);
  const formattedFn = async () =>  await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    messages: messages,
    max_tokens: 4000,
    temperature: 0.61,
    presence_penalty: 0,
    frequency_penalty: 0,
    response_format: {type: "json_object"},
    top_p: 0.6,
  }).catch(err => console.log(err));


  let formatted = await formattedFn();
  let rawFormatted: any = formatted?.choices[0]?.message.content;
  // console.log('rar formatted: ', rawFormatted);
  if (!rawFormatted) return [];
  if (!isJsonString(rawFormatted)) {
    console.log('invalid JSON');
    // regenerating
    formatted = await formattedFn();
    rawFormatted = formatted?.choices[0]?.message.content;
    if (!isJsonString(rawFormatted)) {
      console.log('Unable to generate valid json');
      return;
    }
  }
  rawFormatted = JSON.parse(rawFormatted)
  const basicFormattedKeys = Object.keys(rawFormatted);
  const formattedArr = basicFormattedKeys.map((key: string) => {
    return rawFormatted[key]
  });
  return formattedArr;
}

export const smartChunkDocuments = async (documents: Document[], openai: OpenAI) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 0,
  });
  const docOutput = await splitter.splitDocuments(documents);

  let currPage = 1;
  let bufferChunk = {};
  let buffer: Array<Document> = []; // stores the temp chunks from the current page
  const newChunks: Array<Document> = []; // stores the finalized chunks

  // for each Document output, combine the strings of the page n + 1;
  for (let a = 0; a < docOutput.length; a++) {
    if (currPage ===  docOutput[a].metadata.pageNumber) {
      buffer.push(docOutput[a])
    } else {
      // we are on the next page - change currPage to
      

      buffer.push(docOutput[a]);
      // use OpenAI to refactor the buffer
       
      const formattedStrings = await formatBuffer(buffer, openai);
      console.log(formattedStrings);
      if (formattedStrings && formattedStrings.length > 0) {
        const formattedChunks = formattedStrings[0];
        const formattedChunkKeys = Object.keys(formattedStrings[0]);
        formattedChunkKeys.forEach((formattedKey) => {
          newChunks.push({
            pageContent: formattedChunks[formattedKey],
            metadata: {
              fileName: docOutput[currPage].metadata.fileName,
              totalPages: docOutput[currPage].metadata.totalPages,
              pageNumber: docOutput[currPage].metadata.pageNumber
            }
          } as Document);
        });
      }
      buffer = [{...docOutput[a]}]; // use current chunk also for next run
      if (currPage !==  docOutput[a].metadata.pageNumber) currPage +=1;
    }
  }

  return newChunks;
}