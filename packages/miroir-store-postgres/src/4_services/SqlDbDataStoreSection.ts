import {
  ActionEntityInstanceCollectionReturnType,
  ApplicationSection,
  EntityInstanceCollection,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreDataSectionInterface
} from "miroir-core";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { MixedSqlDbInstanceStoreSection } from "./sqlDbInstanceStoreSectionMixin";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbDataStoreSection")
).then((logger: LoggerInterface) => {log = logger});



export class SqlDbDataStoreSection extends MixedSqlDbInstanceStoreSection implements PersistenceStoreDataSectionInterface {
  // ##############################################################################################
  constructor(
    public applicationSection: ApplicationSection,
    sqlDbStoreName: string, // used only for debugging purposes
    dataConnectionString:string,
    dataSchema:string,
  ) {
    super(
      applicationSection,
      sqlDbStoreName,
      dataConnectionString,
      dataSchema,
      'SqlDbDataStoreSection ' + sqlDbStoreName + ' section data'
    )
  }

  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in PersistenceStoreController
    let result = {};
    log.info(this.logHeader,'getState this.getEntityUuids()',this.getEntityUuids());
    
    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader,'getState getting instances for',parentUuid);
      const instances: ActionEntityInstanceCollectionReturnType = await this.getInstances(parentUuid);
      // const instances:EntityInstanceCollection = {parentUuid:parentUuid, applicationSection:'data',instances: dbInstances};
      // log.info(this.logHeader,'getState found instances',parentUuid,instances);
      if (instances.status != "ok") {
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else if (instances.returnedDomainElement?.elementType != "entityInstanceCollection") {
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else {
        Object.assign(result,{[parentUuid]:instances.returnedDomainElement.elementValue});
      }

    }
    return Promise.resolve(result);
  }
}