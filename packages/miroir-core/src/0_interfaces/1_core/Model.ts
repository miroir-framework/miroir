import { MiroirModelVersion } from "../../0_interfaces/1_core/ModelVersion";
import { EntityDefinition, MetaEntity } from "./EntityDefinition";
import { StoreBasedConfiguration } from "./MiroirConfig";
import { MiroirReport } from "./Report";
import { EntityInstance, EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";

export interface MiroirModelDefinition extends EntityInstanceWithName {

}

/**
 * internal data structure used to manipulate model data
 */
export interface MiroirModel {
  [parentUuid: string]: {[uuid:string]:EntityInstance}
}


export interface MiroirMetaModel {// the name of meta-model entities cannot change
  entities: MetaEntity[];
  entityDefinitions: EntityDefinition[];
  reports: MiroirReport[];
  modelVersions: MiroirModelVersion[];
  configuration: StoreBasedConfiguration[];
}
