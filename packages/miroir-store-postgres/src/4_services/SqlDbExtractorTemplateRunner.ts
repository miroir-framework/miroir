import {
  ActionReturnType,
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  AsyncExtractorRunnerMap,
  asyncExtractWithExtractor,
  asyncExtractWithManyExtractors,
  handleQueryTemplateAction,
  DomainState,
  ExtractorTemplateRunnerMapForJzodSchema,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryTemplateAction,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection.js";
import { SqlDbExtractRunner } from "./SqlDbExtractorRunner.js";
import { SqlDbModelStoreSection } from "./SqlDbModelStoreSection.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "PostgresExtractorRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export type RecursiveStringRecords = string | { [x: string]: RecursiveStringRecords };

export class SqlDbExtractTemplateRunner {
  private logHeader: string;
  private extractorRunnerMap: AsyncExtractorRunnerMap;

  constructor(
    private persistenceStoreController:
      | SqlDbDataStoreSection
      | SqlDbModelStoreSection, /* concrete types for MixedSqlDbInstanceStoreSection */
    private sqlDbExtractorRunner: SqlDbExtractRunner
  ) // private persistenceStoreController: typeof MixedSqlDbInstanceStoreSection // does not work
  {
    this.logHeader = "SqlDbExtractTemplateRunner " + persistenceStoreController.getStoreName();
    const InMemoryImplementationExtractorRunnerMap: AsyncExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.sqlDbExtractorRunner.extractEntityInstanceUuidIndex.bind(this.sqlDbExtractorRunner),
      extractEntityInstance: this.sqlDbExtractorRunner.extractEntityInstance.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      extractWithManyExtractorTemplates: undefined as any,
    };
    const dbImplementationExtractorRunnerMap: AsyncExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.sqlDbExtractorRunner.extractEntityInstanceUuidIndex.bind(this.sqlDbExtractorRunner),
      extractEntityInstance: this.sqlDbExtractorRunner.extractEntityInstance.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory:
        this.sqlDbExtractorRunner.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor.bind(this.sqlDbExtractorRunner),
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: this.sqlDbExtractorRunner.applyExtractorTransformerSql.bind(this.sqlDbExtractorRunner),
      // 
      extractWithManyExtractorTemplates: undefined as any,
    };

    // this.extractorRunnerMap = dbImplementationExtractorRunnerMap;
    this.extractorRunnerMap = InMemoryImplementationExtractorRunnerMap;
  }

  // ##############################################################################################
  async handleQueryTemplateForServerONLY(queryTemplateAction: QueryTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryTemplateForServerONLY", "queryTemplateAction", JSON.stringify(queryTemplateAction, null, 2));
    return handleQueryTemplateAction("SqlDbExtractorTemplateRunner", queryTemplateAction, this.extractorRunnerMap);
  }

}

export function getJzodSchemaSelectorMap(): ExtractorTemplateRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNewForTemplate,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  };
}
