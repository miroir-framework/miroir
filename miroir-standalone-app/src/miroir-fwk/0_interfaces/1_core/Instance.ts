export interface Instance {
  "uuid": string,
  "entity": string,
  // "name":string,
  // "defaultLabel": string,
}

export interface InstanceWithName extends Instance {
  // "uuid": number,
  // "entity": string,
  "name":string,
  // "defaultLabel": string,
}
