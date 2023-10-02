import  initializeOpenai, { limiterOpenai } from "../setup/openai";


const baseComp = (chatData: any, internal?: boolean) => {
  const openai = initializeOpenai(process.env.NEXT_PUBLIC_OPENAI_KEY!);
  return limiterOpenai.schedule(() => openai.createChatCompletion({
    model: 'gpt-3.5-turbo-16k',
    messages: chatData,
    temperature: 0.7,
    max_tokens: 10000,
    frequency_penalty: 0.5,
    presence_penalty: 0.3,
  }));
};


const baseComp4 = (chatData: any) => {
  const openai = initializeOpenai(process.env.NEXT_PUBLIC_OPENAI_KEY!);
  return limiterOpenai.schedule(() => openai.createChatCompletion({
    model: 'gpt-4',
    messages: chatData,
    temperature: 0.7,
    max_tokens: 7000,
    frequency_penalty: 0.5,
    presence_penalty: 0.3,
  }));
};



type chatGptTypes = {
  noAI?: boolean,
  search: string
  amountChars?: number
}


const summarizeText = async ({ noAI, search, amountChars }: chatGptTypes) => {
  const systemtTemplate = `You summarize the given text keeping the important details. You keep the character count under the amount stated by the user`;

  const toSend = [
    { role: 'system', content: systemtTemplate },
    { role: 'user', content: `${search}. Respond in under ${amountChars} characters. Only keep important details and answer with minimum words.`}
  ];

  try {
    let baseCompletion = await baseComp(toSend).catch(err => {
      return baseComp(toSend);
    });
    // make sure the summary is under the stated characters using gpt 4



    const gpt3Comp = baseCompletion.data?.choices[0].message?.content;
    if (!gpt3Comp) throw "could not create completion";
    const toSend4 = [{ role: 'system', content: 'You summarize the given text by the user.' }, { role: 'user', content: `Text: ${gpt3Comp}\n\nSummarize this in under ${amountChars} characters.` }];

    let comp = await baseComp4(toSend4).catch(err => {
      return baseComp(toSend);
    });

    const compData = comp.data?.choices[0].message?.content?.trim();
    return compData;
  } catch (e:any) {
    console.log('error is: ', e?.response?.data)
    throw "Could no create completion";
  };
};

export default summarizeText;