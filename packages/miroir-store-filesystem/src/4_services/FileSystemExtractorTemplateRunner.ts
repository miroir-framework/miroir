import {
  ActionReturnType,
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  AsyncBoxedExtractorOrQueryRunnerMap,
  asyncExtractWithExtractor,
  asyncRunQuery,
  DomainState,
  ExtractorTemplatePersistenceStoreRunner,
  QueryTemplateRunnerMapForJzodSchema,
  getLoggerName,
  handleBoxedExtractorTemplateOrQueryTemplateAction,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  RunQueryTemplateOrBoxedExtractorTemplateAction,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  RunBoxedExtractorTemplateAction,
  handleQueryTemplateAction,
  RunQueryTemplateAction,
  handleBoxedExtractorTemplateAction
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
  private selectorMap: AsyncBoxedExtractorOrQueryRunnerMap;

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
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      //
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
    };
  }

  // ################################################################################################
  async handleQueryTemplateActionForServerONLY(
    runQueryTemplateAction: RunQueryTemplateAction
  ): Promise<ActionReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateActionForServerONLY",
      "runQueryTemplateAction",
      JSON.stringify(runQueryTemplateAction, null, 2)
    );
    return handleQueryTemplateAction("FileSystemExtractorTemplateRunner", runQueryTemplateAction, this.selectorMap);
  }

  // ################################################################################################
  async handleBoxedExtractorTemplateActionForServerONLY(
    runBoxedExtractorTemplateAction: RunBoxedExtractorTemplateAction
  ): Promise<ActionReturnType> {
    log.info(
      this.logHeader,
      "handleBoxedExtractorTemplateActionForServerONLY",
      "runBoxedExtractorTemplateAction",
      JSON.stringify(runBoxedExtractorTemplateAction, null, 2)
    );
    return handleBoxedExtractorTemplateAction(
      "FileSystemExtractorTemplateRunner",
      runBoxedExtractorTemplateAction,
      this.selectorMap
    );
  }

  // ################################################################################################
  async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
    runQueryTemplateOrBoxedExtractorTemplateAction: RunQueryTemplateOrBoxedExtractorTemplateAction
  ): Promise<ActionReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
      "runQueryTemplateOrBoxedExtractorTemplateAction",
      JSON.stringify(runQueryTemplateOrBoxedExtractorTemplateAction, null, 2)
    );
    return handleBoxedExtractorTemplateOrQueryTemplateAction(
      "FileSystemExtractorTemplateRunner",
      runQueryTemplateOrBoxedExtractorTemplateAction,
      this.selectorMap
    );
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
