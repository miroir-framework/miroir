import { ActionReturnType, AdminStoreInterface, LoggerInterface, MiroirLoggerFactory, StoreSectionConfiguration, getLoggerName } from "miroir-core";
import { packageName } from "../constants";
import { IndexedDbStore } from "./IndexedDbStore";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbAdminStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class IndexedDbAdminStore extends IndexedDbStore implements AdminStoreInterface {
  // for the sake of uniformity, we follow the mixin pattern also for this class although it's not mixed in any other class

  // ##############################################################################################
  constructor(
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(
      args[0],
      args[1],
      args[2],
    )
  }

  // ##############################################################################################
  async createStore(
    config: StoreSectionConfiguration,
  ): Promise<ActionReturnType> {
    // does not need to do anything, new IndexedDb() is done in the storeSectionFactory, thus called by StoreControllerManager.addStoreController, where storeSectionFactory is called
    return Promise.resolve({ status: "ok"})
  }

  // ##############################################################################################
  async deleteStore(
    config: StoreSectionConfiguration,
  ): Promise<ActionReturnType> {
    // await this.sequelize.dropSchema(this.schema,{});
    // TODO: remove directory when on server?
    // return clear ()
    return Promise.resolve({ status: "ok"})
  }
}
