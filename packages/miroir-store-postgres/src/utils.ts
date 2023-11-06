// ##############################################################################################

import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import { EntityAttribute, EntityAttributeType, EntityDefinition } from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic, Sequelize } from "sequelize";

// export type SqlEntityDefinition = { [parentName in string]: ModelStatic<Model<any, any>> };
export type SqlUuidEntityDefinition = {
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

const dataTypesMapping: { [type in string]: DataTypes.AbstractDataTypeConstructor } = { // TODO: correct types!
  array: DataTypes.JSONB, // OK?
  boolean: DataTypes.BOOLEAN,
  entity_instance_uuid: DataTypes.STRING,
  object: DataTypes.JSONB, 
  string: DataTypes.STRING,
  uuid: DataTypes.STRING,
  schemaReference: DataTypes.JSONB, 

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
          type: a[1].type == "simpleType" ? dataTypesMapping[a[1].definition] : a[1].type == "schemaReference"? dataTypesMapping[a[1].type] :DataTypes.STRING,
          // allowNull: a[1].type == "simpleType" ? a[1].optional : false,
          allowNull: (a[1] as any)["optional"]??false,
          primaryKey: a[0] == "uuid",
        },
      ];
    })
  );
  console.log("miroir-store-postgres fromMiroirEntityDefinitionToSequelizeEntityDefinition","jzodSchema",entityDefinition.jzodSchema, "result", result);
  return result;
}
// // ##############################################################################################
// export function fromMiroirEntityDefinitionToSequelizeEntityDefinition(
//   entityDefinition: EntityDefinition
// ): ModelAttributes<Model, Attributes<Model>> {
//   return Object.fromEntries(
//     entityDefinition.attributes.map((a:EntityAttribute) => {
//       return [[a.name], { type: dataTypesMapping[a.type], allowNull: a.nullable, primaryKey: a.name == "uuid" }];
//     })
//   );
// }
