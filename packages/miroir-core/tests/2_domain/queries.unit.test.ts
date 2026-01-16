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
import selfApplicationLibrary from "../../src/assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";

// import {
//   BoxedQueryTemplateWithExtractorCombinerTransformer,
//   BoxedQueryWithExtractorCombinerTransformer,
//   SyncQueryRunner,
//   SyncQueryTemplateRunner,
// } from "../../dist";
import {
  Domain2QueryReturnType
} from "../../src/0_interfaces/2_domain/DomainElement.js";
import { ReduxDeploymentsState } from '../../src/0_interfaces/2_domain/ReduxDeploymentsStateInterface';
import { defaultSelfApplicationDeploymentMap, type ApplicationDeploymentMap } from "../../src/1_core/Deployment";
import { defaultMetaModelEnvironment } from "../../src/1_core/Model";
import {
  GetQueryRunnerParamsForDomainState,
  getQueryRunnerParamsForDomainState,
  runQueryFromDomainState,
} from "../../src/2_domain/DomainStateQuerySelectors.js";
import {
  getQueryTemplateRunnerParamsForDomainState,
  GetSelectorParamsForQueryTemplateOnDomainStateType,
  runQueryTemplateFromDomainState,
} from "../../src/2_domain/DomainStateQueryTemplateSelector.js";
import {
  GetQueryRunnerParamsForReduxDeploymentsState,
  getQueryRunnerParamsForReduxDeploymentsState,
  runQueryFromReduxDeploymentsState,
} from "../../src/2_domain/ReduxDeploymentsStateQuerySelectors.js";
import {
  GetQueryTemplateRunnerParamsForReduxDeploymentsState,
  getQueryTemplateRunnerParamsForReduxDeploymentsState,
  runQueryTemplateFromReduxDeploymentsState,
} from "../../src/2_domain/ReduxDeploymentsStateQueryTemplateSelectors.js";
import { ignorePostgresExtraAttributes } from '../../src/4_services/otherTools.js';
import { domainStateToReduxDeploymentsState, resolvePathOnObject } from '../../src/tools.js';
import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

import {
  type SyncQueryRunner,
  type SyncQueryTemplateRunner,
} from "../../src/0_interfaces/2_domain/ExtractorRunnerInterface.js";

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

// console.log("domainState data entities:", Object.keys(domainState[adminConfigurationDeploymentLibrary.uuid]["data"]));
console.log("domainState data authors:", Object.keys(domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["d7a144ff-d1b9-4135-800c-a7cfc1f38733"]));


