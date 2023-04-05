import { EntityDefinition } from "../../0_interfaces/1_core/EntityDefinition";
import { InstanceWithName } from "../../0_interfaces/1_core/Instance";
import { StoreBasedConfiguration } from "../../0_interfaces/1_core/MiroirConfig";
import { MiroirReport } from "../../0_interfaces/1_core/Report";
import { ModelCUDUpdate, ModelReplayableUpdate } from "../../0_interfaces/2_domain/ModelUpdateInterface";

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
  modelUpdates?: ModelReplayableUpdate[];
}

export type MiroirModelHistory = MiroirModelVersion[]; // branches?

// export type MiroirStructureModelMigration = ModelEntityUpdate[];
export type MiroirCUDModelMigration = ModelCUDUpdate[];