// import { sql } from '@sequelize/postgres';

import {
  ACTION_OK,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionReturnType,
  ActionVoidReturnType,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryWithExtractorCombinerTransformer,
  EntityInstance,
  ExtractorOrCombiner,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  RunBoxedExtractorAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction
} from "miroir-core";
import { MixableSqlDbStoreSection, SqlDbStoreSection } from "./SqlDbStoreSection";

import { Op } from "sequelize";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbQueryRunner } from "./SqlDbQueryRunner";
import { RecursiveStringRecords, SqlDbExtractTemplateRunner } from "./SqlDbQueryTemplateRunner";

const consoleLog: any = console.log.bind(console, packageName, cleanLevel, "SqlDbInstanceStoreSectionMixin");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbInstanceStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});

export const MixedSqlDbInstanceStoreSection = SqlDbInstanceStoreSectionMixin(SqlDbStoreSection);

export function SqlDbInstanceStoreSectionMixin<TBase extends MixableSqlDbStoreSection>(Base: TBase) {
  return class MixedIndexedDbInstanceStoreSection
    extends Base
    implements PersistenceStoreInstanceSectionAbstractInterface
  {
    public extractorTemplateRunner: SqlDbExtractTemplateRunner;
    public extractorRunner: SqlDbQueryRunner;

    // ##############################################################################################
    constructor(
      // actual arguments are:
      // public applicationSection: ApplicationSection,
      // public sqlDbStoreName: string,
      // public dataConnectionString:string,
      // public schema:string,
      // public logHeader: string,
      ...args: any[]
    ) {
      super(...args);
      this.extractorRunner = new SqlDbQueryRunner(this.schema, this as any /*SqlDbQueryRunner takes a concrete implementation*/);
      this.extractorTemplateRunner = new SqlDbExtractTemplateRunner(this as any /*SqlDbExtractTemplateRunner takes a concrete implementation*/, this.extractorRunner);
    }

    async executeRawQuery(query: string): Promise<ActionReturnType> {
      const rawResult = await this.sequelize.query(query);
      log.info(this.logHeader, "executeRawQuery", "query", query, "rawResult", rawResult);
      const result: ActionReturnType = {
        status: "ok",
        // returnedDomainElement: { elementType: "any", elementValue: Number((rawResult[0] as any).count) },
        returnedDomainElement: { elementType: "any", elementValue: rawResult[0] },
      };
      log.info(this.logHeader, "executeRawQuery", "query", query, "result", JSON.stringify(result));
      return Promise.resolve(result);
    }

    // ##############################################################################################
    sqlForExtractor(
      extractor: ExtractorOrCombiner
    ): RecursiveStringRecords {
      switch (extractor.extractorOrCombinerType) {
        case "extractorForObjectByDirectReference": {
          return `SELECT * FROM "${this.schema}"."${extractor.parentName}" WHERE "uuid" = '${extractor.instanceUuid}'`;
          break;
        }
        case "combinerForObjectByRelation": {
          throw new Error("sqlForExtractor combinerForObjectByRelation not implemented");
          break;
        }
        case "extractorWrapperReturningObject":
        case "extractorWrapperReturningList":
        case "combinerByRelationReturningObjectList":
        case "combinerByManyToManyRelationReturningObjectList":
        case "extractorByEntityReturningObjectList": {
          throw new Error("sqlForExtractor not implemented for extractorOrCombinerType: " + extractor.extractorOrCombinerType);
          break;
        }
        default: {
          throw new Error("sqlForExtractor not implemented for extractorOrCombinerType of extractor: " + extractor);
          break;
        }
      }
    }
    // ##############################################################################################
    sqlForQuery(
      query:
        | BoxedExtractorOrCombinerReturningObjectOrObjectList
        | BoxedQueryWithExtractorCombinerTransformer
    ): RecursiveStringRecords {
      // log.info(this.logHeader, "sqlForExtractor called with parameter", "extractor", extractor);
      // log.info(this.logHeader, "sqlForExtractor called with sequelize", this.sequelize);
      // log.info(this.logHeader, "sqlForExtractor called with dialect", (this.sequelize as any).dialect);
      // // log.info(this.logHeader, "sqlForExtractor called with queryGenerator", (this.sequelize as any).dialect.queryGenerator);
      // // log.info(this.logHeader, "sqlForExtractor called with selectQuery", (this.sequelize as any).dialect.selectQuery);
      // // log.info(this.logHeader, "sqlForExtractor called with queryInterface", this.sequelize.getQueryInterface());
      // // log.info(this.logHeader, "sqlForExtractor called with dialect", (this.sequelize.getQueryInterface().queryGenerator as any).dialect);
      // // log.info(this.logHeader, "sqlForExtractor called with queryGenerator", this.sequelize.getQueryInterface().queryGenerator);
      // log.info(this.logHeader, "sqlForExtractor called with selectQuery", (this.sequelize.getQueryInterface().queryGenerator as any).selectQuery);
      switch (query.queryType) {
        case "boxedExtractorOrCombinerReturningObjectList": {
          // TODO: use queryGenerator?
          switch (query.select.extractorOrCombinerType) {
            case "extractorByEntityReturningObjectList":{
              return (
                `SELECT * FROM "${this.schema}"."${query.select.parentName}"` +
                (query.select.filter ? ` WHERE ${query.select.filter.attributeName} LIKE '%${query.select.filter.value}%'` : "")
              );
              break;
            }
            case "combinerByRelationReturningObjectList":{
              throw new Error("sqlForQuery combinerByRelationReturningObjectList not implemented");
              
            }
            case "combinerByManyToManyRelationReturningObjectList":{
              throw new Error("sqlForQuery combinerByManyToManyRelationReturningObjectList not implemented");
              
              break;
            }
            default:
              break;
          }
          // return result;
          break;
        }
        case "boxedExtractorOrCombinerReturningObjectList": {
          const result: string = (this.sequelize.getQueryInterface().queryGenerator as any).selectQuery(
            query.select.parentUuid,
            {
              attributes: ["*"],
            }
          );
          log.info(this.logHeader, "sqlForExtractor", "boxedExtractorTemplateReturningObject", result);
          // return "SELECT * FROM domainModel WHERE uuid = " + extractor.deploymentUuid;
          return result;
          break;
        }
        case "boxedQueryWithExtractorCombinerTransformer": {
          return Object.fromEntries(
            Object.entries(query.extractors ?? {}).map((e) => [e[0], this.sqlForExtractor(e[1])])
          );
          break;
        }
        case "boxedExtractorOrCombinerReturningObject": {
          switch (query.select.extractorOrCombinerType) {
            case "extractorForObjectByDirectReference": {
              return `SELECT * FROM "${this.schema}"."${query.select.parentName}" WHERE "uuid" = '${query.select.instanceUuid}'`;
              break;
            }
            case "combinerForObjectByRelation": {
              throw new Error("sqlForQuery combinerForObjectByRelation not implemented");
              
            }
            default: {
              throw new Error(
                "sqlForQuery boxedExtractorOrCombinerReturningObject not implemented for extractorOrCombinerType of select: " +
                  query.select
              );
              break;
            }
          }
          // return `SELECT * FROM "${this.schema}"."${query.parentName}" WHERE "uuid" = '${query.instanceUuid}'`;
          break;
        }
        // case "extractorWrapperReturningObject":
        // case "extractorWrapperReturningList":
        default: {
          return "SQL for extractor could not handle queryType for extractor" + query;
          break;
        }
      }
      return "SQL for extractor not implemented";
    }

    // #############################################################################################
    async handleQueryTemplateActionForServerONLY(query: RunBoxedQueryTemplateAction): Promise<ActionReturnType> {
      log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "query", query);

      const result: ActionReturnType = await this.extractorTemplateRunner.handleQueryTemplateActionForServerONLY(query);

      log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "query", query, "result", result);
      return result;
    }

    // #############################################################################################
    async handleBoxedExtractorTemplateActionForServerONLY(query: RunBoxedExtractorTemplateAction): Promise<ActionReturnType> {
      log.info(this.logHeader, "handleBoxedExtractorTemplateActionForServerONLY", "query", query);

      const result: ActionReturnType = await this.extractorTemplateRunner.handleBoxedExtractorTemplateActionForServerONLY(query);

      log.info(this.logHeader, "handleBoxedExtractorTemplateActionForServerONLY", "query", query, "result", result);
      return result;
    }

    // #############################################################################################
    async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<ActionReturnType> {
      log.info(this.logHeader, "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY", "query", query);

      const result: ActionReturnType = await this.extractorTemplateRunner.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query);

      log.info(this.logHeader, "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY", "query", query, "result", result);
      return result;
    }

    // #############################################################################################
    async handleBoxedExtractorAction(query: RunBoxedExtractorAction): Promise<ActionReturnType> {
      log.info(this.logHeader, "handleBoxedExtractorAction", "query", query);

      const result: ActionReturnType = await this.extractorRunner.handleBoxedExtractorAction(query);

      log.info(this.logHeader, "handleBoxedExtractorAction", "query", query, "result", result);
      return result;
    }

    // #############################################################################################
    async handleBoxedQueryAction(query: RunBoxedQueryAction): Promise<ActionReturnType> {
      log.info(this.logHeader, "handleBoxedQueryAction", "query", query);

      const result: ActionReturnType = await this.extractorRunner.handleBoxedQueryAction(query);

      log.info(this.logHeader, "handleBoxedQueryAction", "query", query, "result", result);
      return result;
    }

    // ##############################################################################################
    async getInstance(parentUuid: string, uuid: string): Promise<ActionEntityInstanceReturnType> {
      try {
        if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[parentUuid]) {
          const result: EntityInstance = (await this.sqlSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid))
            ?.dataValues;
          log.info(this.logHeader, "getInstance", "result", result);
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
        log.warn(this.logHeader, "getInstance", "could not fetch instance from db: parentId", parentUuid, "uuid", uuid);
        return Promise.resolve({
          status: "error",
          error: {
            errorType: "FailedToGetInstance",
            errorMessage: "could not fetch instance from db: parentId " + parentUuid + ", uuid=" + uuid + ": " + error,
          },
        });
      }
    }

    // ##############################################################################################
    async getInstancesWithFilter(
      parentUuid: string,
      filter: {
        attribute: string;
        value: string;
      }
    ): Promise<ActionEntityInstanceCollectionReturnType> {
      let rawResult: any[] = [];
      let cleanResult: EntityInstance[] = [];
      if (
        this.sqlSchemaTableAccess &&
        this.sqlSchemaTableAccess[parentUuid] &&
        this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel
      ) {
        log.info("getInstancesWithFilter calling this.sqlEntities findall", parentUuid);
        try {
          const sequelizeModel = this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel;
          rawResult = (await sequelizeModel?.findAll({
            where: { [filter.attribute]: { [Op.like]: "%" + filter.value + "%" } },
          })) as unknown as EntityInstance[];
          cleanResult = rawResult.map((i) => i["dataValues"]);
          log.info("getInstancesWithFilter result", cleanResult);
        } catch (e) {
          log.warn(this.logHeader, "getInstancesWithFilter", "failed to fetch instances of entityUuid", parentUuid);
          return {
            status: "error",
            error: {
              errorType: "FailedToGetInstances",
              errorMessage: `could not get instances for entity ${parentUuid}`,
            },
          };
        }
      } else {
        log.warn(this.logHeader, "getInstancesWithFilter", "could not find entity in database: entityUuid", parentUuid);
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
    async getOrderedInstancesWithFilter(
      parentUuid: string,
      filter: {
        attribute: string;
        value: string;
      },
      orderBy: {
        attributeName: string;
        direction: "ASC" | "DESC";
      }
    ): Promise<ActionEntityInstanceCollectionReturnType> {
      let rawResult: any[] = [];
      let cleanResult: EntityInstance[] = [];
      if (
        this.sqlSchemaTableAccess &&
        this.sqlSchemaTableAccess[parentUuid] &&
        this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel
      ) {
        log.info("getOrderedInstancesWithFilter calling this.sqlEntities findall", parentUuid);
        try {
          const sequelizeModel = this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel;
          rawResult = (await sequelizeModel?.findAll({
            where: { [filter.attribute]: { [Op.like]: "%" + filter.value + "%" } },
            order: [[orderBy.attributeName, orderBy.direction??"ASC"]],
          })) as unknown as EntityInstance[];
          cleanResult = rawResult.map((i) => i["dataValues"]);
          log.info("getOrderedInstancesWithFilter result", cleanResult);
        } catch (e) {
          log.warn(this.logHeader, "getOrderedInstancesWithFilter", "failed to fetch instances of entityUuid", parentUuid);
          return {
            status: "error",
            error: {
              errorType: "FailedToGetInstances",
              errorMessage: `could not get instances for entity ${parentUuid}`,
            },
          };
        }
      } else {
        log.warn(this.logHeader, "getOrderedInstancesWithFilter", "could not find entity in database: entityUuid", parentUuid);
        return {
          status: "error",
          error: { errorType: "FailedToGetInstances", errorMessage: `getOrderedInstancesWithFilter could not find entity ${parentUuid}` },
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
    async getInstances(parentUuid: string): Promise<ActionEntityInstanceCollectionReturnType> {
      let rawResult: any[] = [];
      let cleanResult: EntityInstance[] = [];
      if (
        this.sqlSchemaTableAccess &&
        this.sqlSchemaTableAccess[parentUuid] &&
        this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel
      ) {
        log.info("getInstances calling this.sqlEntities findall", parentUuid);
        try {
          const sequelizeModel = this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel;
          rawResult = (await sequelizeModel?.findAll()) as unknown as EntityInstance[];
          cleanResult = rawResult.map((i) => i["dataValues"]);
          // log.info("getInstances result", cleanResult);
        } catch (e) {
          log.warn(this.logHeader, "getInstances", "failed to fetch instances of entityUuid", parentUuid);
          return {
            status: "error",
            error: {
              errorType: "FailedToGetInstances",
              errorMessage: `could not get instances for entity ${parentUuid}`,
            },
          };
        }
      } else {
        log.warn(this.logHeader, "getInstances", "could not find entity in database: entityUuid", parentUuid);
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
      console.log(
        "######################################################### upsertInstance #####################################################"
      );
      try {
        const sequelizeModel = this.sqlSchemaTableAccess[instance.parentUuid].sequelizeModel;
        const tmp = await sequelizeModel.upsert(instance as any);
      } catch (error: any) {
        log.error(
          this.logHeader,
          "upsertInstance error",
          "FAILED upserting into Parent",
          instance["parentUuid"],
          "named",
          instance["parentName"],
          "existing data schema entities",
          Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {}),
          "instance",
          instance,
          "error",
          error
          //   "db upsert result (not returned)",
          //   tmp
        );
        return Promise.resolve({
          status: "error",
          error: { errorType: "FailedToUpdateInstance", errorMessage: error },
        });
      }
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<ActionVoidReturnType> {
      for (const instance of instances) {
        try {
          await this.deleteInstance(parentUuid, instance);
        } catch (error) {
          log.warn(this.logHeader, "deleteInstances", "could not delete instance from db: parentId", parentUuid, "uuid", instance.uuid);
          return Promise.resolve({
            status: "error",
            error: {
              errorType: "FailedToDeleteInstance",
              errorMessage: "could not delete instance from db: parentId " + parentUuid + ", uuid=" + instance.uuid + ": " + error,
            },
          });
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
      log.info(this.logHeader, "deleteInstance", parentUuid, instance);
      try {
        const sequelizeModel = this.sqlSchemaTableAccess[parentUuid].sequelizeModel;
        await sequelizeModel.destroy({ where: { uuid: instance.uuid } });
        return Promise.resolve(ACTION_OK);
      } catch (error) {
        log.warn(this.logHeader, "deleteInstance", "could not delete instance from db: parentId", parentUuid, "uuid", instance.uuid);
        return Promise.resolve({
          status: "error",
          error: {
            errorType: "FailedToDeleteInstance",
            errorMessage: "could not delete instance from db: parentId " + parentUuid + ", uuid=" + instance.uuid + ": " + error,
          },
        });
        
      }
    }
  };
}
