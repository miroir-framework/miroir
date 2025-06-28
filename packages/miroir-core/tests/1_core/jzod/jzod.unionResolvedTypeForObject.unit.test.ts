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
    expect(result).toEqual(singleObjectChoice);
  });

  it("should throw error when no object choices are found", () => {
    // Setup
    const valueObject = { name: "test", type: "notFound" };
    const currentValuePath = ["root"];
    const currentTypePath = ["typePath"];
    const discriminator = "type";
    const concreteUnrolledJzodSchemas: JzodElement[] = [{ type: "string" }];

    // Act & Assert
    expect(() =>
      jzodUnionResolvedTypeForObject(
        concreteUnrolledJzodSchemas,
        discriminator,
        valueObject,
        currentValuePath,
        currentTypePath,
        mockMiroirFundamentalJzodSchema,
        mockCurrentModel,
        mockMiroirMetaModel,
        mockRelativeReferenceJzodContext
      )
    ).toThrow(/jzodTypeCheck could not find object type/);
  });

  it('should use selectUnionBranchFromDiscriminator when multiple object choices exist', () => {
    // Setup
    const valueObject = { name: 'test', type: 'typeA' };
    const currentValuePath = ['root'];
    const currentTypePath = ['typePath'];
    const discriminator = 'type';

    const objectChoiceA: JzodObject = {
      type: 'object',
      definition: {
        name: { type: 'string' },
        type: { type: 'literal', definition: 'typeA' } as JzodLiteral
      }
    };

    const objectChoiceB: JzodObject = {
      type: 'object',
      definition: {
        name: { type: 'string' },
        type: { type: 'literal', definition: 'typeB' } as JzodLiteral
      }
    };

    const concreteUnrolledJzodSchemas: JzodElement[] = [
      objectChoiceA, objectChoiceB
    ];

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
    expect(result).toEqual(objectChoiceA);
  });

  it('should handle complex discriminator selection with union types', () => {
    // Setup
    const valueObject = { name: 'test', category: 'advanced', subType: 'special' };
    const currentValuePath = ['root'];
    const currentTypePath = ['typePath'];
    const discriminator = ['category', 'subType'];

    const objectChoice: JzodObject = {
      type: 'object',
      definition: {
        name: { type: 'string' },
        category: { type: 'literal', definition: 'advanced' } as JzodLiteral,
        subType: { type: 'literal', definition: 'special' } as JzodLiteral
      }
    };

    const otherObjectChoice: JzodObject = {
      type: 'object',
      definition: {
        name: { type: 'string' },
        category: { type: 'literal', definition: 'basic' } as JzodLiteral
      }
    };

    const concreteUnrolledJzodSchemas: JzodElement[] = [
      objectChoice,
      otherObjectChoice,
      {
        type: 'union',
        definition: [
          { type: 'string' },
          { type: 'number' }
        ]
      } as JzodUnion
    ];

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
    expect(result).toEqual(objectChoice);
  });
});

// describe('unionObjectChoices', () => {
//   // Mock data for all tests
//   const mockMiroirFundamentalJzodSchema = {} as JzodSchema;
//   const mockCurrentModel = {} as MetaModel;
//   const mockMiroirMetaModel = {} as MetaModel;
//   const mockRelativeReferenceJzodContext = {};

//   it('should filter and collect object choices from a list of JzodElements', () => {
//     // Setup
//     const objectTypeA: JzodObject = { 
//       type: 'object', 
//       definition: { prop: { type: 'string' } }
//     };
    
//     const objectTypeB: JzodObject = { 
//       type: 'object', 
//       definition: { otherProp: { type: 'number' } }
//     };
    
//     const unionType: JzodUnion = {
//       type: 'union',
//       definition: [
//         { type: 'string' },
//         objectTypeB
//       ]
//     };
    
//     const concreteUnrolledJzodSchemas: JzodElement[] = [
//       objectTypeA,
//       { type: 'string' },
//       unionType
//     ];
    
//     // Mock resolveObjectExtendClauseAndDefinition
//     const resolveObjectExtendClauseAndDefinitionMock = vi.fn().mockImplementation(obj => obj);
    
//     vi.mock('./jzodTypeCheck', async (importOriginal) => {
//       const actual = await importOriginal();
//       return {
//         ...actual,
//         resolveObjectExtendClauseAndDefinition: resolveObjectExtendClauseAndDefinitionMock
//       };
//     });
    
