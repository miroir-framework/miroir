export interface Minstance {
  "uuid": string,
  "entity": string,
  // "name":string,
  // "defaultLabel": string,
}

export interface MinstanceWithName extends Minstance {
  // "uuid": number,
  // "entity": string,
  "name":string,
  // "defaultLabel": string,
}

export type Minstances = Minstance[];
