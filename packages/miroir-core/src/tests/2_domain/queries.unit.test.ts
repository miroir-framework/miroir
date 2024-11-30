import adminConfigurationDeploymentLibrary from "../../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

import { DomainState } from "../../0_interfaces/2_domain/DomainControllerInterface";

import {
  DomainElement,
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  QueryWithExtractorCombinerTransformer,
  QueryTemplateReturningObject,
  QueryTemplateWithExtractorCombinerTransformer
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DeploymentEntityState } from "../../0_interfaces/2_domain/DeploymentStateInterface";
import { SyncExtractorOrQueryRunner, SyncExtractorOrQueryTemplateRunner } from "../../0_interfaces/2_domain/ExtractorRunnerInterface";
import {
  getExtractorRunnerParamsForDeploymentEntityState,
  GetExtractorRunnerParamsForDeploymentEntityState,
} from "../../2_domain/DeploymentEntityStateQuerySelectors";
import {
  getExtractorTemplateRunnerParamsForDeploymentEntityState,
  GetExtractorTemplateRunnerParamsForDeploymentEntityState,
} from "../../2_domain/DeploymentEntityStateQueryTemplateSelectors";
import {
  extractWithExtractorFromDomainState,
  getExtractorRunnerParamsForDomainState,
  GetExtractorRunnerParamsForDomainState,
} from "../../2_domain/DomainStateQuerySelectors";
import {
  ExtractorTemplateRunnerForDomainState,
  extractorTemplateRunnerForDomainState,
  getExtractorTemplateRunnerParamsForDomainState,
  GetSelectorParamsForTemplateOnDomainStateType
} from "../../2_domain/DomainStateQueryTemplateSelector";
import { extractWithExtractorOrCombinerReturningObjectOrObjectList, ExtractWithExtractorType } from "../../2_domain/QuerySelectors";
import { extractWithExtractorTemplate } from "../../2_domain/QueryTemplateSelectors";
import { domainStateToDeploymentEntityState, resolvePathOnObject } from "../../tools";
import domainStateImport from "./domainState.json";

const domainState: DomainState = domainStateImport as DomainState;
const deploymentEntityState: DeploymentEntityState = domainStateToDeploymentEntityState(domainState);

export interface TestExtractorParams {
  queryTemplate?: QueryTemplateWithExtractorCombinerTransformer;
  query?: QueryWithExtractorCombinerTransformer;
  // Domain State
  extractorRunnerForDomainState?: SyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer,
    DomainState,
    DomainElement
  >;
  getExtractorRunnerParamsForDomainState?: GetExtractorRunnerParamsForDomainState;
  extractorTemplateRunnerForDomainState?: ExtractorTemplateRunnerForDomainState;
  getExtractorTemplateRunnerParamsForDomainState?: GetSelectorParamsForTemplateOnDomainStateType;
  // Deployment Entity State
  extractorRunnerForDeploymentEntityState?: ExtractWithExtractorType<DeploymentEntityState>;
  getExtractorRunnerParamsForDeploymentEntityState?: GetExtractorRunnerParamsForDeploymentEntityState;
  extractorTemplateRunnerForDeploymentEntityState?: SyncExtractorOrQueryTemplateRunner<
    QueryTemplateReturningObject | QueryTemplateWithExtractorCombinerTransformer,
    DeploymentEntityState,
    DomainElement
  >;
  getExtractorTemplateRunnerParamsForDeploymentEntityState?: GetExtractorTemplateRunnerParamsForDeploymentEntityState
  //
  testAssertions: Record<
    string,
    {
      resultAccessPath?: string[];
      expectedResult: any;
    }
  >;
}

