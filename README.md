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
1. Long-term memory for conversational chat bots
2. Searching books and manuals by meaning of query
3. Searching customer databases
4. Quickly parsing through information in videos
5. Creating conversational chatbots for any website instantly.
6. Generating long-term friends which develop personality over time.
7. Generating AI customer support bots for your website
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
All storage of data requires a db and a collection.
Store text. Requires content
```
mindplug.store({
  db: "first database",
  collection: "any collection",
  content: "hello, sample text to store",
});
```

Store PDF file. Requires an object of type File under 50MB
```
mindplug.storePDF({
  db: "first database",
  collection: "any collection",
  file: <SAMPLE FILE>
});
```

Store webpage. Requires the webpage url
```
mindplug.storeWeb({
  db: "first database",
  collection: "any collection",
  url: "https://mindplug.io"
});
```

Store audio. Requires a MP3 or WAV file under 20MB
```
// must pass an openaiKey to constructor
mindplug.storeAudio({
  db: "first database",
  collection: "any collection",
  file: <SAMPLE FILE> 
});
```



Please see the full documentation [here](https://docs.mindplug.io/javascript-sdk).

## API
Mindplug follows a REST API architecture which can be universally used in any language for any application.

Using the raw API ensures the fastest updates for new and existing endpoints. All the endpoints are listed in this documentation and use axios for making the call requests to Mindplug servers.
The documentation architecture:

### Setup
[API Setup](https://docs.mindplug.io/api/api-setup-text) - Base: Base instance for axios used to interact with text storage and web.

[API Setup](https://docs.mindplug.io/api/api-setup-pdfs) - PDFs: Base instance for axios used to interact with PDF files

[API Setup](https://docs.mindplug.io/api/api-setup-audio) - Audio: Base instance for axios used to interact with audio


### Storing data
[Store basic text](https://docs.mindplug.io/api/storing-data): store basic text content given a string value.

[Store PDF files](https://docs.mindplug.io/api/store-pdf): Requires an instance of axios to pass formData.

[Store Webpage](https://docs.mindplug.io/api/store-web): Crawls the webpage and stores the text content. 

### Query Data
[By semantic search](https://docs.mindplug.io/api/query): To semantic search on stored data. Seach by meaning of text.

[By vector ids](https://docs.mindplug.io/api/query-by-ids): Search specific vectors by their ids.

[By collection](https://docs.mindplug.io/api/query-by-collection): Returns the recent 10 vectors from a given collection.

### Delete Data
[By vector ids](https://docs.mindplug.io/api/delete-by-ids): Delete specific data based on vector ids

[By collection](https://docs.mindplug.io/api/delete-collection): Delete an entire collection, including all stored vectors within.

[By project](https://docs.mindplug.io/api/delete-project): Delete an entire project, including all collections and vectors within.

### List Data
[List projects](https://docs.mindplug.io/api/list-projects): List all the projects you have on Mindplug

[List collections](https://docs.mindplug.io/api/list-collections): List all the collections you have on Mindplug

### Smart
[Web search](https://docs.mindplug.io/api/search-web): Returns the top 3 google results from select resources

There may be more endpoints not listed in this documentation. This repository is not actively maintained, however is still utilized by real-world users. 


## Running the server
Install dependencies 
```
yarn install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

By default the server uses port 3000 of localhost, but if this is run in parallel with the frontend, this should run on port 3001.

