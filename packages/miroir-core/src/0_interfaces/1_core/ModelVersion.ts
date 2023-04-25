import { EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";
import { ModelReplayableUpdate } from "../../0_interfaces/2_domain/ModelUpdateInterface";

export interface MiroirApplicationVersion extends EntityInstanceWithName {
  description?: string;
  // model?: MiroirMetaModel;
  application: string;
  branch: string;
  previousVersion:string;
  modelStructureMigration?: ModelReplayableUpdate[];
  modelCUDMigration?: ModelReplayableUpdate[];
}

// export type MiroirModelHistory = MiroirApplicationVersion[]; // branches?
