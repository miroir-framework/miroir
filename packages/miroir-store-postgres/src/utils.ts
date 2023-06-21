// ##############################################################################################

import { EntityAttribute, EntityAttributeType, EntityDefinition } from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic, Sequelize } from "sequelize";

// export type SqlEntityDefinition = { [parentName in string]: ModelStatic<Model<any, any>> };
export type SqlUuidEntityDefinition = {
  [parentUuid in string]: { parentName?: string; sequelizeModel: ModelStatic<Model<any, any>> };
};

const dataTypesMapping: { [type in EntityAttributeType]: DataTypes.AbstractDataTypeConstructor } = {
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
    entityDefinition.attributes.map((a:EntityAttribute) => {
      return [[a.name], { type: dataTypesMapping[a.type], allowNull: a.nullable, primaryKey: a.name == "uuid" }];
    })
  );
}
