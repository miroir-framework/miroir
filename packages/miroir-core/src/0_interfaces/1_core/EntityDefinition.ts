import { EntityInstanceWithName } from "./Instance.js";

// export const EntityAttributeTypeObject:{[id in string]:id} = {
export const EntityAttributeTypeObject = {
  'STRING': 'STRING', 
  'ARRAY': 'ARRAY', 
  'OBJECT': 'OBJECT',
}
export type EntityAttributeType = keyof typeof EntityAttributeTypeObject;
export const EntityAttributeTypeNameArray: EntityAttributeType[] = Object.keys(EntityAttributeTypeObject) as EntityAttributeType[];



export interface EntityAttribute {
  "id": number,
  "name": string,
  "defaultLabel": string,
  "type": EntityAttributeType,
  "nullable": boolean,
  "editable": boolean,
};

export interface EntityDefinition extends EntityInstanceWithName {
  "parentName"?: string,
  "parentUuid": string,
  "description"?:string,
  "instanceValidationJsonSchema": {},
  "attributes"?: EntityAttribute[],
};

export default {}