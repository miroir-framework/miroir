import {
  ActionReturnType,
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  AsyncExtractorOrQueryRunnerMap,
  asyncExtractWithExtractor,
  asyncRunQuery,
  DomainState,
  ExtractorTemplatePersistenceStoreRunner,
  QueryTemplateRunnerMapForJzodSchema,
  getLoggerName,
  handleQueryTemplateAction,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  RunQueryTemplateOrExtractorTemplateAction,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { FileSystemExtractorRunner } from "./FileSystemExtractorRunner.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "FilesystemExtractorRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemExtractorTemplateRunner implements ExtractorTemplatePersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorOrQueryRunnerMap;

  // ################################################################################################
  constructor(
    private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface,
    private fileSystemExtractorRunner: FileSystemExtractorRunner
  ) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.fileSystemExtractorRunner.extractEntityInstanceUuidIndex,
      extractEntityInstanceList: this.fileSystemExtractorRunner.extractEntityInstanceList,
      extractEntityInstance: this.fileSystemExtractorRunner.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractEntityInstanceListWithObjectListExtractor: asyncExtractEntityInstanceListWithObjectListExtractor,
      runQuery: asyncRunQuery,
      extractWithExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      extractWithManyExtractorTemplates: undefined as any,
    };
  }

  // ################################################################################################
  async handleQueryTemplateForServerONLY(runQueryTemplateOrExtractorTemplateAction: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryTemplateForServerONLY", "runQueryTemplateOrExtractorTemplateAction", JSON.stringify(runQueryTemplateOrExtractorTemplateAction, null, 2));
    return handleQueryTemplateAction("FileSystemExtractorTemplateRunner", runQueryTemplateOrExtractorTemplateAction, this.selectorMap);
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
