// ##############################################################################################

import {
  EntityDefinition,
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
  [parentUuid in string]: { parentName?: string; sequelizeModel: ModelStatic<Model<any, any>> };
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
  const jzodSchema: JzodObject = entityDefinition.jzodSchema ? entityDefinition.jzodSchema : { type: "object", definition: {}};
  const jzodObjectAttributes = jzodSchema.definition;
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
                // "union"
              ].includes(a[1].type))
              ? dataTypesMapping[a[1].type]
              : a[1].type == "array" || a[1].type == "object"
              ? dataTypesMapping[a[1].type]
              : DataTypes.STRING,
          // allowNull: a[1].type == "simpleType" ? a[1].optional : false,
          allowNull: ((a[1] as any)["optional"] || (a[1] as any)["nullable"]) ?? false,
          primaryKey: a[0] == "uuid",
        },
      ];
    })
  );
  // log.info("miroir-store-postgres fromMiroirEntityDefinitionToSequelizeEntityDefinition",entityDefinition.name, "jzodSchema",entityDefinition.jzodSchema, "result", result);
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
