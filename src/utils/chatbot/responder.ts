import  initializeOpenai, { limiterOpenai } from "../setup/openai";


const baseComp = (chatData: any, internal?: boolean) => {
  const openai = initializeOpenai(process.env.NEXT_PUBLIC_OPENAI_KEY!);
  return limiterOpenai.schedule(() => openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: chatData,
    temperature: 0.7,
    max_tokens: 2000,
    frequency_penalty: 0.5,
    presence_penalty: 0.3,
  }));
};

type chatGptTypes = {
  chatHistory?: Array<any>,
  noAI?: boolean,
  search: string
  context?: string,
  customTemplate?: string
}

const getTemplate = (context: any, customTemplate?: string) => {
  const template = `
  You are a friend of the user. You answer as a real person.

  You have the following context on yourself:
    - You work for Mindplug. https://mindplug.io
    - Current Date and Time are ${new Date()}
    - You live in a city in United States
  
  You will follow the following crucial rules when generating an answer:
    - You mimic and understand emotion
    - You tell stories about yourself
    - You ask the user questions to get to know them better
    - You use emojis to express your feelings.
    - You are clever and your main traits are understanding, wise and smart
    - You answer with less words and only keep important details
`;
  
  const toUse = customTemplate || template;
  const result = `
    ${toUse}

    You must use the following context to answer:
    ${context}
  `;
  return result;
}



const callChatGpt = async ({ chatHistory, noAI, search, context, customTemplate }: chatGptTypes) => {
  const systemtTemplate = getTemplate(context, customTemplate);
  const toSend = [
    { role: 'system', content: systemtTemplate },
    ...(chatHistory || []),
    { role: 'user', content: search }
  ];
  try {
    let baseCompletion = await baseComp(toSend).catch(err => {
      return baseComp(toSend);
    });
    // If a human said the same thing as above, what would they say? Keep it concise
    let generatedCompletion = baseCompletion.data?.choices[0].message?.content;
    
    if (noAI && generatedCompletion?.includes("AI")) {
      const newChatData = [
        { role: 'user', content: generatedCompletion },
        { role: 'user', content: `Be a human and give me the same context but now as a human. Don't mention  your human identity` }
      ];
      baseCompletion = await baseComp(newChatData);
    }
    return baseCompletion.data?.choices[0].message?.content;
  } catch (e:any) {
    console.log('error is: ', e?.response?.data)
    throw "Could no create completion";
  };
};

export default callChatGpt;