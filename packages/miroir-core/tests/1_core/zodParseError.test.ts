import { z } from "zod";
import { describe } from "vitest";

import { jzodToZod } from "@miroir-framework/jzod";
// import { zodSchemaToTsTypeText } from "@miroir-framework/jzod-ts";

import {
  transformerForBuild,
  ZodParseError,
  zodParseError,
  ZodParseErrorIssue,
  zodParseErrorIssue,
  ZodParseErrorIssueInvalidUnion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// import test_createEntityAndReportFromSpreadsheetAndUpdateMenu from "../../src/assets/miroir_data/c37625c7-0b35-4d6a-811d-8181eb978301/ffe6ab3c-8296-4293-8aaf-ebbad1f0ac9a.json";

import { zodParseErrorJzodSchema } from "../../src/0_interfaces/1_core/zodParseError";
import zodParseErrorExample from "./zodParseErrorExample.json";
import { zodErrorDeepestIssueLeaves, zodErrorFirstIssueLeaf } from "../../src/1_core/zodParseErrorHandler";

describe("zodParseError", () => {
  it("zodParseError type parses actual Zod parse error example", () => {
    zodParseErrorIssue.parse(zodParseErrorExample.issues[0].unionErrors[0].issues[0]);
    zodParseErrorIssue.parse(zodParseErrorExample.issues[0].unionErrors[0].issues[1]);
    zodParseErrorIssue.parse(zodParseErrorExample.issues[0].unionErrors[0].issues[2]);
    zodParseErrorIssue.parse(zodParseErrorExample.issues[0].unionErrors[0].issues[3]);
    // console.log(
    //   "zodParseErrorExample.issues[0].unionErrors[0].issues[4]",
    //   JSON.stringify(zodParseErrorExample.issues[0].unionErrors[0].issues[4], null, 2)
    // );
    zodParseErrorIssue.parse(zodParseErrorExample.issues[0].unionErrors[0].issues[4]);
    z.array(zodParseErrorIssue).parse(zodParseErrorExample.issues[0].unionErrors[0].issues);
    z.array(zodParseError).parse(zodParseErrorExample.issues[0].unionErrors);
    z.array(zodParseErrorIssue).parse(zodParseErrorExample.issues);
    zodParseError.parse(zodParseErrorExample);
  });

  it("zodParseError type parses actual error", () => {
    const zodParseErrorZodSchema = jzodToZod(zodParseErrorJzodSchema as any);
    zodParseErrorZodSchema.parse(zodParseErrorExample);
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
            received: "number",
            path: ["some", "path"],
            message: "Expected string, received number"
          }
        ]
      };
      expect(zodErrorFirstIssueLeaf(error)).toEqual(error.issues[0]);
    });
  
    it("should recursively find the first leaf issue in a union error", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: [],
            message: "Invalid input",
            unionErrors: [
              {
                name: "ZodError",
                issues: [
                  {
                    code: "invalid_type",
                    expected: "boolean",
                    received: "string",
                    path: ["nested", "field"],
                    message: "Expected boolean, received string"
                  }
                ]
              }
            ]
          }
        ]
      };
      expect(zodErrorFirstIssueLeaf(error)).toEqual((error.issues[0] as any).unionErrors[0].issues[0]);
    });
  
    it("should return the issue itself if it's an invalid_union with no unionErrors", () => {
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: [],
            unionErrors: [],
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
            unionErrors: [
              {
                name: "ZodError",
                issues: [
                  {
                    code: "invalid_union",
                    path: ["deeper"],
                    message: "Invalid input",
                    unionErrors: [
                      {
                        name: "ZodError",
                        issues: [
                          {
                            code: "invalid_type",
                            expected: "string",
                            received: "number",
                            path: ["deepest", "field"],
                            message: "Expected string, received number"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
      expect(zodErrorFirstIssueLeaf(error)).toEqual(
        (
          (error.issues[0] as ZodParseErrorIssueInvalidUnion).unionErrors[0]
            .issues[0] as ZodParseErrorIssueInvalidUnion
        ).unionErrors![0].issues[0]
      );
    });

    it("should handle real world zodParseErrorExample", () => {
      const result = zodErrorFirstIssueLeaf(zodParseErrorExample as ZodParseError);
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
            received: "number",
            path: ["a"],
            message: "Error 1"
          },
          {
            code: "invalid_type",
            expected: "boolean",
            received: "string",
            path: ["a", "b", "c"],
            message: "Error 2"
          },
          {
            code: "invalid_type",
            expected: "number",
            received: "string",
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
            received: "number",
            path: ["a", "b", "c"],
            message: "Error 1"
          },
          {
            code: "invalid_type",
            expected: "boolean",
            received: "string",
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
      const deepIssue: ZodParseErrorIssue = {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["a", "b", "c", "d"],
        message: "Deep error"
      };
      
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: ["x"],
            message: "Union error",
            unionErrors: [
              {
                name: "ZodError",
                issues: [
                  {
                    code: "invalid_type",
                    expected: "boolean",
                    received: "string",
                    path: ["a", "b"],
                    message: "Error in union"
                  }
                ]
              },
              {
                name: "ZodError",
                issues: [deepIssue]
              }
            ]
          } as ZodParseErrorIssueInvalidUnion,
          {
            code: "invalid_type",
            expected: "string",
            received: "number",
            path: ["p", "q"],
            message: "Error outside union"
          }
        ]
      };
      
      expect(zodErrorDeepestIssueLeaves(error)).toEqual({
        depth: 4,
        issues: [deepIssue]
      });
    });
  
    it("should handle nested union errors", () => {
      const deepestIssue: ZodParseErrorIssue = {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["deep", "path", "here"],
        message: "Deepest error"
      };
      
      const error: ZodParseError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_union",
            path: [],
            message: "Outer union",
            unionErrors: [
              {
                name: "ZodError",
                issues: [
                  {
                    code: "invalid_union",
                    path: ["nested"],
                    message: "Inner union",
                    unionErrors: [
                      {
                        name: "ZodError",
                        issues: [deepestIssue]
                      }
                    ]
                  } as ZodParseErrorIssueInvalidUnion
                ]
              }
            ]
          } as ZodParseErrorIssueInvalidUnion
        ]
      };
      
      expect(zodErrorDeepestIssueLeaves(error)).toEqual({
        depth: 3,
        issues: [deepestIssue]
      });
    });
  
    it("should handle multiple union paths with same depth", () => {
      const issue1: ZodParseErrorIssue = {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["a", "b", "c"],
        message: "Error 1"
      };
      
      const issue2: ZodParseErrorIssue = {
        code: "invalid_type",
        expected: "boolean", 
        received: "string",
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
            unionErrors: [
              {
                name: "ZodError",
                issues: [issue1]
              },
              {
                name: "ZodError",
                issues: [issue2]
              }
            ]
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
        const zodSchema = transformerForBuild;
        const transformer = "model"; //conceptLevel as a string, not a full-blown object
        // test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        //     "create new Entity and reports from spreadsheet"
        //   ].compositeAction.templates.newEntityListReport.definition.conceptLevel
        let zodParseError: ZodParseError | undefined = undefined;
        try {
          zodSchema.parse(transformer);
          expect(true).toBe(true); // Pass the test if parsing does not throw an error
        } catch (error) {
          // const zodParseError = error as ZodError;
          zodParseError = error as ZodParseError;
        }
        expect(zodParseError).toBeDefined();
        if (!zodParseError) {
          throw new Error("zodParseError is undefined, test should not have reached this point");
        }
        const issueLeaves = zodErrorDeepestIssueLeaves(zodParseError);
        console.error("Zod parse error :", JSON.stringify(zodErrorDeepestIssueLeaves(zodParseError), null, 2));
        expect(issueLeaves).toEqual({
          depth: 0,
          issues: [
            {
              code: "invalid_type",
              expected: "object",
              received: "string",
              path: [],
              message: "Expected object, received string",
            },
          ],
        });
      });
    });
  });
});