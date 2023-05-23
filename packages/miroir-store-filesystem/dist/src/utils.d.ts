import { EntityDefinition } from "miroir-core";
import { Attributes, Model, ModelAttributes, ModelStatic } from "sequelize";
export type SqlUuidEntityDefinition = {
    [parentUuid in string]: {
        parentName?: string;
        sequelizeModel: ModelStatic<Model<any, any>>;
    };
};
export declare function fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition: EntityDefinition): ModelAttributes<Model, Attributes<Model>>;
