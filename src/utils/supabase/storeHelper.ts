import { reportError } from "../setup/mixpanel";
import supabase from "../setup/supabase";
import { CustomerProjectLimits, CustomerVectorLimits, UserDataType } from "../types/types";
import { createHash } from "crypto";

type UpdateSupabaseStoreType = {
  db: string,
  userData: UserDataType,
  collection: string,
  proj: any,
  totalVectors: number,
  upsertedIds: string[],
  newProject: number,
  uploadId: string,
}

type CheckStoreLimitsType = {
  userData: UserDataType,
  totalVectors: number,
  db: string
}

type UpdateUrlType = {
  userData: UserDataType,
  url: string,
  uploadId: string,
  isUnique: boolean,
  totalVectors: number
}


export const checkStoreLimits = async ({userData, db}: CheckStoreLimitsType) => {

  // CHECK DB before upserting and check plan limits
  const proj = await supabase.from('dbs').select('totalVectors, totalCollections, internalStorage, index').eq('userId', userData.userId).eq('projectName', db).single();
  
  let newProject = 0;
  if (proj.error) {
    newProject = 1;
  }

  return { proj, newProject };
}

const updateSupabaseStore = async ({ db, userData, collection, proj, totalVectors, upsertedIds, newProject, uploadId }: UpdateSupabaseStoreType) => {
  
  // add the namespace as a collection to user data if it doesn't already exist
  const prevCollec = await supabase.from('collections').select('totalVectors').eq('projectName', db).eq('userId', userData.userId).eq('collection', collection).single();
  let newCollection = 0;
  if (prevCollec.error) {
    newCollection = 1;
  }

  const now = new Date().toISOString();

  // if url - delete old vectors for url and update records
  // if (url) {
  //   console.log('deleting url', url)
  //   totalVectors = await updateUrlRecord({ userData, url, uploadId, isUnique, totalVectors });
  // } 

  const project = await supabase.from("dbs").upsert({ lastUpdated: now, projectName: db, userId: userData.userId, index: 'mindplug', totalVectors: (proj?.data?.totalVectors || 0 )+ totalVectors, totalCollections: (proj.data?.totalCollections || 0) + newCollection }).select().single();
  if (project.error) {
    console.log('project error: ', project.error)
    throw 'Could not update project in db'
  }

  const upserted = await supabase.from('collections').upsert({ userId: userData.userId, projectName: db, collection: collection, index: 'mindplug', projectId: project.data?.id, totalVectors: (prevCollec.data?.totalVectors || 0) + totalVectors }).select('collectionId').single();
  if (upserted.error) {
    console.log('could not upsert vectors in supabase: ', upserted.error)
  }

  

  // insert new vectors
  await Promise.all(upsertedIds.map((id, index) => {
    return supabase.from('vectors').upsert({ vectorId: id, collectionId: upserted.data?.collectionId, vectorNumber: index, uploadId: uploadId})
  }));
}

export default updateSupabaseStore;