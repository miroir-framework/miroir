import { MlObject, MlReference, MlUnion, zodParseErrorIssue } from "./preprocessor-generated/miroirFundamentalType";

export const zodParseErrorMlSchema: MlReference = {
  type: "schemaReference",
  context: {
    zodParseErrorIssueInvalidUnion: {
      type: "object",
      definition: {
        code: { type: "literal", definition: "invalid_union" },
        path: {
          type: "array",
          definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
        },
        message: { type: "string" },
        // the issues of each union branch, with paths relative to this issue's path
        errors: {
          type: "array",
          definition: {
            type: "array",
            definition: {
              type: "schemaReference",
              definition: {
                relativePath: "zodParseErrorIssue",
              },
            },
          },
        },
        note: { type: "string", optional: true },
        discriminator: { type: "string", optional: true },
      },
    },
    zodParseErrorIssueUnrecognizedKeys: {
      type: "object",
      definition: {
        code: { type: "literal", definition: "unrecognized_keys" },
        keys: { type: "array", definition: { type: "string" } },
        path: {
          type: "array",
          definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
        },
        message: { type: "string" },
      },
    },
    zodParseErrorIssueInvalidValue: {
      type: "object",
      definition: {
        code: { type: "literal", definition: "invalid_value" },
        values: { type: "array", definition: { type: "any" } },
        path: {
          type: "array",
          definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
        },
        message: { type: "string" },
      },
    },
    zodParseErrorIssue: {
      type: "union",
      discriminator: "code",
      definition: [
        {
          type: "schemaReference",
          definition: {
            relativePath: "zodParseErrorIssueInvalidUnion",
          },
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "zodParseErrorIssueUnrecognizedKeys",
          },
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "zodParseErrorIssueInvalidValue",
          },
        },
        {
          type: "object",
          definition: {
            code: { type: "literal", definition: "invalid_type" },
            expected: { type: "string" },
            path: {
              type: "array",
              definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
            },
            message: { type: "string" },
          },
        },
      ],
    },
    zodParseError: {
      type: "object",
      definition: {
        name: { type: "literal", definition: "ZodError" },
        issues: {
          type: "array",
          definition: {
            type: "schemaReference",
            definition: { relativePath: "zodParseErrorIssue" },
          },
        },
      },
    },
  },
  definition: {
    relativePath: "zodParseError",
  },
};

export const zodParseErrorIssueMlSchema: MlReference = {
  ...zodParseErrorMlSchema,
  definition: {
    relativePath: "zodParseErrorIssue",
  }
}