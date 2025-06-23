// import { describe, it, expect } from 'vitest';
import type { JzodElement, JzodObject } from '@miroir-framework/jzod-ts';
import { JzodSchemaReferencesList } from '../../../src/1_core/jzod/JzodSchemaReferences';

describe('JzodSchemaReferencesList.unit', () => {
  it('returns empty array for a literal element', () => {
    const element: JzodElement = { type: 'literal', definition: 'testLiteral' };
    const refs = JzodSchemaReferencesList(element);
    expect(refs).toEqual([]);
  });

  it('detects a direct schemaReference element', () => {
    const refElement: JzodElement = { type: 'schemaReference', definition: { relativePath: 'a' } };
    const refs = JzodSchemaReferencesList(refElement);
    expect(refs).toEqual([refElement]);
  });

  it('detects schemaReference in an object extend (single value)', () => {
    const refElement: JzodElement = { type: 'schemaReference', definition: { relativePath: 'extended' } };
    const element: JzodElement = { type: 'object', extend: refElement, definition: { a: { type: "string" }} };
    const refs = JzodSchemaReferencesList(element);
    expect(refs).toEqual([refElement]);
  });

  it('detects schemaReference in an object extend (array)', () => {
    const refElement1: JzodElement = { type: 'schemaReference', definition: { relativePath: 'first' } };
    const refElement2: JzodElement = { type: 'schemaReference', definition: { relativePath: 'second' } };
    const nonRef: JzodElement = { type: 'literal', definition: 'no-ref' };
    const element: JzodObject = { type: 'object', extend: [refElement1, refElement2] as any, definition: { a: nonRef } };
    const refs = JzodSchemaReferencesList(element);
    expect(refs).toEqual([refElement1, refElement2]);
  });

  it('detects schemaReference in an object extend and definition', () => {
    const refElement1: JzodElement = { type: 'schemaReference', definition: { relativePath: 'first' } };
    const refElement2: JzodElement = { type: 'schemaReference', definition: { relativePath: 'second' } };
    const element: JzodObject = { type: 'object', extend: refElement1, definition: { a: refElement2 } };
    const refs = JzodSchemaReferencesList(element);
    expect(refs).toEqual([refElement1, refElement2]);
  });

  it('detects schemaReference in an object definition without taking extend into account', () => {
    const refElement1: JzodElement = { type: 'schemaReference', definition: { relativePath: 'first' } };
    const refElement2: JzodElement = { type: 'schemaReference', definition: { relativePath: 'second' } };
    const element: JzodObject = { type: 'object', extend: refElement1, definition: { a: refElement2 } };
    const refs = JzodSchemaReferencesList(element, false);
    expect(refs).toEqual([refElement2]);
  });

  it('recursively detects schemaReference in union definitions', () => {
    const refInUnion: JzodElement = { type: 'schemaReference', definition: { relativePath: 'unionRef' } };
    const element: JzodElement = { type: 'union', definition: [refInUnion, { type: 'number' }] };
    const refs = JzodSchemaReferencesList(element);
    expect(refs).toEqual([refInUnion]);
  });

  it('recursively detects schemaReference in intersection definitions', () => {
    const leftRef: JzodElement = { type: 'schemaReference', definition: { relativePath: 'left' } };
    const rightRef: JzodElement = { type: 'schemaReference', definition: { relativePath: 'right' } };
    const element: JzodElement = {
      type: 'intersection',
      definition: { left: leftRef, right: rightRef },
    };
    const refs = JzodSchemaReferencesList(element);
    expect(refs).toEqual([leftRef, rightRef]);
  });

  it('recursively detects schemaReference in function arguments/returns', () => {
    const argRef: JzodElement = { type: 'schemaReference', definition: { relativePath: 'argRef' } };
    const returnRef: JzodElement = { type: 'schemaReference', definition: { relativePath: 'returnRef' } };
    const element: JzodElement = {
      type: 'function',
      definition: {
        args: [argRef, { type: 'string' }],
        returns: returnRef,
      },
    };
    const refs = JzodSchemaReferencesList(element);
    expect(refs).toEqual([argRef, returnRef]);
  });

  // it('recursively detects schemaReference in nested structures', () => {
  //   const deepRef: JzodElement = { type: 'schemaReference', definition: { relativePath: 'deep' } };
  //   const unionNode: JzodElement = { type: 'union', definition: [{ type: 'number' }, deepRef] };
  //   const arrayNode: JzodElement = { type: 'array', definition: unionNode };
  //   const objectNode: JzodElement = { type: 'object', extend: [{ type: 'literal', definition: 'ignore' }, arrayNode] };
  //   const refs = JzodSchemaReferencesList(objectNode);
  //   expect(refs).toEqual([deepRef]);
  // });
});