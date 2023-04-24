import { EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";
import { MiroirMetaModel } from "../../0_interfaces/1_core/Model";
import { ModelReplayableUpdate } from "../../0_interfaces/2_domain/ModelUpdateInterface";

export interface MiroirModelVersion extends EntityInstanceWithName {
  previousVersionUuid:string;
  description?: string;
  // model?: MiroirMetaModel;
  modelUuid: string;
  modelUpdates?: ModelReplayableUpdate[];
}

export type MiroirModelHistory = MiroirModelVersion[]; // branches?
