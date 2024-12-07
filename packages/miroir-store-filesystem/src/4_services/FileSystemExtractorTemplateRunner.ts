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
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  RunBoxedExtractorTemplateAction,
  handleQueryTemplateAction,
  RunBoxedQueryTemplateAction,
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
    runBoxedQueryTemplateAction: RunBoxedQueryTemplateAction
  ): Promise<ActionReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateActionForServerONLY",
      "runBoxedQueryTemplateAction",
      JSON.stringify(runBoxedQueryTemplateAction, null, 2)
    );
    return handleQueryTemplateAction("FileSystemExtractorTemplateRunner", runBoxedQueryTemplateAction, this.selectorMap);
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
    runBoxedQueryTemplateOrBoxedExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction
  ): Promise<ActionReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
      "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
      JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction, null, 2)
    );
    return handleBoxedExtractorTemplateOrQueryTemplateAction(
      "FileSystemExtractorTemplateRunner",
      runBoxedQueryTemplateOrBoxedExtractorTemplateAction,
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
