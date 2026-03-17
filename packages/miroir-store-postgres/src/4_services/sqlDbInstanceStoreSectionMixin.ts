// import { sql } from '@sequelize/postgres';

import {
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
  ACTION_OK,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryWithExtractorCombinerTransformer,
  EntityInstance,
  ExtractorRunnerInMemory,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  type ApplicationDeploymentMap,
  type MiroirModelEnvironment
} from "miroir-core";
import { MixableSqlDbStoreSection, SqlDbStoreSection } from "./SqlDbStoreSection";

import { Op } from "sequelize";
import { sqlStringForExtractor } from "../1_core/SqlGenerator";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbQueryRunner } from "./SqlDbQueryRunner";
import { RecursiveStringRecords, SqlDbExtractTemplateRunner } from "./SqlDbQueryTemplateRunner";
import { stripNullOptionalAttributes } from "../utils";

// const consoleLog: any = log.info.bind(console, packageName, cleanLevel, "SqlDbInstanceStoreSectionMixin");

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbInstanceStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});

export const MixedSqlDbInstanceStoreSection = SqlDbInstanceStoreSectionMixin(SqlDbStoreSection);

export function SqlDbInstanceStoreSectionMixin<TBase extends MixableSqlDbStoreSection>(
  Base: TBase
) {
  return class MixedIndexedDbInstanceStoreSection
    extends Base
    implements PersistenceStoreInstanceSectionAbstractInterface
  {
    public extractorTemplateRunner: SqlDbExtractTemplateRunner;
    public sqlDbQueryRunner: SqlDbQueryRunner;
    public extractorRunnerInMemory: ExtractorRunnerInMemory;

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
      this.extractorRunnerInMemory = new ExtractorRunnerInMemory(this);
      this.sqlDbQueryRunner = new SqlDbQueryRunner(
        this.schema,
        this as any /*SqlDbQueryRunner takes a concrete implementation*/,
        this.extractorRunnerInMemory
      );
      this.extractorTemplateRunner = new SqlDbExtractTemplateRunner(
        this as any /*SqlDbExtractTemplateRunner takes a concrete implementation*/,
        this.sqlDbQueryRunner
      );
    }

    // ##############################################################################################
    async executeRawQuery(query: string, values?: any[]): Promise<Action2ReturnType> {
      log.info(this.logHeader, "######## executeRawQuery", "query", query, "values", values);
      // const rawResult = await this.sequelize.query({query, values: values??[]});
      const rawResult = await this.sequelize.query(query, {
        bind: Array.isArray(values) ? values : [],
      });
      // log.info(this.logHeader, "######## executeRawQuery", "query", query, "rawResult", rawResult);
      const result: Action2ReturnType = {
        status: "ok",
        returnedDomainElement: rawResult[0],
      };
      // log.info(this.logHeader, "######## executeRawQuery", "query", query, "result", JSON.stringify(result));
      return Promise.resolve(result);
    }

    // ##############################################################################################
    sqlForQuery(
      query:
        | BoxedExtractorOrCombinerReturningObjectOrObjectList
        | BoxedQueryWithExtractorCombinerTransformer,
      modelEnvironment: MiroirModelEnvironment
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
            case "extractorInstancesByEntity": {
              const entitySchema = this.sqlSchemaTableAccess?.[query.select.parentUuid]?.isExternal
                ? ((modelEnvironment as any)?.currentModel?.entityDefinitions?.find(
                    (ed: any) => ed.entityUuid === query.select.parentUuid,
                  )?.externalDataSource?.schema ?? this.schema)
                : this.schema;
              return (
                `SELECT * FROM "${entitySchema}"."${query.select.parentName}"` +
                (query.select.filter
                  ? ` WHERE ${query.select.filter.attributeName} LIKE '%${query.select.filter.value}%'`
                  : "")
              );
              break;
            }
            case "combinerOneToMany": {
              throw new Error("sqlForQuery combinerOneToMany not implemented");
            }
            case "combinerManyToMany": {
              throw new Error(
                "sqlForQuery combinerManyToMany not implemented"
              );

              break;
            }
            default:
              break;
          }
          // return result;
          break;
        }
        case "boxedExtractorOrCombinerReturningObjectList": {
          const result: string = (
            this.sequelize.getQueryInterface().queryGenerator as any
          ).selectQuery(query.select.parentUuid, {
            attributes: ["*"],
          });
          log.info(
            this.logHeader,
            "sqlForExtractor",
            "boxedExtractorOrCombinerReturningObjectList",
            result
          );
          // return "SELECT * FROM domainModel WHERE uuid = " + extractor.deploymentUuid;
          return result;
          break;
        }
        case "boxedQueryWithExtractorCombinerTransformer": {
          return Object.fromEntries(
            Object.entries(query.extractors ?? {}).map((e) => [
              e[0],
              sqlStringForExtractor(e[1], this.schema, modelEnvironment),
            ])
          );
          break;
        }
        case "boxedExtractorOrCombinerReturningObject": {
          switch (query.select.extractorOrCombinerType) {
            case "extractorByPrimaryKey": {
              const pkColumn = this.sqlSchemaTableAccess[query.select.parentUuid]?.idAttribute ?? "uuid";
              const entitySchema = this.sqlSchemaTableAccess?.[query.select.parentUuid]?.isExternal
                ? ((modelEnvironment as any)?.currentModel?.entityDefinitions?.find(
                    (ed: any) => ed.entityUuid === query.select.parentUuid,
                  )?.externalDataSource?.schema ?? this.schema)
                : this.schema;
              return `SELECT * FROM "${entitySchema}"."${query.select.parentName}" WHERE "${pkColumn}" = '${query.select.instanceUuid}'`;
              break;
            }
            case "combinerOneToOne": {
              throw new Error("sqlForQuery combinerOneToOne not implemented");
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
    async handleQueryTemplateActionForServerONLY(
      query: RunBoxedQueryTemplateAction,
      appliationDeploymentMap: ApplicationDeploymentMap
    ): Promise<Action2ReturnType> {
      log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "query", query);

      const result: Action2ReturnType =
        await this.extractorTemplateRunner.handleQueryTemplateActionForServerONLY(
          query,
          appliationDeploymentMap
        );

      log.info(
        this.logHeader,
        "handleQueryTemplateActionForServerONLY",
        "query",
        query,
        "result",
        result
      );
      return result;
    }

    // #############################################################################################
    async handleBoxedQueryAction(
      query: RunBoxedQueryAction,
      appliationDeploymentMap: ApplicationDeploymentMap,
      currentModelEnvironment: MiroirModelEnvironment
    ): Promise<Action2ReturnType> {
      log.info(this.logHeader, "handleBoxedQueryAction called for query", query);

      const result: Action2ReturnType = await this.sqlDbQueryRunner.handleBoxedQueryAction(
        query,
        appliationDeploymentMap,
        currentModelEnvironment
      );

      log.info(
        this.logHeader,
        "handleBoxedQueryAction done for query",
        query,
        "result",
        JSON.stringify(result, null, 2)
      );
      return result;
    }

    // ##############################################################################################
    async getInstance(parentUuid: string, instancePrimaryKey: string): Promise<Action2EntityInstanceReturnType> {
      try {
        if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[parentUuid]) {
          const entityAccess = this.sqlSchemaTableAccess[parentUuid];
          const scopedModel = entityAccess.isExternal && entityAccess.effectiveSchema
            ? entityAccess.sequelizeModel.schema(entityAccess.effectiveSchema)
            : entityAccess.sequelizeModel;
          const idAttribute = entityAccess.idAttribute ?? "uuid";
          let result: EntityInstance;
          if (Array.isArray(idAttribute)) {
            // Composite PK: parse serialized key and use findOne with WHERE
            const pkAttributes = idAttribute;
            const { parseCompositeKeyValue } = await import("miroir-core");
            const pkValues = parseCompositeKeyValue(pkAttributes, instancePrimaryKey);
            result = (await scopedModel.findOne({ where: pkValues }))?.dataValues;
          } else {
            result = (await scopedModel.findByPk(instancePrimaryKey))?.dataValues;
          }
          if (result && entityAccess.optionalNonNullableAttributes && entityAccess.optionalNonNullableAttributes.length > 0) {
            result = stripNullOptionalAttributes(result as Record<string, any>, entityAccess.optionalNonNullableAttributes) as EntityInstance;
          }
          log.info(this.logHeader, "getInstance", "result", result);
          return Promise.resolve({
            status: "ok",
            returnedDomainElement: result,
          });
        } else {
          // TODO: indicate exact reason!
          console.warn(this.logHeader, "getInstance", "could not find entityUuid", parentUuid);
          return Promise.resolve(
            new Action2Error("FailedToGetInstance", "could not find entityUuid " + parentUuid)
          );
        }
      } catch (error) {
        // TODO: indicate exact reason!
        log.warn(
          this.logHeader,
          "getInstance",
          "could not fetch instance from db: parentId",
          parentUuid,
          "instancePrimaryKey",
          instancePrimaryKey
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToGetInstance",
            "could not fetch instance from db: parentId " +
              parentUuid +
              ", instancePrimaryKey=" +
              instancePrimaryKey +
              ": " +
              error
          )
        );
      }
    }

    // ##############################################################################################
    async getInstancesWithFilter(
      parentUuid: string,
      filter: {
        attribute: string;
        value: string;
      }
    ): Promise<Action2EntityInstanceCollectionOrFailure> {
      let rawResult: any[] = [];
      let cleanResult: EntityInstance[] = [];
      try {
        if (
          this.sqlSchemaTableAccess &&
          this.sqlSchemaTableAccess[parentUuid] &&
          this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel
        ) {
          log.info("getInstancesWithFilter calling this.sqlEntities findall", parentUuid);
          const entityAccess = this.sqlSchemaTableAccess[parentUuid];
          const scopedModel = entityAccess?.isExternal && entityAccess?.effectiveSchema
            ? entityAccess.sequelizeModel.schema(entityAccess.effectiveSchema)
            : entityAccess?.sequelizeModel;
          rawResult = (await scopedModel?.findAll({
            where: { [filter.attribute]: { [Op.like]: "%" + filter.value + "%" } },
          })) as unknown as EntityInstance[];
          cleanResult = rawResult.map((i) => i["dataValues"]);
          if (entityAccess.optionalNonNullableAttributes && entityAccess.optionalNonNullableAttributes.length > 0) {
            cleanResult = cleanResult.map((i) => stripNullOptionalAttributes(i as Record<string, any>, entityAccess.optionalNonNullableAttributes!) as EntityInstance);
          }
          log.info("getInstancesWithFilter result", JSON.stringify(cleanResult, null, 2));
        } else {
          log.warn(
            this.logHeader,
            "getInstancesWithFilter",
            "could not find entity in database: entityUuid",
            parentUuid
          );
          return Promise.resolve(
            new Action2Error("FailedToGetInstances", `could not find entity ${parentUuid} in database schema ${this.schema}, available entities: ${Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {})}`)
          );
        }
        // TODO: CORRECT APPLICATION SECTION
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: {
            parentUuid,
            applicationSection: this.applicationSection,
            instances: cleanResult,
          },
        });
      } catch (e) {
        log.warn(
          this.logHeader,
          "getInstancesWithFilter",
          "failed to fetch instances of entityUuid",
          parentUuid
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToGetInstances",
            `could not get instances for entity ${parentUuid}`
          )
        );
      }
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
    ): Promise<Action2EntityInstanceCollectionOrFailure> {
      let rawResult: any[] = [];
      let cleanResult: EntityInstance[] = [];
      try {
        if (
          this.sqlSchemaTableAccess &&
          this.sqlSchemaTableAccess[parentUuid] &&
          this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel
        ) {
          log.info("getOrderedInstancesWithFilter calling this.sqlEntities findall", parentUuid);
          const entityAccess2 = this.sqlSchemaTableAccess[parentUuid];
          const scopedModel2 = entityAccess2?.isExternal && entityAccess2?.effectiveSchema
            ? entityAccess2.sequelizeModel.schema(entityAccess2.effectiveSchema)
            : entityAccess2?.sequelizeModel;
          rawResult = (await scopedModel2?.findAll({
            where: { [filter.attribute]: { [Op.like]: "%" + filter.value + "%" } },
            order: [[orderBy.attributeName, orderBy.direction ?? "ASC"]],
          })) as unknown as EntityInstance[];
          cleanResult = rawResult.map((i) => i["dataValues"]);
          if (entityAccess2.optionalNonNullableAttributes && entityAccess2.optionalNonNullableAttributes.length > 0) {
            cleanResult = cleanResult.map((i) => stripNullOptionalAttributes(i as Record<string, any>, entityAccess2.optionalNonNullableAttributes!) as EntityInstance);
          }
          log.info("getOrderedInstancesWithFilter result", cleanResult);
        } else {
          log.warn(
            this.logHeader,
            "getOrderedInstancesWithFilter",
            "could not find entity in database: entityUuid",
            parentUuid
          );
          return Promise.resolve(
            new Action2Error("FailedToGetInstances", `could not find entity ${parentUuid} in database schema ${this.schema}, available entities: ${Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {})}`)
          );
        }
        // TODO: CORRECT APPLICATION SECTION
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: {
            parentUuid,
            applicationSection: this.applicationSection,
            instances: cleanResult,
          },
        });
      } catch (e) {
        log.warn(
          this.logHeader,
          "getOrderedInstancesWithFilter",
          "failed to fetch instances of entityUuid",
          parentUuid
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToGetInstances",
            `could not get instances for entity ${parentUuid}`
          )
        );
      }
    }

    // ##############################################################################################
    async getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure> {
      let rawResult: any[] = [];
      let cleanResult: EntityInstance[] = [];
      try {
        if (
          this.sqlSchemaTableAccess &&
          this.sqlSchemaTableAccess[parentUuid] &&
          this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel
        ) {
          const entityAccess3 = this.sqlSchemaTableAccess[parentUuid];
          log.info("getInstances calling this.sqlEntities findall", parentUuid, JSON.stringify(entityAccess3, null, 2));
          const scopedModel3 = entityAccess3?.isExternal && entityAccess3?.effectiveSchema
            ? entityAccess3.sequelizeModel.schema(entityAccess3.effectiveSchema)
            : entityAccess3?.sequelizeModel;
          rawResult = (await scopedModel3?.findAll()) as unknown as EntityInstance[];
          cleanResult = rawResult.map((i) => i["dataValues"]);
          if (entityAccess3.optionalNonNullableAttributes && entityAccess3.optionalNonNullableAttributes.length > 0) {
            cleanResult = cleanResult.map((i) => stripNullOptionalAttributes(i as Record<string, any>, entityAccess3.optionalNonNullableAttributes!) as EntityInstance);
          }
          // log.info("getInstances result", JSON.stringify(cleanResult, null, 2));
        } else {
          log.warn(
            this.logHeader,
            "getInstances",
            "could not find entity in database: entityUuid",
            parentUuid
          );
          return Promise.resolve(
            new Action2Error("FailedToGetInstances", `could not find entity ${parentUuid} in database schema ${this.schema}, available entities: ${Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {})}`)
          );
        }
        // TODO: CORRECT APPLICATION SECTION
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: {
            parentUuid,
            applicationSection: this.applicationSection,
            instances: cleanResult,
          },
        });
      } catch (e) {
        log.warn(
          this.logHeader,
          "getInstances",
          "failed to fetch instances of entityUuid",
          parentUuid,
          "error:",
          e
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToGetInstances",
            `sqlDbStoreName ${this.sqlDbStoreName} could not get instances for entity ${parentUuid}: ${e}`
          )
        );
      }
    }

    // ##############################################################################################
    async upsertInstance(
      parentUuid: string,
      instance: EntityInstance
    ): Promise<Action2VoidReturnType> {
      log.info(
        "######################################################### upsertInstance #####################################################"
      );
      if (
        !this.sqlSchemaTableAccess ||
        !instance.parentUuid ||
        !this.sqlSchemaTableAccess[instance.parentUuid]
      ) {
        console.warn(
          this.logHeader,
          "upsertInstance",
          "could not find entity in database: entityUuid",
          // instance.parentUuid
          `could not find entity ${instance.parentUuid} in database schema ${this.schema}, available entities: ${Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {})}`
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToUpdateInstance",
            `failed to upsert instance ${instance.uuid} of entity ${instance.parentUuid} in database schema ${this.schema}, available entities: ${Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {})}`
          )
        );
      }
      if (this.sqlSchemaTableAccess[instance.parentUuid]?.isExternal) {
        log.warn(this.logHeader, "upsertInstance", "rejected: entity is external (read-only)", instance.parentUuid);
        return Promise.resolve(
          new Action2Error(
            "FailedToUpdateInstance",
            `cannot upsert instance into external (read-only) entity ${instance.parentUuid}`
          )
        );
      }
      try {
        log.info("upsertInstance for instance:", JSON.stringify(instance, null, 2));
        const sequelizeModel = this.sqlSchemaTableAccess[instance.parentUuid].sequelizeModel;
        const tmp = await sequelizeModel.upsert(instance as any);
        log.info("upsertInstance sequelizeModel.upsert done:", JSON.stringify(instance, null, 2));
      } catch (error: any) {
        const errorText: string = error.toString();
        // log.error(
        log.info(
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
          errorText
        );
        // throw new Error("upsertInstance error: " + errorText);

        return Promise.resolve(
          new Action2Error(
            "FailedToUpdateInstance",
            `failed to upsert instance ${instance.uuid} of entity ${instance.parentUuid}`
          )
        );
      }
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async deleteInstances(
      parentUuid: string,
      instances: EntityInstance[]
    ): Promise<Action2VoidReturnType> {
      for (const instance of instances) {
        try {
          const tmpResult = await this.deleteInstance(parentUuid, instance);
          if (tmpResult.status !== "ok") {
            return tmpResult;
          }
        } catch (error) {
          log.warn(
            this.logHeader,
            "deleteInstances",
            "could not delete instance from db: parentId",
            parentUuid,
            "uuid",
            instance.uuid
          );
          return Promise.resolve(
            new Action2Error(
              "FailedToDeleteInstance",
              `could not delete instance: parentId ${parentUuid}, uuid=${instance.uuid}: ${error}`
            )
          );
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async deleteInstance(
      parentUuid: string,
      instance: EntityInstance
    ): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "deleteInstance", parentUuid, instance);
      if (!this.sqlSchemaTableAccess[parentUuid]) {
        log.warn(
          this.logHeader,
          "deleteInstance",
          "could not find entity in database: entityUuid",
          parentUuid
        );
        return Promise.resolve(
          new Action2Error("FailedToDeleteInstance", `could not find entity ${parentUuid} in database schema ${this.schema}, available entities: ${Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {})}`)
        );
      }
      if (this.sqlSchemaTableAccess[parentUuid]?.isExternal) {
        log.warn(this.logHeader, "deleteInstance", "rejected: entity is external (read-only)", parentUuid);
        return Promise.resolve(
          new Action2Error(
            "FailedToDeleteInstance",
            `cannot delete instance from external (read-only) entity ${parentUuid}`
          )
        );
      }
      try {
        const sequelizeModel = this.sqlSchemaTableAccess[parentUuid].sequelizeModel;
        const idAttribute = this.sqlSchemaTableAccess[parentUuid].idAttribute ?? "uuid";
        if (Array.isArray(idAttribute)) {
          // Composite PK: build WHERE clause with all PK columns
          const whereClause: Record<string, any> = {};
          for (const attr of idAttribute) {
            whereClause[attr] = (instance as any)[attr];
          }
          await sequelizeModel.destroy({ where: whereClause });
        } else {
          await sequelizeModel.destroy({ where: { [idAttribute]: (instance as any)[idAttribute] } });
        }
        return Promise.resolve(ACTION_OK);
      } catch (error) {
        log.warn(
          this.logHeader,
          "deleteInstance",
          "could not delete instance: parentId",
          parentUuid,
          "uuid",
          instance.uuid
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToDeleteInstance",
            `could not delete instance: parentId ${parentUuid}, uuid=${instance.uuid}: ${error}`
          )
        );
      }
    }
  };
}
