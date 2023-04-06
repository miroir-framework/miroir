// // #############################################################################################
export const datastoreTypeObject = {
  'datastoreSQL': 'datastoreSQL', // to delete all DB contents. DANGEROUS. TEMPORARY?
  'datastoreNoSQL': 'datastoreNoSQL',
  'datastoreJSONfile': 'datastoreJSONfile',
  'datastoreIndexedDb': 'datastoreIndexedDb',
  'datastoreGitRepo': 'datastoreGitRepo',
}
export type DatastoreType = keyof typeof datastoreTypeObject;
export const datastoreTypeArray:DatastoreType[] = Object.keys(datastoreTypeObject) as DatastoreType[];
export const datastoreTypeArrayString:string[] = datastoreTypeArray.map(a=>a);

export interface DatastoreSQL {
  datastoreType: 'datastoreSQL';
  connectionString: string;
}

export interface DatastoreNoSQL {
  datastoreType: 'datastoreNoSQL';

}

export interface DatastoreJSONfile {
  datastoreType: 'datastoreJSONfile';

}

export interface DatastoreIndexedDb {
  datastoreType: 'datastoreIndexedDb';

}

export interface DatastoreGitRepo {
  datastoreType: 'datastoreGitRepo';

}

export type Datastore = 
  | DatastoreSQL
  | DatastoreNoSQL
  | DatastoreJSONfile
  | DatastoreGitRepo
;