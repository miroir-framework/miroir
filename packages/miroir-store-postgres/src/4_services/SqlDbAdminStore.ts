import {
  ACTION_OK,
  Action2Error,
  Action2VoidReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  StoreSectionConfiguration
} from "miroir-core";
import { Sequelize } from "sequelize";
import { packageName } from "../constants";
import { SqlDbStore } from "./SqlDbStore";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbAdminStore")
).then((logger: LoggerInterface) => {log = logger});

export class SqlDbAdminStore extends SqlDbStore implements PersistenceStoreAdminSectionInterface {
  // for the sake of uniformity, we follow the mixin pattern also for this class although it's not mixed in any other class

  // ##############################################################################################
  constructor(
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2], args[3], args[4]);
  }

  // ##############################################################################################
  async createStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    try {
      log.info("storeManagementAction_createStore", JSON.stringify(config));
      if (config.emulatedServerType !== "sql") {
        throw new Error( "SqlDbAdminStore createStore failed for serverType " + config.emulatedServerType);
      }
      await this.sequelize.createSchema(config.schema, {});
      log.info("createStore DONE!");
    } catch (error) {
      return Promise.resolve(new Action2Error("FailedToCreateStore", error as string));
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async deleteStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    try {
      if (config.emulatedServerType !== "sql") {
        throw new Error("SqlDbAdminStore deleteStore failed for serverType " + config.emulatedServerType);
      }
      // PersistenceStoreController.deleteStore closes all Sequelize pools first; use a
      // short-lived connection so schema teardown still works after section close().
      const dropSequelize = new Sequelize(config.connectionString, {
        dialect: "postgres",
        logging: false,
      });
      try {
        log.info(
          "SqlDbAdminStore storeManagementAction deleteStore",
          JSON.stringify(config),
        );
        await dropSequelize.query(`DROP SCHEMA IF EXISTS "${config.schema}" CASCADE;`);
        log.info("SqlDbAdminStore deleteStore DONE for schema", config.schema);
      } finally {
        await dropSequelize.close();
      }
    } catch (error) {
      return Promise.resolve(new Action2Error("FailedToDeleteStore", String(error)));
    }
    return Promise.resolve(ACTION_OK);
  }
}
