import {
  ActionReturnType,
  DomainElement,
  ExtractorForDomainModelObjects,
  ExtractorForRecordOfExtractors,
  QueryTemplateAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import {
  AsyncExtractorRunnerMap,
  ExtractorTemplatePersistenceStoreRunner,
  ExtractorTemplateRunnerMapForJzodSchema
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { PersistenceStoreInstanceSectionAbstractInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import {
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithExtractor,
  asyncExtractWithManyExtractors,
} from "./AsyncQuerySelectors.js";
import { cleanLevel } from "./constants.js";
import {
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
} from "./DomainStateQueryTemplateSelector.js";
import { ExtractorRunnerInMemory } from "./ExtractorRunnerInMemory.js";
import { handleQueryTemplateAction } from "./QueryTemplateSelectors.js";
import { resolveExtractorTemplateForDomainModelObjects, resolveExtractorTemplateForRecordOfExtractors } from "./Templates.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "ExtractorTemplateRunnerInMemory");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class ExtractorTemplateRunnerInMemory implements ExtractorTemplatePersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorRunnerMap;


  // ################################################################################################
  constructor(
    private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface,
    private extractorRunnerInMemory: ExtractorRunnerInMemory,
  ) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    // this.extractorRunnerInMemory = new ExtractorRunnerInMemory(persistenceStoreController
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractorRunnerInMemory.extractEntityInstanceUuidIndex,
      extractEntityInstance: this.extractorRunnerInMemory.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      extractWithManyExtractorTemplates: undefined as any,
    };
  }

  // ################################################################################################
  async handleQueryTemplateForServerONLY(queryTemplateAction: QueryTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryTemplateForServerONLY", "queryTemplateAction", JSON.stringify(queryTemplateAction, null, 2));
    return handleQueryTemplateAction("ExtractorTemplateRunnerInMemory", queryTemplateAction, this.selectorMap);
  }

} // end of class ExtractorTemplateRunnerInMemory

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
export function getJzodSchemaSelectorMap(): ExtractorTemplateRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNewForTemplate,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  };
}
