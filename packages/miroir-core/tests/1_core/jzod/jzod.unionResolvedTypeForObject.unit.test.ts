import { describe, it, expect, vi } from 'vitest';
import {
  JzodElement,
  JzodLiteral,
  JzodObject,
  JzodSchema,
  JzodUnion,
  MetaModel,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  jzodUnionResolvedTypeForObject,
  unionObjectChoices,
  selectUnionBranchFromDiscriminator,
} from "../../../src/1_core/jzod/jzodTypeCheck";

describe('jzodUnionResolvedTypeForObject', () => {
  // Mock data for all tests
  const mockMiroirFundamentalJzodSchema = {} as JzodSchema;
  const mockCurrentModel = {} as MetaModel;
  const mockMiroirMetaModel = {} as MetaModel;
  const mockRelativeReferenceJzodContext = {};

  it("should return the single object choice when there is only one option", () => {
    // Setup
    const valueObject = { name: "test", type: "single" };
    const currentValuePath = ["root"];
    const currentTypePath = ["typePath"];
    const discriminator = "type";

    const singleObjectChoice: JzodObject = {
      type: "object",
      definition: {
        name: { type: "string" },
        type: { type: "literal", definition: "single" },
      },
    };

    const concreteUnrolledJzodSchemas: JzodElement[] = [singleObjectChoice];

    // Act
    const result = jzodUnionResolvedTypeForObject(
      concreteUnrolledJzodSchemas,
      discriminator,
      valueObject,
      currentValuePath,
      currentTypePath,
      mockMiroirFundamentalJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockRelativeReferenceJzodContext
    );

    // Assert
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.resolvedJzodObjectSchema).toEqual(singleObjectChoice);
    }
  });

  it("should return error when no object choices are found", () => {
    // Setup
    const valueObject = { name: "test", type: "notFound" };
    const currentValuePath = ["root"];
    const currentTypePath = ["typePath"];
    const discriminator = "type";
    const concreteUnrolledJzodSchemas: JzodElement[] = [{ type: "string" }];

    // Act
    const result = jzodUnionResolvedTypeForObject(
      concreteUnrolledJzodSchemas,
      discriminator,
      valueObject,
      currentValuePath,
      currentTypePath,
      mockMiroirFundamentalJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockRelativeReferenceJzodContext
    );

    // Assert
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toMatch(/could not find object type/);
    }
  });

  // TODO: DOES NOT WORK?!
  // it("should return error when valueObject has discriminator but the discriminator value is not allowed", () => {
  //   // Setup
  //   const valueObject = { name: "test", type: "unknown" };
  //   const currentValuePath = ["root"];
  //   const currentTypePath = ["typePath"];
  //   const discriminator = "type";

  //   const objectChoice: JzodObject = {
  //     type: "object",
  //     definition: {
  //       name: { type: "string" },
  //       type: { type: "literal", definition: "known" },
  //     },
  //   };

  //   const concreteUnrolledJzodSchemas: JzodElement[] = [objectChoice];

  //   // Act
  //   const result = jzodUnionResolvedTypeForObject(
  //     concreteUnrolledJzodSchemas,
  //     discriminator,
  //     valueObject,
  //     currentValuePath,
  //     currentTypePath,
  //     mockMiroirFundamentalJzodSchema,
  //     mockCurrentModel,
  //     mockMiroirMetaModel,
  //     mockRelativeReferenceJzodContext
  //   );

  //   // Assert
  //   expect(result.status).toBe("error");
  //   if (result.status === "error") {
  //     expect(result.error).toMatch(/could not find object type/);
  //   }
  // });

  // it('should use selectUnionBranchFromDiscriminator when multiple object choices exist', () => {
  //   // Setup
  //   const valueObject = { name: 'test', type: 'typeA' };
  //   const currentValuePath = ['root'];
  //   const currentTypePath = ['typePath'];
  //   const discriminator = 'type';

  //   const objectChoiceA: JzodObject = {
  //     type: 'object',
  //     definition: {
  //       name: { type: 'string' },
  //       type: { type: 'literal', definition: 'typeA' } as JzodLiteral
  //     }
  //   };

  //   const objectChoiceB: JzodObject = {
  //     type: 'object',
  //     definition: {
  //       name: { type: 'string' },
  //       type: { type: 'literal', definition: 'typeB' } as JzodLiteral
  //     }
  //   };

  //   const concreteUnrolledJzodSchemas: JzodElement[] = [
  //     objectChoiceA, objectChoiceB
  //   ];

  //   // Act
  //   const result = jzodUnionResolvedTypeForObject(
  //     concreteUnrolledJzodSchemas,
  //     discriminator,
  //     valueObject,
  //     currentValuePath,
  //     currentTypePath,
  //     mockMiroirFundamentalJzodSchema,
  //     mockCurrentModel,
  //     mockMiroirMetaModel,
  //     mockRelativeReferenceJzodContext
  //   );

  //   // Assert
  //   expect(result.status).toBe("ok");
  //   if (result.status === "ok") {
  //     expect(result.resolvedJzodObjectSchema).toEqual(objectChoiceA);
  //   }
  // });

  // it('should handle complex discriminator selection with union types', () => {
  //   // Setup
  //   const valueObject = { name: 'test', category: 'advanced', subType: 'special' };
  //   const currentValuePath = ['root'];
  //   const currentTypePath = ['typePath'];
  //   const discriminator = ['category', 'subType'];

  //   const objectChoice: JzodObject = {
  //     type: 'object',
  //     definition: {
  //       name: { type: 'string' },
  //       category: { type: 'literal', definition: 'advanced' } as JzodLiteral,
  //       subType: { type: 'literal', definition: 'special' } as JzodLiteral
  //     }
  //   };

  //   const otherObjectChoice: JzodObject = {
  //     type: 'object',
  //     definition: {
  //       name: { type: 'string' },
  //       category: { type: 'literal', definition: 'basic' } as JzodLiteral
  //     }
  //   };

  //   const concreteUnrolledJzodSchemas: JzodElement[] = [
  //     objectChoice,
  //     otherObjectChoice,
  //     {
  //       type: 'union',
  //       definition: [
  //         { type: 'string' },
  //         { type: 'number' }
  //       ]
  //     } as JzodUnion
  //   ];

  //   // Act
  //   const result = jzodUnionResolvedTypeForObject(
  //     concreteUnrolledJzodSchemas,
  //     discriminator,
  //     valueObject,
  //     currentValuePath,
  //     currentTypePath,
  //     mockMiroirFundamentalJzodSchema,
  //     mockCurrentModel,
  //     mockMiroirMetaModel,
  //     mockRelativeReferenceJzodContext
  //   );

  //   // Assert
  //   expect(result.status).toBe("ok");
  //   if (result.status === "ok") {
  //     expect(result.resolvedJzodObjectSchema).toEqual(objectChoice);
  //   }
  // });
});
