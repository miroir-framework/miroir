import { EntityInstanceWithName } from "./Instance.js";

// export const EntityAttributeTypeObject:{[id in string]:id} = {
export const EntityAttributeTypeObject = {
  'STRING': 'STRING', 
  'ARRAY': 'ARRAY', 
  'OBJECT': 'OBJECT',
  'ENTITY_INSTANCE_UUID': 'ENTITY_INSTANCE_UUID',
}
export type EntityAttributeType = keyof typeof EntityAttributeTypeObject;
export const EntityAttributeTypeNameArray: EntityAttributeType[] = Object.keys(EntityAttributeTypeObject) as EntityAttributeType[];

export type Uuid = string;

export interface EntityAttribute {
  "id": number,
  "name": string,
  "defaultLabel": string,
  "type": EntityAttributeType,
  "description"?: string,
  "nullable": boolean,
  "editable": boolean,
};

export interface MetaEntity extends EntityInstanceWithName {
  "parentName"?: string,
  "parentUuid": string,
  "description"?:string,
  "application": Uuid, // TODO: make it mandatory!
};

export interface EntityDefinition extends EntityInstanceWithName {
  "parentName"?: string,
  "parentUuid": Uuid,
  "entityUuid": Uuid,
  "description"?:string,
  "instanceValidationJsonSchema": {},
  "attributes"?: EntityAttribute[],
};

/**
* duplicated from Redux
* @public
*/
export interface InstanceDictionaryNum<T> {
  [id: number]: T | undefined;
}

/**
* duplicated from Redux
* @public
*/
export interface InstanceDictionary<T> extends InstanceDictionaryNum<T> {
  [id: string]: T | undefined;
}

export default {}