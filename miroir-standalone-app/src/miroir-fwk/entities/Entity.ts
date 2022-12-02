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
  "uuid": number,
  "entity": string,
  "name":string,
  "instanceValidationJsonSchema": {},
  "attributes"?: MiroirEntityAttribute[],
};

export type MiroirEntities=MiroirEntity[];
