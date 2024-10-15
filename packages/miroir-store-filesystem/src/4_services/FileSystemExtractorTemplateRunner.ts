import {
  ActionReturnType,
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  AsyncExtractorRunnerMap,
  asyncExtractWithExtractor,
  asyncExtractWithManyExtractors,
  DomainElement,
  DomainState,
  ExtractorForDomainModelObjects,
  ExtractorForRecordOfExtractors,
  ExtractorTemplatePersistenceStoreRunner,
  ExtractorTemplateRunnerMapForJzodSchema,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  QueryTemplateAction,
  resolveExtractorTemplateForDomainModelObjects,
  resolveExtractorTemplateForRecordOfExtractors,
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
  private selectorMap: AsyncExtractorRunnerMap;

  // ################################################################################################
  constructor(
    private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface,
    private fileSystemExtractorRunner: FileSystemExtractorRunner
  ) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.fileSystemExtractorRunner.extractEntityInstanceUuidIndex,
      extractEntityInstance: this.fileSystemExtractorRunner.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      extractEntityInstanceUuidIndexForTemplate: undefined as any,
      extractEntityInstanceForTemplate: undefined as any,
      extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: undefined as any,
      extractWithManyExtractorTemplates: undefined as any,
      extractWithExtractorTemplate: undefined as any,
      applyExtractorTemplateTransformer: undefined as any
    };
  }

  // ################################################################################################
  async handleQueryTemplateForServerONLY(queryTemplateAction: QueryTemplateAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader, "handleQueryTemplateForServerONLY", "queryTemplateAction", JSON.stringify(queryTemplateAction, null, 2));
    let queryResult: DomainElement;
    switch (queryTemplateAction.query.queryType) {
      case "extractorTemplateForDomainModelObjects": {
        const resolvedQuery: ExtractorForDomainModelObjects = resolveExtractorTemplateForDomainModelObjects(
          queryTemplateAction.query,
        );

        queryResult = await this.selectorMap.extractWithExtractor(
          {
            extractor: resolvedQuery,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      case "extractorTemplateForRecordOfExtractors": {
        const resolvedQuery: ExtractorForRecordOfExtractors = resolveExtractorTemplateForRecordOfExtractors(
          queryTemplateAction.query,
        );

        queryResult = await this.selectorMap.extractWithManyExtractors(
          {
            extractor: resolvedQuery,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      default: {
        return {
          status: "error",
          error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryTemplateAction) },
        } as ActionReturnType;
        break;
      }
    }
    if (queryResult.elementType == "failure") {
      return {
        status: "error",
        error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
      } as ActionReturnType;
    } else {
      const result: ActionReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(this.logHeader, "handleQueryTemplateForServerONLY", "queryTemplateAction", queryTemplateAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
    // const result = { status: "ok", returnedDomainElement: { elementType: "object", elementValue: {}}} as ActionReturnType;

    // return result;
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
