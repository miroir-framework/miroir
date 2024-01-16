import { ActionError, ActionReturnType, AdminStoreInterface, LoggerInterface, MiroirLoggerFactory, SqlDbStoreSectionConfiguration, StoreSectionConfiguration, getLoggerName } from "miroir-core";
import { packageName } from "../constants";
import { SqlDbStore } from "./SqlDbStore";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbAdminStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class SqlDbAdminStore extends SqlDbStore implements AdminStoreInterface {
  // for the sake of uniformity, we follow the mixin pattern also for this class although it's not mixed in any other class

  // ##############################################################################################
  constructor(
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(
      args[0],
      args[1],
      args[2],
      args[3],
    )
  }

  // ##############################################################################################
  async createStore(
    config: StoreSectionConfiguration,
  ): Promise<ActionReturnType> {
    try {
      if (config.emulatedServerType !== "sql") {
        throw new Error(loggerName + " createStore failed for serverType " + config.emulatedServerType);
      }
      await this.sequelize.createSchema(config.schema,{});
    } catch (error) {
      return Promise.resolve({ status: "error", error: { errorType: "FailedToCreateStore", errorMessage: error}})
    }
    return Promise.resolve({ status: "ok"})
  }

  // ##############################################################################################
  async deleteStore(
    config: StoreSectionConfiguration,
  ): Promise<ActionReturnType> {
    try {
      if (config.emulatedServerType !== "sql") {
        throw new Error(loggerName + " deleteStore failed for serverType " + config.emulatedServerType);
      }
      await this.sequelize.dropSchema(config.schema,{});
    } catch (error) {
      return Promise.resolve({ status: "error", error: { errorType: "FailedToDeleteStore", errorMessage: error}})
    }
    return Promise.resolve({ status: "ok"})
  }
}
