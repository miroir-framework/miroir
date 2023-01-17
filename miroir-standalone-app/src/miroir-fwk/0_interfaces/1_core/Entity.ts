import { InstanceWithName } from "src/miroir-fwk/0_interfaces/1_core/Instance";

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
