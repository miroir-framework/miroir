export interface MEntityAttribute {
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

export interface MEntityDefinition {
  "uuid": string,
  "entity": string,
  "name":string,
  "description"?:string,
  "instanceValidationJsonSchema": {},
  "attributes"?: MEntityAttribute[],
};
