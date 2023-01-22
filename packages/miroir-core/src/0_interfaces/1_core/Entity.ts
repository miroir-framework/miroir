import { InstanceWithName } from "./Instance.js";

export interface EntityAttribute {
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

export interface EntityDefinition extends InstanceWithName {
  // "uuid": string,
  // "name":string,
  "entity": string,
  "description"?:string,
  "instanceValidationJsonSchema": {},
  "attributes"?: EntityAttribute[],
};

export default {}