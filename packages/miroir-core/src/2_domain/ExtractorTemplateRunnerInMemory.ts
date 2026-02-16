import {
  RunBoxedQueryTemplateAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import { Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  AsyncBoxedExtractorOrQueryRunnerMap,
  ExtractorTemplatePersistenceStoreRunner,
  QueryTemplateRunnerMapForJzodSchema
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreInstanceSectionAbstractInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
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
import {
  handleQueryTemplateAction
} from "./QueryTemplateSelectors";

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
    this.selectorMap = {
      extractorOrCombinerType: "async",
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
    runBoxedQueryTemplateAction: RunBoxedQueryTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment
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
      applicationDeploymentMap,
      this.selectorMap,
      modelEnvironment
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
