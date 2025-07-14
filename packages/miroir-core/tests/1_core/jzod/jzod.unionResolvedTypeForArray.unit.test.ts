import { jzodUnionResolvedTypeForArray } from '../../../src/1_core/jzod/jzodTypeCheck';
import {
  JzodElement,
  JzodArray,
  JzodTuple,
  JzodUnion,
  JzodSchema,
  MetaModel,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

describe('jzodUnionResolvedTypeForArray', () => {
  const mockMiroirFundamentalJzodSchema = {} as JzodSchema;
  const mockCurrentModel = {} as MetaModel;
  const mockMiroirMetaModel = {} as MetaModel;
  const mockRelativeReferenceJzodContext = {};

  it('should return error when no array choices are found', () => {
    // Setup
    const valueArray = ["test"];
    const currentValuePath = ["root"];
    const currentTypePath = ["typePath"];
    const discriminator = "type";
    const concreteUnrolledJzodSchemas: JzodElement[] = [{ type: "string" }];

    // Act
    const result = jzodUnionResolvedTypeForArray(
      concreteUnrolledJzodSchemas,
      discriminator,
      valueArray,
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

  it('should return the single array choice when there is only one option', () => {
    // Setup
    const valueArray = ["test"];
    const currentValuePath = ["root"];
    const currentTypePath = ["typePath"];
    const discriminator = "type";

    const singleArrayChoice: JzodArray = {
      type: "array",
      definition: {
        type: "string"
      }
    };

    const concreteUnrolledJzodSchemas: JzodElement[] = [singleArrayChoice];

    // Act
    const result = jzodUnionResolvedTypeForArray(
      concreteUnrolledJzodSchemas,
      discriminator,
      valueArray,
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
      expect(result.resolvedJzodObjectSchema).toEqual(singleArrayChoice);
    }
  });

  // TODO: implement case for multiple array choices, based potentially on a discriminator
  // it('should use selectUnionBranchFromDiscriminator when multiple array choices exist', () => {
  //   // Setup
  //   const valueArray = ["test"];
  //   const currentValuePath = ["root"];
  //   const currentTypePath = ["typePath"];
  //   const discriminator = "type";

  //   const arrayChoiceA: JzodArray = {
  //     type: "array",
  //     definition: { type: "string" }
  //   };

  //   const arrayChoiceB: JzodArray = {
  //     type: "array",
  //     definition: { type: "number" }
  //   };

  //   const concreteUnrolledJzodSchemas: JzodElement[] = [
  //     arrayChoiceA, arrayChoiceB
  //   ];

  //   // Act
  //   const result = jzodUnionResolvedTypeForArray(
  //     concreteUnrolledJzodSchemas,
  //     discriminator,
  //     valueArray,
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
  //     expect(result.resolvedJzodObjectSchema).toEqual(arrayChoiceA);
  //   }
  // });

  // it('should handle complex discriminator selection with union types', () => {
  //   // Setup
  //   const valueArray = ["test"];
  //   const currentValuePath = ["root"];
  //   const currentTypePath = ["typePath"];
  //   const discriminator = ["category", "subType"];

  //   const arrayChoice: JzodArray = {
  //     type: "array",
  //     definition: { type: "string" }
  //   };

  //   const tupleChoice: JzodTuple = {
  //     type: "tuple",
  //     definition: [ { type: "number" }, { type: "boolean" }]
  //   };

  //   const concreteUnrolledJzodSchemas: JzodElement[] = [
  //     arrayChoice,
  //     tupleChoice,
  //     {
  //       type: "union",
  //       definition: [
  //         { type: "string" },
  //         { type: "number" }
  //       ]
  //     } as JzodUnion
  //   ];

  //   // Act
  //   const result = jzodUnionResolvedTypeForArray(
  //     concreteUnrolledJzodSchemas,
  //     discriminator,
  //     valueArray,
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
  //     expect(result.resolvedJzodObjectSchema).toEqual(arrayChoice);
  //   }
  // });
});
