// import { sql } from '@sequelize/postgres';

import {
  EntityInstance,
  PersistenceStoreInstanceSectionAbstractInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  ActionReturnType,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionVoidReturnType,
  ACTION_OK,
  RunQueryTemplateOrExtractorTemplateAction,
  QueryTemplateForObjectList,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryTemplateReturningObject,
  ExtractorTemplateByExtractorWrapper,
  QueryForExtractorOrCombinerReturningObjectList,
  QueryForExtractorOrCombinerReturningObject,
  ExtractorWrapper,
  QueryWithExtractorCombinerTransformer,
  RunExtractorOrQueryAction,
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  ExtractorOrCombinerReturningObject,
  ExtractorOrCombinerReturningObjectList,
  Extractor,
  ExtractorOrCombiner,
} from "miroir-core";
import { MixableSqlDbStoreSection, SqlDbStoreSection } from "./SqlDbStoreSection";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { Op } from "sequelize";
import { RecursiveStringRecords, SqlDbExtractTemplateRunner } from "./SqlDbQueryTemplateRunner";
import { SqlDbQueryRunner } from "./SqlDbQueryRunner";

const consoleLog: any = console.log.bind(console, packageName, cleanLevel, "SqlDbInstanceStoreSectionMixin");
const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbInstanceStoreSectionMixin");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
        // Extractor
        // | ExtractorOrCombinerReturningObject
        // | ExtractorOrCombinerReturningObjectList
        // // | CombinerByManyToManyRelationReturningObjectList
        // // | ExtractorOrCombinerReturningObject
        // // | ExtractorOrCombinerReturningObjectList
        // | ExtractorWrapper
        // | ExtractorForObjectByDirectReference
        // | QueryWithExtractorCombinerTransformer
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
        | QueryForExtractorOrCombinerReturningObjectOrObjectList
        // | QueryForExtractorOrCombinerReturningObjectList
        // | QueryForExtractorOrCombinerReturningObject
        // | ExtractorWrapper
        | QueryWithExtractorCombinerTransformer
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
          // where: { [filter.attribute]: { [Op.like]: "%" + filter.value + "%" } },
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
        case "queryWithExtractorCombinerTransformer": {
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

    // // ##############################################################################################
    // sqlForExtractorTemplate(
    //   extractor:
    //     | QueryTemplateForObjectList
    //     | QueryTemplateReturningObject
    //     | ExtractorTemplateByExtractorWrapper
    //     | QueryTemplateWithExtractorCombinerTransformer
    // ): RecursiveStringRecords {
    //   // log.info(this.logHeader, "sqlForExtractor called with parameter", "extractor", extractor);
    //   // log.info(this.logHeader, "sqlForExtractor called with sequelize", this.sequelize);
    //   // log.info(this.logHeader, "sqlForExtractor called with dialect", (this.sequelize as any).dialect);
    //   // // log.info(this.logHeader, "sqlForExtractor called with queryGenerator", (this.sequelize as any).dialect.queryGenerator);
    //   // // log.info(this.logHeader, "sqlForExtractor called with selectQuery", (this.sequelize as any).dialect.selectQuery);
    //   // // log.info(this.logHeader, "sqlForExtractor called with queryInterface", this.sequelize.getQueryInterface());
    //   // // log.info(this.logHeader, "sqlForExtractor called with dialect", (this.sequelize.getQueryInterface().queryGenerator as any).dialect);
    //   // // log.info(this.logHeader, "sqlForExtractor called with queryGenerator", this.sequelize.getQueryInterface().queryGenerator);
    //   // log.info(this.logHeader, "sqlForExtractor called with selectQuery", (this.sequelize.getQueryInterface().queryGenerator as any).selectQuery);
    //   switch (extractor.queryType) {
    //     case "extractorTemplateForObjectListByEntity": {
    //       // const result = (this.sequelize.getQueryInterface().queryGenerator as any).selectQuery(extractor.parentUuid
    //       //   , {
    //       // // const result = (this.sequelize as any).dialect.queryGenerator.selectQuery(extractor.parentUuid, {
    //       //   attributes: ["*"],
    //       // }
    //       // );
    //       // log.info(this.logHeader, "sqlForExtractor", "boxedExtractorTemplateReturningObject", result);
    //       if (extractor.parentName == undefined) {
    //         throw new Error(
    //           "sqlForExtractor can not handle queryTemplateType for extractor" + JSON.stringify(extractor)
    //         );
    //       }
    //       // const parentUuid = 
    //       // TODO: use queryGenerator?
    //       return `SELECT * FROM "${this.schema}"."${extractor.parentName}"`;
    //       // return result;
    //       break;
    //     }
    //     case "boxedExtractorTemplateReturningObject": {
    //       const result: string = (this.sequelize.getQueryInterface().queryGenerator as any).selectQuery(
    //         extractor.select.parentUuid,
    //         {
    //           attributes: ["*"],
    //         }
    //       );
    //       log.info(this.logHeader, "sqlForExtractor", "boxedExtractorTemplateReturningObject", result);
    //       // return "SELECT * FROM domainModel WHERE uuid = " + extractor.deploymentUuid;
    //       return result;
    //       break;
    //     }
    //     case "queryTemplateWithExtractorCombinerTransformer": {
    //       return Object.fromEntries(
    //         Object.entries(extractor.extractorTemplates ?? {}).map((e) => [e[0], this.sqlForExtractorTemplate(e[1])])
    //       );
    //       break;
    //     }
    //     case "extractorForObjectByDirectReference":
    //     case "extractorWrapperReturningObject":
    //     case "extractorWrapperReturningList":
    //     default: {
    //       return "SQL for extractor could not handle queryType for extractor" + extractor;
    //       break;
    //     }
    //   }
    //   return "SQL for extractor not implemented";
    // }

    // #############################################################################################
    async handleQueryTemplateForServerONLY(query: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType> {
      log.info(this.logHeader, "handleQueryTemplateForServerONLY", "query", query);

      const result: ActionReturnType = await this.extractorTemplateRunner.handleQueryTemplateForServerONLY(query);

      log.info(this.logHeader, "handleQueryTemplateForServerONLY", "query", query, "result", result);
      return result;
    }

    // #############################################################################################
    async handleQueryAction(query: RunExtractorOrQueryAction): Promise<ActionReturnType> {
      log.info(this.logHeader, "handleQueryAction", "query", query);

      const result: ActionReturnType = await this.extractorRunner.handleQueryAction(query);

      log.info(this.logHeader, "handleQueryAction", "query", query, "result", result);
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
        return Promise.resolve({ status: "error", error: { errorType: "FailedToGetInstance" } });
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
          log.info("getInstances result", cleanResult);
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
          error: { errorType: "FailedToCreateInstance", errorMessage: error },
        });
      }
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
      log.info(this.logHeader, "deleteInstance", parentUuid, instance);
      const sequelizeModel = this.sqlSchemaTableAccess[parentUuid].sequelizeModel;
      await sequelizeModel.destroy({ where: { uuid: instance.uuid } });
      return Promise.resolve(ACTION_OK);
    }
  };
}
