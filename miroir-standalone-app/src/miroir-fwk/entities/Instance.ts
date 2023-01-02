export interface MiroirEntityInstance {
  "uuid": number,
  "entity": string,
  // "name":string,
  // "defaultLabel": string,
}

export interface MiroirEntityInstanceWithName extends MiroirEntityInstance {
  // "uuid": number,
  // "entity": string,
  "name":string,
  // "defaultLabel": string,
}

export type MiroirEntityInstances = MiroirEntityInstance[];
