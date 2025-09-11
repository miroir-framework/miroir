// import { describe, expect, it } from 'vitest';

import { DomainState } from "../../src/0_interfaces/2_domain/DomainControllerInterface";

// import {
//   BoxedQueryTemplateWithExtractorCombinerTransformer,
//   BoxedQueryWithExtractorCombinerTransformer,
//   ReduxDeploymentsState,
//   getQueryRunnerParamsForReduxDeploymentsState,
//   GetQueryRunnerParamsForReduxDeploymentsState,
//   runQueryFromReduxDeploymentsState,
//   GetQueryTemplateRunnerParamsForReduxDeploymentsState,
//   getQueryTemplateRunnerParamsForReduxDeploymentsState,
//   runQueryTemplateFromReduxDeploymentsState,
//   SyncQueryRunner,
//   SyncQueryTemplateRunner,
//   GetQueryRunnerParamsForDomainState,
//   getQueryRunnerParamsForDomainState,
//   runQueryFromDomainState,
//   getQueryTemplateRunnerParamsForDomainState,
//   GetSelectorParamsForQueryTemplateOnDomainStateType,
//   runQueryTemplateFromDomainState,
//   domainStateToReduxDeploymentsState,
//   resolvePathOnObject,
//   Domain2ElementFailed, Domain2QueryReturnType,
//   ignorePostgresExtraAttributes,
// } from "miroir-core";

// import domainStateImport from "./domainState.json" with { type: "json" };
import domainStateImport from "./domainState.json";
// import adminConfigurationDeploymentLibrary from "../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json" with { type: "json" };
import adminConfigurationDeploymentLibrary from "../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";
import { ReduxDeploymentsState } from '../../src/0_interfaces/2_domain/ReduxDeploymentsStateInterface';
import { domainStateToReduxDeploymentsState, resolvePathOnObject } from '../../src/tools.js';
import {
  getQueryTemplateRunnerParamsForDomainState,
  GetSelectorParamsForQueryTemplateOnDomainStateType,
  runQueryTemplateFromDomainState,
} from "../../src/2_domain/DomainStateQueryTemplateSelector.js";
import {
  GetQueryRunnerParamsForDomainState,
  getQueryRunnerParamsForDomainState,
  runQueryFromDomainState,
} from "../../src/2_domain/DomainStateQuerySelectors.js";
import {
  GetQueryTemplateRunnerParamsForReduxDeploymentsState,
  getQueryTemplateRunnerParamsForReduxDeploymentsState,
  runQueryTemplateFromReduxDeploymentsState,
} from "../../src/2_domain/ReduxDeploymentsStateQueryTemplateSelectors.js";
import {
  GetQueryRunnerParamsForReduxDeploymentsState,
  getQueryRunnerParamsForReduxDeploymentsState,
  runQueryFromReduxDeploymentsState,
} from "../../src/2_domain/ReduxDeploymentsStateQuerySelectors.js";
import {
  Domain2ElementFailed,
  Domain2QueryReturnType,
} from "../../src/0_interfaces/2_domain/DomainElement.js";
import { ignorePostgresExtraAttributes } from '../../src/4_services/otherTools.js';
import {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  SyncQueryRunner,
  SyncQueryTemplateRunner,
} from "../../dist";
import { defaultMetaModelEnvironment } from "../../src";

const domainState: DomainState = domainStateImport as DomainState;
const deploymentEntityState: ReduxDeploymentsState = domainStateToReduxDeploymentsState(domainState);

const ignoreFailureAttributes:string[] = [
  "applicationSection",
  "deploymentUuid",
  "entityUuid",
  "instanceUuid",
  "errorStack",
  "failureMessage",
  "failureOrigin",
  "innerError",
  // "queryContext",
  "queryParameters",
  "queryReference",
  "query",
];

export interface TestExtractorParams {
  queryTemplate?: BoxedQueryTemplateWithExtractorCombinerTransformer;
  query?: BoxedQueryWithExtractorCombinerTransformer;
  // ################################################################################################
  // Domain State
  getQueryRunnerParamsForDomainState?: GetQueryRunnerParamsForDomainState,
  runQueryFromDomainState?: SyncQueryRunner<
    DomainState,
    Domain2QueryReturnType<Record<string,any>>
  >

