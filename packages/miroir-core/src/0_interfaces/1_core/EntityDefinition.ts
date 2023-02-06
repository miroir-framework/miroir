import { InstanceWithName } from "./Instance.js";

export interface EntityAttribute {
  "id": number,
  "name": string,
  "defaultLabel": string,
  "type": string,
  "nullable": boolean,
  "editable": boolean,
};

export interface EntityDefinition extends InstanceWithName {
  "entity": string,
  "description"?:string,
  "instanceValidationJsonSchema": {},
  "attributes"?: EntityAttribute[],
};

export default {}