//     // Act
//     const result = unionObjectChoices(
//       concreteUnrolledJzodSchemas,
//       mockMiroirFundamentalJzodSchema,
//       mockCurrentModel,
//       mockMiroirMetaModel,
//       mockRelativeReferenceJzodContext
//     );
    
//     // Assert
//     expect(result).toHaveLength(2);
//     expect(result).toContainEqual(objectTypeA);
//     expect(result).toContainEqual(objectTypeB);
//   });
// });

// describe('selectUnionBranchFromDiscriminator', () => {
//   // Mock data for all tests
//   const mockMiroirFundamentalJzodSchema = {} as JzodSchema;
//   const mockCurrentModel = {} as MetaModel;
//   const mockMiroirMetaModel = {} as MetaModel;
//   const mockRelativeReferenceJzodContext = {};

//   it('should select the correct union branch using a single discriminator', () => {
//     // Setup
//     const valueObject = { type: 'user', name: 'John' };
//     const valueObjectPath = ['root'];
//     const typePath = ['typePath'];
//     const discriminator = 'type';
    
//     const userObject: JzodObject = {
//       type: 'object',
//       definition: {
//         type: { type: 'literal', definition: 'user' } as JzodLiteral,
//         name: { type: 'string' }
//       }
//     };
    
//     const adminObject: JzodObject = {
//       type: 'object',
//       definition: {
//         type: { type: 'literal', definition: 'admin' } as JzodLiteral,
//         name: { type: 'string' },
//         level: { type: 'number' }
//       }
//     };
    
//     const objectUnionChoices = [userObject, adminObject];
    
//     // Act
//     const result = selectUnionBranchFromDiscriminator(
//       objectUnionChoices,
//       discriminator,
//       valueObject,
//       valueObjectPath,
//       typePath,
//       mockMiroirFundamentalJzodSchema,
//       mockCurrentModel,
//       mockMiroirMetaModel,
//       mockRelativeReferenceJzodContext
//     );
    
//     // Assert
//     expect(result.currentDiscriminatedObjectJzodSchema).toEqual(userObject);
//     expect(result.flattenedUnionChoices).toHaveLength(1);
//     expect(result.chosenDiscriminator).toEqual([{discriminator: 'type', value: 'user'}]);
//   });

//   it('should throw error when no match is found with discriminator', () => {
//     // Setup
//     const valueObject = { type: 'guest', name: 'Visitor' };
//     const valueObjectPath = ['root'];
//     const typePath = ['typePath'];
//     const discriminator = 'type';
    
//     const userObject: JzodObject = {
//       type: 'object',
//       definition: {
//         type: { type: 'literal', definition: 'user' } as JzodLiteral,
//         name: { type: 'string' }
//       }
//     };
    
//     const adminObject: JzodObject = {
//       type: 'object',
//       definition: {
//         type: { type: 'literal', definition: 'admin' } as JzodLiteral,
//         name: { type: 'string' }
//       }
//     };
    
//     const objectUnionChoices = [userObject, adminObject];
    
//     // Act & Assert
//     expect(() => selectUnionBranchFromDiscriminator(
//       objectUnionChoices,
//       discriminator,
//       valueObject,
//       valueObjectPath,
//       typePath,
//       mockMiroirFundamentalJzodSchema,
//       mockCurrentModel,
//       mockMiroirMetaModel,
//       mockRelativeReferenceJzodContext
//     )).toThrow(/found no match with discriminator/);
//   });

//   it('should throw error when multiple matches are found with discriminator', () => {
//     // Setup
//     const valueObject = { type: 'user', name: 'John' };
//     const valueObjectPath = ['root'];
//     const typePath = ['typePath'];
//     const discriminator = 'type';
    
//     const userObject1: JzodObject = {
//       type: 'object',
//       definition: {
//         type: { type: 'literal', definition: 'user' } as JzodLiteral,
//         name: { type: 'string' }
//       }
//     };
    
//     const userObject2: JzodObject = {
//       type: 'object',
//       definition: {
//         type: { type: 'literal', definition: 'user' } as JzodLiteral,
//         name: { type: 'string' },
//         age: { type: 'number' }
//       }
//     };
    
//     const objectUnionChoices = [userObject1, userObject2];
    
//     // Act & Assert
//     expect(() => selectUnionBranchFromDiscriminator(
//       objectUnionChoices,
//       discriminator,
//       valueObject,
//       valueObjectPath,
//       typePath,
//       mockMiroirFundamentalJzodSchema,
//       mockCurrentModel,
//       mockMiroirMetaModel,
//       mockRelativeReferenceJzodContext
//     )).toThrow(/found many matches with discriminator/);
//   });