const testExtractorParams: Record<string, TestExtractorParams> = {
  // ###########################################################################################
  "error on non-existing Entity: EntityNotFound": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "XXXXXX",
          },
          instanceUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "XXXXXXXXX",
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
  "select 1 object from Domain State and apply transformer on foreign key": {
    // queryTemplate: {
    //   queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    //   deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    //   contextResults: {},
    //   pageParams: {},
    //   queryParams: {},
    //   extractorTemplates: {
    //     book: {
    //       extractorTemplateType: "extractorForObjectByDirectReference",
    //       parentName: "Book",
    //       parentUuid: {
    //         transformerType: "constantUuid",
    //         interpolation: "build",
    //         value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    //       },
    //       instanceUuid: {
    //         transformerType: "constantUuid",
    //         interpolation: "build",
    //         value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
    //       },
    //     },
    //   },
    // },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractors: {
        book: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          foreignKeysForTransformer: ["author"],
          applyTransformer: {
            transformerType: "createObject",
            interpolation: "runtime",
            definition: {
              bookTitle: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["referenceObject", "name"],
              },
              authorName: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["foreignKeyObjects", "author", "name"],
              },
            },
          },
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult: {
          book: {
            authorName: "Paul Veyne",
            bookTitle: "Et dans l'éternité je ne m'ennuierai pas",
          },
          // book: domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
          //   "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
          // ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        } as any, // TODO: correct type of the expected result
        // expectedResult: {
        //   book: domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
        //     "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        //   ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        // } as any, // TODO: correct type of the expected result
      },
    },
  },
  "select 1 object from Domain State using direct query parameter reference": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "getFromParameters",
            interpolation: "build",
            referenceName: "wantedBookUuid",
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractorTemplates: {
        book: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
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
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "a027c379-8468-43a5-ba4d-bf618be25cab",
          },
          objectReference: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referenceName: "book",
          },
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
  "select 1 object from the uuid found in an attribute of another object then use applyTransformer on it":
    {
      queryTemplate: {
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        application: selfApplicationLibrary.uuid,
        // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: {},
        pageParams: {},
        queryParams: {},
        extractorTemplates: {
          book: {
            extractorTemplateType: "extractorForObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
              interpolation: "build",
              value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
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
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
              interpolation: "build",
              value: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectReference: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "book",
            },
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
            applyTransformer: {
              transformerType: "createObject",
              interpolation: "runtime",
              definition: {
                bookTitle: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["referenceObject", "name"],
                },
                publisherName: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["foreignKeyObject", "name"],
                },
                publisherUuid: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["foreignKeyObject", "uuid"],
                },
              },
            },
          },
        },
      },
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: selfApplicationLibrary.uuid,
        // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
            applyTransformer: {
              transformerType: "createObject",
              interpolation: "runtime",
              definition: {
                bookTitle: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["referenceObject", "name"],
                },
                publisherName: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["foreignKeyObject", "name"],
                },
                publisherUuid: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["foreignKeyObject", "uuid"],
                },
              },
            },
          },
        },
        runtimeTransformers: {},
      },
      ...testExtractorTools,
      testAssertions: {
        test1: {
          expectedResult: {
            bookTitle: "Et dans l'éternité je ne m'ennuierai pas",
            publisherName: "Folio",
            publisherUuid: "516a7366-39e7-4998-82cb-80199a7fa667",
          },
          resultAccessPath: ["publisher"],
        },
      },
    },
  "select publishers of books by author using combinerByManyToManyRelationReturningObjectList with applyTransformer":
    {
      queryTemplate: {
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        application: selfApplicationLibrary.uuid,
        contextResults: {},
        pageParams: {},
        queryParams: {},
        extractorTemplates: {
          author: {
            extractorTemplateType: "extractorForObjectByDirectReference",
            parentName: "Author",
            parentUuid: {
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
              interpolation: "build",
              value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            },
            instanceUuid: {
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
              interpolation: "build",
              value: "ce7b601d-be5f-4bc6-a5af-14091594046a", // Paul Veyne
            },
          },
        },
        combinerTemplates: {
          booksOfAuthor: {
            extractorTemplateType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: {
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
              interpolation: "build",
              value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            objectReference: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "author",
            },
            AttributeOfListObjectToCompareToReferenceUuid: "author",
          },
          publishersOfBooks: {
            extractorTemplateType: "combinerByManyToManyRelationReturningObjectList",
            parentName: "Publisher",
            parentUuid: {
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
              interpolation: "build",
              value: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectListReference: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "booksOfAuthor",
            },
            objectListReferenceAttribute: "publisher",
            applyTransformer: {
              transformerType: "createObject",
              interpolation: "runtime",
              definition: {
                authorUuid: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["referenceObject", "author"],
                },
                publisherName: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["foreignKeyObject", "name"],
                },
                publisherUuid: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["foreignKeyObject", "uuid"],
                },
              },
            },
          },
        },
      },
      // query: {
      //   queryType: "boxedQueryWithExtractorCombinerTransformer",
      //   application: selfApplicationLibrary.uuid,
      //   // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      //   contextResults: {},
      //   pageParams: {},
      //   queryParams: {},
      //   extractors: {
      //     author: {
      //       extractorOrCombinerType: "extractorForObjectByDirectReference",
      //       parentName: "Author",
      //       parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
      //       instanceUuid: "ce7b601d-be5f-4bc6-a5af-14091594046a", // Paul Veyne
      //     },
      //   },
      //   combiners: {
      //     booksOfAuthor: {
      //       extractorOrCombinerType: "combinerByRelationReturningObjectList",
      //       parentName: "Book",
      //       parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      //       objectReference: "author",
      //       AttributeOfListObjectToCompareToReferenceUuid: "author",
      //     },
      //     publishersOfBooks: {
      //       extractorOrCombinerType: "combinerByManyToManyRelationReturningObjectList",
      //       parentName: "Publisher",
      //       parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
      //       objectListReference: "booksOfAuthor",
      //       objectListReferenceAttribute: "publisher",
      //       applyTransformer: {
      //         transformerType: "createObject",
      //         interpolation: "runtime",
      //         definition: {
      //           authorUuid: {
      //             transformerType: "getFromContext",
      //             interpolation: "runtime",
      //             referencePath: ["referenceObject", "author"],
      //           },
      //           publisherName: {
      //             transformerType: "getFromContext",
      //             interpolation: "runtime",
      //             referencePath: ["foreignKeyObject", "name"],
      //           },
      //           publisherUuid: {
      //             transformerType: "getFromContext",
      //             interpolation: "runtime",
      //             referencePath: ["foreignKeyObject", "uuid"],
      //           },
      //         },
      //       },
      //     },
      //   },
      //   runtimeTransformers: {},
      // },
      ...testExtractorTools,
      testAssertions: {
        test1: {
          expectedResult: [
            {
              // authorName: "Paul Veyne",
              authorUuid: "ce7b601d-be5f-4bc6-a5af-14091594046a",
              publisherName: "Folio",
              publisherUuid: "516a7366-39e7-4998-82cb-80199a7fa667",
            },
          ],
          resultAccessPath: ["publishersOfBooks"],
        },
      },
    },
  "select Authors": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          },
        },
      },
      runtimeTransformers: {},
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          },
          filter: {
            attributeName: "name",
            value: {
              transformerType: "returnValue",
              mlSchema: { type: "string" },
              interpolation: "build",
              value: "or",
            },
          },
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
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
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "a027c379-8468-43a5-ba4d-bf618be25cab",
          },
          objectReference: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referenceName: "book",
          },
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: {
          //join with only returnValue references
          extractorTemplateType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          objectReference: {
            transformerType: "getFromContext",
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
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
          //join with only returnValue references
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
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          instanceUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
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
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "a027c379-8468-43a5-ba4d-bf618be25cab",
          },
          objectReference: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referenceName: "book",
          },
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: {
          extractorTemplateType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          objectReference: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referenceName: "publisher",
          },
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
        result1: {
          extractorTemplateType: "extractorTemplateByExtractorWrapperReturningObject",
          definition: {
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "booksOfPublisher",
            },
          },
        },
        result2: {
          extractorTemplateType: "extractorTemplateByExtractorWrapperReturningList",
          definition: [
            {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "booksOfPublisher",
            },
            {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "booksOfPublisher",
            },
          ],
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
  "select custom-built result: return Books of Author from Domain State": {
    queryTemplate: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractorTemplates: {
        author: {
          extractorTemplateType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733", // Author
          },
          instanceUuid: {
            transformerType: "returnValue",
            value: "ce7b601d-be5f-4bc6-a5af-14091594046a", // Paul Veyne
          },
        },
      },
      combinerTemplates: {
        books: {
          extractorTemplateType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: {
            transformerType: "returnValue",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
          objectReference: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referenceName: "author",
          },
          AttributeOfListObjectToCompareToReferenceUuid: "author",
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractors: {
        author: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733", // Author
          instanceUuid: "ce7b601d-be5f-4bc6-a5af-14091594046a", // Paul Veyne
        },
      },
      combiners: {
        books: {
          extractorOrCombinerType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          objectReference: "author",
          AttributeOfListObjectToCompareToReferenceUuid: "author",
        },
      },
    },
    ...testExtractorTools,
    testAssertions: {
      test1: {
        expectedResult:
          domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
            "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
          ]["ce7b601d-be5f-4bc6-a5af-14091594046a"],
        resultAccessPath: ["author"],
      },
      test2: {
        expectedResult: [
          {
            author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
            conceptLevel: "Data",
            name: "Le Pain et le Cirque",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
            uuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
          },
          {
            author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
            conceptLevel: "Data",
            name: "Et dans l'éternité je ne m'ennuierai pas",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
            uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          },
        ],
        resultAccessPath: ["books"],
      },
    },
  },
  "select custom-built result: return couple Author name - Book title for Books of Author from Domain State":
    {
      queryTemplate: {
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        application: selfApplicationLibrary.uuid,
        // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: {},
        pageParams: {
          applicationSection: "data",
        },
        queryParams: {},
        extractorTemplates: {
          author: {
            extractorTemplateType: "extractorForObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              transformerType: "returnValue",
              value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733", // Author
            },
            instanceUuid: {
              transformerType: "returnValue",
              value: "ce7b601d-be5f-4bc6-a5af-14091594046a", // Paul Veyne
            },
          },
        },
        combinerTemplates: {
          books: {
            extractorTemplateType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: {
              transformerType: "returnValue",
              value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            objectReference: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "author",
            },
            AttributeOfListObjectToCompareToReferenceUuid: "author",
            applyTransformer: {
              transformerType: "createObject",
              interpolation: "runtime",
              definition: {
                authorName: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["referenceObject", "name"],
                },
                bookTitle: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["foreignKeyObject", "name"],
                },
              },
            },
          },
        },
      },
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: selfApplicationLibrary.uuid,
        // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: {},
        pageParams: {
          applicationSection: "data",
        },
        queryParams: {},
        extractors: {
          author: {
            extractorOrCombinerType: "extractorForObjectByDirectReference",
            parentName: "Author",
            parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733", // Author
            instanceUuid: "ce7b601d-be5f-4bc6-a5af-14091594046a", // Paul Veyne
          },
        },
        combiners: {
          books: {
            extractorOrCombinerType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            objectReference: "author",
            AttributeOfListObjectToCompareToReferenceUuid: "author",
            applyTransformer: {
              transformerType: "createObject",
              interpolation: "runtime",
              definition: {
                authorName: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["referenceObject", "name"],
                },
                bookTitle: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["foreignKeyObject", "name"],
                },
              },
            },
          },
        },
      },
      ...testExtractorTools,
      testAssertions: {
        test1: {
          expectedResult:
            domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
              "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
            ]["ce7b601d-be5f-4bc6-a5af-14091594046a"],
          resultAccessPath: ["author"],
        },
        test2: {
          expectedResult: [
            {
              authorName: "Paul Veyne",
              bookTitle: "Le Pain et le Cirque",
            },
            {
              authorName: "Paul Veyne",
              bookTitle: "Et dans l'éternité je ne m'ennuierai pas",
            },
          ],
          resultAccessPath: ["books"],
        },
        // test2: {
        //   expectedResult: Object.values({
        //     "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7":
        //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
        //         "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        //       ]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
        //     "c6852e89-3c3c-447f-b827-4b5b9d830975":
        //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
        //         "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        //       ]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
        //     "caef8a59-39eb-48b5-ad59-a7642d3a1e8f":
        //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
        //         "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        //       ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        //   }),
        //   resultAccessPath: ["result2", "0"],
        // },
        // test3: {
        //   expectedResult: Object.values({
        //     "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7":
        //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
        //         "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        //       ]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
        //     "c6852e89-3c3c-447f-b827-4b5b9d830975":
        //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
        //         "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        //       ]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
        //     "caef8a59-39eb-48b5-ad59-a7642d3a1e8f":
        //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"][
        //         "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        //       ]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        //   }),
        //   resultAccessPath: ["result2", "1"],
        // },
      },
    },
  "select custom-built result with extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: instances of all Entites from Domain State, indexed by Entity Uuid":
    {
      queryTemplate: {
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        application: selfApplicationLibrary.uuid,
        // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
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
                  transformerType: "getFromParameters",
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
        application: selfApplicationLibrary.uuid,
        // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                  transformerType: "getFromParameters",
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
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
            transformerType: "returnValue",
            mlSchema: { type: "uuid" },
            interpolation: "build",
            value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          },
        },
      },
      runtimeTransformers: {
        publishers: {
          transformerType: "getUniqueValues",
          interpolation: "runtime",
          applyTo: {
            transformerType: "getFromContext",
            referenceName: "books",
          },
          attribute: "publisher",
        },
      },
    },
    query: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: selfApplicationLibrary.uuid,
      // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
          transformerType: "getUniqueValues",
          interpolation: "runtime",
          applyTo: {
            transformerType: "getFromContext",
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

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: adminConfigurationDeploymentLibrary.uuid,
};