const testExtractorTools = {
    // Domain State
    extractorRunnerForDomainState: extractWithExtractorFromDomainState,
    getExtractorRunnerParamsForDomainState: getExtractorRunnerParamsForDomainState,
    extractorTemplateRunnerForDomainState: extractorTemplateRunnerForDomainState,
    getExtractorTemplateRunnerParamsForDomainState: getExtractorTemplateRunnerParamsForDomainState,
    // Deployment Entity State
    extractorRunnerForDeploymentEntityState: extractWithExtractorOrCombinerReturningObjectOrObjectList<DeploymentEntityState>,
    getExtractorRunnerParamsForDeploymentEntityState: getExtractorRunnerParamsForDeploymentEntityState,
    extractorTemplateRunnerForDeploymentEntityState: extractWithExtractorTemplate<DeploymentEntityState>,
    getExtractorTemplateRunnerParamsForDeploymentEntityState: getExtractorTemplateRunnerParamsForDeploymentEntityState,
}
const testExtractorParams: Record<string, TestExtractorParams> = {
  // // ###########################################################################################
  "error on non-existing Entity: EntityNotFound": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "XXXXXX",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
    },
    query:{
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: { },
      queryParams: { },
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "XXXXXX",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: {
          elementType: "object",
          elementValue: {
            book: {
              elementType: "failure",
              elementValue: {
                applicationSection: "data",
                deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                entityUuid: "XXXXXX",
                queryFailure: "EntityNotFound",
              },
            },
          },
        },
      }
    }
  },
  "error on non-existing object uuid: InstanceNotFound": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "XXXXXXXXX",
          },
        },
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      "deploymentUuid": adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: { },
      queryParams: { },
      "extractors": {
        "book": {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "XXXXXXXXX"
        }
      }
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: {
          elementType: "object",
          elementValue: {
            book: {
              elementType: "failure",
              elementValue: {
                applicationSection: "data",
                deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                instanceUuid: "XXXXXXXXX",
                queryFailure: "InstanceNotFound",
              },
            },
          },
        },
      }
    }
  },
  "select 1 object from Domain State": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: {
          elementType: "object",
          elementValue: {
            book: domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"][
              "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
            ],
          },
        } as any, // TODO: correct type of the expected result
      }
    }
  },
  // "select 1 object from Domain State using context reference": {
  //   queryTemplate: {
  //     queryType: "queryTemplateWithExtractorCombinerTransformer",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {},
  //     queryParams: {},
  //     extractorTemplates: {
  //       book: {
  //         queryType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         },
  //         instanceUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  //         },
  //       },
  //     },
  //     combinerTemplates: {
  //       book2: {
  //         queryType: "queryContextReference",
  //         queryReference: "book",
  //       },
  //     },
  //   },
  //   query: {
  //     queryType: "queryWithExtractorCombinerTransformer",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: { },
  //     queryParams: { },
  //     extractors: {
  //       book: {
  //         queryType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  //       },
  //     },
  //     combiners: {
  //       book2: {
  //         queryType: "queryContextReference",
  //         queryReference: "book",
  //       },
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult:
  //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"][
  //         "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //       ],
  //       resultAccessPath: ["elementValue", "book2"],
  //     }
  //   }
  // },
  "select 1 object from Domain State using direct query parameter reference": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
      extractorTemplates: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "parameterReference",
            referenceName: "wantedBookUuid",
          },
        },
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: { },
      pageParams: { },
      queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        }
      },
      runtimeTransformers: {
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: 
        domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"][
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
        ],
        resultAccessPath: ["elementValue", "book"],
      }
    }
  },
  "select 1 object from the uuid found in an attribute of another object from Domain State": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
      combinerTemplates: {
        publisher: {
          queryType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "book",
          },
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
      combiners: {
        publisher: {
          extractorOrCombinerType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          objectReference: "book",
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
      },
      runtimeTransformers: {
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult:
        domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["a027c379-8468-43a5-ba4d-bf618be25cab"][
          "516a7366-39e7-4998-82cb-80199a7fa667"
        ],
        resultAccessPath: ["elementValue", "publisher"],
      }
    }
  },
  "select Authors": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: {},
      extractorTemplates: {
        authors: {
          queryType: "extractorTemplateForObjectListByEntity",
          parentName: "Author",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          },
        },
      },
      runtimeTransformers: {},
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractors: {
        authors: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
        },
      },
      runtimeTransformers: {
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: Object.values({
          '4441169e-0c22-4fbc-81b2-28c87cf48ab2': {
            uuid: '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            name: 'Don Norman'
          },
          'ce7b601d-be5f-4bc6-a5af-14091594046a': {
            uuid: 'ce7b601d-be5f-4bc6-a5af-14091594046a',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            name: 'Paul Veyne'
          },
          'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17': {
            uuid: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            conceptLevel: 'Data',
            name: 'Cornell Woolrich'
          },
          'e4376314-d197-457c-aa5e-d2da5f8d5977': {
            uuid: 'e4376314-d197-457c-aa5e-d2da5f8d5977',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            conceptLevel: 'Data',
            name: 'Catherine Guérard'
          }
        }),
        resultAccessPath: ["elementValue", "authors"],
      }
    }
  },
  "select Authors with filter": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: {},
      extractorTemplates: {
        authors: {
          queryType: "extractorTemplateForObjectListByEntity",
          parentName: "Author",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          },
          filter: {
            attributeName: "name",
            value: {
              transformerType: "constantString",
              constantStringValue: "or",
            },
          },
        },
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractors: {
        authors: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          filter: {
            attributeName: "name",
            value: "or",
          },
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: Object.values({
          '4441169e-0c22-4fbc-81b2-28c87cf48ab2': {
            uuid: '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            name: 'Don Norman'
          },
          'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17': {
            uuid: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            conceptLevel: 'Data',
            name: 'Cornell Woolrich'
          },
        }),
        resultAccessPath: ["elementValue", "authors"],
      }
    }
  },
  "select Books of Publisher of given Book from Domain State": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractorTemplates: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
      combinerTemplates: {
        publisher: {
          queryType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "book",
          },
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: { //join with only constant references
          queryType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "publisher",
          },
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
      },
      runtimeTransformers: {
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
      combiners: {
        publisher: {
          extractorOrCombinerType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          objectReference: "book",
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: { //join with only constant references
          extractorOrCombinerType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          objectReference: "publisher",
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
      },
      runtimeTransformers: {
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: Object.values({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        }),
        resultAccessPath: ["elementValue", "booksOfPublisher"],
      }
    }
  },
  "select custom-built result: Books of Publisher of given Book from Domain State": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractorTemplates: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
      combinerTemplates: {
        publisher: {
          queryType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "book",
          },
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: {
          queryType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "publisher",
          },
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
        result1: {
          queryType: "extractorTemplateByExtractorWrapperReturningObject",
          definition: {
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
              transformerType: "contextReference",
              referenceName: "booksOfPublisher",
            },
          },
        },
        result2: {
          queryType: "extractorTemplateByExtractorWrapperReturningList",
          definition: [
            { transformerType: "contextReference", referenceName: "booksOfPublisher" },
            { transformerType: "contextReference", referenceName: "booksOfPublisher" },
          ],
        },
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
      combiners: {
        publisher: {
          extractorOrCombinerType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          objectReference: "book",
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: {
          extractorOrCombinerType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          objectReference: "publisher",
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
        result1: {
          extractorOrCombinerType: "extractorWrapperReturningObject",
          definition: {
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: "booksOfPublisher",
            },
          },
        },
        result2: {
          extractorOrCombinerType: "extractorWrapperReturningList",
          definition: [
            { extractorOrCombinerType: "extractorOrCombinerContextReference", extractorOrCombinerContextReference: "booksOfPublisher" },
            { extractorOrCombinerType: "extractorOrCombinerContextReference", extractorOrCombinerContextReference: "booksOfPublisher" },
          ],
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: Object.values({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        }),
        resultAccessPath: ["elementValue", "result1", "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
      },
  //     expect((queryResult.elementValue as any)["result2"][0]).toEqual(expectedValue);
  //     expect((queryResult.elementValue as any)["result2"][1]).toEqual(expectedValue);
      "test2": {
        expectedResult: Object.values({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        }),
        resultAccessPath: ["elementValue", "result2", "0"],
      },
      "test3": {
        expectedResult: Object.values({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        }),
        resultAccessPath: ["elementValue", "result2", "1"],
      }
    }
  },
  "select custom-built result with extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: instances of all Entites from Domain State, indexed by Entity Uuid": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: {},
      extractorTemplates: {
        entities: {
          queryType: "extractorTemplateForObjectListByEntity",
          applicationSection: "model",
          parentName: "Entity",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          },
        },
      },
      combinerTemplates: {
        instancesOfEntities: {
          queryType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList", // heteronomous many-to-many join, not possible with SQL
          rootExtractorOrReference: "entities",
          subQueryTemplate: {
            query: {
              queryType: "extractorTemplateForObjectListByEntity",
              parentUuid: {
                transformerType: "parameterReference",
                referenceName: "uuid",
              },
            },
            rootQueryObjectTransformer: {
              transformerType: "recordOfTransformers",
              definition: {
                uuid: {
                  transformerType: "objectTransformer",
                  attributeName: "uuid",
                },
              },
            },
          },
        },
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractors: {
        entities: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          applicationSection: "model",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        },
      },
      combiners: {
        instancesOfEntities: {
          extractorOrCombinerType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList", // heteronomous many-to-many join, possible but akward with SQL (huge "select" clause, dealing with homonym attributes)
          rootExtractorOrReference: "entities",
          subQueryTemplate: {
            query: {
              queryType: "extractorTemplateForObjectListByEntity",
              parentUuid: {
                transformerType: "parameterReference",
                referenceName: "uuid",
              },
            },
            rootQueryObjectTransformer: {
              transformerType: "recordOfTransformers",
              definition: {
                uuid: {
                  transformerType: "objectTransformer",
                  attributeName: "uuid",
                },
              },
            },
          },
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        // expectedResult: domainState[adminConfigurationDeploymentLibrary.uuid]["data"],
        expectedResult: 
        Object.fromEntries(
          Object.entries(domainState[adminConfigurationDeploymentLibrary.uuid]["data"])
          .map((e) => [
            e[0],
            Object.values(e[1])
          ])
        ),
        resultAccessPath: ["elementValue", "instancesOfEntities"],
      }
    }
  },
  "select Unique Publisher Uuids of Books": {
    queryTemplate: {
      queryType: "queryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractorTemplates: {
        books: {
          queryType: "extractorTemplateForObjectListByEntity",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
        },
      },
      runtimeTransformers: {
        publishers: {
          transformerType: "unique",
          interpolation: "runtime",
          referencedExtractor: "books",
          attribute: "publisher",
        },
      },
    },
    query: {
      queryType: "queryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        elementType: "object",
        elementValue: {
          applicationSection: {
            elementType: "string",
            elementValue: "data",
          },
        },
      },
      queryParams: { },
      extractors: {
        books: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        },
      },
      runtimeTransformers: {
        publishers: {
          transformerType: "unique",
          interpolation: "runtime",
          referencedExtractor: "books",
          attribute: "publisher",
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      "test1": {
        expectedResult: [
          { publisher: "516a7366-39e7-4998-82cb-80199a7fa667" },
          { publisher: "c1c97d54-aba8-4599-883a-7fe8f3874095" },
          { publisher: "1f550a2a-33f5-4a56-83ee-302701039494" },
        ],
        resultAccessPath: ["elementValue", "publishers"],
      }
    }
  },
};


