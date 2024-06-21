import { ACTION_OK, ActionError, ActionReturnType, ActionVoidReturnType, AdminStoreInterface, LoggerInterface, MiroirLoggerFactory, SqlDbStoreSectionConfiguration, StoreSectionConfiguration, getLoggerName } from "miroir-core";
import { packageName } from "../constants.js";
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
      args[4],
    )
  }

  // ##############################################################################################
  async createStore(
    config: StoreSectionConfiguration,
  ): Promise<ActionVoidReturnType> {
    try {
      log.info("createStore", JSON.stringify(config));
      if (config.emulatedServerType !== "sql") {
        throw new Error(loggerName + " createStore failed for serverType " + config.emulatedServerType);
      }
      await this.sequelize.createSchema(config.schema,{});
      log.info("createStore DONE!");
    } catch (error) {
      return Promise.resolve({ status: "error", error: { errorType: "FailedToCreateStore", errorMessage: error as string}})
    }
    return Promise.resolve(ACTION_OK)
  }

  // ##############################################################################################
  async deleteStore(
    config: StoreSectionConfiguration,
  ): Promise<ActionVoidReturnType> {
    try {
      if (config.emulatedServerType !== "sql") {
        throw new Error(loggerName + " deleteStore failed for serverType " + config.emulatedServerType);
      }
      await this.sequelize.dropSchema(config.schema,{});
    } catch (error) {
      return Promise.resolve({ status: "error", error: { errorType: "FailedToDeleteStore", errorMessage: error as string}})
    }
    return Promise.resolve(ACTION_OK)
  }
}
