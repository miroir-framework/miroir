import { describe, it, expect } from 'vitest';
import type { JzodElement, JzodObject, JzodReference } from '@miroir-framework/jzod-ts';
import { JzodSchemaReferencesList, JzodSchemaReferencesSet, jzodTransitiveDependencySet } from '../../src/1_core/jzod/JzodSchemaReferences';

describe('jzodTransitiveDependencySet.unit', () => {
  // describe('JzodSchemaReferencesList', () => {
  //   it('returns empty array for a literal element', () => {
  //     const element: JzodElement = { type: 'literal', definition: 'testLiteral' };
  //     const refs = JzodSchemaReferencesList(element);
  //     expect(refs).toEqual([]);
  //   });

  //   it('detects a direct schemaReference element', () => {
  //     const refElement: JzodReference = { type: 'schemaReference', definition: { relativePath: 'a' } };
  //     const refs = JzodSchemaReferencesList(refElement);
  //     expect(refs).toEqual([refElement]);
  //   });

  //   it('detects schemaReference in an object extend (single value)', () => {
  //     const refElement: JzodReference = { type: 'schemaReference', definition: { relativePath: 'extended' } };
  //     const element: JzodObject = { type: 'object', extend: refElement, definition: { a: { type: "string" }} };
  //     const refs = JzodSchemaReferencesList(element);
  //     expect(refs).toEqual([refElement]);
  //   });

  //   it('detects schemaReference in an object extend (array)', () => {
  //     const refElement1: JzodReference = { type: 'schemaReference', definition: { relativePath: 'first' } };
  //     const refElement2: JzodReference = { type: 'schemaReference', definition: { relativePath: 'second' } };
  //     const element: JzodObject = { type: 'object', extend: [refElement1, refElement2], definition: { a: { type: "string" } } };
  //     const refs = JzodSchemaReferencesList(element);
  //     expect(refs).toEqual([refElement1, refElement2]);
  //   });

  //   it('detects schemaReference in object definition without extend', () => {
  //     const refElement: JzodReference = { type: 'schemaReference', definition: { relativePath: 'inner' } };
  //     const element: JzodObject = { type: 'object', definition: { a: refElement } };
  //     const refs = JzodSchemaReferencesList(element);
  //     expect(refs).toEqual([refElement]);
  //   });
  // });

  describe('JzodSchemaReferencesSet', () => {
    it('returns empty Set for a literal element', () => {
      const element: JzodElement = { type: 'literal', definition: 'testLiteral' };
      const refs = JzodSchemaReferencesSet(element);
      expect(refs).toEqual(new Set<JzodReference>([]));
    });

    it('detects a direct schemaReference element', () => {
      const refElement: JzodElement = { type: 'schemaReference', definition: { relativePath: 'a' } };
      const refs = JzodSchemaReferencesSet(refElement);
      expect(refs).toEqual(new Set<JzodReference>([refElement]));
    });
  });

  describe('jzodTransitiveDependencySet', () => {
    it('finds direct dependency', () => {
      const schema: JzodReference = {
        type: 'schemaReference',
        definition: { relativePath: 'root' },
        context: {
          'root': { type: 'object', definition: { a: { type: 'string' } } }
        }
      };

      const deps = jzodTransitiveDependencySet(schema, 'root');
      expect(deps).toEqual(new Set(['root']));
    });

    it('finds single level dependencies', () => {
      const refB: JzodReference = { type: 'schemaReference', definition: { relativePath: 'B' } };
      const schema: JzodReference = {
        type: 'schemaReference',
        definition: { relativePath: 'A' },
        context: {
          'A': { type: 'object', definition: { b: refB } },
          'B': { type: 'string' }
        }
      };

      const deps = jzodTransitiveDependencySet(schema, 'A');
      expect(deps).toEqual(new Set(['A', 'B']));
    });

    it('finds transitive dependencies', () => {
      const refB: JzodReference = { type: 'schemaReference', definition: { relativePath: 'B' } };
      const refC: JzodReference = { type: 'schemaReference', definition: { relativePath: 'C' } };
      const schema: JzodReference = {
        type: 'schemaReference',
        definition: { relativePath: 'A' },
        context: {
          'A': { type: 'object', definition: { b: refB } },
          'B': { type: 'object', definition: { c: refC } },
          'C': { type: 'string' }
        }
      };

      const deps = jzodTransitiveDependencySet(schema, 'A');
      expect(deps).toEqual(new Set(['A', 'B', 'C']));
    });

    it('handles circular dependencies', () => {
      const refB: JzodReference = { type: 'schemaReference', definition: { relativePath: 'B' } };
      const refA: JzodReference = { type: 'schemaReference', definition: { relativePath: 'A' } };
      const schema: JzodReference = {
        type: 'schemaReference',
        definition: { relativePath: 'A' },
        context: {
          'A': { type: 'object', definition: { b: refB } },
          'B': { type: 'object', definition: { a: refA } }
        }
      };

      const deps = jzodTransitiveDependencySet(schema, 'A');
      expect(deps).toEqual(new Set(['A', 'B']));
    });

    it('throws error when context is missing', () => {
      const schema: JzodReference = {
        type: 'schemaReference',
        definition: { relativePath: 'A' }
      };

      expect(() => jzodTransitiveDependencySet(schema, 'A')).toThrow('miroirFundamentalJzodSchema.context is not defined');
    });

    it('throws error when element not found in context', () => {
      const schema: JzodReference = {
        type: 'schemaReference',
        definition: { relativePath: 'A' },
        context: {
          'B': { type: 'string' }
        }
      };

      expect(() => jzodTransitiveDependencySet(schema, 'A')).toThrow('Element A not found in context');
    });
  });
});