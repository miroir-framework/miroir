import { describe, expect, it } from 'vitest';
import type {
  JzodObject,
  JzodReference,
  JzodUnion,
  MlSchema
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
// } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
// import { unionChoices } from "./JzodUnfoldSchemaForValue";
import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import {
  unionObjectChoices,
} from "../../../src/1_core/jzod/jzodTypeCheck";

// Minimal mocks for MetaModel and MlSchema
// const mockMetaModel: MetaModel = {} as MetaModel;
// const mockJzodSchema: MlSchema = {
//   uuid: "mock",
//   definition: { context: {} }
// } as MlSchema;
import { defaultMetaModelEnvironment } from '../../../src/1_core/Model';

const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as MlSchema;

describe("unionObjectChoices", () => {
  it("returns only object types from a flat union", () => {
    const obj1: JzodObject = { type: "object", definition: { a: { type: "string" } } };
    const obj2: JzodObject = { type: "object", definition: { b: { type: "number" } } };
    const union: JzodUnion = { type: "union", definition: [obj1, obj2, { type: "string" }] };

    const result = unionObjectChoices(
      union.definition,
      defaultMetaModelEnvironment,
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
      defaultMetaModelEnvironment,
      {}
    );
    expect(result).toEqual([obj1, obj2, obj3]);
  });

  // ##############################################################################################
  it("resolves schemaReferences in nested unions", () => {
    // Simulate a schemaReference to an object
    const referencedObj: JzodObject = { type: "object", definition: { d: { type: "string" } } };
    const schemaReference: JzodReference = {
      type: "schemaReference",
      definition: { 
        // absolutePath: "mock",
         relativePath: "refObj" },
      context: {}
    };
    const nestedUnion: JzodUnion = { type: "union", definition: [schemaReference] };
    const union: JzodUnion = { type: "union", definition: [nestedUnion] };

    // Patch resolveJzodSchemaReferenceInContext to return referencedObj
    // const { resolveJzodSchemaReferenceInContext } = await import("./JzodUnfoldSchemaForValue");
    // const original = resolveJzodSchemaReferenceInContext;
    // (globalThis as any).resolveJzodSchemaReferenceInContext = () => referencedObj;

    const result = unionObjectChoices(
      union.definition,
      defaultMetaModelEnvironment,
      { refObj: referencedObj }
      // { mock: referencedObj }
    );
    expect(result).toEqual([referencedObj]);

    // Restore original
    // (globalThis as any).resolveJzodSchemaReferenceInContext = original;
  });

  // ##############################################################################################
  it("returns empty array if no object types are present", () => {
    const union: JzodUnion = { type: "union", definition: [{ type: "string" }, { type: "number" }] };
    const result = unionObjectChoices(
      union.definition,
      defaultMetaModelEnvironment,
      {}
    );
    expect(result).toEqual([]);
  });
});
