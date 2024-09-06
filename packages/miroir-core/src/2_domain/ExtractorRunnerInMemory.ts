// import {
//   ActionEntityInstanceCollectionReturnType,
//   ActionReturnType,
//   ApplicationSection,
//   asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
//   AsyncExtractorRunner,
//   AsyncExtractorRunnerMap,
//   AsyncExtractorRunnerParams,
//   asyncExtractWithExtractor,
//   asyncExtractWithManyExtractors,
//   DomainElement,
//   DomainElementEntityInstanceOrFailed,
//   DomainElementInstanceUuidIndexOrFailed,
//   DomainState,
//   ExtractorTemplateForSingleObject,
//   ExtractorTemplateForSingleObjectList,
//   ExtractorRunnerMapForJzodSchema,
//   getLoggerName,
//   LoggerInterface,
//   MiroirLoggerFactory,
//   PersistenceStoreExtractorRunner,
//   PersistenceStoreInstanceSectionAbstractInterface,
//   QueryAction,
//   QueryTemplateSelectObject,
//   resolveContextReferenceDEFUNCT,
//   selectEntityJzodSchemaFromDomainStateNew,
//   selectFetchQueryJzodSchemaFromDomainStateNew,
//   selectJzodSchemaByDomainModelQueryFromDomainStateNew,
//   selectJzodSchemaBySingleSelectQueryFromDomainStateNew
// } from "miroir-core";
import {
  QueryAction,
  ActionReturnType,
  DomainElement,
  ExtractorTemplateForSingleObject,
  DomainElementEntityInstanceOrFailed,
  QueryTemplateSelectObject,
  ApplicationSection,
  ExtractorTemplateForSingleObjectList,
  DomainElementInstanceUuidIndexOrFailed,
  ActionEntityInstanceCollectionReturnType,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import {
  PersistenceStoreExtractorRunner,
  AsyncExtractorRunnerMap,
  AsyncExtractorRunner,
  AsyncExtractorRunnerParams,
  ExtractorRunnerMapForJzodSchema,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { PersistenceStoreInstanceSectionAbstractInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import {
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
} from "./DomainStateQuerySelectors.js";
import {
  resolveContextReference,
} from "./QuerySelectors.js";
import {
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithManyExtractors,
  asyncExtractWithExtractor,
  asyncApplyExtractorTransformerInMemory,
} from "./AsyncQuerySelectors.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "ExtractorRunnerInMemory");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class ExtractorRunnerInMemory implements PersistenceStoreExtractorRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorRunnerMap;

  // ################################################################################################
  constructor(private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
      extractEntityInstance: this.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
    };
  }

  // ################################################################################################
  async handleQuery(queryAction: QueryAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader, "handleQuery", "queryAction", JSON.stringify(queryAction, null, 2));
    let queryResult: DomainElement;
    switch (queryAction.query.queryType) {
      case "extractorTemplateForDomainModelObjects": {
        queryResult = await this.selectorMap.extractWithExtractor(
          {
            extractor: queryAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      case "extractorTemplateForRecordOfExtractors": {
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
      log.info(this.logHeader, "handleQuery", "queryAction", queryAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
    // const result = { status: "ok", returnedDomainElement: { elementType: "object", elementValue: {}}} as ActionReturnType;

    // return result;
  }

  // ################################################################################################
  public extractEntityInstance: AsyncExtractorRunner<
    ExtractorTemplateForSingleObject,
    DomainElementEntityInstanceOrFailed
  > = async (
    selectorParams: AsyncExtractorRunnerParams<ExtractorTemplateForSingleObject>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
    const querySelectorParams: QueryTemplateSelectObject = selectorParams.extractor.select as QueryTemplateSelectObject;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
        "data") as ApplicationSection);

    const entityUuidReference: DomainElement = resolveContextReference(
      querySelectorParams.parentUuid,
      selectorParams.extractor.queryParams,
      selectorParams.extractor.contextResults
    );

    log.info(
      "selectEntityInstanceFromDeploymentEntityState params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );

    // log.info("selectEntityInstanceFromDeploymentEntityState found entityUuidReference", JSON.stringify(entityUuidReference))
    if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "IncorrectParameters",
          queryReference: JSON.stringify(querySelectorParams.parentUuid),
        },
      };
    }

    // const index = getDeploymentEntityStateIndex(
    //   deploymentUuid,
    //   applicationSection,
    //   entityUuidReference.elementValue
    // )

    switch (querySelectorParams?.queryType) {
      case "selectObjectByRelation": {
        const referenceObject = resolveContextReference(
          querySelectorParams.objectReference,
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
          entityUuidReference.elementValue,
          (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
        );

        if (result.status == "error") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReference.elementValue,
            },
          };
        }
        // log.info(
        //   "selectEntityInstanceFromDeploymentEntityState selectObjectByRelation, ############# reference",
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
        const instanceDomainElement = resolveContextReference(
          querySelectorParams.instanceUuid,
          selectorParams.extractor.queryParams,
          selectorParams.extractor.contextResults
        );
        // log.info("selectEntityInstanceFromDeploymentEntityState selectObjectByDirectReference found domainState", JSON.stringify(domainState))

        log.info(
          "selectEntityInstanceFromDeploymentEntityState found instanceUuid",
          JSON.stringify(instanceDomainElement)
        );

        // if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
        if (instanceDomainElement.elementType == "instance") {
          return instanceDomainElement; /* QueryResults, elementType == "failure" */
        }
        if (instanceDomainElement.elementType != "string" && instanceDomainElement.elementType != "instanceUuid") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "EntityNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReference.elementValue,
            },
          };
        }
        log.info("selectEntityInstanceFromDeploymentEntityState resolved instanceUuid =", instanceDomainElement);
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
          entityUuidReference.elementValue,
          instanceDomainElement.elementValue
        );

        if (result.status == "error") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReference.elementValue,
              instanceUuid: instanceDomainElement.elementValue,
            },
          };
        }
        log.info(
          "selectEntityInstanceFromDeploymentEntityState selectObjectByDirectReference, ############# reference",
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
          "selectEntityInstanceFromDeploymentEntityState can not handle QueryTemplateSelectObject query with queryType=" +
            selectorParams.extractor.select.queryType
        );
        break;
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorTemplateForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid: DomainElement = resolveContextReference(
      extractorRunnerParams.extractor.select.parentUuid,
      extractorRunnerParams.extractor.queryParams,
      extractorRunnerParams.extractor.contextResults
    );

    // log.info("selectEntityInstanceUuidIndexFromDomainState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

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

    switch (entityUuid.elementType) {
      case "string":
      case "instanceUuid": {
        const entityInstanceCollection: ActionEntityInstanceCollectionReturnType =
          await this.persistenceStoreController.getInstances(/*applicationSection, */ entityUuid.elementValue);

        if (entityInstanceCollection.status == "error") {
          // return data;
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "EntityNotFound", // TODO: find corresponding queryFailure from data.status
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuid.elementValue,
            },
          };
        }
        const entityInstanceUuidIndex = Object.fromEntries(
          entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i:any) => [i.uuid, i])
        );
        return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
        break;
      }
      case "object":
      case "instance":
      case "instanceUuidIndex":
      case "instanceUuidIndexUuidIndex":
      case "array": {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryReference: JSON.stringify(extractorRunnerParams.extractor.select.parentUuid),
          },
        };
      }
      case "failure": {
        return entityUuid;
        break;
      }
      default: {
        throw new Error(
          "selectEntityInstanceUuidIndexFromDomainState could not handle reference entityUuid=" + entityUuid
        );
        break;
      }
    }
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