  getQueryTemplateRunnerParamsForDomainState?: GetSelectorParamsForQueryTemplateOnDomainStateType;
  runQueryTemplateFromDomainState?: SyncQueryTemplateRunner<
    DomainState,
    Domain2QueryReturnType<Record<string,any>>
  >
  // ##############################################################################################
  // Deployment Entity State
  getQueryRunnerParamsForReduxDeploymentsState?: GetQueryRunnerParamsForReduxDeploymentsState,
  runQueryFromReduxDeploymentsState?: SyncQueryRunner<
    ReduxDeploymentsState,
    Domain2QueryReturnType<Record<string,any>>
  >

  getQueryTemplateRunnerParamsForReduxDeploymentsState?: GetQueryTemplateRunnerParamsForReduxDeploymentsState;
  runQueryTemplateFromReduxDeploymentsState:SyncQueryTemplateRunner<
    ReduxDeploymentsState,
    Domain2QueryReturnType<Record<string,any>>
  >

  // extractorRunnerForReduxDeploymentsState?: ExtractWithExtractorType<ReduxDeploymentsState>;
  // extractorTemplateRunnerForReduxDeploymentsState?: SyncBoxedExtractorTemplateRunner<
  //   BoxedExtractorTemplateReturningObjectOrObjectList,
  //   ReduxDeploymentsState,
  //   DomainElement
  // >;
  // getExtractorTemplateRunnerParamsForReduxDeploymentsState?: GetExtractorTemplateRunnerParamsForReduxDeploymentsState
  //
  testAssertions: Record<
    string,
    {
      resultAccessPath?: string[];
      expectedResult: any;
    }
  >;
}

// const testExtractorTools: Partial<TestExtractorParams> = {
const testExtractorTools = {
    // Domain State
    getQueryTemplateRunnerParamsForDomainState: getQueryTemplateRunnerParamsForDomainState,
    runQueryTemplateFromDomainState: runQueryTemplateFromDomainState,

    getQueryRunnerParamsForDomainState: getQueryRunnerParamsForDomainState,
    runQueryFromDomainState: runQueryFromDomainState,

    // ############################################################################################
    // Deployment Entity State
    getQueryTemplateRunnerParamsForReduxDeploymentsState: getQueryTemplateRunnerParamsForReduxDeploymentsState,
    runQueryTemplateFromReduxDeploymentsState:runQueryTemplateFromReduxDeploymentsState,
    
    getQueryRunnerParamsForReduxDeploymentsState: getQueryRunnerParamsForReduxDeploymentsState,
    runQueryFromReduxDeploymentsState: runQueryFromReduxDeploymentsState,

    // extractors
    // extractorRunnerForReduxDeploymentsState: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList<ReduxDeploymentsState>,
    // extractorTemplateRunnerForReduxDeploymentsState: extractWithBoxedExtractorTemplate<ReduxDeploymentsState>,
    // getExtractorTemplateRunnerParamsForReduxDeploymentsState: getExtractorTemplateRunnerParamsForReduxDeploymentsState,
}