describe("queries.unit", () => {
  // ###########################################################################################
  it.each(Object.entries(testExtractorParams))(
    "test %s",
    (currentTestName, testParams: TestExtractorParams) => {
      console.log("STARTING test:", currentTestName);
      expect(currentTestName != undefined).toBeTruthy();
      expect(testParams.testAssertions).toBeDefined();
      // Testing Extractors
      if (testParams.query) {
        // Domain State
        if (testParams.runQueryFromDomainState && testParams.getQueryRunnerParamsForDomainState) {
          const preResult = testParams.runQueryFromDomainState(
            domainState,
            applicationDeploymentMap,
            testParams.getQueryRunnerParamsForDomainState(testParams.query),
            defaultMetaModelEnvironment
            // getExtractorRunnerParamsForDomainState(testParams.query)
          );
          for (const [testAssertionName, testAssertionParams] of Object.entries(
            testParams.testAssertions
          )) {
            console.log(
              `############################################## running query for DOMAIN STATE test assertion: ${currentTestName} ${testAssertionName}`
            );
            console.log(
              `For test named ${currentTestName} ${testAssertionName} preResult: `,
              JSON.stringify(preResult, null, 2)
            );
            const result = cleanupResult(preResult, testAssertionParams);
            console.log(`For test named ${currentTestName} ${testAssertionName} result: `, result);
            expect(result).toEqual(testAssertionParams.expectedResult);
          }
        }
        // Deployment Entity State
        if (
          testParams.runQueryFromReduxDeploymentsState &&
          testParams.getQueryRunnerParamsForReduxDeploymentsState
        ) {
          const preResult = testParams.runQueryFromReduxDeploymentsState(
            deploymentEntityState,
            applicationDeploymentMap,
            testParams.getQueryRunnerParamsForReduxDeploymentsState(testParams.query),
            defaultMetaModelEnvironment
          );
          for (const [testAssertionName, testAssertionParams] of Object.entries(
            testParams.testAssertions
          )) {
            console.log(
              `############################################## running query for DEPLOYMENT ENTITY STATE test assertion: ${currentTestName} ${testAssertionName}`
            );
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
            applicationDeploymentMap,
            testParams.getQueryTemplateRunnerParamsForDomainState(testParams.queryTemplate),
            defaultMetaModelEnvironment
          ) as any;
          for (const [testAssertionName, testAssertionParams] of Object.entries(
            testParams.testAssertions
          )) {
            console.log(
              `############################################## running query TEMPLATE for DOMAIN STATE test assertion: ${currentTestName} ${testAssertionName}`
            );
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
            applicationDeploymentMap,
            testParams.getQueryTemplateRunnerParamsForReduxDeploymentsState(
              testParams.queryTemplate,
              applicationDeploymentMap

            ),
            defaultMetaModelEnvironment
          ) as any;
          for (const [testAssertionName, testAssertionParams] of Object.entries(
            testParams.testAssertions
          )) {
            console.log(
              `############################################## running query TEMPLATE for DEPLOYMENT ENTITY STATE test assertion: ${currentTestName} ${testAssertionName}`
            );
            const result = cleanupResult(preTemplateResult, testAssertionParams);
            // console.log(`For test named ${currentTestName} ${testName} Template result: `, result);
            // console.log(`For test named ${currentTestName} ${testName} expected Template result: `, testParams.expectedResult);
            expect(result).toEqual(testAssertionParams.expectedResult);
          }
        }
      }
    }
  );
});

