import { JzodReference } from "../1_core/preprocessor-generated/miroirFundamentalType";

export const testSuitesResultsSchema: JzodReference = {
  type: "schemaReference",
  context: {
    testAssertionResult: {
      type: "object",
      definition: {
        assertionName: {
          type: "string",
          // description: "The name of the assertion",
        },
        assertionResult: {
          type: "enum",
          // description: "The result of the assertion",
          definition: ["ok", "error"],
        },
        assertionExpectedValue: {
          type: "any",
          // description: "The expected value of the assertion",
        },
        assertionActualValue: {
          type: "any",
          // description: "The actual value of the assertion",
        },
      },
    },
    testAssertionsResults: {
      type: "record",
      definition: {
        type: "schemaReference",
        definition: {
          relativePath: "testAssertionResult",
        },
      },
    },
    testResult: {
      type: "object",
      definition: {
        testLabel: {
          type: "string",
          // description: "The label of the test",
        },
        testResult: {
          type: "enum",
          // description: "The result of the test",
          definition: ["ok", "error"],
        },
        testAssertionsResults: {
          // description: "The results of the assertions of the test",
          type: "schemaReference",
          definition: {
            relativePath: "testAssertionsResults",
          },
        },
      },
    },
    testsResults: {
      type: "record",
      definition: {
        type: "schemaReference",
        definition: {
          relativePath: "testResult",
        },
      },
    },
    testSuiteResult: {
      type: "record",
      definition: {
        type: "schemaReference",
        definition: {
          relativePath: "testsResults",
        },
      },
    },
    innerTestSuitesResults: {
      type: "record",
      definition: {
        type: "schemaReference",
        definition: {
          relativePath: "testSuiteResult",
        },
      },
    },
  },
  definition: {
    relativePath: "innerTestSuitesResults",
  },
};
