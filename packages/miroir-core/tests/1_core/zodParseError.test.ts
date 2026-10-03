import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { describe, it, expect } from "vitest";

import { mlToZod } from "../../src/1_core/mls/mlJzodAdapter";

import {
  coreTransformerForBuildPlusRuntime,
  transformerDefinition,
  ZodParseError,
  zodParseError,
  ZodParseErrorIssue,
  zodParseErrorIssue,
  ZodParseErrorIssueInvalidUnion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


import { zodParseErrorMlSchema } from "../../src/0_interfaces/1_core/zodParseError";
import { zodErrorDeepestIssueLeaves, zodErrorFirstIssueLeaf } from "../../src/1_core/mls/zodParseErrorHandler";

// A real zod 4 parse error: a TransformerDefinition asset whose library implementation names its function with a number.
// Its issues use the four codes the zodParseError schema describes.
function zodParseErrorExample(): ZodParseError {
  const transformerDefinitionsDir = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../miroir-app-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8"
  );
  const asset = JSON.parse(readFileSync(join(transformerDefinitionsDir, readdirSync(transformerDefinitionsDir).sort()[0]), "utf8"));
  const result = transformerDefinition.safeParse({
    ...asset,
    transformerImplementation: { transformerImplementationType: "libraryImplementation", inMemoryImplementationFunctionName: 3 },
  });
  expect(result.success).toBe(false);
  return JSON.parse(JSON.stringify({ name: result.error!.name, issues: result.error!.issues }));
}

