export interface MiroirObject {
  "uuid": number,
  "entity": string,
  // "name":string,
  // "defaultLabel": string,
}

export interface MiroirObjectWithName extends MiroirObject {
  // "uuid": number,
  // "entity": string,
  "name":string,
  // "defaultLabel": string,
}