const testExtractorParams: Record<string, TestExtractorParams> = {
  // ###########################################################################################
  "error on non-existing Entity: EntityNotFound": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "XXXXXX",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "XXXXXX",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        // ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
        expectedResult: {
          queryFailure: "ReferenceNotFound",
          queryContext: "runQuery could not run extractor: book",
        },
      },
    },
  },
  "error on non-existing object uuid: InstanceNotFound": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "XXXXXXXXX",
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "XXXXXXXXX",
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult: {
          queryFailure: "ReferenceNotFound",
          queryContext: "runQuery could not run extractor: book",
        },
      },
    },
  },
  "select 1 object from Domain State": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
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
      test1: {
        expectedResult: {
          book: domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
            "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
          ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        } as any, // TODO: correct type of the expected result
      },
    },
  },
  // "select 1 object from Domain State using context reference": {
  //   queryTemplate: {
  //     queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {},
  //     queryParams: {},
  //     extractorTemplates: {
  //       book: {
  //         extractorTemplateType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         },
  //         instanceUuid: {
  //           transformerType: "constantUuid",
  //           value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
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
  //     queryType: "boxedQueryWithExtractorCombinerTransformer",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: { },
  //     queryParams: { },
  //     extractors: {
  //       book: {
  //         extractorTemplateType: "extractorForObjectByDirectReference",
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
  //       resultAccessPath: ["book2"],
  //     }
  //   }
  // },
  "select 1 object from Domain State using direct query parameter reference": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "parameterReference",
            interpolation: "build",
            referenceName: "wantedBookUuid",
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
      runtimeTransformers: {},
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult:
          domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
            "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
          ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        resultAccessPath: ["book"],
      },
    },
  },
  "select 1 object from the uuid found in an attribute of another object from Domain State": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
      combinerTemplates: {
        publisher: {
          extractorTemplateType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "a027c379-8468-43a5-ba4d-bf618be25cab",
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
      queryType: "boxedQueryWithExtractorCombinerTransformer",
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
      runtimeTransformers: {},
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult:
          domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
            "a027c379-8468-43a5-ba4d-bf618be25cab"
          ]["516a7366-39e7-4998-82cb-80199a7fa667"],
        resultAccessPath: ["publisher"],
      },
    },
  },
  "select Authors": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractorTemplates: {
        authors: {
          extractorTemplateType: "extractorTemplateForObjectListByEntity",
          parentName: "Author",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          },
        },
      },
      runtimeTransformers: {},
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractors: {
        authors: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
        },
      },
      runtimeTransformers: {},
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult: Object.values({
          "4441169e-0c22-4fbc-81b2-28c87cf48ab2": {
            uuid: "4441169e-0c22-4fbc-81b2-28c87cf48ab2",
            parentName: "Author",
            parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            name: "Don Norman",
          },
          "ce7b601d-be5f-4bc6-a5af-14091594046a": {
            uuid: "ce7b601d-be5f-4bc6-a5af-14091594046a",
            parentName: "Author",
            parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            name: "Paul Veyne",
          },
          "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17": {
            uuid: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
            parentName: "Author",
            parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            conceptLevel: "Data",
            name: "Cornell Woolrich",
          },
          "e4376314-d197-457c-aa5e-d2da5f8d5977": {
            uuid: "e4376314-d197-457c-aa5e-d2da5f8d5977",
            parentName: "Author",
            parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            conceptLevel: "Data",
            name: "Catherine Guérard",
          },
        }),
        resultAccessPath: ["authors"],
      },
    },
  },
  "select Authors with filter": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractorTemplates: {
        authors: {
          extractorTemplateType: "extractorTemplateForObjectListByEntity",
          parentName: "Author",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          },
          filter: {
            attributeName: "name",
            value: {
              transformerType: "constantString",
              interpolation: "build",
              value: "or",
            },
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
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
      test1: {
        expectedResult: Object.values({
          "4441169e-0c22-4fbc-81b2-28c87cf48ab2": {
            uuid: "4441169e-0c22-4fbc-81b2-28c87cf48ab2",
            parentName: "Author",
            parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            name: "Don Norman",
          },
          "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17": {
            uuid: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
            parentName: "Author",
            parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            conceptLevel: "Data",
            name: "Cornell Woolrich",
          },
        }),
        resultAccessPath: ["authors"],
      },
    },
  },
  "select Books of Publisher of given Book from Domain State": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
      combinerTemplates: {
        publisher: {
          extractorTemplateType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "a027c379-8468-43a5-ba4d-bf618be25cab",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "book",
          },
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: {
          //join with only constant references
          extractorTemplateType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "publisher",
          },
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
      },
      runtimeTransformers: {},
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
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
        booksOfPublisher: {
          //join with only constant references
          extractorOrCombinerType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          objectReference: "publisher",
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
      },
      runtimeTransformers: {},
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult: Object.values({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        }),
        resultAccessPath: ["booksOfPublisher"],
      },
    },
  },
  "select custom-built result: Books of Publisher of given Book from Domain State": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
      combinerTemplates: {
        publisher: {
          extractorTemplateType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "a027c379-8468-43a5-ba4d-bf618be25cab",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "book",
          },
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: {
          extractorTemplateType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          objectReference: {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: "publisher",
          },
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
        result1: {
          extractorTemplateType: "extractorTemplateByExtractorWrapperReturningObject",
          definition: {
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "booksOfPublisher",
            },
          },
        },
        result2: {
          extractorTemplateType: "extractorTemplateByExtractorWrapperReturningList",
          definition: [
            {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "booksOfPublisher",
            },
            {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "booksOfPublisher",
            },
          ],
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
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
            {
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: "booksOfPublisher",
            },
            {
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: "booksOfPublisher",
            },
          ],
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult: Object.values({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        }),
        resultAccessPath: ["result1", "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
      },
      test2: {
        expectedResult: Object.values({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        }),
        resultAccessPath: ["result2", "0"],
      },
      test3: {
        expectedResult: Object.values({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f":
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        }),
        resultAccessPath: ["result2", "1"],
      },
    },
  },
  "select custom-built result with extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: instances of all Entites from Domain State, indexed by Entity Uuid":
    {
      queryTemplate: {
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: {},
        pageParams: {
          applicationSection: "data",
        },
        queryParams: {},
        extractorTemplates: {
          entities: {
            extractorTemplateType: "extractorTemplateForObjectListByEntity",
            applicationSection: "model",
            parentName: "Entity",
            parentUuid: {
              transformerType: "constantUuid",
              interpolation: "build",
              value: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
            },
          },
        },
        combinerTemplates: {
          instancesOfEntities: {
            extractorTemplateType:
              "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList", // heteronomous many-to-many join, not possible with SQL
            rootExtractorOrReference: "entities",
            subQueryTemplate: {
              query: {
                extractorTemplateType: "extractorTemplateForObjectListByEntity",
                parentUuid: {
                  transformerType: "parameterReference",
                  interpolation: "build",
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
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: {},
        pageParams: {
          applicationSection: "data",
        },
        queryParams: {},
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
            extractorOrCombinerType:
              "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList", // heteronomous many-to-many join, possible but akward with SQL (huge "select" clause, dealing with homonym attributes)
            rootExtractorOrReference: "entities",
            subQueryTemplate: {
              query: {
                extractorTemplateType: "extractorTemplateForObjectListByEntity",
                parentUuid: {
                  transformerType: "parameterReference",
                  interpolation: "build",
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
        test1: {
          // expectedResult: domainState[adminConfigurationDeploymentLibrary.uuid]["data"],
          expectedResult: Object.fromEntries(
            Object.entries(domainState[adminConfigurationDeploymentLibrary.uuid]["data"]).map(
              (e) => [e[0], Object.values(e[1])]
            )
          ),
          resultAccessPath: ["instancesOfEntities"],
        },
      },
    },
  "select Unique Publisher Uuids of Books": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractorTemplates: {
        books: {
          extractorTemplateType: "extractorTemplateForObjectListByEntity",
          parentName: "Book",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
        },
      },
      runtimeTransformers: {
        publishers: {
          transformerType: "unique",
          interpolation: "runtime",
          applyTo: {
            transformerType: "contextReference",
            referenceName: "books",
          },
          attribute: "publisher",
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
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
          applyTo: {
            transformerType: "contextReference",
            referenceName: "books",
          },
          attribute: "publisher",
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult: [
          { publisher: "516a7366-39e7-4998-82cb-80199a7fa667" },
          { publisher: "c1c97d54-aba8-4599-883a-7fe8f3874095" },
          { publisher: "1f550a2a-33f5-4a56-83ee-302701039494" },
        ],
        resultAccessPath: ["publishers"],
      },
    },
  },
};


function cleanupResult(
  preResult: Domain2QueryReturnType<Record<string, any>>,
  testAssertionParams: { resultAccessPath?: string[]; expectedResult: any }
) {
  const resolvedPreResult = resolvePathOnObject(
    preResult,
    testAssertionParams.resultAccessPath ?? []
  );
  let result;
  if (Object.hasOwn(resolvedPreResult, "queryFailure")) {
    result = ignorePostgresExtraAttributes(resolvedPreResult, ignoreFailureAttributes);
  } else {
    result = resolvedPreResult;
  }
  return result;
}

describe("queries.unit", () => {
  // ###########################################################################################
  it.each(Object.entries(testExtractorParams))('test %s', (currentTestName, testParams:TestExtractorParams) => {
    console.log("STARTING test:", currentTestName);
    expect(currentTestName != undefined).toBeTruthy();
    expect(testParams.testAssertions).toBeDefined();
    // Testing Extractors
    if (testParams.query) {
      // Domain State
      if (testParams.runQueryFromDomainState && testParams.getQueryRunnerParamsForDomainState) {
        const preResult = testParams.runQueryFromDomainState(
          domainState,
          testParams.getQueryRunnerParamsForDomainState(testParams.query),
          defaultMetaModelEnvironment,
          // getExtractorRunnerParamsForDomainState(testParams.query)
        );
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.log(
            `############################################## running query for DOMAIN STATE test assertion: ${currentTestName} ${testAssertionName}`
          );
          console.log(`For test named ${currentTestName} ${testAssertionName} preResult: `, JSON.stringify(preResult, null, 2));
          const result = cleanupResult(preResult, testAssertionParams);
          console.log(`For test named ${currentTestName} ${testAssertionName} result: `, result);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
      // Deployment Entity State
      if (testParams.runQueryFromReduxDeploymentsState && testParams.getQueryRunnerParamsForReduxDeploymentsState) {
        const preResult = testParams.runQueryFromReduxDeploymentsState(
          deploymentEntityState,
          testParams.getQueryRunnerParamsForReduxDeploymentsState(testParams.query),
          defaultMetaModelEnvironment,
        );
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
        console.log(`############################################## running query for DEPLOYMENT ENTITY STATE test assertion: ${currentTestName} ${testAssertionName}`);
          const result = cleanupResult(preResult, testAssertionParams);
          console.log(`For test named ${currentTestName} ${testAssertionName} result: `, result);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
    }
    // ################################################################################################
    // Testing Extractor Templates
    if (testParams.queryTemplate) {
      // Domain State
      if (
        testParams.getQueryTemplateRunnerParamsForDomainState &&
        testParams.runQueryTemplateFromDomainState
      ) {
        const preTemplateResult = testParams.runQueryTemplateFromDomainState(
          domainState,
          testParams.getQueryTemplateRunnerParamsForDomainState(testParams.queryTemplate),
          defaultMetaModelEnvironment,
        ) as any;
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.log(`############################################## running query TEMPLATE for DOMAIN STATE test assertion: ${currentTestName} ${testAssertionName}`);
          const result = cleanupResult(preTemplateResult, testAssertionParams);
          // console.log(`For test named ${currentTestName} ${testName} Template result: `, result);
          // console.log(`For test named ${currentTestName} ${testName} expected Template result: `, testParams.expectedResult);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
      // Deployment Entity State
      if (
        testParams.getQueryTemplateRunnerParamsForReduxDeploymentsState &&
        testParams.runQueryTemplateFromReduxDeploymentsState
      ) {
        const preTemplateResult = testParams.runQueryTemplateFromReduxDeploymentsState(
          deploymentEntityState,
          testParams.getQueryTemplateRunnerParamsForReduxDeploymentsState(testParams.queryTemplate),
          defaultMetaModelEnvironment,
        ) as any;
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.log(`############################################## running query TEMPLATE for DEPLOYMENT ENTITY STATE test assertion: ${currentTestName} ${testAssertionName}`);
          const result = cleanupResult(preTemplateResult, testAssertionParams);
          // console.log(`For test named ${currentTestName} ${testName} Template result: `, result);
          // console.log(`For test named ${currentTestName} ${testName} expected Template result: `, testParams.expectedResult);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
    }
  });
});

