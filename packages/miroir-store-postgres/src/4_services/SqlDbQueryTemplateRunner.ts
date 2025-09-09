import {
  Action2ReturnType,
  asyncApplyExtractorTransformerInMemory,
  AsyncBoxedExtractorOrQueryRunnerMap,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithExtractor,
  asyncRunQuery,
  defaultMetaModelEnvironment,
  DomainState,
  handleBoxedExtractorTemplateAction,
  handleBoxedExtractorTemplateOrQueryTemplateAction,
  handleQueryTemplateAction,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryTemplateRunnerMapForJzodSchema,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate
} from "miroir-core";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection";
import { SqlDbModelStoreSection } from "./SqlDbModelStoreSection";
import { SqlDbQueryRunner } from "./SqlDbQueryRunner";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbQueryTemplateRunner")
).then((logger: LoggerInterface) => {log = logger});

export type RecursiveStringRecords = string | { [x: string]: RecursiveStringRecords };

export class SqlDbExtractTemplateRunner {
  private logHeader: string;
  private extractorRunnerMapForServerOnly: AsyncBoxedExtractorOrQueryRunnerMap;

  constructor(
    private persistenceStoreController:
      | SqlDbDataStoreSection
      | SqlDbModelStoreSection, /* concrete types for MixedSqlDbInstanceStoreSection */
    private sqlDbExtractorRunner: SqlDbQueryRunner
  ) // private persistenceStoreController: typeof MixedSqlDbInstanceStoreSection // does not work
  {
    this.logHeader = "SqlDbExtractTemplateRunner " + persistenceStoreController.getStoreName();
    const InMemoryImplementationExtractorRunnerMap: AsyncBoxedExtractorOrQueryRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.sqlDbExtractorRunner.extractEntityInstanceUuidIndex.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceList: this.sqlDbExtractorRunner.extractEntityInstanceList.bind(this.sqlDbExtractorRunner),
      extractEntityInstance: this.sqlDbExtractorRunner.extractEntityInstance.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractEntityInstanceListWithObjectListExtractor: asyncExtractEntityInstanceListWithObjectListExtractor,
      runQuery: asyncRunQuery,
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
    };
    const dbImplementationExtractorRunnerMap: AsyncBoxedExtractorOrQueryRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.sqlDbExtractorRunner.extractEntityInstanceUuidIndex.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceList: this.sqlDbExtractorRunner.extractEntityInstanceList.bind(this.sqlDbExtractorRunner),
      extractEntityInstance: this.sqlDbExtractorRunner.extractEntityInstance.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceUuidIndexWithObjectListExtractor:
        this.sqlDbExtractorRunner.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceListWithObjectListExtractor:
        this.sqlDbExtractorRunner.asyncSqlDbExtractEntityInstanceListWithObjectListExtractor.bind(this.sqlDbExtractorRunner),
      runQuery: this.sqlDbExtractorRunner.asyncExtractWithQuery.bind(this.sqlDbExtractorRunner),
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: undefined as any,
      // 
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
    };

    // this.extractorRunnerMap = dbImplementationExtractorRunnerMap;
    this.extractorRunnerMapForServerOnly = InMemoryImplementationExtractorRunnerMap;
  }

  // ##############################################################################################
  async handleQueryTemplateActionForServerONLY(runBoxedQueryTemplateAction: RunBoxedQueryTemplateAction): Promise<Action2ReturnType> {
    log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "runBoxedQueryTemplateAction", JSON.stringify(runBoxedQueryTemplateAction, null, 2));
    return handleQueryTemplateAction("SqlDbQueryTemplateRunner", runBoxedQueryTemplateAction, this.extractorRunnerMapForServerOnly, defaultMetaModelEnvironment);
  }

  // ##############################################################################################
  async handleBoxedExtractorTemplateActionForServerONLY(runBoxedExtractorTemplateAction: RunBoxedExtractorTemplateAction): Promise<Action2ReturnType> {
    log.info(this.logHeader, "handleBoxedExtractorTemplateActionForServerONLY", "runBoxedExtractorTemplateAction", JSON.stringify(runBoxedExtractorTemplateAction, null, 2));
    return handleBoxedExtractorTemplateAction("SqlDbQueryTemplateRunner", runBoxedExtractorTemplateAction, this.extractorRunnerMapForServerOnly, defaultMetaModelEnvironment);
  }

  // ##############################################################################################
  async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(runBoxedQueryTemplateOrBoxedExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<Action2ReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
      "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
      JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction, null, 2)
    );
    return handleBoxedExtractorTemplateOrQueryTemplateAction("SqlDbQueryTemplateRunner", runBoxedQueryTemplateOrBoxedExtractorTemplateAction, this.extractorRunnerMapForServerOnly, defaultMetaModelEnvironment);
  }

}

export function getDomainStateJzodSchemaExtractorRunnerMap(): QueryTemplateRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNewForTemplate,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  };
}
