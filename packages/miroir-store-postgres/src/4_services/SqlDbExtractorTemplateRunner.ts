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
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  asyncExtractEntityInstanceListWithObjectListExtractor
} from "miroir-core";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection";
import { SqlDbExtractRunner } from "./SqlDbExtractorRunner";
import { SqlDbModelStoreSection } from "./SqlDbModelStoreSection";

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
      extractEntityInstanceList: this.sqlDbExtractorRunner.extractEntityInstanceList.bind(this.sqlDbExtractorRunner),
      extractEntityInstance: this.sqlDbExtractorRunner.extractEntityInstance.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractEntityInstanceListWithObjectListExtractor: asyncExtractEntityInstanceListWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      extractWithManyExtractorTemplates: undefined as any,
    };
    const dbImplementationExtractorRunnerMap: AsyncExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.sqlDbExtractorRunner.extractEntityInstanceUuidIndex.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceList: this.sqlDbExtractorRunner.extractEntityInstanceList.bind(this.sqlDbExtractorRunner),
      extractEntityInstance: this.sqlDbExtractorRunner.extractEntityInstance.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceUuidIndexWithObjectListExtractor:
        this.sqlDbExtractorRunner.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor.bind(this.sqlDbExtractorRunner),
      extractEntityInstanceListWithObjectListExtractor:
        this.sqlDbExtractorRunner.asyncSqlDbExtractEntityInstanceListWithObjectListExtractor.bind(this.sqlDbExtractorRunner),
      extractWithManyExtractors: this.sqlDbExtractorRunner.asyncExtractWithQuery.bind(this.sqlDbExtractorRunner),
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: undefined as any,
      // 
      extractWithManyExtractorTemplates: undefined as any,
    };

    this.extractorRunnerMap = dbImplementationExtractorRunnerMap;
    // this.extractorRunnerMap = InMemoryImplementationExtractorRunnerMap;
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
