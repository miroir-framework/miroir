import { describe, it, expect } from 'vitest';
import {

stringTuple,
circularReplacer,
domainStateToDeploymentEntityState,
safeResolvePathOnObject,
resolvePathOnObject,
ResultAccessPath,
} from '../src/tools';

describe("stringTuple", () => {
  it("returns the tuple as is", () => {
    const result = stringTuple("a", "b", "c");
    expect(result).toEqual(["a", "b", "c"]);
  });
});

// describe("circularReplacer", () => {
//   it("removes circular references", () => {
//     const obj: any = { a: 1 };
//     obj.self = obj;
//     const replacer = circularReplacer();
//     const str = JSON.stringify(obj, replacer);
//     expect(str).toContain('"a":1');
//     expect(str).not.toContain("self");
//   });

//   it("returns value for non-object", () => {
//     const replacer = circularReplacer();
//     expect(replacer("key", 42)).toBe(42);
//   });
// });

describe("domainStateToDeploymentEntityState", () => {
  it("converts domainState to DeploymentEntityState", () => {
    const domainState = {
      dep1: {
        sectionA: {
          entity1: {
            inst1: { foo: 1 },
            inst2: { foo: 2 },
          },
        },
      },
    };
    const result = domainStateToDeploymentEntityState(domainState as any);
    const keys = Object.keys(result);
    expect(keys.length).toBe(1);
    const state = result[keys[0]];
    expect(state.ids).toEqual(["inst1", "inst2"]);
    expect(state.entities).toEqual({
      inst1: { foo: 1 },
      inst2: { foo: 2 },
    });
  });
});

describe("safeResolvePathOnObject", () => {
  const obj = {
    a: {
      b: [{ c: 1 }, { c: 2 }],
    },
    d: 42,
  };

  it("resolves a valid path", () => {
    const path: ResultAccessPath = ["a", "b", 1, "c"];
    expect(safeResolvePathOnObject(obj, path)).toBe(2);
  });

  it("returns undefined for invalid path", () => {
    const path: ResultAccessPath = ["a", "x", "y"];
    expect(safeResolvePathOnObject(obj, path)).toBeUndefined();
  });

  it("handles empty path", () => {
    expect(safeResolvePathOnObject(obj, [])).toBe(obj);
  });

  it("handles map type in path", () => {
    const arr = [{ foo: 1 }, { foo: 2 }];
    const path: ResultAccessPath = [{ type: "map", key: "foo" }];
    expect(safeResolvePathOnObject(arr, path)).toEqual([1, 2]);
  });
});

describe("resolvePathOnObject", () => {
  const obj = {
    a: {
      b: [{ c: 1 }, { c: 2 }, { c: undefined }],
    },
    d: 42,
  };

  it("resolves a valid path", () => {
    const path: ResultAccessPath = ["a", "b", 0, "c"];
    expect(resolvePathOnObject(obj, path)).toBe(1);
  });

  it("resolves a valid path when value is undefined", () => {
    const path: ResultAccessPath = ["a", "b", 2, "c"];
    expect(resolvePathOnObject(obj, path)).toBe(undefined);
  });

  it("throws on invalid path", () => {
    const path: ResultAccessPath = ["a", "x", "y"];
    expect(() => resolvePathOnObject(obj, path)).toThrow();
  });

  it("handles map type in path", () => {
    const arr = [{ foo: 1 }, { foo: 2 }];
    const path: ResultAccessPath = [{ type: "map", key: "foo" }];
    expect(resolvePathOnObject(arr, path)).toEqual([1, 2]);
  });
});