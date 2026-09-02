// ##############################################################################################

import {
  Entity,
  entityMLSchema,
  isVirtualAttribute,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic } from "sequelize";

import { cleanLevel } from "./4_services/constants.js";
import { packageName } from "./constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "utils");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});


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

function resolveMlSchemaForSequelize(entity: Entity): JzodObject {
  if (!entity.mlSchema) {
    return { type: "object", definition: {} };
  }
  return entityMLSchema(entity);
}

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
/**
 * Build Sequelize attributes from Entity present-model fields.
 */
export function fromMiroirPresentModelToSequelizeEntityDefinition(
  entity: Entity,
): ModelAttributes<Model, Attributes<Model>> {
  const mlSchema = resolveMlSchemaForSequelize(entity);
  const idAttribute: string | string[] = entity.idAttribute ?? "uuid";
  const pkAttributes: string[] = Array.isArray(idAttribute) ? idAttribute : [idAttribute];
  const jzodObjectAttributes = mlSchema.definition;
  const result = Object.fromEntries(
    Object.entries(jzodObjectAttributes)
      .filter(([, schema]) => !isVirtualAttribute(schema))
      .map((a: [string, JzodElement]) => {
      return [
        [a[0]],
        {
          type:
            (
              [
                "any",
                "boolean",
                "date",
                "number",
                "string",
                "uuid",
                "array",
                "object",
                "record",
                "schemaReference",
                "union",
              ].includes(a[1].type))
              ? dataTypesMapping[a[1].type]
              : DataTypes.STRING,
          allowNull: ((a[1] as any)["optional"] || (a[1] as any)["nullable"]) ?? false,
          primaryKey: pkAttributes.includes(a[0]),
        },
      ];
    })
  );
  return result;
}

// ##############################################################################################
/**
 * Returns the list of attribute names that are optional (allowNull in DB) but NOT nullable
 * (i.e. null means "absent", not a meaningful null value). These attributes should have their
 * null values replaced by undefined when reading from the database.
 */
export function getOptionalNonNullableAttributes(
  entity: Entity,
): string[] {
  const mlSchema = resolveMlSchemaForSequelize(entity);
  return Object.entries(mlSchema.definition)
    .filter(([, attrDef]) => {
      const attr = attrDef as JzodElement & { optional?: boolean; nullable?: boolean };
      // Virtual attributes are not columns; if a leftover NULL appears on read, drop it (D4).
      if (isVirtualAttribute(attr)) {
        return true;
      }
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
