export interface MentityAttribute {
  "id": number,
  "name": string,
  "defaultLabel": string,
  "type": string,
  "nullable": boolean,
  "editable": boolean,
  // "attributeFormat"?: {
  //   "name": string,
  //   "defaultLabel": string,
  // }[],
};

export interface Mentity {
  "uuid": string,
  "entity": string,
  "name":string,
  "description"?:string,
  "instanceValidationJsonSchema": {},
  "attributes"?: MentityAttribute[],
};

export type mEntities=Mentity[];
