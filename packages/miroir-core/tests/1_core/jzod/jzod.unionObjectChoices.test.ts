import { describe, it, expect } from 'vitest';
import type {
  JzodElement,
  JzodObject,
  JzodReference,
  JzodSchema,
  JzodUnion,
  MetaModel,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
// } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
// import { unionChoices } from "./JzodUnfoldSchemaForValue";
import currentModel from "../currentModel.json";
import currentMiroirModel from "../currentMiroirModel.json";
import {
  unionObjectChoices,
} from "../../../src/1_core/jzod/jzodTypeCheck";
import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import { resolveJzodSchemaReferenceInContext } from '../../../src/1_core/jzod/jzodResolveSchemaReferenceInContext';

// Minimal mocks for MetaModel and JzodSchema
const mockMetaModel: MetaModel = {} as MetaModel;
const mockJzodSchema: JzodSchema = {
  uuid: "mock",
  definition: { context: {} }
} as JzodSchema;

describe("unionObjectChoices", () => {
  it("returns only object types from a flat union", () => {
    const obj1: JzodObject = { type: "object", definition: { a: { type: "string" } } };
    const obj2: JzodObject = { type: "object", definition: { b: { type: "number" } } };
    const union: JzodUnion = { type: "union", definition: [obj1, obj2, { type: "string" }] };

    const result = unionObjectChoices(
      union.definition,
      mockJzodSchema,
      mockMetaModel,
      mockMetaModel,
      {}
    );
    expect(result).toEqual([obj1, obj2]);
  });

  // ##############################################################################################
  // TODO: why this test? the ObjectUnionChoices function does not resolve schemaReferences, it only acts on unrolled unions, it is call after jzodUnion_recursivelyUnfold
  // it("resolves schemaReferences (with relativePath) in unions", () => {
  //   // Simulate a schemaReference to an object
  //   const referencedObj: JzodObject = { type: "object", definition: { d: { type: "string" } } };
  //   const schemaReference: JzodReference = {
  //     type: "schemaReference",
  //     // definition: { absolutePath: "mock", relativePath: "refObj" },
  //     definition: { relativePath: "refObj" },
  //     context: {}
  //   };
  //   const union: JzodUnion = { type: "union", definition: [schemaReference, { type: "string" }] };

  //   // Patch resolveJzodSchemaReferenceInContext to return referencedObj
  //   // const original = resolveJzodSchemaReferenceInContext;
  //   // (globalThis as any).resolveJzodSchemaReferenceInContext = () => referencedObj;

  //   const result = unionObjectChoices(
  //     union.definition,
  //     mockJzodSchema,
  //     mockMetaModel,
  //     mockMetaModel,
  //     { refObj: referencedObj }
  //   );
  //   expect(result).toEqual([referencedObj]);

  //   // Restore original
  //   // (globalThis as any).resolveJzodSchemaReferenceInContext = original;
  // });

  // ##############################################################################################
  it("flattens nested unions and returns all object types", () => {
    const obj1: JzodObject = { type: "object", definition: { a: { type: "string" } } };
    const obj2: JzodObject = { type: "object", definition: { b: { type: "number" } } };
    const obj3: JzodObject = { type: "object", definition: { c: { type: "boolean" } } };
    const nestedUnion: JzodUnion = { type: "union", definition: [obj2, obj3] };
    const union: JzodUnion = { type: "union", definition: [obj1, nestedUnion, { type: "string" }] };

    const result = unionObjectChoices(
      union.definition,
      mockJzodSchema,
      mockMetaModel,
      mockMetaModel,
      {}
    );
    expect(result).toEqual([obj1, obj2, obj3]);
  });

  // // ##############################################################################################
  // it("resolves schemaReferences in nested unions", () => {
  //   // Simulate a schemaReference to an object
  //   const referencedObj: JzodObject = { type: "object", definition: { d: { type: "string" } } };
  //   const schemaReference: JzodReference = {
  //     type: "schemaReference",
  //     definition: { absolutePath: "mock", relativePath: "refObj" },
  //     context: {}
  //   };
  //   const nestedUnion: JzodUnion = { type: "union", definition: [schemaReference] };
  //   const union: JzodUnion = { type: "union", definition: [nestedUnion] };

  //   // Patch resolveJzodSchemaReferenceInContext to return referencedObj
  //   // const { resolveJzodSchemaReferenceInContext } = await import("./JzodUnfoldSchemaForValue");
  //   // const original = resolveJzodSchemaReferenceInContext;
  //   // (globalThis as any).resolveJzodSchemaReferenceInContext = () => referencedObj;

  //   const result = unionChoices(
  //     union.definition,
  //     mockJzodSchema,
  //     mockMetaModel,
  //     mockMetaModel,
  //     { refObj: referencedObj }
  //   );
  //   expect(result).toEqual([referencedObj]);

  //   // Restore original
  //   // (globalThis as any).resolveJzodSchemaReferenceInContext = original;
  // });

  // ##############################################################################################
  it("returns empty array if no object types are present", () => {
    const union: JzodUnion = { type: "union", definition: [{ type: "string" }, { type: "number" }] };
    const result = unionObjectChoices(
      union.definition,
      mockJzodSchema,
      mockMetaModel,
      mockMetaModel,
      {}
    );
    expect(result).toEqual([]);
  });

  // // ##############################################################################################
  // it("choices for Test instance", () => {
  //   // const currentReportTargetEntityDefinition: JzodElement = {
  //   const currentReportTargetEntityDefinition = {
  //     type: "object",
  //     definition: {
  //       uuid: {
  //         type: "string",
  //         validations: [
  //           {
  //             type: "uuid",
  //           },
  //         ],
  //         tag: {
  //           value: {
  //             id: 1,
  //             defaultLabel: "Uuid",
  //             editable: false,
  //           },
  //         },
  //       },
  //       parentName: {
  //         type: "string",
  //         optional: true,
  //         tag: {
  //           value: {
  //             id: 1,
  //             defaultLabel: "Uuid",
  //             editable: false,
  //           },
  //         },
  //       },
  //       parentUuid: {
  //         type: "string",
  //         validations: [
  //           {
  //             type: "uuid",
  //           },
  //         ],
  //         tag: {
  //           value: {
  //             id: 1,
  //             defaultLabel: "parentUuid",
  //             editable: false,
  //           },
  //         },
  //       },
  //       definition: {
  //         type: "object",
  //         definition: {
  //           testCompositeActions: {
  //             type: "record",
  //             optional: true,
  //             definition: {
  //               type: "schemaReference",
  //               definition: {
  //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                 relativePath: "testCompositeAction",
  //               },
  //             },
  //           },
  //           fullTestDefinition: {
  //             type: "union",
  //             optional: true,
  //             discriminator: "testType",
  //             definition: [
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testCompositeAction",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   beforeTestSetupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterTestCleanupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   compositeAction: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   testCompositeActionAssertions: {
  //                     type: "array",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "compositeRunTestAssertion",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testCompositeActionSuite",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   beforeAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   beforeEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   testCompositeActions: {
  //                     type: "record",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "testCompositeAction",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testBuildCompositeAction",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   beforeTestSetupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterTestCleanupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   compositeAction: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "buildCompositeAction",
  //                     },
  //                   },
  //                   testCompositeActionAssertions: {
  //                     type: "array",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "compositeRunTestAssertion",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testBuildCompositeActionSuite",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   beforeAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   beforeEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   testCompositeActions: {
  //                     type: "record",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "testBuildCompositeAction",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testRuntimeCompositeAction",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   beforeTestSetupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterTestCleanupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   compositeAction: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "runtimeCompositeAction",
  //                     },
  //                   },
  //                   testCompositeActionAssertions: {
  //                     type: "array",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "compositeRunTestAssertion",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testRuntimeCompositeActionSuite",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   beforeAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   beforeEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   testCompositeActions: {
  //                     type: "record",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "testRuntimeCompositeAction",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testBuildPlusRuntimeCompositeAction",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   testParams: {
  //                     type: "record",
  //                     optional: true,
  //                     definition: {
  //                       type: "any",
  //                     },
  //                   },
  //                   beforeTestSetupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterTestCleanupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   compositeAction: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "buildPlusRuntimeCompositeAction",
  //                     },
  //                   },
  //                   testCompositeActionAssertions: {
  //                     type: "array",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "compositeRunTestAssertion",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testBuildPlusRuntimeCompositeActionSuite",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   testParams: {
  //                     type: "record",
  //                     optional: true,
  //                     definition: {
  //                       type: "any",
  //                     },
  //                   },
  //                   beforeAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   beforeEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   afterAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeAction",
  //                     },
  //                   },
  //                   testCompositeActions: {
  //                     type: "record",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "testBuildPlusRuntimeCompositeAction",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testCompositeActionTemplate",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   beforeTestSetupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeActionTemplate",
  //                     },
  //                   },
  //                   afterTestCleanupAction: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeActionTemplate",
  //                     },
  //                   },
  //                   compositeActionTemplate: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeActionTemplate",
  //                     },
  //                   },
  //                   testCompositeActionAssertions: {
  //                     type: "array",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "compositeRunTestAssertion",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testCompositeActionTemplateSuite",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   beforeAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeActionTemplate",
  //                     },
  //                   },
  //                   beforeEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeActionTemplate",
  //                     },
  //                   },
  //                   afterEach: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeActionTemplate",
  //                     },
  //                   },
  //                   afterAll: {
  //                     type: "schemaReference",
  //                     optional: true,
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "compositeActionTemplate",
  //                     },
  //                   },
  //                   testCompositeActions: {
  //                     type: "record",
  //                     definition: {
  //                       type: "schemaReference",
  //                       definition: {
  //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                         relativePath: "testCompositeActionTemplate",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   testType: {
  //                     type: "literal",
  //                     definition: "testAssertion",
  //                   },
  //                   testLabel: {
  //                     type: "string",
  //                   },
  //                   definition: {
  //                     type: "object",
  //                     definition: {
  //                       resultAccessPath: {
  //                         type: "array",
  //                         optional: true,
  //                         definition: {
  //                           type: "string",
  //                         },
  //                       },
  //                       resultTransformer: {
  //                         type: "schemaReference",
  //                         optional: true,
  //                         definition: {
  //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                           relativePath: "extendedTransformerForRuntime",
  //                         },
  //                       },
  //                       ignoreAttributes: {
  //                         type: "array",
  //                         optional: true,
  //                         definition: {
  //                           type: "string",
  //                         },
  //                       },
  //                       expectedValue: {
  //                         type: "any",
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //       },
  //     },
  //   };
  //   // const testInstance: any = {
  //   //   uuid: "ffe6ab3c-8296-4293-8aaf-ebbad1f0ac9a",
  //   //   parentName: "Test",
  //   //   parentUuid: "c37625c7-0b35-4d6a-811d-8181eb978301",
  //   //   name: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
  //   //   selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //   //   branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
  //   //   description: "First Test",
  //   //   definition: {
  //   //     testCompositeActions: {
  //   //       "create new Entity and reports from spreadsheet": {
  //   //         testType: "testBuildPlusRuntimeCompositeAction",
  //   //         testLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
  //   //         compositeAction: {
  //   //           actionType: "compositeAction",
  //   //           actionLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
  //   //           actionName: "sequence",
  //   //           templates: {
  //   //             createEntity_newEntity: {
  //   //               uuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "newEntityUuid",
  //   //               },
  //   //               parentUuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referencePath: ["entityEntity", "uuid"],
  //   //               },
  //   //               selfApplication: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "testSelfApplicationUuid",
  //   //               },
  //   //               description: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "createEntity_newEntityDescription",
  //   //               },
  //   //               name: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "newEntityName",
  //   //               },
  //   //             },
  //   //             createEntity_newEntityDefinition: {
  //   //               name: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "newEntityName",
  //   //               },
  //   //               uuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "newEntityDefinitionUuid",
  //   //               },
  //   //               parentName: "EntityDefinition",
  //   //               parentUuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referencePath: ["entityEntityDefinition", "uuid"],
  //   //               },
  //   //               entityUuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referencePath: ["createEntity_newEntity", "uuid"],
  //   //               },
  //   //               conceptLevel: "Model",
  //   //               defaultInstanceDetailsReportUuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "defaultInstanceDetailsReportUuid",
  //   //               },
  //   //               jzodSchema: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "newEntityJzodSchema",
  //   //               },
  //   //             },
  //   //             newEntityListReport: {
  //   //               uuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "createEntity_newEntityListReportUuid",
  //   //               },
  //   //               selfApplication: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "testSelfApplicationUuid",
  //   //               },
  //   //               parentName: "Report",
  //   //               parentUuid: {
  //   //                 transformerType: "mustacheStringTemplate",
  //   //                 interpolation: "build",
  //   //                 definition: "{{entityReport.uuid}}",
  //   //               },
  //   //               conceptLevel: "Model",
  //   //               name: {
  //   //                 transformerType: "mustacheStringTemplate",
  //   //                 interpolation: "build",
  //   //                 definition: "{{newEntityName}}List",
  //   //               },
  //   //               defaultLabel: {
  //   //                 transformerType: "mustacheStringTemplate",
  //   //                 interpolation: "build",
  //   //                 definition: "List of {{newEntityName}}s",
  //   //               },
  //   //               type: "list",
  //   //               definition: {
  //   //                 extractors: {
  //   //                   instanceList: {
  //   //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //   //                     parentName: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "newEntityName",
  //   //                     },
  //   //                     parentUuid: {
  //   //                       transformerType: "mustacheStringTemplate",
  //   //                       interpolation: "build",
  //   //                       definition: "{{createEntity_newEntity.uuid}}",
  //   //                     },
  //   //                   },
  //   //                 },
  //   //                 section: {
  //   //                   type: "objectListReportSection",
  //   //                   definition: {
  //   //                     label: {
  //   //                       transformerType: "mustacheStringTemplate",
  //   //                       interpolation: "build",
  //   //                       definition: "{{newEntityName}}s",
  //   //                     },
  //   //                     parentUuid: {
  //   //                       transformerType: "mustacheStringTemplate",
  //   //                       interpolation: "build",
  //   //                       definition: "{{createEntity_newEntity.uuid}}",
  //   //                     },
  //   //                     fetchedDataReference: "instanceList",
  //   //                   },
  //   //                 },
  //   //               },
  //   //             },
  //   //             newEntityDetailsReport: {
  //   //               uuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "createEntity_newEntityDetailsReportUuid",
  //   //               },
  //   //               selfApplication: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "testSelfApplicationUuid",
  //   //               },
  //   //               parentName: {
  //   //                 transformerType: "mustacheStringTemplate",
  //   //                 interpolation: "build",
  //   //                 definition: "{{entityReport.name}}",
  //   //               },
  //   //               parentUuid: {
  //   //                 transformerType: "mustacheStringTemplate",
  //   //                 interpolation: "build",
  //   //                 definition: "{{entityReport.uuid}}",
  //   //               },
  //   //               conceptLevel: "Model",
  //   //               name: {
  //   //                 transformerType: "mustacheStringTemplate",
  //   //                 interpolation: "build",
  //   //                 definition: "{{newEntityName}}Details",
  //   //               },
  //   //               defaultLabel: {
  //   //                 transformerType: "mustacheStringTemplate",
  //   //                 interpolation: "build",
  //   //                 definition: "Details of {{newEntityName}}",
  //   //               },
  //   //               definition: {
  //   //                 extractorTemplates: {
  //   //                   elementToDisplay: {
  //   //                     transformerType: "constant",
  //   //                     interpolation: "build",
  //   //                     value: {
  //   //                       extractorTemplateType: "extractorForObjectByDirectReference",
  //   //                       parentName: {
  //   //                         transformerType: "contextReference",
  //   //                         interpolation: "build",
  //   //                         referenceName: "newEntityName",
  //   //                       },
  //   //                       parentUuid: {
  //   //                         transformerType: "mustacheStringTemplate",
  //   //                         interpolation: "build",
  //   //                         definition: "{{newEntityUuid}}",
  //   //                       },
  //   //                       instanceUuid: {
  //   //                         transformerType: "constant",
  //   //                         interpolation: "runtime",
  //   //                         value: {
  //   //                           transformerType: "contextReference",
  //   //                           interpolation: "runtime",
  //   //                           referenceName: "instanceUuid",
  //   //                         },
  //   //                       },
  //   //                     },
  //   //                   },
  //   //                 },
  //   //                 section: {
  //   //                   type: "list",
  //   //                   definition: [
  //   //                     {
  //   //                       type: "objectInstanceReportSection",
  //   //                       definition: {
  //   //                         label: {
  //   //                           transformerType: "mustacheStringTemplate",
  //   //                           interpolation: "build",
  //   //                           definition: "My {{newEntityName}}",
  //   //                         },
  //   //                         parentUuid: {
  //   //                           transformerType: "mustacheStringTemplate",
  //   //                           interpolation: "build",
  //   //                           definition: "{{newEntityUuid}}",
  //   //                         },
  //   //                         fetchedDataReference: "elementToDisplay",
  //   //                       },
  //   //                     },
  //   //                   ],
  //   //                 },
  //   //               },
  //   //             },
  //   //           },
  //   //           definition: [
  //   //             {
  //   //               actionType: "modelAction",
  //   //               actionName: "createEntity",
  //   //               actionLabel: "createEntity",
  //   //               deploymentUuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "testDeploymentUuid",
  //   //               },
  //   //               endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //   //               entities: [
  //   //                 {
  //   //                   entity: {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "createEntity_newEntity",
  //   //                   },
  //   //                   entityDefinition: {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "createEntity_newEntityDefinition",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //             {
  //   //               actionType: "transactionalInstanceAction",
  //   //               actionLabel: "createReports",
  //   //               instanceAction: {
  //   //                 actionType: "createInstance",
  //   //                 applicationSection: "model",
  //   //                 deploymentUuid: {
  //   //                   transformerType: "parameterReference",
  //   //                   interpolation: "build",
  //   //                   referenceName: "testDeploymentUuid",
  //   //                 },
  //   //                 endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //   //                 objects: [
  //   //                   {
  //   //                     parentName: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referencePath: ["newEntityListReport", "parentName"],
  //   //                     },
  //   //                     parentUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referencePath: ["newEntityListReport", "parentUuid"],
  //   //                     },
  //   //                     applicationSection: "model",
  //   //                     instances: [
  //   //                       {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referenceName: "newEntityListReport",
  //   //                       },
  //   //                       {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referenceName: "newEntityDetailsReport",
  //   //                       },
  //   //                     ],
  //   //                   },
  //   //                 ],
  //   //               },
  //   //             },
  //   //             {
  //   //               actionType: "modelAction",
  //   //               actionName: "commit",
  //   //               actionLabel: "commit",
  //   //               endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //   //               deploymentUuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "testDeploymentUuid",
  //   //               },
  //   //             },
  //   //             {
  //   //               actionType: "compositeRunBoxedExtractorOrQueryAction",
  //   //               actionLabel: "getListOfEntityDefinitions",
  //   //               nameGivenToResult: "newApplicationEntityDefinitionList",
  //   //               query: {
  //   //                 actionType: "runBoxedExtractorOrQueryAction",
  //   //                 actionName: "runQuery",
  //   //                 endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //   //                 applicationSection: "model",
  //   //                 deploymentUuid: {
  //   //                   transformerType: "parameterReference",
  //   //                   interpolation: "build",
  //   //                   referenceName: "testDeploymentUuid",
  //   //                 },
  //   //                 query: {
  //   //                   queryType: "boxedQueryWithExtractorCombinerTransformer",
  //   //                   deploymentUuid: {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "testDeploymentUuid",
  //   //                   },
  //   //                   pageParams: {
  //   //                     currentDeploymentUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "testDeploymentUuid",
  //   //                     },
  //   //                   },
  //   //                   queryParams: {},
  //   //                   contextResults: {},
  //   //                   extractors: {
  //   //                     entityDefinitions: {
  //   //                       extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //   //                       applicationSection: "model",
  //   //                       parentName: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityEntityDefinition", "name"],
  //   //                       },
  //   //                       parentUuid: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityEntityDefinition", "uuid"],
  //   //                       },
  //   //                       orderBy: {
  //   //                         attributeName: "name",
  //   //                         direction: "ASC",
  //   //                       },
  //   //                     },
  //   //                   },
  //   //                 },
  //   //               },
  //   //             },
  //   //             {
  //   //               actionType: "compositeRunBoxedExtractorOrQueryAction",
  //   //               actionLabel: "getListOfEntities",
  //   //               nameGivenToResult: "newApplicationEntityList",
  //   //               query: {
  //   //                 actionType: "runBoxedExtractorOrQueryAction",
  //   //                 actionName: "runQuery",
  //   //                 endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //   //                 applicationSection: "model",
  //   //                 deploymentUuid: {
  //   //                   transformerType: "parameterReference",
  //   //                   interpolation: "build",
  //   //                   referenceName: "testDeploymentUuid",
  //   //                 },
  //   //                 query: {
  //   //                   queryType: "boxedQueryWithExtractorCombinerTransformer",
  //   //                   deploymentUuid: {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "testDeploymentUuid",
  //   //                   },
  //   //                   pageParams: {
  //   //                     currentDeploymentUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "testDeploymentUuid",
  //   //                     },
  //   //                   },
  //   //                   queryParams: {},
  //   //                   contextResults: {},
  //   //                   extractors: {
  //   //                     entities: {
  //   //                       extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //   //                       applicationSection: "model",
  //   //                       parentName: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityEntity", "name"],
  //   //                       },
  //   //                       parentUuid: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityEntity", "uuid"],
  //   //                       },
  //   //                       orderBy: {
  //   //                         attributeName: "name",
  //   //                         direction: "ASC",
  //   //                       },
  //   //                     },
  //   //                   },
  //   //                 },
  //   //               },
  //   //             },
  //   //             {
  //   //               actionType: "compositeRunBoxedExtractorOrQueryAction",
  //   //               actionLabel: "getListOfReports",
  //   //               nameGivenToResult: "newApplicationReportList",
  //   //               query: {
  //   //                 actionType: "runBoxedExtractorOrQueryAction",
  //   //                 actionName: "runQuery",
  //   //                 endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //   //                 applicationSection: "model",
  //   //                 deploymentUuid: {
  //   //                   transformerType: "parameterReference",
  //   //                   interpolation: "build",
  //   //                   referenceName: "testDeploymentUuid",
  //   //                 },
  //   //                 query: {
  //   //                   queryType: "boxedQueryWithExtractorCombinerTransformer",
  //   //                   deploymentUuid: {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "testDeploymentUuid",
  //   //                   },
  //   //                   pageParams: {
  //   //                     currentDeploymentUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "testDeploymentUuid",
  //   //                     },
  //   //                   },
  //   //                   runAsSql: true,
  //   //                   queryParams: {},
  //   //                   contextResults: {},
  //   //                   extractors: {
  //   //                     reports: {
  //   //                       extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //   //                       applicationSection: "model",
  //   //                       parentName: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityReport", "name"],
  //   //                       },
  //   //                       parentUuid: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityReport", "uuid"],
  //   //                       },
  //   //                       orderBy: {
  //   //                         attributeName: "name",
  //   //                         direction: "ASC",
  //   //                       },
  //   //                     },
  //   //                   },
  //   //                 },
  //   //               },
  //   //             },
  //   //             {
  //   //               actionType: "compositeRunBoxedQueryAction",
  //   //               actionLabel: "getMenu",
  //   //               nameGivenToResult: "menuUpdateQueryResult",
  //   //               queryTemplate: {
  //   //                 actionType: "runBoxedQueryAction",
  //   //                 actionName: "runQuery",
  //   //                 endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //   //                 applicationSection: "model",
  //   //                 deploymentUuid: {
  //   //                   transformerType: "parameterReference",
  //   //                   interpolation: "build",
  //   //                   referenceName: "testDeploymentUuid",
  //   //                 },
  //   //                 query: {
  //   //                   queryType: "boxedQueryWithExtractorCombinerTransformer",
  //   //                   deploymentUuid: {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "testDeploymentUuid",
  //   //                   },
  //   //                   pageParams: {},
  //   //                   queryParams: {},
  //   //                   contextResults: {},
  //   //                   extractors: {
  //   //                     menuList: {
  //   //                       extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //   //                       applicationSection: "model",
  //   //                       parentName: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityMenu", "name"],
  //   //                       },
  //   //                       parentUuid: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityMenu", "uuid"],
  //   //                       },
  //   //                     },
  //   //                   },
  //   //                   runtimeTransformers: {
  //   //                     menu: {
  //   //                       transformerType: "listPickElement",
  //   //                       interpolation: "runtime",
  //   //                       applyTo: {
  //   //                         referenceType: "referencedTransformer",
  //   //                         reference: {
  //   //                           transformerType: "contextReference",
  //   //                           interpolation: "runtime",
  //   //                           referenceName: "menuList",
  //   //                         },
  //   //                       },
  //   //                       index: 0,
  //   //                     },
  //   //                     menuItem: {
  //   //                       transformerType: "freeObjectTemplate",
  //   //                       interpolation: "runtime",
  //   //                       definition: {
  //   //                         reportUuid: {
  //   //                           transformerType: "parameterReference",
  //   //                           interpolation: "build",
  //   //                           referenceName: "createEntity_newEntityListReportUuid",
  //   //                         },
  //   //                         label: {
  //   //                           transformerType: "mustacheStringTemplate",
  //   //                           interpolation: "build",
  //   //                           definition: "List of {{newEntityName}}s",
  //   //                         },
  //   //                         section: "data",
  //   //                         selfApplication: {
  //   //                           transformerType: "parameterReference",
  //   //                           interpolation: "build",
  //   //                           referencePath: ["adminConfigurationDeploymentParis", "uuid"],
  //   //                         },
  //   //                         icon: "local_drink",
  //   //                       },
  //   //                     },
  //   //                     updatedMenu: {
  //   //                       transformerType: "transformer_menu_addItem",
  //   //                       interpolation: "runtime",
  //   //                       menuItemReference: {
  //   //                         transformerType: "contextReference",
  //   //                         interpolation: "runtime",
  //   //                         referenceName: "menuItem",
  //   //                       },
  //   //                       menuReference: {
  //   //                         transformerType: "contextReference",
  //   //                         interpolation: "runtime",
  //   //                         referenceName: "menu",
  //   //                       },
  //   //                       menuSectionItemInsertionIndex: -1,
  //   //                     },
  //   //                   },
  //   //                 },
  //   //               },
  //   //             },
  //   //             {
  //   //               actionType: "transactionalInstanceAction",
  //   //               actionLabel: "updateMenu",
  //   //               instanceAction: {
  //   //                 actionType: "updateInstance",
  //   //                 applicationSection: "model",
  //   //                 deploymentUuid: {
  //   //                   transformerType: "parameterReference",
  //   //                   interpolation: "build",
  //   //                   referenceName: "testDeploymentUuid",
  //   //                 },
  //   //                 endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //   //                 objects: [
  //   //                   {
  //   //                     parentName: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referencePath: ["entityMenu", "name"],
  //   //                     },
  //   //                     parentUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referencePath: ["entityMenu", "uuid"],
  //   //                     },
  //   //                     applicationSection: "model",
  //   //                     instances: [
  //   //                       {
  //   //                         transformerType: "contextReference",
  //   //                         interpolation: "runtime",
  //   //                         referencePath: ["menuUpdateQueryResult", "updatedMenu"],
  //   //                       },
  //   //                     ],
  //   //                   },
  //   //                 ],
  //   //               },
  //   //             },
  //   //             {
  //   //               actionType: "modelAction",
  //   //               actionName: "commit",
  //   //               actionLabel: "commit",
  //   //               endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //   //               deploymentUuid: {
  //   //                 transformerType: "parameterReference",
  //   //                 interpolation: "build",
  //   //                 referenceName: "testDeploymentUuid",
  //   //               },
  //   //             },
  //   //             {
  //   //               actionType: "compositeRunBoxedQueryAction",
  //   //               actionLabel: "getNewMenuList",
  //   //               nameGivenToResult: "newMenuList",
  //   //               queryTemplate: {
  //   //                 actionType: "runBoxedQueryAction",
  //   //                 actionName: "runQuery",
  //   //                 endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //   //                 applicationSection: "model",
  //   //                 deploymentUuid: {
  //   //                   transformerType: "parameterReference",
  //   //                   interpolation: "build",
  //   //                   referenceName: "testDeploymentUuid",
  //   //                 },
  //   //                 query: {
  //   //                   queryType: "boxedQueryWithExtractorCombinerTransformer",
  //   //                   deploymentUuid: {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "testDeploymentUuid",
  //   //                   },
  //   //                   pageParams: {},
  //   //                   queryParams: {},
  //   //                   contextResults: {},
  //   //                   extractors: {
  //   //                     menuList: {
  //   //                       extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //   //                       applicationSection: "model",
  //   //                       parentName: "Menu",
  //   //                       parentUuid: {
  //   //                         transformerType: "parameterReference",
  //   //                         interpolation: "build",
  //   //                         referencePath: ["entityMenu", "uuid"],
  //   //                       },
  //   //                     },
  //   //                   },
  //   //                 },
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //         testCompositeActionAssertions: [
  //   //           {
  //   //             actionType: "compositeRunTestAssertion",
  //   //             actionLabel: "checkEntities",
  //   //             nameGivenToResult: "checkEntityList",
  //   //             testAssertion: {
  //   //               testType: "testAssertion",
  //   //               testLabel: "checkEntities",
  //   //               definition: {
  //   //                 resultAccessPath: ["newApplicationEntityList", "entities"],
  //   //                 ignoreAttributes: [
  //   //                   "author",
  //   //                   "conceptLevel",
  //   //                   "parentDefinitionVersionUuid",
  //   //                   "parentName",
  //   //                 ],
  //   //                 expectedValue: [
  //   //                   {
  //   //                     uuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "newEntityUuid",
  //   //                     },
  //   //                     parentUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referencePath: ["entityEntity", "uuid"],
  //   //                     },
  //   //                     selfApplication: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "testSelfApplicationUuid",
  //   //                     },
  //   //                     description: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "createEntity_newEntityDescription",
  //   //                     },
  //   //                     name: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "newEntityName",
  //   //                     },
  //   //                   },
  //   //                 ],
  //   //               },
  //   //             },
  //   //           },
  //   //           {
  //   //             actionType: "compositeRunTestAssertion",
  //   //             actionLabel: "checkEntityDefinitions",
  //   //             nameGivenToResult: "checkEntityDefinitionList",
  //   //             testAssertion: {
  //   //               testType: "testAssertion",
  //   //               testLabel: "checkEntityDefinitions",
  //   //               definition: {
  //   //                 resultAccessPath: ["newApplicationEntityDefinitionList", "entityDefinitions"],
  //   //                 ignoreAttributes: [
  //   //                   "author",
  //   //                   "conceptLevel",
  //   //                   "description",
  //   //                   "icon",
  //   //                   "parentDefinitionVersionUuid",
  //   //                   "parentName",
  //   //                   "viewAttributes",
  //   //                 ],
  //   //                 expectedValue: [
  //   //                   {
  //   //                     name: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "newEntityName",
  //   //                     },
  //   //                     uuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "newEntityDefinitionUuid",
  //   //                     },
  //   //                     parentName: "EntityDefinition",
  //   //                     parentUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referencePath: ["entityEntityDefinition", "uuid"],
  //   //                     },
  //   //                     entityUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referencePath: ["newEntityUuid"],
  //   //                     },
  //   //                     conceptLevel: "Model",
  //   //                     defaultInstanceDetailsReportUuid: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "defaultInstanceDetailsReportUuid",
  //   //                     },
  //   //                     jzodSchema: {
  //   //                       transformerType: "parameterReference",
  //   //                       interpolation: "build",
  //   //                       referenceName: "newEntityJzodSchema",
  //   //                     },
  //   //                   },
  //   //                 ],
  //   //               },
  //   //             },
  //   //           },
  //   //           {
  //   //             actionType: "compositeRunTestAssertion",
  //   //             actionLabel: "checkReports",
  //   //             nameGivenToResult: "checkReportList",
  //   //             testAssertion: {
  //   //               testType: "testAssertion",
  //   //               testLabel: "checkReports",
  //   //               definition: {
  //   //                 resultAccessPath: ["newApplicationReportList", "reports"],
  //   //                 ignoreAttributes: ["author", "parentDefinitionVersionUuid", "type"],
  //   //                 expectedValue: [
  //   //                   {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "newEntityListReport",
  //   //                   },
  //   //                   {
  //   //                     transformerType: "parameterReference",
  //   //                     interpolation: "build",
  //   //                     referenceName: "newEntityDetailsReport",
  //   //                   },
  //   //                 ],
  //   //               },
  //   //             },
  //   //           },
  //   //           {
  //   //             actionType: "compositeRunTestAssertion",
  //   //             actionLabel: "checkMenus",
  //   //             nameGivenToResult: "checkMenuList",
  //   //             testAssertion: {
  //   //               testType: "testAssertion",
  //   //               testLabel: "checkMenus",
  //   //               definition: {
  //   //                 resultAccessPath: ["newMenuList", "menuList"],
  //   //                 ignoreAttributes: ["author"],
  //   //                 expectedValue: [
  //   //                   {
  //   //                     uuid: "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
  //   //                     parentName: "Menu",
  //   //                     parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
  //   //                     parentDefinitionVersionUuid: null,
  //   //                     name: "LibraryMenu",
  //   //                     defaultLabel: "Meta-Model",
  //   //                     description:
  //   //                       "This is the default menu allowing to explore the Library SelfApplication.",
  //   //                     definition: {
  //   //                       menuType: "complexMenu",
  //   //                       definition: [
  //   //                         {
  //   //                           items: [
  //   //                             {
  //   //                               icon: "category",
  //   //                               label: "Library Entities",
  //   //                               section: "model",
  //   //                               reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
  //   //                               selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //   //                             },
  //   //                             {
  //   //                               icon: "category",
  //   //                               label: "Library Entity Definitions",
  //   //                               section: "model",
  //   //                               reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
  //   //                               selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //   //                             },
  //   //                             {
  //   //                               icon: "list",
  //   //                               label: "Library Reports",
  //   //                               section: "model",
  //   //                               reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
  //   //                               selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //   //                             },
  //   //                             {
  //   //                               icon: "auto_stories",
  //   //                               label: "Library Books",
  //   //                               section: "data",
  //   //                               reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
  //   //                               selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //   //                             },
  //   //                             {
  //   //                               icon: "star",
  //   //                               label: "Library Authors",
  //   //                               section: "data",
  //   //                               reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
  //   //                               selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //   //                             },
  //   //                             {
  //   //                               icon: "account_balance",
  //   //                               label: "Library Publishers",
  //   //                               section: "data",
  //   //                               reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
  //   //                               selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //   //                             },
  //   //                             {
  //   //                               icon: "flag",
  //   //                               label: "Library countries",
  //   //                               section: "data",
  //   //                               reportUuid: "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
  //   //                               selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //   //                             },
  //   //                             {
  //   //                               icon: "person",
  //   //                               label: "Library Users",
  //   //                               section: "data",
  //   //                               reportUuid: "3df9413d-5050-4357-910c-f764aacae7e6",
  //   //                               selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //   //                             },
  //   //                             {
  //   //                               reportUuid: {
  //   //                                 transformerType: "parameterReference",
  //   //                                 interpolation: "build",
  //   //                                 referenceName: "createEntity_newEntityListReportUuid",
  //   //                               },
  //   //                               label: {
  //   //                                 transformerType: "mustacheStringTemplate",
  //   //                                 interpolation: "build",
  //   //                                 definition: "List of {{newEntityName}}s",
  //   //                               },
  //   //                               section: "data",
  //   //                               selfApplication: {
  //   //                                 transformerType: "parameterReference",
  //   //                                 interpolation: "build",
  //   //                                 referencePath: ["adminConfigurationDeploymentParis", "uuid"],
  //   //                               },
  //   //                               icon: "local_drink",
  //   //                             },
  //   //                           ],
  //   //                           label: "library",
  //   //                           title: "Library",
  //   //                         },
  //   //                       ],
  //   //                     },
  //   //                   },
  //   //                 ],
  //   //               },
  //   //             },
  //   //           },
  //   //         ],
  //   //       },
  //   //     },
  //   //   },
  //   // };
  //   console.log(
  //     "miroirFundamentalJzodSchema.definition.context.buildPlusRuntimeCompositeAction.definition.definition.definition",
  //     JSON.stringify(
  //       miroirFundamentalJzodSchema.definition.context.buildPlusRuntimeCompositeAction.definition
  //         .definition.definition,
  //       null,
  //       2
  //     )
  //   );
  //   const compositeActionSchema = currentReportTargetEntityDefinition.definition.definition.definition.testCompositeActions;
  //   const jzodSchema = miroirFundamentalJzodSchema.definition.context
  //     .buildPlusRuntimeCompositeAction.definition.definition.definition as JzodUnion;
  //   const concreteJzodSchemas: JzodElement[] = jzodSchema.definition.map((a: JzodElement) =>
  //     a.type == "schemaReference"
  //       ? resolveJzodSchemaReferenceInContext(
  //           miroirFundamentalJzodSchema as any,
  //           a,
  //           currentModel as any,
  //           currentMiroirModel as any,
  //           a.context
  //         )
  //       : a
  //   );
  //   console.log("concreteJzodSchemas", JSON.stringify(concreteJzodSchemas, null, 2));
  //   const result = unionObjectChoices(
  //     // [currentReportTargetEntityDefinition],
  //     // [{
  //     //   type: "record",
  //     //   definition: miroirFundamentalJzodSchema.definition.context.testBuildPlusRuntimeCompositeAction as any
  //     // }],
  //     [
  //       miroirFundamentalJzodSchema.definition.context.buildPlusRuntimeCompositeAction.definition
  //         .definition.definition as any,
  //     ],
  //     miroirFundamentalJzodSchema as any,
  //     currentModel as any,
  //     currentMiroirModel as any,
  //     {}
  //     // { refObj: referencedObj }
  //   );
  //   console.log("result", JSON.stringify(result, null, 2));
  //   expect(result).toEqual([
  //     {
  //       type: "object",
  //       definition: {
  //         actionType: {
  //           type: "literal",
  //           definition: "compositeRunBoxedQueryAction",
  //         },
  //         actionLabel: {
  //           type: "string",
  //           optional: true,
  //         },
  //         nameGivenToResult: {
  //           type: "string",
  //         },
  //         queryTemplate: {
  //           type: "schemaReference",
  //           definition: {
  //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //             relativePath: "runBoxedQueryAction",
  //           },
  //         },
  //       },
  //     },
  //     {
  //       type: "object",
  //       definition: {
  //         actionType: {
  //           type: "literal",
  //           definition: "compositeRunBoxedExtractorAction",
  //         },
  //         actionLabel: {
  //           type: "string",
  //           optional: true,
  //         },
  //         nameGivenToResult: {
  //           type: "string",
  //         },
  //         queryTemplate: {
  //           type: "schemaReference",
  //           definition: {
  //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //             relativePath: "runBoxedExtractorAction",
  //           },
  //         },
  //       },
  //     },
  //     {
  //       type: "object",
  //       definition: {
  //         actionType: {
  //           type: "literal",
  //           definition: "compositeRunBoxedExtractorOrQueryAction",
  //         },
  //         actionLabel: {
  //           type: "string",
  //           optional: true,
  //         },
  //         nameGivenToResult: {
  //           type: "string",
  //         },
  //         query: {
  //           type: "schemaReference",
  //           definition: {
  //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //             relativePath: "runBoxedExtractorOrQueryAction",
  //           },
  //         },
  //       },
  //     },
  //     {
  //       type: "object",
  //       definition: {
  //         actionType: {
  //           type: "literal",
  //           definition: "compositeRunTestAssertion",
  //         },
  //         actionLabel: {
  //           type: "string",
  //           optional: true,
  //         },
  //         nameGivenToResult: {
  //           type: "string",
  //         },
  //         testAssertion: {
  //           type: "schemaReference",
  //           definition: {
  //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //             relativePath: "testAssertion",
  //           },
  //         },
  //       },
  //     },
  //     {
  //       type: "object",
  //       definition: {
  //         actionType: {
  //           type: "literal",
  //           definition: "compositeAction",
  //         },
  //         actionName: {
  //           type: "literal",
  //           definition: "sequence",
  //         },
  //         actionLabel: {
  //           type: "string",
  //           optional: true,
  //         },
  //         deploymentUuid: {
  //           type: "uuid",
  //           optional: true,
  //           tag: {
  //             value: {
  //               defaultLabel: "Module Deployment Uuid",
  //               editable: false,
  //             },
  //           },
  //         },
  //         templates: {
  //           type: "record",
  //           optional: true,
  //           definition: {
  //             type: "any",
  //           },
  //         },
  //         definition: {
  //           type: "array",
  //           definition: {
  //             type: "union",
  //             discriminator: "actionType",
  //             definition: [
  //               {
  //                 type: "schemaReference",
  //                 definition: {
  //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                   relativePath: "buildPlusRuntimeDomainAction",
  //                 },
  //               },
  //               {
  //                 type: "schemaReference",
  //                 definition: {
  //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                   relativePath: "buildPlusRuntimeCompositeAction",
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   actionType: {
  //                     type: "literal",
  //                     definition: "compositeRunBoxedQueryAction",
  //                   },
  //                   actionLabel: {
  //                     type: "string",
  //                     optional: true,
  //                   },
  //                   nameGivenToResult: {
  //                     type: "string",
  //                   },
  //                   queryTemplate: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "runBoxedQueryAction",
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   actionType: {
  //                     type: "literal",
  //                     definition: "compositeRunBoxedExtractorAction",
  //                   },
  //                   actionLabel: {
  //                     type: "string",
  //                     optional: true,
  //                   },
  //                   nameGivenToResult: {
  //                     type: "string",
  //                   },
  //                   queryTemplate: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "runBoxedExtractorAction",
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   actionType: {
  //                     type: "literal",
  //                     definition: "compositeRunBoxedExtractorOrQueryAction",
  //                   },
  //                   actionLabel: {
  //                     type: "string",
  //                     optional: true,
  //                   },
  //                   nameGivenToResult: {
  //                     type: "string",
  //                   },
  //                   query: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "runBoxedExtractorOrQueryAction",
  //                     },
  //                   },
  //                 },
  //               },
  //               {
  //                 type: "object",
  //                 definition: {
  //                   actionType: {
  //                     type: "literal",
  //                     definition: "compositeRunTestAssertion",
  //                   },
  //                   actionLabel: {
  //                     type: "string",
  //                     optional: true,
  //                   },
  //                   nameGivenToResult: {
  //                     type: "string",
  //                   },
  //                   testAssertion: {
  //                     type: "schemaReference",
  //                     definition: {
  //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                       relativePath: "testAssertion",
  //                     },
  //                   },
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //       },
  //     },
  //   ]);

  // });
});
