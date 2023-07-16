import initializePinecone from "../setup/pinecone";


type UpsertData = {
  search: number [],
  collection: string | undefined,
  numberResults?: number
}

type Metadata = {
  content: string
}

export default async function queryData(data: UpsertData) {
  const pinecone = await initializePinecone();

  // retrieve index from pinecone
  const index = pinecone.Index('mindplug');

  // query to return the top 3 results
  const queryRequest = {
    vector: data.search,
    topK: data.numberResults || 3,
    includeMetadata: true,
    namespace: data.collection
  };

  // splice vectors into chunks
  try {
    const queryResult = await index.query({
      queryRequest,
    });
    return (
      queryResult.matches?.map((match) => ({
        ...match,
        metadata: match.metadata as Metadata,
      })) || []
    );
  } catch (e) {
    console.log("Error querying embeddings: ", e);
    throw new Error(`Error querying embeddings: ${e}`);
  }

}

