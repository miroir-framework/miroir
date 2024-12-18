import {
  ActionReturnType,
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  AsyncBoxedExtractorOrQueryRunnerMap,
  asyncExtractWithExtractor,
  asyncRunQuery,
  handleBoxedExtractorTemplateOrQueryTemplateAction,
  DomainState,
  QueryTemplateRunnerMapForJzodSchema,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  RunBoxedQueryTemplateAction,
  handleQueryTemplateAction,
  RunBoxedExtractorTemplateAction,
  handleBoxedExtractorTemplateAction
} from "miroir-core";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection";
import { SqlDbQueryRunner } from "./SqlDbQueryRunner";
import { SqlDbModelStoreSection } from "./SqlDbModelStoreSection";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbQueryTemplateRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export type RecursiveStringRecords = string | { [x: string]: RecursiveStringRecords };

export class SqlDbExtractTemplateRunner {
  private logHeader: string;
  private extractorRunnerMap: AsyncBoxedExtractorOrQueryRunnerMap;

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
    this.extractorRunnerMap = InMemoryImplementationExtractorRunnerMap;
  }

  // ##############################################################################################
  async handleQueryTemplateActionForServerONLY(runBoxedQueryTemplateAction: RunBoxedQueryTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "runBoxedQueryTemplateAction", JSON.stringify(runBoxedQueryTemplateAction, null, 2));
    return handleQueryTemplateAction("SqlDbQueryTemplateRunner", runBoxedQueryTemplateAction, this.extractorRunnerMap);
  }

  // ##############################################################################################
  async handleBoxedExtractorTemplateActionForServerONLY(runBoxedExtractorTemplateAction: RunBoxedExtractorTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleBoxedExtractorTemplateActionForServerONLY", "runBoxedExtractorTemplateAction", JSON.stringify(runBoxedExtractorTemplateAction, null, 2));
    return handleBoxedExtractorTemplateAction("SqlDbQueryTemplateRunner", runBoxedExtractorTemplateAction, this.extractorRunnerMap);
  }

  // ##############################################################################################
  async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(runBoxedQueryTemplateOrBoxedExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY", "runBoxedQueryTemplateOrBoxedExtractorTemplateAction", JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction, null, 2));
    return handleBoxedExtractorTemplateOrQueryTemplateAction("SqlDbQueryTemplateRunner", runBoxedQueryTemplateOrBoxedExtractorTemplateAction, this.extractorRunnerMap);
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
