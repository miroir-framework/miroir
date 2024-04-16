import {
  EntityInstance,
  AbstractInstanceStoreSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  ActionReturnType,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionVoidReturnType,
  ACTION_OK,
} from "miroir-core";
import { MixableSqlDbStoreSection, SqlDbStoreSection } from "./SqlDbStoreSection.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const consoleLog: any = console.log.bind(console, packageName, cleanLevel, "SqlDbInstanceStoreSectionMixin");
const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbInstanceStoreSectionMixin");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const MixedSqlDbInstanceStoreSection = SqlDbInstanceStoreSectionMixin(SqlDbStoreSection);

export function SqlDbInstanceStoreSectionMixin<TBase extends MixableSqlDbStoreSection>(Base: TBase) {
  return class MixedIndexedDbInstanceStoreSection extends Base implements AbstractInstanceStoreSectionInterface {
    // ##############################################################################################
    constructor(
      // actual arguments are:
      // public applicationSection: ApplicationSection,
      // public sqlDbStoreName: string,
      // public dataConnectionString:string,
      // public dataSchema:string,
      // public logHeader: string,
      ...args: any[]
    ) {
      super(...args);
    }

    // ##############################################################################################
    async getInstance(parentUuid: string, uuid: string): Promise<ActionEntityInstanceReturnType> {
      try {
        if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[parentUuid]) {
          const result: EntityInstance = (await this.sqlSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid))
            ?.dataValues;
          return Promise.resolve({
            status: "ok",
            returnedDomainElement: { elementType: "instance", elementValue: result },
          });
        } else {
          // TODO: indicate exact reason!
          console.warn(this.logHeader, "getInstance", "could not find entityUuid", parentUuid);
          return Promise.resolve({ status: "error", error: { errorType: "FailedToGetInstance" } });
        }
      } catch (error) {
        // TODO: indicate exact reason!
        console.warn(
          this.logHeader,
          "getInstance",
          "could not fetch instance from db: parentId",
          parentUuid,
          "uuid",
          uuid
        );
        return Promise.resolve({ status: "error", error: { errorType: "FailedToGetInstance" } });
      }
    }

    // ##############################################################################################
    async getInstances(parentUuid: string): Promise<ActionEntityInstanceCollectionReturnType> {
      let rawResult: any[] = [];
      let cleanResult: EntityInstance[] = [];
      if (
        this.sqlSchemaTableAccess &&
        this.sqlSchemaTableAccess[parentUuid] &&
        this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel
      ) {
        consoleLog("getInstances calling this.sqlEntities findall", parentUuid);
        try {
          const sequelizeModel = this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel;
          rawResult = (await sequelizeModel?.findAll()) as unknown as EntityInstance[];
          cleanResult = rawResult.map((i) => i["dataValues"]);
          consoleLog("getInstances result", cleanResult);
        } catch (e) {
          console.warn(this.logHeader, "getInstances", "failed to fetch instances of entityUuid", parentUuid);
          return {
            status: "error",
            error: {
              errorType: "FailedToGetInstances",
              errorMessage: `could not get instances for entity ${parentUuid}`,
            },
          };
        }
      } else {
        console.warn(this.logHeader, "getInstances", "could not find entity in database: entityUuid", parentUuid);
        return {
          status: "error",
          error: { errorType: "FailedToGetInstances", errorMessage: `could not find entity ${parentUuid}` },
        };
      }
      // TODO: CORRECT APPLICATION SECTION
      return Promise.resolve({
        status: "ok",
        returnedDomainElement: {
          elementType: "entityInstanceCollection",
          elementValue: { parentUuid, applicationSection: this.applicationSection, instances: cleanResult },
        },
      });
    }

    // ##############################################################################################
    async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
      const sequelizeModel = this.sqlSchemaTableAccess[instance.parentUuid].sequelizeModel;
      const tmp = await sequelizeModel.upsert(instance as any);
      console.debug(
        this.logHeader,
        "upsertInstance",
        "upserting into Parent",
        instance["parentUuid"],
        "named",
        instance["parentName"],
        "existing data schema entities",
        Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {}),
        "instance",
        instance,
        "db upsert result (not returned)",
        tmp
      );
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<ActionVoidReturnType> {
      for (const instance of instances) {
        await this.deleteInstance(parentUuid, instance);
      }
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
      console.debug(this.logHeader, "deleteInstance", parentUuid, instance);
      const sequelizeModel = this.sqlSchemaTableAccess[parentUuid].sequelizeModel;
      await sequelizeModel.destroy({ where: { uuid: instance.uuid } });
      return Promise.resolve(ACTION_OK);
    }
  };
}
