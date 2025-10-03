import { JzodReference, type JzodElement } from "../1_core/preprocessor-generated/miroirFundamentalType";

export const testAssertionResult: JzodElement = {
  type: "object",
  definition: {
    assertionName: {
      type: "string",
      description: "The name of the assertion",
    },
    assertionResult: {
      type: "enum",
      description: "The result of the assertion",
      definition: ["ok", "error", "skipped"],
    },
    assertionExpectedValue: {
      type: "any",
      description: "The expected value of the assertion",
    },
    assertionActualValue: {
      type: "any",
      description: "The actual value of the assertion",
    },
  },
};
export const testAssertionsResults: JzodElement = {
  type: "record",
  definition: {
    type: "schemaReference",
    definition: {
      relativePath: "testAssertionResult",
    },
  },
};

export const testResult: JzodElement = {
  type: "object",
  definition: {
    testLabel: {
      type: "string",
      // description: "The label of the test",
    },
    testResult: {
      type: "enum",
      // description: "The result of the test",
      definition: ["ok", "error", "skipped"],
    },
    testAssertionsResults: {
      // description: "The results of the assertions of the test",
      type: "schemaReference",
      definition: {
        relativePath: "testAssertionsResults",
      },
    },
  },
};

export const testsResults: JzodElement = {
  type: "record",
  definition: {
    type: "schemaReference",
    definition: {
      relativePath: "testResult",
    },
  },
};

export const innerTestSuitesResults: JzodElement = {
  type: "record",
  definition: {
    type: "schemaReference",
    definition: {
      relativePath: "testSuiteResult",
    },
  },
};

export const testSuiteResult: JzodElement = {
  type: "object",
  definition: {
    testsResults: {
      type: "schemaReference",
      optional: true,
      definition: { relativePath: "testsResults" },
    },
    testsSuiteResults: {
      type: "schemaReference",
      optional: true,
      definition: { relativePath: "innerTestSuitesResults" },
    },
  },
};


export const testSuitesResults: JzodReference = {
  type: "schemaReference",
  context: {
    testAssertionResult,
    testAssertionsResults,
    testResult,
    testsResults,
    testSuiteResult,
    innerTestSuitesResults,
  },
  definition: {
    relativePath: "innerTestSuitesResults",
    // relativePath: "testSuiteResult",
  },
};
