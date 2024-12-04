import {
  ActionReturnType,
  RunExtractorTemplateAction,
  RunQueryTemplateAction,
  RunQueryTemplateOrExtractorTemplateAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  AsyncExtractorOrQueryRunnerMap,
  ExtractorTemplatePersistenceStoreRunner,
  QueryTemplateRunnerMapForJzodSchema
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreInstanceSectionAbstractInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import {
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithExtractor,
  asyncRunQuery,
} from "./AsyncQuerySelectors";
import { cleanLevel } from "./constants";
import {
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
} from "./DomainStateQueryTemplateSelector";
import { ExtractorRunnerInMemory } from "./ExtractorRunnerInMemory";
import { handleExtractorOrQueryTemplateAction, handleExtractorTemplateAction, handleQueryTemplateAction, runQueryTemplateWithExtractorCombinerTransformer } from "./QueryTemplateSelectors";

const loggerName: string = getLoggerName(packageName, cleanLevel, "ExtractorTemplateRunnerInMemory");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class ExtractorTemplateRunnerInMemory implements ExtractorTemplatePersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorOrQueryRunnerMap;

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
      extractWithExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
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
    return handleQueryTemplateAction(
      "ExtractorTemplateRunnerInMemory",
      runQueryTemplateAction,
      this.selectorMap
    );
  }

  // ################################################################################################
  async handleExtractorTemplateActionForServerONLY(
    runExtractorTemplateAction: RunExtractorTemplateAction
  ): Promise<ActionReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateOrExtractorTemplateActionForServerONLY",
      "runQueryTemplateOrExtractorTemplateAction",
      JSON.stringify(runExtractorTemplateAction, null, 2)
    );
    return handleExtractorTemplateAction(
      "ExtractorTemplateRunnerInMemory",
      runExtractorTemplateAction,
      this.selectorMap
    );
  }

  // ################################################################################################
  async handleQueryTemplateOrExtractorTemplateActionForServerONLY(
    runQueryTemplateOrExtractorTemplateAction: RunQueryTemplateOrExtractorTemplateAction
  ): Promise<ActionReturnType> {
    log.info(
      this.logHeader,
      "handleQueryTemplateOrExtractorTemplateActionForServerONLY",
      "runQueryTemplateOrExtractorTemplateAction",
      JSON.stringify(runQueryTemplateOrExtractorTemplateAction, null, 2)
    );
    return handleExtractorOrQueryTemplateAction(
      "ExtractorTemplateRunnerInMemory",
      runQueryTemplateOrExtractorTemplateAction,
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
