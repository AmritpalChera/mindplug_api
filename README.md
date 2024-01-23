# Mindplug
![image](https://github.com/AmritpalChera/mindplug_api/assets/52187061/40cabf3a-1bbd-45f4-9afe-8f284e298b86)


## What is Mindplug? 🤔
Mindplug is an API service allowing integration of semantic search in any application within minutes. It provides a high level interface to generating and managing embeddings easily through combining different technologies. 

Mindplug is an essential service for people looking to move fast with cutting edge technology. Currently hosted plans are able to support small to medium sized organizations. We're working on hosted enterprise plans that will soon be released in the future.

For those who want extra control of their data and like working at the low-level, we also allow the users to bring their own API keys for the services we use. This way, Mindplug can be used as an interface to interact with user's existing data.

Mindplug provides a pre-built frontend dashboard for the API that can be used to generate and manage embeddings. This is best for those looking for a no-code solution for their data. We're working on integrations between Mindplug and ExperAI, our chatbot application.

To maximize the use cases, Mindplug allows users to embed data from multiple file types including PDF, Web, Docs and even YouTube videos. We take care of all the technical details to provide the best quality embeddings and the most relevant results to your search query.

Our vision is to inspire people from around the world to be fascinated through this technology. To support this, we've kept our pricing plans fairly lenient with abilities to store up to 300 vectors for free. With our pre-processing, this is enough storage for a 30 page pdf document. We believe this is enough storage for anybody to get started with semantic search on any data.

A very minor list of use-cases for using the Mindplug API include: 
```
Long-term memory for conversational chat bots
Searching books and manuals by meaning of query
Searching customer databases
Quickly parsing through information in videos
Creating conversational chatbots for any website instantly.
Generating long-term friends which develop personality over time.
Generating AI customer support bots for your website
```

## Minimizing costs for storing data 🪙
Mindplug uses Pinecone. How do we minimize costs to provide the best user experience? 

Pinecone is a vector database that charges per index. An index is a type of storage that supports different projects. Each project can further be sub-divided by namespaces. The projects run on a server called a pod. There are different tiers for the pods, optimized for different use cases. In our case, we optimize for storage, using S1 pods, given the users may upload an arbitrary amount of data. 

On this S1 pod, Mindplug automatically creates an index called Mindplug. The projects and collections in your account are living in a shared space in this S1 pod, divided by the namespaces for each specific user. This allows Mindplug to utilize the most of amount of space per index, avoiding the creation of additional pods thus charges.

Pinecone automatically encrypts data for its embeddings. Please see Pinecone's security policy on how your embedding data is treated: https://www.pinecone.io/security/. Although this is the case, the data lives in a shared space for different users. This data is not utilized for any other purpose other than to complete the user API requests.

## JS SDK
There is a standardized JS SDK available for mindplug for users to easily integrate semantic search into their applications. Mindplug is the easiest solution to creating and managing embeddings. Add long term memory to your LLMs, perform semantic data analysis and easily filter data based on metadata. Connect your app to external web sources using our smart endpoints.

### Install
NPM
```
npm install mindplug
```
Yarn
```
yarn add mindplug
```

### Initialize Mindplug
Obtain an API key from [Mindplug](https://www.mindplug.io/) dashboard.
```
import Mindplug from 'mindplug';
const mindplug = new Mindplug({mindplugKey: <SAMPLE KEY>});
```

### Store Data


Please see the full documentation [here](https://docs.mindplug.io/javascript-sdk).

## API
Mindplug follows a REST API architecture which can be universally used in any language for any application.

Using the raw API ensures the fastest updates for new and existing endpoints. All the endpoints are listed in this documentation and use axios for making the call requests to Mindplug servers.
The documentation architecture:

### Setup
API Setup - Base: Base instance for axios used to interact with text storage and web.

API Setup - PDFs: Base instance for axios used to interact with PDF files

API Setup - Audio: Base instance for axios used to interact with audio

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
# mindplug_api
