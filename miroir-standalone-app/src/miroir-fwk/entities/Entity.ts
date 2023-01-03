export interface MiroirEntityAttribute {
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

export interface MiroirEntity {
  "uuid": string,
  "entity": string,
  "name":string,
  "description"?:string,
  "instanceValidationJsonSchema": {},
  "attributes"?: MiroirEntityAttribute[],
};

export type MiroirEntities=MiroirEntity[];