describe("queries.unit", () => {
  // ###########################################################################################
  it.each(Object.entries(testExtractorParams))('test %s', (currentTestName, testParams:TestExtractorParams) => {
    console.info("STARTING test:", currentTestName);
    expect(currentTestName != undefined).toBeTruthy();
    expect(testParams.testAssertions).toBeDefined();
    // Testing Extractors
    if (testParams.query) {
      // Domain State
      if (testParams.extractorRunnerForDomainState && testParams.getExtractorRunnerParamsForDomainState) {
        const preResult = testParams.extractorRunnerForDomainState(
          domainState,
          getExtractorRunnerParamsForDomainState(testParams.query)
        );
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.info(`############################################## running query for DOMAIN STATE test assertion: ${currentTestName} ${testAssertionName}`);
          const result = resolvePathOnObject(preResult, testAssertionParams.resultAccessPath ?? []);
          // console.info(`For test named ${currentTestName} ${testName} result: `, result);
          // console.info(`For test named ${currentTestName} ${testName} expected result: `, testParams.expectedResult);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
      // Deployment Entity State
      if (testParams.extractorRunnerForDeploymentEntityState && testParams.getExtractorRunnerParamsForDeploymentEntityState) {
        const preResult = testParams.extractorRunnerForDeploymentEntityState(
          deploymentEntityState,
          getExtractorRunnerParamsForDeploymentEntityState(testParams.query)
        );
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
        console.info(`############################################## running query for DEPLOYMENT ENTITY STATE test assertion: ${currentTestName} ${testAssertionName}`);
          const result = resolvePathOnObject(preResult, testAssertionParams.resultAccessPath ?? []);
          // console.info(`For test named ${currentTestName} ${testName} result: `, result);
          // console.info(`For test named ${currentTestName} ${testName} expected result: `, testParams.expectedResult);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
    }
    // ################################################################################################
    // Testing Extractor Templates
    if (testParams.queryTemplate) {
      // Domain State
      if (
        testParams.extractorTemplateRunnerForDomainState &&
        testParams.getExtractorTemplateRunnerParamsForDomainState
      ) {
        const preTemplateResult = testParams.extractorTemplateRunnerForDomainState(
          domainState,
          testParams.getExtractorTemplateRunnerParamsForDomainState(testParams.queryTemplate)
        ) as any;
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.info(`############################################## running query TEMPLATE for DOMAIN STATE test assertion: ${currentTestName} ${testAssertionName}`);
          const result = resolvePathOnObject(preTemplateResult, testAssertionParams.resultAccessPath ?? []);
          // console.info(`For test named ${currentTestName} ${testName} Template result: `, result);
          // console.info(`For test named ${currentTestName} ${testName} expected Template result: `, testParams.expectedResult);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
      // Deployment Entity State
      if (
        testParams.extractorTemplateRunnerForDeploymentEntityState &&
        testParams.getExtractorTemplateRunnerParamsForDeploymentEntityState
      ) {
        const preTemplateResult = testParams.extractorTemplateRunnerForDeploymentEntityState(
          deploymentEntityState,
          testParams.getExtractorTemplateRunnerParamsForDeploymentEntityState(testParams.queryTemplate)
        ) as any;
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.info(`############################################## running query TEMPLATE for DEPLOYMENT ENTITY STATE test assertion: ${currentTestName} ${testAssertionName}`);
          const result = resolvePathOnObject(preTemplateResult, testAssertionParams.resultAccessPath ?? []);
          // console.info(`For test named ${currentTestName} ${testName} Template result: `, result);
          // console.info(`For test named ${currentTestName} ${testName} expected Template result: `, testParams.expectedResult);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
    }

  });
});
