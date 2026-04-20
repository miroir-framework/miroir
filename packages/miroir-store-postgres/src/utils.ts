// ##############################################################################################

import {
  EntityDefinition,
  entityDefinitionMLSchema,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MiroirLoggerFactory
} from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic } from "sequelize";

import { cleanLevel } from "./4_services/constants.js";
import { packageName } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "utils")
).then((logger: LoggerInterface) => {log = logger});


// export type SqlEntityDefinition = { [parentName in string]: ModelStatic<Model<any, any>> };
export type EntityUuidIndexedSequelizeModel = {
  [parentUuid in string]: {
    parentName?: string;
    idAttribute?: string | string[];
    isExternal?: boolean;
    effectiveSchema?: string;
    optionalNonNullableAttributes?: string[];
    sequelizeModel: ModelStatic<Model<any, any>>;
  };
};

// const dataTypesMapping: { [type in EntityAttributeType]: DataTypes.AbstractDataTypeConstructor } = {
//   ARRAY: DataTypes.JSONB, // OK?
//   BOOLEAN: DataTypes.BOOLEAN,
//   ENTITY_INSTANCE_UUID: DataTypes.STRING,
//   OBJECT: DataTypes.JSONB, 
//   STRING: DataTypes.STRING,
//   UUID: DataTypes.STRING,
//   // OBJECT: DataTypes.STRING, // TODO: use JSONB for OBJECTs on postgres!
// };

export const dataTypesMapping: { [type in string]: DataTypes.AbstractDataTypeConstructor } = { // TODO: correct types!
  array: DataTypes.JSONB, // OK?
  boolean: DataTypes.BOOLEAN,
  entity_instance_uuid: DataTypes.STRING,
  union: DataTypes.JSONB, 
  object: DataTypes.JSONB, 
  number: DataTypes.INTEGER, 
  record: DataTypes.JSONB, 
  string: DataTypes.STRING,
  uuid: DataTypes.STRING,
  date: DataTypes.DATE,
  schemaReference: DataTypes.JSONB, 
  any: DataTypes.JSONB, 

  // ARRAY: DataTypes.JSONB, // OK?
  // BOOLEAN: DataTypes.BOOLEAN,
  // ENTITY_INSTANCE_UUID: DataTypes.STRING,
  // OBJECT: DataTypes.JSONB, 
  // STRING: DataTypes.STRING,
  // UUID: DataTypes.STRING,
  // OBJECT: DataTypes.STRING, // TODO: use JSONB for OBJECTs on postgres!
};

// ##############################################################################################
export function fromMiroirEntityDefinitionToSequelizeEntityDefinition(
  entityDefinition: EntityDefinition
): ModelAttributes<Model, Attributes<Model>> {
  const mlSchema: JzodObject = entityDefinition.mlSchema
    ? entityDefinition.mlSchema.extend
      ? entityDefinitionMLSchema(entityDefinition as EntityDefinition)
      : entityDefinition.mlSchema
    : { type: "object", definition: {} };
  const idAttribute: string | string[] = (entityDefinition as any).idAttribute ?? "uuid";
  const pkAttributes: string[] = Array.isArray(idAttribute) ? idAttribute : [idAttribute];
  const jzodObjectAttributes = mlSchema.definition;
  const result = Object.fromEntries(
    Object.entries(jzodObjectAttributes).map((a: [string, JzodElement]) => {
      return [
        [a[0]],
        {
          type:
            (
              [
                "any",
                // "bigint",
                // "boolean",
                "date",
                // "never",
                // "null",
                "number",
                "string",
                "uuid",
                // "undefined",
                // "unknown",
                // "void",
                "array",
                // "enum",
                // "function",
                // "lazy",
                // "literal",
                // "intersection",
                // "map",
                "object",
                // "promise",
                "record",
                "schemaReference",
                // "set",
                // "simpleType",
                // "tuple",
                "union",
              ].includes(a[1].type))
              ? dataTypesMapping[a[1].type]
              : DataTypes.STRING,
          // allowNull: a[1].type == "simpleType" ? a[1].optional : false,
          allowNull: ((a[1] as any)["optional"] || (a[1] as any)["nullable"]) ?? false,
          primaryKey: pkAttributes.includes(a[0]),
        },
      ];
    })
  );
  // log.info("miroir-store-postgres fromMiroirEntityDefinitionToSequelizeEntityDefinition",entityDefinition.name, "mlSchema",entityDefinition.mlSchema, "result", result);
  return result;
}

// ##############################################################################################
/**
 * Returns the list of attribute names that are optional (allowNull in DB) but NOT nullable
 * (i.e. null means "absent", not a meaningful null value). These attributes should have their
 * null values replaced by undefined when reading from the database.
 */
export function getOptionalNonNullableAttributes(entityDefinition: EntityDefinition): string[] {
  const mlSchema: JzodObject = entityDefinition.mlSchema
    ? entityDefinition.mlSchema.extend
      ? entityDefinitionMLSchema(entityDefinition as EntityDefinition)
      : entityDefinition.mlSchema
    : { type: "object", definition: {} };
  return Object.entries(mlSchema.definition)
    .filter(([, attrDef]) => {
      const attr = attrDef as JzodElement & { optional?: boolean; nullable?: boolean };
      return attr.optional === true && !attr.nullable;
    })
    .map(([attrName]) => attrName);
}

// ##############################################################################################
/**
 * Removes entries whose value is null from an instance object, for the given list of attribute names.
 * This converts postgres NULL values back to undefined for optional, non-nullable attributes.
 */
export function stripNullOptionalAttributes(instance: Record<string, any>, optionalNonNullableAttributes: string[]): Record<string, any> {
  if (!optionalNonNullableAttributes || optionalNonNullableAttributes.length === 0) {
    return instance;
  }
  const result = Object.fromEntries(
    Object.entries(instance).filter(([key, value]) => !optionalNonNullableAttributes.includes(key) || value !== null)
  );
  // log.info(
  //   "miroir-store-postgres stripNullOptionalAttributes",
  //   // "instance before",
  //   // instance,
  //   "optionalNonNullableAttributes",
  //   optionalNonNullableAttributes,
  //   "result",
  //   result,
  // );
  return result;
}
// // ##############################################################################################
// export function fromMiroirAttributeDefinitionToSequelizeModelAttributeColumnOptions(
//   attributeDefinition: JzodElement
// ): {dataType: DataTypes.AbstractDataTypeConstructor, options:ModelAttributeColumnOptions} {

//   const dataType =  dataTypesMapping[attributeDefinition?.definition as string]
//   const result: { dataType: DataTypes.AbstractDataTypeConstructor, options:ModelAttributeColumnOptions } = {
//     "dataType": dataType,
//     "options": {
//       "type": dataType,
//       "allowNull": attributeDefinition.optional || attributeDefinition.nullable,
//     }
//   };
//   log.info(
//     "fromMiroirAttributeDefinitionToSequelizeModelAttributeColumnOptions attributeDefinition=",
//     JSON.stringify(attributeDefinition),
//     "dataType=",
//     dataType,
//     "result",
//     result
//   );

//   return result;
// }
