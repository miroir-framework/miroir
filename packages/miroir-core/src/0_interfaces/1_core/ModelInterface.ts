import { InstanceWithName } from "../../0_interfaces/1_core/Instance";
import { ModelCUDUpdate, ModelStructureUpdate } from "../../0_interfaces/2_domain/ModelUpdateInterface";
import { EntityDefinition } from "../../0_interfaces/1_core/EntityDefinition";
import { MiroirReport } from "../../0_interfaces/1_core/Report";
import { StoreBasedConfiguration } from "../../0_interfaces/1_core/MiroirConfig";

export interface MiroirModel {
  entities: EntityDefinition[];
  reports: MiroirReport[];
  modelVersions: MiroirModelVersion[];
  configuration: StoreBasedConfiguration[];
}

export interface MiroirModelVersion extends InstanceWithName {
  previousVersionUuid:string;
  description?: string;
  model?: MiroirModel;
  modelStructureMigration?: MiroirStructureModelMigration;
  modelCUDMigration?: ModelCUDUpdate[];
}

export type MiroirModelHistory = MiroirModelVersion[]; // branches?

export type MiroirStructureModelMigration = ModelStructureUpdate[];
export type MiroirCUDModelMigration = ModelCUDUpdate[];