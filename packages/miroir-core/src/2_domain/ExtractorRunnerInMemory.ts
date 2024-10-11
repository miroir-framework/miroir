import {
  ActionEntityInstanceCollectionReturnType,
  ActionReturnType,
  ApplicationSection,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  QueryAction,
  QuerySelectObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import {
  AsyncExtractorRunner,
  AsyncExtractorRunnerMap,
  AsyncExtractorRunnerParams,
  ExtractorPersistenceStoreRunner,
  ExtractorRunnerMapForJzodSchema
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { PersistenceStoreInstanceSectionAbstractInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { asyncApplyExtractorTransformerInMemory, asyncExtractEntityInstanceUuidIndexWithObjectListExtractor, asyncExtractWithExtractor, asyncExtractWithManyExtractors } from "./AsyncQuerySelectors.js";
import { asyncApplyExtractorTemplateTransformerInMemory, asyncExtractEntityInstanceUuidIndexWithObjectListExtractorTemplate, asyncExtractWithExtractorTemplate, asyncExtractWithManyExtractorTemplates } from "./AsyncQueryTemplateSelectors.js";
import { cleanLevel } from "./constants.js";
import {
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
} from "./DomainStateQuerySelectors.js";
import { ExtractorTemplateRunnerInMemory } from "./ExtractorTemplateRunnerInMemory.js";
import { transformer_InnerReference_resolve } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "ExtractorRunnerInMemory");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class ExtractorRunnerInMemory implements ExtractorPersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorRunnerMap;
  private extractorTemplateRunner: ExtractorTemplateRunnerInMemory;

  // ################################################################################################
  constructor(private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface) {
    this.logHeader = "ExtractorRunnerInMemory for store=" + persistenceStoreController.getStoreName();
    this.extractorTemplateRunner = new ExtractorTemplateRunnerInMemory(persistenceStoreController);
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
      extractEntityInstance: this.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // ##########################################################################################
      extractEntityInstanceUuidIndexForTemplate: this.extractorTemplateRunner.extractEntityInstanceUuidIndex,
      extractEntityInstanceForTemplate: this.extractorTemplateRunner.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractorTemplate,
      extractWithManyExtractorTemplates: asyncExtractWithManyExtractorTemplates,
      extractWithExtractorTemplate: asyncExtractWithExtractorTemplate,
      applyExtractorTemplateTransformer: asyncApplyExtractorTemplateTransformerInMemory,
    };
  }

  // ################################################################################################
  async handleQuery(queryAction: QueryAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader, "handleQuery start", "queryAction", JSON.stringify(queryAction, null, 2));
    let queryResult: DomainElement;
    switch (queryAction.query.queryType) {
      case "extractorForDomainModelObjects": {
        queryResult = await this.selectorMap.extractWithExtractor(
          {
            extractor: queryAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      case "extractorForRecordOfExtractors": {
        queryResult = await this.selectorMap.extractWithManyExtractors(
          {
            extractor: queryAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      default: {
        return {
          status: "error",
          error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryAction) },
        } as ActionReturnType;
        break
      }
    }
    if (queryResult.elementType == "failure") {
      return {
        status: "error",
        error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
      } as ActionReturnType;
    } else {
      const result: ActionReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(this.logHeader, "handleQuery", "queryAction", queryAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
    // const result = { status: "ok", returnedDomainElement: { elementType: "object", elementValue: {}}} as ActionReturnType;

    // return result;
  }

  // ################################################################################################
  public extractEntityInstance: AsyncExtractorRunner<
    ExtractorForSingleObject,
    DomainElementEntityInstanceOrFailed
  > = async (
    selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObject>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
    const querySelectorParams: QuerySelectObject = selectorParams.extractor.select as QuerySelectObject;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
        "data") as ApplicationSection);

    const entityUuidReference = querySelectorParams.parentUuid // TODO: we assume this ia a constant here

    log.info(
      "extractEntityInstance params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );

    // if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    //   return {
    //     elementType: "failure",
    //     elementValue: {
    //       queryFailure: "IncorrectParameters",
    //       queryReference: JSON.stringify(querySelectorParams.parentUuid),
    //     },
    //   };
    // }

    // const index = getDeploymentEntityStateIndex(
    //   deploymentUuid,
    //   applicationSection,
    //   entityUuidReference.elementValue
    // )

    switch (querySelectorParams?.queryType) {
      case "selectObjectByRelation": {
        // TODO: we assume this ia a constant, get rid of resolution altogether (push it up)
        const referenceObject = transformer_InnerReference_resolve(
          "build",
          { transformerType: "contextReference", referenceName: querySelectorParams.objectReference },
          selectorParams.extractor.queryParams,
          selectorParams.extractor.contextResults
        );
  
        if (
          !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
          // ||
          // referenceObject.elementType != "instance"
        ) {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "IncorrectParameters",
              queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
              queryContext: "extractRunnerInMemory extractEntityInstance query has no AttributeOfObjectToCompareToReferenceUuid, query=" + JSON.stringify(querySelectorParams),
            },
          };
        }

        const result = await this.persistenceStoreController.getInstance(
          // applicationSection,
          entityUuidReference,
          (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
        );

        if (result.status == "error") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReference,
            },
          };
        }
        // log.info(
        //   "extractEntityInstance selectObjectByRelation, ############# reference",
        //   querySelectorParams,
        //   "######### context entityUuid",
        //   entityUuidReference,
        //   "######### referenceObject",
        //   referenceObject,
        //   "######### queryParams",
        //   JSON.stringify(selectorParams.query.queryParams, undefined, 2),
        //   "######### contextResults",
        //   JSON.stringify(selectorParams.query.contextResults, undefined, 2)
        // );
        return {
          elementType: "instance",
          elementValue: result.returnedDomainElement.elementValue,
          // deploymentEntityState[index].entities[
          //   (referenceObject.elementValue as any)[
          //     querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
          //   ]
          // ],
        };
        break;
      }
      case "selectObjectByDirectReference": {
        const instanceUuid = querySelectorParams.instanceUuid;
        // log.info("extractEntityInstance selectObjectByDirectReference found domainState", JSON.stringify(domainState))

        log.info(
          "extractEntityInstance found instanceUuid",
          JSON.stringify(instanceUuid)
        );

        // if (instanceDomainElement.elementType == "instance") {
        //   return instanceDomainElement; /* QueryResults, elementType == "failure" */
        // }
        // if (instanceDomainElement.elementType != "string" && instanceDomainElement.elementType != "instanceUuid") {
        //   return {
        //     elementType: "failure",
        //     elementValue: {
        //       queryFailure: "EntityNotFound",
        //       deploymentUuid,
        //       applicationSection,
        //       entityUuid: entityUuidReference.elementValue,
        //     },
        //   };
        // }
        // log.info("extractEntityInstance resolved instanceUuid =", instanceUuid);
        // if (!deploymentEntityState[index]) {
        //   return {
        //     elementType: "failure",
        //     elementValue: {
        //       queryFailure: "EntityNotFound",
        //       deploymentUuid,
        //       applicationSection,
        //       entityUuid: entityUuidReference.elementValue,
        //     },
        //   };
        // }
        // if (!deploymentEntityState[index].entities[instanceDomainElement.elementValue]) {
        //   return {
        //     elementType: "failure",
        //     elementValue: {
        //       queryFailure: "InstanceNotFound",
        //       deploymentUuid,
        //       applicationSection,
        //       entityUuid: entityUuidReference.elementValue,
        //       instanceUuid: instanceDomainElement.elementValue,
        //     },
        //   };
        // }
        const result = await this.persistenceStoreController.getInstance(
          // applicationSection,
          entityUuidReference,
          instanceUuid
        );

        if (result.status == "error") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReference,
              instanceUuid: instanceUuid,
            },
          };
        }
        log.info(
          "extractEntityInstance selectObjectByDirectReference, ############# reference",
          querySelectorParams,
          "entityUuidReference",
          entityUuidReference,
          "######### context entityUuid",
          entityUuidReference,
          "######### queryParams",
          JSON.stringify(selectorParams.extractor.queryParams, undefined, 2),
          "######### contextResults",
          JSON.stringify(selectorParams.extractor.contextResults, undefined, 2),
        );
        return {
          elementType: "instance",
          elementValue: result.returnedDomainElement.elementValue,
          // deploymentEntityState[index].entities[instanceDomainElement.elementValue],
        };
        break;
      }
      default: {
        throw new Error(
          "extractEntityInstance can not handle QueryTemplateSelectObject query with queryType=" +
            selectorParams.extractor.select.queryType
        );
        break;
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid = extractorRunnerParams.extractor.select.parentUuid;

    // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate domainState", domainState);

    if (!deploymentUuid || !applicationSection || !entityUuid) {
      return {
        // new object
        elementType: "failure",
        elementValue: {
          queryFailure: "IncorrectParameters",
          queryContext:
            "extractEntityInstanceUuidIndex wrong context as deploymentUuid, applicationSection, entityUuid not found, deploymentUuid=" +
            deploymentUuid +
            ", applicationSection=" +
            applicationSection +
            ", entityUuid=" +
            entityUuid,
          queryParameters: JSON.stringify(extractorRunnerParams),
        },
      };
      // resolving by fetchDataReference, fetchDataReferenceAttribute
    }

    // switch (entityUuid.elementType) {
    //   case "string":
    //   case "instanceUuid": {
    const entityInstanceCollection: ActionEntityInstanceCollectionReturnType =
      await this.persistenceStoreController.getInstances(/*applicationSection, */ entityUuid);

    if (entityInstanceCollection.status == "error") {
      // return data;
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "EntityNotFound", // TODO: find corresponding queryFailure from data.status
          deploymentUuid,
          applicationSection,
          entityUuid: entityUuid,
        },
      };
    }
    const entityInstanceUuidIndex = Object.fromEntries(
      entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i:any) => [i.uuid, i])
    );
    return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
      //   break;
      // }
      // case "object":
      // case "instance":
      // case "instanceUuidIndex":
      // case "instanceUuidIndexUuidIndex":
      // case "array": {
      //   return {
      //     elementType: "failure",
      //     elementValue: {
      //       queryFailure: "IncorrectParameters",
      //       queryReference: JSON.stringify(extractorRunnerParams.extractor.select.parentUuid),
      //     },
      //   };
      // }
      // case "failure": {
      //   return entityUuid;
      //   break;
      // }
      // default: {
      //   throw new Error(
      //     "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference entityUuid=" + entityUuid
      //   );
      //   break;
      // }
    // }
  };

  // ##############################################################################################
  public getSelectorMap(): AsyncExtractorRunnerMap {
    return this.selectorMap;
  }
} // end of class ExtractorRunnerInMemory

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
export function getJzodSchemaSelectorMap(): ExtractorRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}
