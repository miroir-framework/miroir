import { MiroirModelVersion } from "../../0_interfaces/1_core/ModelVersion";
import { EntityDefinition } from "./EntityDefinition";
import { StoreBasedConfiguration } from "./MiroirConfig";
import { MiroirReport } from "./Report";
import { EntityInstance, EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";

export interface MiroirModelDefinition extends EntityInstanceWithName {

}

/**
 * internal data structure used to manipulate model data
 */
export interface MiroirModel {
  [entityUuid: string]: {[uuid:string]:EntityInstance}
}


export interface MiroirMetaModel {// the name of meta-model entities cannot change
  entities: EntityDefinition[];
  reports: MiroirReport[];
  modelVersions: MiroirModelVersion[];
  configuration: StoreBasedConfiguration[];
}
