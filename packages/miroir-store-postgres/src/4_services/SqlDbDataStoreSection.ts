import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  StoreDataSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  ActionReturnType,
  ApplicationSection,
  ActionEntityInstanceCollectionReturnType
} from "miroir-core";
import { MixedSqlDbInstanceStoreSection } from "./sqlDbInstanceStoreSectionMixin.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbDataStoreSection");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


export class SqlDbDataStoreSection extends MixedSqlDbInstanceStoreSection implements StoreDataSectionInterface {
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