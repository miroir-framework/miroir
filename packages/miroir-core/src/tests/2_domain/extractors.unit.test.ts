import adminConfigurationDeploymentLibrary from "../../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

import { DomainState } from "../../0_interfaces/2_domain/DomainControllerInterface";

import {
  DomainElement,
  ExtractorForDomainModelObjects,
  ExtractorForRecordOfExtractors,
  ExtractorTemplateForDomainModelObjects,
  ExtractorTemplateForRecordOfExtractors
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DeploymentEntityState } from "../../0_interfaces/2_domain/DeploymentStateInterface";
import { SyncExtractorRunner, SyncExtractorTemplateRunner } from "../../0_interfaces/2_domain/ExtractorRunnerInterface";
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
import { extractWithExtractor, ExtractWithExtractorType } from "../../2_domain/QuerySelectors";
import { extractWithExtractorTemplate } from "../../2_domain/QueryTemplateSelectors";
import { domainStateToDeploymentEntityState, resolvePathOnObject } from "../../tools";
import domainStateImport from "./domainState.json";

const domainState: DomainState = domainStateImport as DomainState;
const deploymentEntityState: DeploymentEntityState = domainStateToDeploymentEntityState(domainState);

export interface TestExtractorParams {
  extractorTemplate?: ExtractorTemplateForRecordOfExtractors;
  extractor?: ExtractorForRecordOfExtractors;
  // Domain State
  extractorRunnerForDomainState?: SyncExtractorRunner<
    ExtractorForDomainModelObjects | ExtractorForRecordOfExtractors,
    DomainState,
    DomainElement
  >;
  getExtractorRunnerParamsForDomainState?: GetExtractorRunnerParamsForDomainState;
  extractorTemplateRunnerForDomainState?: ExtractorTemplateRunnerForDomainState;
  getExtractorTemplateRunnerParamsForDomainState?: GetSelectorParamsForTemplateOnDomainStateType;
  // Deployment Entity State
  extractorRunnerForDeploymentEntityState?: ExtractWithExtractorType<DeploymentEntityState>;
  getExtractorRunnerParamsForDeploymentEntityState?: GetExtractorRunnerParamsForDeploymentEntityState;
  extractorTemplateRunnerForDeploymentEntityState?: SyncExtractorTemplateRunner<
    ExtractorTemplateForDomainModelObjects | ExtractorTemplateForRecordOfExtractors,
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
    extractorRunnerForDeploymentEntityState: extractWithExtractor<DeploymentEntityState>,
    getExtractorRunnerParamsForDeploymentEntityState: getExtractorRunnerParamsForDeploymentEntityState,
    extractorTemplateRunnerForDeploymentEntityState: extractWithExtractorTemplate<DeploymentEntityState>,
    getExtractorTemplateRunnerParamsForDeploymentEntityState: getExtractorTemplateRunnerParamsForDeploymentEntityState,
}
const testExtractorParams: Record<string, TestExtractorParams> = {
  // ###########################################################################################
  // "error on non-existing Entity: EntityNotFound": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
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
  //           constantUuidValue: "XXXXXX",
  //         },
  //         instanceUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  //         },
  //       },
  //     },
  //   },
  //   extractor:{
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: { },
  //     queryParams: { },
  //     extractors: {
  //       book: {
  //         queryType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: "XXXXXX",
  //         instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //       },
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult: {
  //         elementType: "object",
  //         elementValue: {
  //           book: {
  //             elementType: "failure",
  //             elementValue: {
  //               applicationSection: "data",
  //               deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //               entityUuid: "XXXXXX",
  //               queryFailure: "EntityNotFound",
  //             },
  //           },
  //         },
  //       },
  //     }
  //   }
  // },
  // "error on non-existing object uuid: InstanceNotFound": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
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
  //           constantUuidValue: "XXXXXXXXX",
  //         },
  //       },
  //     },
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     "deploymentUuid": adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: { },
  //     queryParams: { },
  //     "extractors": {
  //       "book": {
  //         queryType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         instanceUuid: "XXXXXXXXX"
  //       }
  //     }
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult: {
  //         elementType: "object",
  //         elementValue: {
  //           book: {
  //             elementType: "failure",
  //             elementValue: {
  //               applicationSection: "data",
  //               deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //               entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //               instanceUuid: "XXXXXXXXX",
  //               queryFailure: "InstanceNotFound",
  //             },
  //           },
  //         },
  //       },
  //     }
  //   }
  // },
  // "select 1 object from Domain State": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
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
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {},
  //     queryParams: {},
  //     extractors: {
  //       book: {
  //         queryType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  //       },
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult: {
  //         elementType: "object",
  //         elementValue: {
  //           book: domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"][
  //             "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //           ],
  //         },
  //       } as any, // TODO: correct type of the expected result
  //     }
  //   }
  // },
  // // "select 1 object from Domain State using context reference": {
  // //   extractorTemplate: {
  // //     queryType: "extractorTemplateForRecordOfExtractors",
  // //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  // //     contextResults: {},
  // //     pageParams: {},
  // //     queryParams: {},
  // //     extractorTemplates: {
  // //       book: {
  // //         queryType: "extractorForObjectByDirectReference",
  // //         parentName: "Book",
  // //         parentUuid: {
  // //           transformerType: "constantUuid",
  // //           constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  // //         },
  // //         instanceUuid: {
  // //           transformerType: "constantUuid",
  // //           constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  // //         },
  // //       },
  // //     },
  // //     combinerTemplates: {
  // //       book2: {
  // //         queryType: "queryContextReference",
  // //         queryReference: "book",
  // //       },
  // //     },
  // //   },
  // //   extractor: {
  // //     queryType: "extractorForRecordOfExtractors",
  // //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  // //     contextResults: {},
  // //     pageParams: { },
  // //     queryParams: { },
  // //     extractors: {
  // //       book: {
  // //         queryType: "extractorForObjectByDirectReference",
  // //         parentName: "Book",
  // //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  // //         instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  // //       },
  // //     },
  // //     combiners: {
  // //       book2: {
  // //         queryType: "queryContextReference",
  // //         queryReference: "book",
  // //       },
  // //     },
  // //   },
  // //   ...testExtractorTools,
  // //   testAssertions: {
  // //     "test1": {
  // //       expectedResult:
  // //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"][
  // //         "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  // //       ],
  // //       resultAccessPath: ["elementValue", "book2"],
  // //     }
  // //   }
  // // },
  // "select 1 object from Domain State using direct query parameter reference": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {},
  //     queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
  //     extractorTemplates: {
  //       book: {
  //         queryType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         },
  //         instanceUuid: {
  //           transformerType: "parameterReference",
  //           referenceName: "wantedBookUuid",
  //         },
  //       },
  //     },
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: { },
  //     pageParams: { },
  //     queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
  //     extractors: {
  //       book: {
  //         queryType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  //       }
  //     },
  //     runtimeTransformers: {
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult: 
  //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"][
  //         "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //       ],
  //       resultAccessPath: ["elementValue", "book"],
  //     }
  //   }
  // },
  // "select 1 object from the uuid found in an attribute of another object from Domain State": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
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
  //       publisher: {
  //         queryType: "extractorCombinerForObjectByRelation",
  //         parentName: "Publisher",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
  //         },
  //         objectReference: {
  //           transformerType: "contextReference",
  //           interpolation: "runtime",
  //           referenceName: "book",
  //         },
  //         AttributeOfObjectToCompareToReferenceUuid: "publisher",
  //       },
  //     },
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {},
  //     queryParams: {},
  //     extractors: {
  //       book: {
  //         queryType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  //       },
  //     },
  //     combiners: {
  //       publisher: {
  //         queryType: "extractorCombinerForObjectByRelation",
  //         parentName: "Publisher",
  //         parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
  //         objectReference: "book",
  //         AttributeOfObjectToCompareToReferenceUuid: "publisher",
  //       },
  //     },
  //     runtimeTransformers: {
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult:
  //       domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["a027c379-8468-43a5-ba4d-bf618be25cab"][
  //         "516a7366-39e7-4998-82cb-80199a7fa667"
  //       ],
  //       resultAccessPath: ["elementValue", "publisher"],
  //     }
  //   }
  // },
  // "select Authors": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: {},
  //     extractorTemplates: {
  //       authors: {
  //         queryType: "extractorTemplateForObjectListByEntity",
  //         parentName: "Author",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  //         },
  //       },
  //     },
  //     runtimeTransformers: {},
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: { },
  //     extractors: {
  //       authors: {
  //         queryType: "extractorByEntityReturningObjectList",
  //         parentName: "Author",
  //         parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  //       },
  //     },
  //     runtimeTransformers: {
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult: Object.values({
  //         '4441169e-0c22-4fbc-81b2-28c87cf48ab2': {
  //           uuid: '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
  //           parentName: 'Author',
  //           parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
  //           name: 'Don Norman'
  //         },
  //         'ce7b601d-be5f-4bc6-a5af-14091594046a': {
  //           uuid: 'ce7b601d-be5f-4bc6-a5af-14091594046a',
  //           parentName: 'Author',
  //           parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
  //           name: 'Paul Veyne'
  //         },
  //         'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17': {
  //           uuid: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
  //           parentName: 'Author',
  //           parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
  //           conceptLevel: 'Data',
  //           name: 'Cornell Woolrich'
  //         },
  //         'e4376314-d197-457c-aa5e-d2da5f8d5977': {
  //           uuid: 'e4376314-d197-457c-aa5e-d2da5f8d5977',
  //           parentName: 'Author',
  //           parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
  //           conceptLevel: 'Data',
  //           name: 'Catherine Guérard'
  //         }
  //       }),
  //       resultAccessPath: ["elementValue", "authors"],
  //     }
  //   }
  // },
  // "select Authors with filter": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: {},
  //     extractorTemplates: {
  //       authors: {
  //         queryType: "extractorTemplateForObjectListByEntity",
  //         parentName: "Author",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  //         },
  //         filter: {
  //           attributeName: "name",
  //           value: {
  //             transformerType: "constantString",
  //             constantStringValue: "or",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: { },
  //     extractors: {
  //       authors: {
  //         queryType: "extractorByEntityReturningObjectList",
  //         parentName: "Author",
  //         parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  //         filter: {
  //           attributeName: "name",
  //           value: "or",
  //         },
  //       },
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult: Object.values({
  //         '4441169e-0c22-4fbc-81b2-28c87cf48ab2': {
  //           uuid: '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
  //           parentName: 'Author',
  //           parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
  //           name: 'Don Norman'
  //         },
  //         'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17': {
  //           uuid: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
  //           parentName: 'Author',
  //           parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
  //           conceptLevel: 'Data',
  //           name: 'Cornell Woolrich'
  //         },
  //       }),
  //       resultAccessPath: ["elementValue", "authors"],
  //     }
  //   }
  // },
  // "select Books of Publisher of given Book from Domain State": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: { },
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
  //       publisher: {
  //         queryType: "extractorCombinerForObjectByRelation",
  //         parentName: "Publisher",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
  //         },
  //         objectReference: {
  //           transformerType: "contextReference",
  //           interpolation: "runtime",
  //           referenceName: "book",
  //         },
  //         AttributeOfObjectToCompareToReferenceUuid: "publisher",
  //       },
  //       booksOfPublisher: { //join with only constant references
  //         queryType: "combinerByRelationReturningObjectList",
  //         parentName: "Book",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         },
  //         objectReference: {
  //           transformerType: "contextReference",
  //           interpolation: "runtime",
  //           referenceName: "publisher",
  //         },
  //         AttributeOfListObjectToCompareToReferenceUuid: "publisher",
  //       },
  //     },
  //     runtimeTransformers: {
  //     },
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
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
  //       publisher: {
  //         queryType: "extractorCombinerForObjectByRelation",
  //         parentName: "Publisher",
  //         parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
  //         objectReference: "book",
  //         AttributeOfObjectToCompareToReferenceUuid: "publisher",
  //       },
  //       booksOfPublisher: { //join with only constant references
  //         queryType: "combinerByRelationReturningObjectList",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         objectReference: "publisher",
  //         AttributeOfListObjectToCompareToReferenceUuid: "publisher",
  //       },
  //     },
  //     runtimeTransformers: {
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult: Object.values({
  //         "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
  //         "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
  //         "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
  //       }),
  //       resultAccessPath: ["elementValue", "booksOfPublisher"],
  //     }
  //   }
  // },
  "select custom-built result: Books of Publisher of given Book from Domain State": {
    extractorTemplate: {
      queryType: "extractorTemplateForRecordOfExtractors",
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
          queryType: "extractorCombinerForObjectByRelation",
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
          queryType: "wrapperReturningObject",
          definition: {
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
              queryType: "queryContextReference",
              queryReference: "booksOfPublisher",
            },
          },
        },
        result2: {
          queryType: "wrapperReturningList",
          definition: [
            { queryType: "queryContextReference", queryReference: "booksOfPublisher" },
            { queryType: "queryContextReference", queryReference: "booksOfPublisher" },
          ],
        },
      },
    },
    extractor: {
      queryType: "extractorForRecordOfExtractors",
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
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
      combiners: {
        publisher: {
          queryType: "extractorCombinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          objectReference: "book",
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: {
          queryType: "combinerByRelationReturningObjectList",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          objectReference: "publisher",
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
        result1: {
          queryType: "wrapperReturningObject",
          definition: {
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
              queryType: "queryContextReference",
              queryReference: "booksOfPublisher",
            },
          },
        },
        result2: {
          queryType: "wrapperReturningList",
          definition: [
            { queryType: "queryContextReference", queryReference: "booksOfPublisher" },
            { queryType: "queryContextReference", queryReference: "booksOfPublisher" },
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
  // "select custom-built result with extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: instances of all Entites from Domain State, indexed by Entity Uuid": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: {},
  //     extractorTemplates: {
  //       entities: {
  //         queryType: "extractorTemplateForObjectListByEntity",
  //         applicationSection: "model",
  //         parentName: "Entity",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         },
  //       },
  //     },
  //     combinerTemplates: {
  //       instancesOfEntities: {
  //         queryType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList", // heteronomous many-to-many join, not possible with SQL
  //         rootExtractorOrReference: "entities",
  //         subQueryTemplate: {
  //           query: {
  //             queryType: "extractorTemplateForObjectListByEntity",
  //             parentUuid: {
  //               transformerType: "parameterReference",
  //               referenceName: "uuid",
  //             },
  //           },
  //           rootQueryObjectTransformer: {
  //             transformerType: "recordOfTransformers",
  //             definition: {
  //               uuid: {
  //                 transformerType: "objectTransformer",
  //                 attributeName: "uuid",
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: { },
  //     extractors: {
  //       entities: {
  //         queryType: "extractorByEntityReturningObjectList",
  //         applicationSection: "model",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //       },
  //     },
  //     combiners: {
  //       instancesOfEntities: {
  //         queryType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList", // heteronomous many-to-many join, possible but akward with SQL (huge "select" clause, dealing with homonym attributes)
  //         rootExtractorOrReference: "entities",
  //         subQueryTemplate: {
  //           query: {
  //             queryType: "extractorTemplateForObjectListByEntity",
  //             parentUuid: {
  //               transformerType: "parameterReference",
  //               referenceName: "uuid",
  //             },
  //           },
  //           rootQueryObjectTransformer: {
  //             transformerType: "recordOfTransformers",
  //             definition: {
  //               uuid: {
  //                 transformerType: "objectTransformer",
  //                 attributeName: "uuid",
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       // expectedResult: domainState[adminConfigurationDeploymentLibrary.uuid]["data"],
  //       expectedResult: 
  //       Object.fromEntries(
  //         Object.entries(domainState[adminConfigurationDeploymentLibrary.uuid]["data"])
  //         .map((e) => [
  //           e[0],
  //           Object.values(e[1])
  //         ])
  //       ),
  //       resultAccessPath: ["elementValue", "instancesOfEntities"],
  //     }
  //   }
  // },
  // "select Unique Publisher Uuids of Books": {
  //   extractorTemplate: {
  //     queryType: "extractorTemplateForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: { },
  //     extractorTemplates: {
  //       books: {
  //         queryType: "extractorTemplateForObjectListByEntity",
  //         parentName: "Book",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         },
  //       },
  //     },
  //     runtimeTransformers: {
  //       publishers: {
  //         transformerType: "unique",
  //         interpolation: "runtime",
  //         referencedExtractor: "books",
  //         attribute: "publisher",
  //       },
  //     },
  //   },
  //   extractor: {
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       elementType: "object",
  //       elementValue: {
  //         applicationSection: {
  //           elementType: "string",
  //           elementValue: "data",
  //         },
  //       },
  //     },
  //     queryParams: { },
  //     extractors: {
  //       books: {
  //         queryType: "extractorByEntityReturningObjectList",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //       },
  //     },
  //     runtimeTransformers: {
  //       publishers: {
  //         transformerType: "unique",
  //         interpolation: "runtime",
  //         referencedExtractor: "books",
  //         attribute: "publisher",
  //       },
  //     },
  //   },
  //   ...testExtractorTools,
  //   testAssertions: {
  //     "test1": {
  //       expectedResult: [
  //         { publisher: "516a7366-39e7-4998-82cb-80199a7fa667" },
  //         { publisher: "c1c97d54-aba8-4599-883a-7fe8f3874095" },
  //         { publisher: "1f550a2a-33f5-4a56-83ee-302701039494" },
  //       ],
  //       resultAccessPath: ["elementValue", "publishers"],
  //     }
  //   }
  // },
};


describe("extractors.unit", () => {
  // ###########################################################################################
  it.each(Object.entries(testExtractorParams))('test %s', (currentTestName, testParams:TestExtractorParams) => {
    console.info("STARTING test:", currentTestName);
    expect(currentTestName != undefined).toBeTruthy();
    expect(testParams.testAssertions).toBeDefined();
    // Testing Extractors
    if (testParams.extractor) {
      // Domain State
      if (testParams.extractorRunnerForDomainState && testParams.getExtractorRunnerParamsForDomainState) {
        const preResult = testParams.extractorRunnerForDomainState(
          domainState,
          getExtractorRunnerParamsForDomainState(testParams.extractor)
        );
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.info(`running extractor for Domain State test assertion: ${currentTestName} ${testAssertionName}`);
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
          getExtractorRunnerParamsForDeploymentEntityState(testParams.extractor)
        );
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.info(`running extractor for DeploymentEntityState test assertion: ${currentTestName} ${testAssertionName}`);
          const result = resolvePathOnObject(preResult, testAssertionParams.resultAccessPath ?? []);
          // console.info(`For test named ${currentTestName} ${testName} result: `, result);
          // console.info(`For test named ${currentTestName} ${testName} expected result: `, testParams.expectedResult);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
    }
    // ################################################################################################
    // Testing Extractor Templates
    if (testParams.extractorTemplate) {
      // Domain State
      if (
        testParams.extractorTemplateRunnerForDomainState &&
        testParams.getExtractorTemplateRunnerParamsForDomainState
      ) {
        const preTemplateResult = testParams.extractorTemplateRunnerForDomainState(
          domainState,
          testParams.getExtractorTemplateRunnerParamsForDomainState(testParams.extractorTemplate)
        ) as any;
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.info(`running extractor Template for DomainState test assertion: ${currentTestName} ${testAssertionName}`);
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
          testParams.getExtractorTemplateRunnerParamsForDeploymentEntityState(testParams.extractorTemplate)
        ) as any;
        for (const [testAssertionName, testAssertionParams] of Object.entries(testParams.testAssertions)) {
          console.info(`running extractor Template for DeploymentEntityState test assertion: ${currentTestName} ${testAssertionName}`);
          const result = resolvePathOnObject(preTemplateResult, testAssertionParams.resultAccessPath ?? []);
          // console.info(`For test named ${currentTestName} ${testName} Template result: `, result);
          // console.info(`For test named ${currentTestName} ${testName} expected Template result: `, testParams.expectedResult);
          expect(result).toEqual(testAssertionParams.expectedResult);
        }
      }
    }

  });
});
