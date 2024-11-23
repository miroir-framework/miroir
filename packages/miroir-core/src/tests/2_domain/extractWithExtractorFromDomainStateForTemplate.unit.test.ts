import adminConfigurationDeploymentLibrary from "../../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

import { DomainState } from "../../0_interfaces/2_domain/DomainControllerInterface";

import {
  DomainElement,
  ExtractorForDomainModelObjects,
  ExtractorForRecordOfExtractors,
  ExtractorTemplateForRecordOfExtractors
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { SyncExtractorRunner } from "../../0_interfaces/2_domain/ExtractorRunnerInterface";
import { extractWithExtractorFromDomainState, getSelectorParams } from "../../2_domain/DomainStateQuerySelectors";
import {
  ExtractWithExtractorFromDomainStateForTemplate,
  extractWithExtractorFromDomainStateForTemplate,
  getSelectorParamsForTemplateOnDomainState
} from "../../2_domain/DomainStateQueryTemplateSelector";
import { resolvePathOnObject } from "../../tools";
import domainStateImport from "./domainState.json";

const domainState: DomainState = domainStateImport as DomainState;

export interface TestExtractorParams {
  queryTemplateParam?: ExtractorTemplateForRecordOfExtractors;
  queryTemplateFunction?: ExtractWithExtractorFromDomainStateForTemplate;
  queryParam?: ExtractorForRecordOfExtractors;
  queryFunction?: SyncExtractorRunner<
    ExtractorForDomainModelObjects | ExtractorForRecordOfExtractors,
    DomainState,
    DomainElement
  >;
  // queryFunction?: (
  //   domainState: DomainState,
  //   extractorAndParams: SyncExtractorRunnerParams<
  //     ExtractorForRecordOfExtractors | ExtractorForDomainModelObjects,
  //     DomainState
  //   >
  // ) => DomainElement;
  testsOnResult: Record<
    string,
    {
      resultAccessPath?: string[];
      expectedResult: any;
    }
  >;
}

const testExtractorParams: Record<string, TestExtractorParams> = {
  // ###########################################################################################
  "error on non-existing Entity: EntityNotFound": {
    queryTemplateParam: {
      queryType: "extractorTemplateForRecordOfExtractors",
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam:{
      queryType: "extractorForRecordOfExtractors",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: { },
      queryParams: { },
      extractors: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "XXXXXX",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
        },
      },
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
    queryTemplateParam: {
      queryType: "extractorTemplateForRecordOfExtractors",
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
      queryType: "extractorForRecordOfExtractors",
      "deploymentUuid": adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: { },
      queryParams: { },
      "extractors": {
        "book": {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "XXXXXXXXX"
        }
      }
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
    queryTemplateParam: {
      queryType: "extractorTemplateForRecordOfExtractors",
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
      queryType: "extractorForRecordOfExtractors",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
      extractors: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
  "select 1 object from Domain State using context reference": {
    queryTemplateParam: {
      queryType: "extractorTemplateForRecordOfExtractors",
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
        book2: {
          queryType: "queryContextReference",
          queryReference: "book",
        },
      },
    },
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
      queryType: "extractorForRecordOfExtractors",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: { },
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
        book2: {
          queryType: "queryContextReference",
          queryReference: "book",
        },
      },
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
      "test1": {
        expectedResult:
        domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"][
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
        ],
        resultAccessPath: ["elementValue", "book2"],
      }
    }
  },
  "select 1 object from Domain State using direct query parameter reference": {
    queryTemplateParam: {
      queryType: "extractorTemplateForRecordOfExtractors",
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
      queryType: "extractorForRecordOfExtractors",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: { },
      pageParams: { },
      queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
      extractors: {
        book: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        }
      },
      runtimeTransformers: {
      },
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
    queryTemplateParam: {
      queryType: "extractorTemplateForRecordOfExtractors",
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
      queryType: "extractorForRecordOfExtractors",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      contextResults: {},
      pageParams: {},
      queryParams: {},
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
          queryType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          objectReference: "book",
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
      },
      runtimeTransformers: {
      },
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
    queryTemplateParam: {
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
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
        authors: {
          queryType: "extractorForObjectListByEntity",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
        },
      },
      runtimeTransformers: {
      },
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
    queryTemplateParam: {
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
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
        authors: {
          queryType: "extractorForObjectListByEntity",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          filter: {
            attributeName: "name",
            value: "or",
          },
        },
      },
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
    queryTemplateParam: {
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
          queryType: "combinerForObjectListByRelation",
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
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
          queryType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          objectReference: "book",
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: { //join with only constant references
          queryType: "combinerForObjectListByRelation",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          objectReference: "publisher",
          AttributeOfListObjectToCompareToReferenceUuid: "publisher",
        },
      },
      runtimeTransformers: {
      },
    },
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
    queryTemplateParam: {
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
          queryType: "combinerForObjectListByRelation",
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
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
          queryType: "combinerForObjectByRelation",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          objectReference: "book",
          AttributeOfObjectToCompareToReferenceUuid: "publisher",
        },
        booksOfPublisher: {
          queryType: "combinerForObjectListByRelation",
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
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
  "select custom-built result with queryCombiner: instances of all Entites from Domain State, indexed by Entity Uuid": {
    queryTemplateParam: {
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
          queryType: "queryCombiner", // heteronomous many-to-many join, not possible with SQL
          rootExtractorOrReference: {
            queryType: "queryContextReference",
            queryReference: "entities",
          },
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
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
        entities: {
          queryType: "extractorForObjectListByEntity",
          applicationSection: "model",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        },
      },
      combiners: {
        instancesOfEntities: {
          queryType: "queryCombiner", // heteronomous many-to-many join, possible but akward with SQL (huge "select" clause, dealing with homonym attributes)
          rootExtractorOrReference: {
            queryType: "queryContextReference",
            queryReference: "entities",
          },
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
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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
    queryTemplateParam: {
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
    queryTemplateFunction: extractWithExtractorFromDomainStateForTemplate,
    queryParam: {
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
        books: {
          queryType: "extractorForObjectListByEntity",
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
    queryFunction: extractWithExtractorFromDomainState,
    testsOnResult: {
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


describe("extractWithExtractorFromDomainStateForTemplate.unit", () => {
  // ###########################################################################################
  it.each(Object.entries(testExtractorParams))('test %s', (currentTestName, testParams:TestExtractorParams) => {
    console.info("STARTING test:", currentTestName);
    expect(currentTestName != undefined).toBeTruthy();
    expect(testExtractorParams[currentTestName] !== undefined).toBeTruthy();
    expect(testExtractorParams[currentTestName].queryTemplateParam).toBeDefined();
    expect(testExtractorParams[currentTestName].testsOnResult).toBeDefined();
    if (testExtractorParams[currentTestName].queryTemplateParam && testExtractorParams[currentTestName].queryTemplateFunction) {
      const queryTemplateParam: ExtractorTemplateForRecordOfExtractors = testParams.queryTemplateParam as any;
      const queryTemplateFunction: ExtractWithExtractorFromDomainStateForTemplate = testParams.queryTemplateFunction as any;
      const preTemplateResult = queryTemplateFunction(
        domainState,
        getSelectorParamsForTemplateOnDomainState(queryTemplateParam)
      ) as any;
      for (const [testName, testParams] of Object.entries(testExtractorParams[currentTestName].testsOnResult)) {
        console.info(`running extractor Template test named: ${currentTestName} ${testName}`);
        const result = resolvePathOnObject(preTemplateResult, testParams.resultAccessPath ?? []);
        // console.info(`For test named ${currentTestName} ${testName} Template result: `, result);
        // console.info(`For test named ${currentTestName} ${testName} expected Template result: `, testParams.expectedResult);
        expect(result).toEqual(testParams.expectedResult);
      }
    }

    if (testExtractorParams[currentTestName].queryParam && testExtractorParams[currentTestName].queryFunction) {
      const queryParam: ExtractorForRecordOfExtractors = testParams.queryParam as any;
      const queryFunction: SyncExtractorRunner<
      ExtractorForDomainModelObjects | ExtractorForRecordOfExtractors,
      DomainState,
      DomainElement > = testParams.queryFunction as any;
      const preResult = queryFunction(
        domainState,
        getSelectorParams(queryParam)
      );
      for (const [testName, testParams] of Object.entries(testExtractorParams[currentTestName].testsOnResult)) {
        console.info(`running extractor test named: ${currentTestName} ${testName}`);
        const result = resolvePathOnObject(preResult, testParams.resultAccessPath ?? []);
        // console.info(`For test named ${currentTestName} ${testName} result: `, result);
        // console.info(`For test named ${currentTestName} ${testName} expected result: `, testParams.expectedResult);
        expect(result).toEqual(testParams.expectedResult);
      }
    }
  });
});
