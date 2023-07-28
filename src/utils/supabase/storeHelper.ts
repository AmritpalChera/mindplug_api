import { addAnalyticsCount } from "../analytics/requestTracker";
import supabase from "../setup/supabase";
import { UserDataType } from "../types/types";
import { v4 as uuidv4 } from 'uuid';

type UpdateSupabaseStoreType = {
  db: string,
  userData: UserDataType,
  collection: string,
  proj: any,
  totalVectors: number,
  upsertedIds: string[],
  newProject: number
}

type CheckStoreLimitsType = {
  userData: UserDataType,
  totalVectors: number,
  db: string
}

export const checkStoreLimits = async ({userData, totalVectors, db}: CheckStoreLimitsType) => {
  if (!userData.analytics.customPlan && userData.analytics.totalVectors + totalVectors > userData.analytics.vectorLimit) {
    throw "Action exceeds plan quoto. Vector limit reached";
  }
  

  // CHECK DB before upserting and check plan limits
  const proj = await supabase.from('dbs').select('totalVectors, totalCollections').eq('userId', userData.userId).eq('projectName', db).single();

  let newProject = 0;
  if (proj.error) {
    newProject = 1;
    if (!userData.analytics.customPlan && (userData.analytics.totalProjects + 1) > userData.analytics.projectLimit) {
      throw "Action exceeeds plan quota. Project limit reached"
    }
  }
  return { proj, newProject };
}

const updateSupabaseStore = async ({ db, userData, collection, proj, totalVectors, upsertedIds, newProject }: UpdateSupabaseStoreType) => {
  
  // add the namespace as a collection to user data if it doesn't already exist
  const prevCollec = await supabase.from('collections').select('totalVectors').eq('projectName', db).eq('userId', userData.userId).eq('collection', collection).single();
  let newCollection = 0;
  if (prevCollec.error) {
    newCollection = 1;
  }


  const project = await supabase.from("dbs").upsert({ lastUpdated: (new Date().toISOString()), projectName: db, userId: userData.userId, index: 'mindplug', totalVectors: (proj?.data?.totalVectors || 0 )+ totalVectors, totalCollections: (proj.data?.totalCollections || 0) + newCollection }).select().single();
  if (project.error) {
    console.log('project error: ', project.error)
    throw 'Could not update project in db'
  }

  const upserted = await supabase.from('collections').upsert({ userId: userData.userId, projectName: db, collection: collection, index: 'mindplug', projectId: project.data?.id, totalVectors: (prevCollec.data?.totalVectors || 0) + totalVectors }).select('collectionId').single();
  if (upserted.error) {
    console.log('could not upsert vectors in supabase: ', upserted.error)
  }

  const uploadId = uuidv4(); //upload id
  await Promise.all(upsertedIds.map((id) => {
    return supabase.from('vectors').upsert({ vectorId: id, collectionId: upserted.data?.collectionId, uploadId: uploadId})
  }));

  await addAnalyticsCount({totalProjects: newProject, totalCollections: newCollection, totalVectors: totalVectors, analytics: userData.analytics})
}

export default updateSupabaseStore;