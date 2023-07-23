import initializePinecone from "../setup/pinecone";


type UpsertData = {
  vectorIds: string[],
  namespace: string,
  customIndex?: string,
  customPineconeKey?: string,
  customPineconeEnv?: string,
}

export default async function queryVectors(data: UpsertData) {
  const pinecone = await initializePinecone(data.customPineconeKey, data.customPineconeEnv);

  // retrieve index from pinecone
  const index = pinecone.Index(data.customIndex || 'mindplug');

  // splice vectors into chunks
  try {
    const queryResult = await index.fetch({ ids: data.vectorIds, namespace: data.namespace });

    //formattime
    const vectors = queryResult.vectors!;
    const vectorKeys = Object.keys(vectors)
    const toReturn = vectorKeys.map((key) => {
      const vec = vectors[key];
      return {
        id: vec.id,
        metadata: vec.metadata
      }
    })

    return (toReturn);
  } catch (e) {
    console.log("Error querying embeddings: ", e);
    throw new Error(`Error querying embeddings: ${e}`);
  }

}

