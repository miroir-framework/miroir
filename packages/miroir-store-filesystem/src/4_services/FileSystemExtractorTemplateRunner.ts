import {
  Action2ReturnType,
  asyncApplyExtractorTransformerInMemory,
  AsyncBoxedExtractorOrQueryRunnerMap,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithExtractor,
  asyncRunQuery,
  defaultMiroirModelEnvironment,
  DomainState,
  ExtractorTemplatePersistenceStoreRunner,
  handleQueryTemplateAction,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  QueryTemplateRunnerMapForJzodSchema,
  RunBoxedQueryTemplateAction,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  type ApplicationDeploymentMap
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { FileSystemExtractorRunner } from "./FileSystemExtractorRunner.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FilesystemExtractorRunner")
).then((logger: LoggerInterface) => {log = logger});

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
      extractorOrCombinerType: "async",
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
    runBoxedQueryTemplateAction: RunBoxedQueryTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2ReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateActionForServerONLY",
      "runBoxedQueryTemplateAction",
      JSON.stringify(runBoxedQueryTemplateAction, null, 2)
    );
    return handleQueryTemplateAction(
      "FileSystemExtractorTemplateRunner",
      runBoxedQueryTemplateAction,
      applicationDeploymentMap,
      this.selectorMap,
      defaultMiroirModelEnvironment, // TODO: use actual current deployment environment
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
