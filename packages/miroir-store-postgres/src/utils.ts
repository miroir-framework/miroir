// ##############################################################################################

import { JzodElement } from "@miroir-framework/jzod";
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
  ARRAY: DataTypes.JSONB, // OK?
  BOOLEAN: DataTypes.BOOLEAN,
  ENTITY_INSTANCE_UUID: DataTypes.STRING,
  OBJECT: DataTypes.JSONB, 
  STRING: DataTypes.STRING,
  UUID: DataTypes.STRING,
  // OBJECT: DataTypes.STRING, // TODO: use JSONB for OBJECTs on postgres!
};

// ##############################################################################################
export function fromMiroirEntityDefinitionToSequelizeEntityDefinition(
  entityDefinition: EntityDefinition
): ModelAttributes<Model, Attributes<Model>> {
  return Object.fromEntries(
    Object.entries(entityDefinition.jzodSchema ? entityDefinition.jzodSchema : {}).map((a: [string, JzodElement]) => {
      return [
        [a[0]],
        {
          type: a[1].type == "simpleType" ? dataTypesMapping[a[1].definition] : DataTypes.STRING,
          allowNull: a[1].type == "simpleType" ? a[1].optional : false,
          primaryKey: a[0] == "uuid",
        },
      ];
    })
  );
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