describe("zodParseError", () => {
  it("zodParseError type parses actual Zod parse error example", () => {
    const example = zodParseErrorExample();
    const unionIssue = example.issues[0] as ZodParseErrorIssueInvalidUnion;
    expect(unionIssue.code).toBe("invalid_union");
    for (const branch of unionIssue.errors) {
      z.array(zodParseErrorIssue).parse(branch);
    }
    z.array(zodParseErrorIssue).parse(example.issues);
    zodParseError.parse(example);
  });

  it("zodParseError type parses actual error", () => {
    const zodParseErrorZodSchema = mlToZod(zodParseErrorMlSchema);
    zodParseErrorZodSchema.parse(zodParseErrorExample());
  });

  describe("zodErrorFirstIssueLeaf", () => {
    it("should return undefined when the error has no issues", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: []
      };
      expect(zodErrorFirstIssueLeaf(error)).toBeUndefined();
    });

    it("should return the first issue when it's not an invalid_union", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            path: ["some", "path"],
            message: "Invalid input: expected string, received number"
          }
        ]
      };
      expect(zodErrorFirstIssueLeaf(error)).toEqual(error.issues[0]);
    });

    it("should recursively find the first leaf issue in a union error, with its absolute path", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: ["root"],
            message: "Invalid input",
            errors: [
              [
                {
                  code: "invalid_type",
                  expected: "boolean",
                  path: ["nested", "field"],
                  message: "Invalid input: expected boolean, received string"
                }
              ]
            ]
          }
        ]
      };
      expect(zodErrorFirstIssueLeaf(error)).toEqual({
        code: "invalid_type",
        expected: "boolean",
        path: ["root", "nested", "field"],
        message: "Invalid input: expected boolean, received string",
      });
    });

    it("should return the issue itself if it's an invalid_union with no branch errors", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: ["kind"],
            errors: [],
            note: "No matching discriminator",
            discriminator: "kind",
            message: "Invalid input"
          }
        ]
      };
      expect(zodErrorFirstIssueLeaf(error)).toEqual(error.issues[0]);
    });

    it("should handle deeply nested union errors", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: [],
            message: "Invalid input",
            errors: [
              [
                {
                  code: "invalid_union",
                  path: ["deeper"],
                  message: "Invalid input",
                  errors: [
                    [
                      {
                        code: "invalid_type",
                        expected: "string",
                        path: ["deepest", "field"],
                        message: "Invalid input: expected string, received number"
                      }
                    ]
                  ]
                }
              ]
            ]
          }
        ]
      };
      expect(zodErrorFirstIssueLeaf(error)?.path).toEqual(["deeper", "deepest", "field"]);
    });

    it("should handle real world zodParseErrorExample", () => {
      const result = zodErrorFirstIssueLeaf(zodParseErrorExample());
      expect(result).toBeDefined();
      expect(result!.code).toBeDefined();
      expect(result!.path).toBeDefined();
      expect(result!.message).toBeDefined();
    });
  });


  describe("zodErrorDeepestIssueLeaves", () => {
    it("should return empty array when there are no issues", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: []
      };
      expect(zodErrorDeepestIssueLeaves(error)).toEqual({ depth: 0, issues: [] });
    });

    it("should find the deepest issue based on path length", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            path: ["a"],
            message: "Error 1"
          },
          {
            code: "invalid_type",
            expected: "boolean",
            path: ["a", "b", "c"],
            message: "Error 2"
          },
          {
            code: "invalid_type",
            expected: "number",
            path: ["a", "b"],
            message: "Error 3"
          }
        ]
      };
      expect(zodErrorDeepestIssueLeaves(error)).toEqual({
        depth: 3,
        issues: [error.issues[1]]
      });
    });

    it("should collect multiple issues at the same deepest level", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            path: ["a", "b", "c"],
            message: "Error 1"
          },
          {
            code: "invalid_type",
            expected: "boolean",
            path: ["x", "y", "z"],
            message: "Error 2"
          }
        ]
      };
      expect(zodErrorDeepestIssueLeaves(error)).toEqual({
        depth: 3,
        issues: [error.issues[0], error.issues[1]]
      });
    });

    it("should handle union errors and find the deepest issues", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: ["x"],
            message: "Union error",
            errors: [
              [
                {
                  code: "invalid_type",
                  expected: "boolean",
                  path: ["a"],
                  message: "Error in union"
                }
              ],
              [
                {
                  code: "invalid_type",
                  expected: "string",
                  path: ["a", "b", "c"],
                  message: "Deep error"
                }
              ]
            ]
          } as ZodParseErrorIssueInvalidUnion,
          {
            code: "invalid_type",
            expected: "string",
            path: ["p", "q"],
            message: "Error outside union"
          }
        ]
      };

      expect(zodErrorDeepestIssueLeaves(error)).toEqual({
        depth: 4,
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            path: ["x", "a", "b", "c"],
            message: "Deep error"
          }
        ]
      });
    });

    it("should handle nested union errors", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: [],
            message: "Outer union",
            errors: [
              [
                {
                  code: "invalid_union",
                  path: ["nested"],
                  message: "Inner union",
                  errors: [
                    [
                      {
                        code: "invalid_type",
                        expected: "string",
                        path: ["deep", "path"],
                        message: "Deepest error"
                      }
                    ]
                  ]
                } as ZodParseErrorIssueInvalidUnion
              ]
            ]
          } as ZodParseErrorIssueInvalidUnion
        ]
      };

      expect(zodErrorDeepestIssueLeaves(error)).toEqual({
        depth: 3,
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            path: ["nested", "deep", "path"],
            message: "Deepest error"
          }
        ]
      });
    });

    it("should handle multiple union paths with same depth", () => {
      const issue1: ZodParseErrorIssue = {
        code: "invalid_type",
        expected: "string",
        path: ["a", "b", "c"],
        message: "Error 1"
      };

      const issue2: ZodParseErrorIssue = {
        code: "invalid_type",
        expected: "boolean",
        path: ["x", "y", "z"],
        message: "Error 2"
      };

      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: [],
            message: "Union error",
            errors: [[issue1], [issue2]]
          } as ZodParseErrorIssueInvalidUnion
        ]
      };

      expect(zodErrorDeepestIssueLeaves(error)).toEqual({
        depth: 3,
        issues: [issue1, issue2]
      });
    });

    describe("real world zodParseErrorExample", () => {
      it("should clenan-up error on parsing TransformerForBuild", () => {
        const zodSchema = coreTransformerForBuildPlusRuntime;
        const transformer = {
          transformerType: "not_existing"
        };
        let zodParseError: ZodParseError | undefined = undefined;
        try {
          zodSchema.parse(transformer);
          expect(true).toBe(true); // Pass the test if parsing does not throw an error
        } catch (error) {
          zodParseError = error as ZodParseError;
        }
        expect(zodParseError).toBeDefined();
        if (!zodParseError) {
          throw new Error("zodParseError is undefined, test should not have reached this point");
        }
        const issueLeaves = zodErrorDeepestIssueLeaves(zodParseError);
        expect(issueLeaves).toEqual({
          depth: 1,
          issues: [
            {
              code: "custom",
              message: "Object must not contain 'transformerType'",
              path: ["transformerType"],
            },
          ],
        });
      });
    });
  });
});