//   it('should handle multiple discriminators to resolve ambiguity', () => {
//     // Setup
//     const valueObject = { type: 'user', role: 'admin', name: 'John' };
//     const valueObjectPath = ['root'];
//     const typePath = ['typePath'];
//     const discriminator = ['type', 'role'];
    
//     const regularUserObject: JzodObject = {
//       type: 'object',
//       definition: {
//         type: { type: 'literal', definition: 'user' } as JzodLiteral,
//         role: { type: 'literal', definition: 'regular' } as JzodLiteral,
//         name: { type: 'string' }
//       }
//     };
    
//     const adminUserObject: JzodObject = {
//       type: 'object',
//       definition: {
//         type: { type: 'literal', definition: 'user' } as JzodLiteral,
//         role: { type: 'literal', definition: 'admin' } as JzodLiteral,
//         name: { type: 'string' }
//       }
//     };
    
//     const objectUnionChoices = [regularUserObject, adminUserObject];
    
//     // Act
//     const result = selectUnionBranchFromDiscriminator(
//       objectUnionChoices,
//       discriminator,
//       valueObject,
//       valueObjectPath,
//       typePath,
//       mockMiroirFundamentalJzodSchema,
//       mockCurrentModel,
//       mockMiroirMetaModel,
//       mockRelativeReferenceJzodContext
//     );
    
//     // Assert
//     expect(result.currentDiscriminatedObjectJzodSchema).toEqual(adminUserObject);
//     expect(result.chosenDiscriminator).toEqual([
//       {discriminator: 'type', value: 'user'},
//       {discriminator: 'role', value: 'admin'}
//     ]);
//   });

//   it('should handle enum discriminators', () => {
//     // Setup
//     const valueObject = { status: 'active', name: 'John' };
//     const valueObjectPath = ['root'];
//     const typePath = ['typePath'];
//     const discriminator = 'status';
    
//     const activeObject: JzodObject = {
//       type: 'object',
//       definition: {
//         status: { type: 'enum', definition: ['active', 'pending'] },
//         name: { type: 'string' }
//       }
//     };
    
//     const inactiveObject: JzodObject = {
//       type: 'object',
//       definition: {
//         status: { type: 'enum', definition: ['inactive', 'suspended'] },
//         name: { type: 'string' }
//       }
//     };
    
//     const objectUnionChoices = [activeObject, inactiveObject];
    
//     // Act
//     const result = selectUnionBranchFromDiscriminator(
//       objectUnionChoices,
//       discriminator,
//       valueObject,
//       valueObjectPath,
//       typePath,
//       mockMiroirFundamentalJzodSchema,
//       mockCurrentModel,
//       mockMiroirMetaModel,
//       mockRelativeReferenceJzodContext
//     );
    
//     // Assert
//     expect(result.currentDiscriminatedObjectJzodSchema).toEqual(activeObject);
//     expect(result.chosenDiscriminator).toEqual([{discriminator: 'status', value: 'active'}]);
//   });

//   it('should handle discrimination without discriminator by checking object structure', () => {
//     // Setup
//     const valueObject = { name: 'John', age: 30 };
//     const valueObjectPath = ['root'];
//     const typePath = ['typePath'];
//     const discriminator = undefined;
    
//     const personObject: JzodObject = {
//       type: 'object',
//       definition: {
//         name: { type: 'string' },
//         age: { type: 'number' }
//       }
//     };
    
//     const companyObject: JzodObject = {
//       type: 'object',
//       definition: {
//         name: { type: 'string' },
//         employees: { type: 'number' }
//       }
//     };
    
//     const objectUnionChoices = [personObject, companyObject];
    
//     // Act
//     const result = selectUnionBranchFromDiscriminator(
//       objectUnionChoices,
//       discriminator,
//       valueObject,
//       valueObjectPath,
//       typePath,
//       mockMiroirFundamentalJzodSchema,
//       mockCurrentModel,
//       mockMiroirMetaModel,
//       mockRelativeReferenceJzodContext
//     );
    
//     // Assert
//     expect(result.currentDiscriminatedObjectJzodSchema).toEqual(personObject);
//     expect(result.flattenedUnionChoices).toHaveLength(1);
//     expect(result.chosenDiscriminator).toEqual([]);
//   });
// });