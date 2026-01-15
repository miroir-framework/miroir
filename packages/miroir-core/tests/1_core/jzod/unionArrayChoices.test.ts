import { unionArrayChoices } from '../../../src/1_core/jzod/jzodTypeCheck';
import {
  JzodElement,
  JzodArray,
  JzodTuple,
  JzodUnion,
  MlSchema,
  MetaModel,
// } from "../src/1_core/jzod/types";
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import { resolveJzodSchemaReferenceInContext } from '../../../src/1_core/jzod/jzodResolveSchemaReferenceInContext';
import { defaultMiroirMetaModel } from '../../test_assets/defaultMiroirMetaModel';
import { defaultMetaModelEnvironment } from '../../../src/1_core/Model';

const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as MlSchema;


describe('unionArrayChoices', () => {
  const mockJzodStringArray: JzodArray = {
    type: 'array',
    definition: { type: 'string' }
  };

  const mockJzodNumberArray: JzodArray = {
    type: 'array',
    definition: { type: 'number' }
  };

  const mockJzodTuple: JzodTuple = {
    type: 'tuple',
    definition: []
  };

  const mockJzodUnion: JzodUnion = {
    type: 'union',
    definition: [mockJzodStringArray, mockJzodTuple]
  };

  const mockConcreteUnrolledJzodSchemas: JzodElement[] = [
    mockJzodStringArray,
    mockJzodTuple,
    mockJzodUnion
  ];

  const mockRelativeReferenceJzodContext: { [k: string]: JzodElement } = {
    'referenceToStringArray': mockJzodStringArray,
    'referenceToNumberArray': mockJzodNumberArray,
    'referenceToTuple': mockJzodTuple,
    'referenceToUnion': mockJzodUnion,
  };

  // ##############################################################################################
  it('should return array and tuple schemas directly from concreteUnrolledJzodSchemas', () => {
    const result = unionArrayChoices(
      mockConcreteUnrolledJzodSchemas,
      defaultMetaModelEnvironment,
      // castMiroirFundamentalJzodSchema,
      // defaultMiroirMetaModel,
      // defaultMiroirMetaModel,
      mockRelativeReferenceJzodContext
    );

    expect(result).toContain(mockJzodStringArray);
    expect(result).toContain(mockJzodTuple);
  });

  // ##############################################################################################
  it('should handle schema references within unions', () => {
    const mockJzodReference: JzodElement = {
      type: 'schemaReference',
      context: {},
      definition: {
        relativePath: 'referenceToStringArray'
      }
    };

    const mockUnionWithReference: JzodUnion = {
      type: 'union',
      definition: [mockJzodReference, { type: "string"}]
    };

    const mockConcreteUnrolledJzodSchemasWithReference: JzodElement[] = [
      mockUnionWithReference
    ];

    const result = unionArrayChoices(
      mockConcreteUnrolledJzodSchemasWithReference,
      defaultMetaModelEnvironment,
      // castMiroirFundamentalJzodSchema,
      // defaultMiroirMetaModel,
      // defaultMiroirMetaModel,
      mockRelativeReferenceJzodContext
    );

    expect(result).toEqual(expect.any(Array));
    expect(result).toContain(mockJzodStringArray);
  });
});
