import {
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { Action2ReturnType } from "../0_interfaces/2_domain/DomainElement.js";
import {
  AsyncBoxedExtractorOrQueryRunnerMap,
  ExtractorTemplatePersistenceStoreRunner,
  QueryTemplateRunnerMapForJzodSchema
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { PersistenceStoreInstanceSectionAbstractInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory.js";
import { packageName } from "../constants.js";
import {
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithExtractor,
  asyncRunQuery,
} from "./AsyncQuerySelectors.js";
import { cleanLevel } from "./constants.js";
import {
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
} from "./DomainStateQueryTemplateSelector.js";
import { ExtractorRunnerInMemory } from "./ExtractorRunnerInMemory.js";
import { handleBoxedExtractorTemplateAction, handleBoxedExtractorTemplateOrQueryTemplateAction, handleQueryTemplateAction } from "./QueryTemplateSelectors.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ExtractorTemplateRunnerInMemory")
).then((logger: LoggerInterface) => {log = logger});

export class ExtractorTemplateRunnerInMemory implements ExtractorTemplatePersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncBoxedExtractorOrQueryRunnerMap;

  // ################################################################################################
  constructor(
    private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface,
    private extractorRunnerInMemory: ExtractorRunnerInMemory
  ) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    // this.extractorRunnerInMemory = new ExtractorRunnerInMemory(persistenceStoreController
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractorRunnerInMemory.extractEntityInstanceUuidIndex,
      extractEntityInstanceList: this.extractorRunnerInMemory.extractEntityInstanceList,
      extractEntityInstance: this.extractorRunnerInMemory.extractEntityInstance,
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
  ): Promise<Action2ReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateActionForServerONLY",
      "runBoxedQueryTemplateAction",
      JSON.stringify(runBoxedQueryTemplateAction, null, 2)
    );
    return handleQueryTemplateAction(
      "ExtractorTemplateRunnerInMemory",
      runBoxedQueryTemplateAction,
      this.selectorMap
    );
  }

  // ################################################################################################
  async handleBoxedExtractorTemplateActionForServerONLY(
    runBoxedExtractorTemplateAction: RunBoxedExtractorTemplateAction
  ): Promise<Action2ReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
      "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
      JSON.stringify(runBoxedExtractorTemplateAction, null, 2)
    );
    return handleBoxedExtractorTemplateAction(
      "ExtractorTemplateRunnerInMemory",
      runBoxedExtractorTemplateAction,
      this.selectorMap
    );
  }

  // ################################################################################################
  async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
    runBoxedQueryTemplateOrBoxedExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction
  ): Promise<Action2ReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
      "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
      JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction, null, 2)
    );
    return handleBoxedExtractorTemplateOrQueryTemplateAction(
      "ExtractorTemplateRunnerInMemory",
      runBoxedQueryTemplateOrBoxedExtractorTemplateAction,
      this.selectorMap
    );
  }
} // end of class ExtractorTemplateRunnerInMemory

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
export function getDomainStateJzodSchemaExtractorRunnerMap(): QueryTemplateRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNewForTemplate,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  };
}
