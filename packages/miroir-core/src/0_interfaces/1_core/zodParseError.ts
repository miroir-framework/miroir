import { JzodObject, JzodReference, JzodUnion, zodParseErrorIssue } from "./preprocessor-generated/miroirFundamentalType";

export const zodParseErrorJzodSchema: JzodReference = {
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
        unionErrors: {
          type: "array",
          definition: {
            type: "schemaReference",
            definition: {
              relativePath: "zodParseError",
            },
          },
        },
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
    zodParseErrorIssueInvalidLiteral: {
      type: "object",
      definition: {
        code: { type: "literal", definition: "invalid_literal" },
        expected: { type: "string" },
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
            relativePath: "zodParseErrorIssueInvalidLiteral",
          },
        },
        // {
        //   type: "object",
        //   definition: {
        //     code: { type: "literal", definition: "invalid_literal" },
        //     expected: { type: "string" },
        //     path: {
        //       type: "array",
        //       definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
        //     },
        //     message: { type: "string" },
        //   },
        // },
        {
          type: "object",
          definition: {
            code: { type: "literal", definition: "invalid_type" },
            expected: { type: "string" },
            received: { type: "string" },
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

export const zodParseErrorIssueJzodSchema: JzodReference = {
  ...zodParseErrorJzodSchema,
  definition: {
    relativePath: "zodParseErrorIssue",
  }
}