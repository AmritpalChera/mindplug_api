import { addAnalyticsCount } from "../analytics/requestTracker";
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
  url?: string
}

type CheckStoreLimitsType = {
  userData: UserDataType,
  totalVectors: number,
  db: string
}

type UpdateUrlType = {
  userData: UserDataType,
  url: string,
  uploadId: string
}

export const checkStoreLimits = async ({userData, totalVectors, db}: CheckStoreLimitsType) => {
  if (!userData.analytics.customPlan && userData.analytics.totalVectors + totalVectors > CustomerVectorLimits[userData.analytics.plan]) {
    throw `Action exceeds plan quota. Requires ${totalVectors} vectors; limit reached`;
  }
  

  // CHECK DB before upserting and check plan limits
  const proj = await supabase.from('dbs').select('totalVectors, totalCollections, internalStorage, index').eq('userId', userData.userId).eq('projectName', db).single();
  
  let newProject = 0;
  if (proj.error) {
    newProject = 1;
    if (!userData.analytics.customPlan && (userData.analytics.totalProjects + 1) > CustomerProjectLimits[userData.analytics.plan]) {
      throw "Action exceeeds plan quota. Project limit reached"
    }
  }
  if (proj.data?.internalStorage  && !userData.analytics.customPlan) userData.pineconeEnv = '';
  return { proj, newProject };
}

const updateUrlRecord = async ({url, userData, uploadId}: UpdateUrlType) => {
  url = url.toLowerCase();
  const hostname = new URL(url).hostname;
  const hashedUrl = createHash('sha256').update(url).digest('hex');
  if (!hashedUrl || !hostname) {
    reportError(userData.userId, `Could not create hostname or hashedurl for url: ${url}`);
  } else {
    // update record with the same hash and store the new upload id.
    const createNewRecord = await supabase.from('webVectors').upsert({ uploadId, urlHash: hashedUrl, url, hostUrl: hostname });

    if (createNewRecord.error) {
      reportError(userData.userId, createNewRecord.error, `Could not create new url record`)
    }
  }
}

const updateSupabaseStore = async ({ db, userData, collection, proj, totalVectors, upsertedIds, newProject, uploadId, url }: UpdateSupabaseStoreType) => {
  
  // add the namespace as a collection to user data if it doesn't already exist
  const prevCollec = await supabase.from('collections').select('totalVectors').eq('projectName', db).eq('userId', userData.userId).eq('collection', collection).single();
  let newCollection = 0;
  if (prevCollec.error) {
    newCollection = 1;
  }

  const now = new Date().toISOString();

  const project = await supabase.from("dbs").upsert({ lastUpdated: now, projectName: db, userId: userData.userId, index: 'mindplug', totalVectors: (proj?.data?.totalVectors || 0 )+ totalVectors, totalCollections: (proj.data?.totalCollections || 0) + newCollection, internalStorage: !userData.analytics.customPlan }).select().single();
  if (project.error) {
    console.log('project error: ', project.error)
    throw 'Could not update project in db'
  }

  const upserted = await supabase.from('collections').upsert({ userId: userData.userId, projectName: db, collection: collection, index: 'mindplug', projectId: project.data?.id, totalVectors: (prevCollec.data?.totalVectors || 0) + totalVectors }).select('collectionId').single();
  if (upserted.error) {
    console.log('could not upsert vectors in supabase: ', upserted.error)
  }

  // insert new vectors
  await Promise.all(upsertedIds.map((id) => {
    return supabase.from('vectors').upsert({ vectorId: id, collectionId: upserted.data?.collectionId, uploadId: uploadId})
  }));

  // if url - delete old vectors for url and update records
  if (url) {
    console.log('deleting url', url)
    await updateUrlRecord({ userData, url, uploadId });
  } 

  await addAnalyticsCount({totalProjects: newProject, totalCollections: newCollection, totalVectors: totalVectors, analytics: userData.analytics, url})
}

export default updateSupabaseStore;