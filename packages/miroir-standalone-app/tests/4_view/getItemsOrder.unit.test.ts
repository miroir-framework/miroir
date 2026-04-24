import { describe, it, expect } from 'vitest';
import { JzodElement, JzodObject, KeyMapEntry } from 'miroir-core';
import { getItemsOrder } from '../../src/miroir-fwk/4_view/components/ValueObjectEditor/JzodElementEditorHooks';

// Helper to create a KeyMapEntry whose resolvedReferenceSchemaInContext marks a record type.
// Note: resolvedReferenceSchemaInContext is defined in the Jzod schema for KeyMapEntry
// but is not yet reflected in the TypeScript interface, so we cast.
const makeRecordKeyMapEntry = (): KeyMapEntry =>
  ({
    rawSchema: { type: 'string' } as JzodElement,
    resolvedSchema: { type: 'string' } as JzodElement,
    resolvedReferenceSchemaInContext: { type: 'record', definition: { type: 'string' } } as JzodElement,
  } as unknown as KeyMapEntry);

// Helper to attach a tag.value.id to a JzodElement definition entry
const withId = (id: number): JzodElement => ({ type: 'string', tag: { value: { id } } } as any);
const noId = (): JzodElement => ({ type: 'string' } as any);

describe('getItemsOrder', () => {
  // ─────────────────────────────────────────────────────────────
  // Edge-cases / default path: returns []
  // ─────────────────────────────────────────────────────────────
  describe('returns [] for non-qualifying inputs', () => {
    it('returns [] when currentValue is null', () => {
      expect(getItemsOrder(null, undefined, undefined, undefined)).toEqual([]);
    });

    it('returns [] when currentValue is undefined', () => {
      expect(getItemsOrder(undefined, undefined, undefined, undefined)).toEqual([]);
    });

    it('returns [] when currentValue is a string', () => {
      expect(getItemsOrder('hello', undefined, undefined, undefined)).toEqual([]);
    });

    it('returns [] when currentValue is a number', () => {
      expect(getItemsOrder(42, undefined, undefined, undefined)).toEqual([]);
    });

    it('returns [] for a plain object when no schema signals object/record', () => {
      expect(getItemsOrder({ a: 1 }, undefined, undefined, undefined)).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Array path
  // ─────────────────────────────────────────────────────────────
  describe('array values', () => {
    it('returns [] for an empty array', () => {
      expect(getItemsOrder([], undefined, undefined, undefined)).toEqual([]);
    });

    it('returns [0] for a single-element array', () => {
      expect(getItemsOrder([42], undefined, undefined, undefined)).toEqual([0]);
    });

    it('returns indices [0,1,2] for a three-element array', () => {
      expect(getItemsOrder(['a', 'b', 'c'], undefined, undefined, undefined)).toEqual([0, 1, 2]);
    });

    it('returns indices in order regardless of element values', () => {
      const arr = [{ name: 'z' }, { name: 'a' }, { name: 'm' }];
      expect(getItemsOrder(arr, undefined, undefined, undefined)).toEqual([0, 1, 2]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Record type — detected via rawMLSchema.type === "record"
  // ─────────────────────────────────────────────────────────────
  describe('record type detected via rawMLSchema', () => {
    const rawRecordSchema: JzodElement = { type: 'record', definition: { type: 'string' } } as any;

    it('returns [] for an empty record object', () => {
      expect(getItemsOrder({}, rawRecordSchema, undefined, undefined)).toEqual([]);
    });

    it('returns keys in insertion order when no entry carries a tag.value.id', () => {
      const value = { b: { name: 'B' }, a: { name: 'A' }, c: { name: 'C' } };
      expect(getItemsOrder(value, rawRecordSchema, undefined, undefined))
        .toEqual(['b', 'a', 'c']);
    });

    it('sorts all entries ascending by tag.value.id when every entry has one', () => {
      const value = {
        c: { tag: { value: { id: 3 } }, name: 'C' },
        a: { tag: { value: { id: 1 } }, name: 'A' },
        b: { tag: { value: { id: 2 } }, name: 'B' },
      };
      expect(getItemsOrder(value, rawRecordSchema, undefined, undefined))
        .toEqual(['a', 'b', 'c']);
    });

    it('puts id-carrying entries first (sorted ascending), then id-less entries in insertion order', () => {
      const value = {
        noId1: { name: 'NoId1' },
        withId2: { tag: { value: { id: 2 } }, name: 'WithId2' },
        noId2: { name: 'NoId2' },
        withId1: { tag: { value: { id: 1 } }, name: 'WithId1' },
      };
      expect(getItemsOrder(value, rawRecordSchema, undefined, undefined))
        .toEqual(['withId1', 'withId2', 'noId1', 'noId2']);
    });

    it('ignores non-numeric id values (treats them as missing)', () => {
      // only numeric typeof id is treated as an id
      const value = {
        stringId: { tag: { value: { id: 'first' } } },
        numId: { tag: { value: { id: 1 } } },
        noId: {},
      };
      expect(getItemsOrder(value, rawRecordSchema, undefined, undefined))
        .toEqual(['numId', 'stringId', 'noId']);
    });

    it('returns keys in insertion order when no entries have numeric ids (no id at all)', () => {
      const value = { z: {}, m: {}, a: {} };
      expect(getItemsOrder(value, rawRecordSchema, undefined, undefined))
        .toEqual(['z', 'm', 'a']);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Record type — detected via resolvedSchemaReference
  // ─────────────────────────────────────────────────────────────
  describe('record type detected via resolvedSchemaReference', () => {
    // const recordKeyMapEntry = makeRecordKeyMapEntry();

    it('schemaReference: returns keys in insertion order when no entry has a tag.value.id', () => {
      const value = { b: {}, a: {} };
      expect(getItemsOrder(value, undefined, undefined, undefined, { type: 'record', definition: { type: 'string' } } as JzodElement))
        .toEqual(['b', 'a']);
    });

    it('schemaReference: sorts entries with ids first, then id-less entries', () => {
      const value = {
        b: { tag: { value: { id: 2 } } },
        noId: {},
        a: { tag: { value: { id: 1 } } },
      };
      expect(getItemsOrder(value, undefined, undefined, undefined, { type: 'record', definition: { type: 'string' } } as JzodElement))
        .toEqual(['a', 'b', 'noId']);
    });

    it('schemaReference: also works when rawMLSchema is a record at the same time (consistent result)', () => {
      const rawRecordSchema: JzodElement = { type: 'record', definition: { type: 'string' } } as any;
      const value = {
        b: { tag: { value: { id: 2 } } },
        a: { tag: { value: { id: 1 } } },
      };
      const resultViaRaw = getItemsOrder(value, rawRecordSchema, undefined, undefined);
      const resultViaKeyMap = getItemsOrder(value, undefined, undefined, undefined, { type: 'record', definition: { type: 'string' } } as JzodElement);
      expect(resultViaRaw).toEqual(resultViaKeyMap);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Typed object path — resolvedMLSchema.type === "object"
  // (and rawMLSchema is NOT "record" / keymap does NOT signal "record")
  // ─────────────────────────────────────────────────────────────
  describe('typed object — resolvedMLSchema.type === "object"', () => {
    const resolvedObjectSchema: JzodElement = { type: 'object', definition: {} } as any;

    it('returns [] for an empty currentValue object', () => {
      const flatSchema: JzodObject = {
        type: 'object',
        definition: { a: withId(1), b: withId(2) },
      };
      const rawSchema: JzodElement = { type: 'object', definition: {} } as any;
      expect(getItemsOrder({}, rawSchema, flatSchema, resolvedObjectSchema)).toEqual([]);
    });

    it('sorts present attribute keys by tag.value.id ascending', () => {
      const flatSchema: JzodObject = {
        type: 'object',
        definition: {
          a: withId(2),
          b: withId(1),
          c: withId(3),
        },
      };
      const rawSchema: JzodElement = { type: 'object', definition: {} } as any;
      const value = { a: 'A', b: 'B', c: 'C' };
      expect(getItemsOrder(value, rawSchema, flatSchema, resolvedObjectSchema))
        .toEqual(['b', 'a', 'c']);
    });

    it('puts id-less attributes after id-carrying attributes', () => {
      const flatSchema: JzodObject = {
        type: 'object',
        definition: {
          noId: noId(),
          withId: withId(1),
        },
      };
      const rawSchema: JzodElement = { type: 'object', definition: {} } as any;
      const value = { noId: 'x', withId: 'y' };
      expect(getItemsOrder(value, rawSchema, flatSchema, resolvedObjectSchema))
        .toEqual(['withId', 'noId']);
    });

    it('excludes attributes absent from currentValue', () => {
      const flatSchema: JzodObject = {
        type: 'object',
        definition: {
          present: withId(1),
          absent: withId(2),
        },
      };
      const rawSchema: JzodElement = { type: 'object', definition: {} } as any;
      const value = { present: 'here' }; // 'absent' is not in currentValue
      expect(getItemsOrder(value, rawSchema, flatSchema, resolvedObjectSchema))
        .toEqual(['present']);
    });

    it('uses flattenedMLSchema.definition when rawMLSchema.type === "object"', () => {
      // flatSchema: first=id1, second=id2  → order: first, second
      // resolvedSchema: second=id1, first=id2 → order would be: second, first
      // rawMLSchema.type === "object" → flattenedMLSchema wins
      const flatSchema: JzodObject = {
        type: 'object',
        definition: {
          first: withId(1),
          second: withId(2),
        },
      };
      const resolvedSchemaWithDifferentOrder: JzodElement = {
        type: 'object',
        definition: {
          second: withId(1), // reversed ids
          first: withId(2),
        },
      } as any;
      const rawSchema: JzodElement = { type: 'object', definition: {} } as any;
      const value = { first: 'a', second: 'b' };
      expect(getItemsOrder(value, rawSchema, flatSchema, resolvedSchemaWithDifferentOrder))
        .toEqual(['first', 'second']);
    });

    it('uses resolvedMLSchema.definition when rawMLSchema is undefined (not type "object")', () => {
      // When rawMLSchema is undefined, (resolvedMLSchema as any)?.definition is used.
      // resolvedSchema: first=id1, second=id2  → order: first, second
      const resolvedSchema: JzodElement = {
        type: 'object',
        definition: {
          first: withId(1),
          second: withId(2),
        },
      } as any;
      const flatSchema: JzodObject = {
        type: 'object',
        definition: {
          second: withId(1), // different ordering — should NOT be used
          first: withId(2),
        },
      };
      const value = { first: 'a', second: 'b' };
      expect(getItemsOrder(value, undefined, flatSchema, resolvedSchema))
        .toEqual(['first', 'second']);
    });

    it('returns all id-less attributes in schema-definition order when no ids are present', () => {
      const flatSchema: JzodObject = {
        type: 'object',
        definition: {
          z: noId(),
          m: noId(),
          a: noId(),
        },
      };
      const rawSchema: JzodElement = { type: 'object', definition: {} } as any;
      const value = { z: 1, m: 2, a: 3 };
      // withId is empty → sorted (empty), withoutId contains all keys in Object.keys(definition) order filtered by presence
      expect(getItemsOrder(value, rawSchema, flatSchema, resolvedObjectSchema))
        .toEqual(['z', 'm', 'a']);
    });
  });
});
