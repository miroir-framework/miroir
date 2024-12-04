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
  handleExtractorOrQueryTemplateAction,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  RunQueryTemplateOrExtractorTemplateAction,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  RunExtractorTemplateAction,
  handleQueryTemplateAction,
  RunQueryTemplateAction,
  handleExtractorTemplateAction
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
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
    };
  }

  // ################################################################################################
  async handleQueryTemplateActionForServerONLY(runQueryTemplateAction: RunQueryTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "runQueryTemplateAction", JSON.stringify(runQueryTemplateAction, null, 2));
    return handleQueryTemplateAction("FileSystemExtractorTemplateRunner", runQueryTemplateAction, this.selectorMap);
  }

  // ################################################################################################
  async handleExtractorTemplateActionForServerONLY(runExtractorTemplateAction: RunExtractorTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleExtractorTemplateActionForServerONLY", "runExtractorTemplateAction", JSON.stringify(runExtractorTemplateAction, null, 2));
    return handleExtractorTemplateAction("FileSystemExtractorTemplateRunner", runExtractorTemplateAction, this.selectorMap);
  }

  // ################################################################################################
  async handleQueryTemplateOrExtractorTemplateActionForServerONLY(runQueryTemplateOrExtractorTemplateAction: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryTemplateOrExtractorTemplateActionForServerONLY", "runQueryTemplateOrExtractorTemplateAction", JSON.stringify(runQueryTemplateOrExtractorTemplateAction, null, 2));
    return handleExtractorOrQueryTemplateAction("FileSystemExtractorTemplateRunner", runQueryTemplateOrExtractorTemplateAction, this.selectorMap);
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
