import { describe, it, expect } from 'vitest';
import {

stringTuple,
circularReplacer,
domainStateToReduxDeploymentsState,
safeResolvePathOnObject,
resolvePathOnObject,
AbsolutePath,
resolveRelativePath,
} from '../src/tools';
import { mergeIfUnique, pushIfUnique } from '../src/1_core/tools';
import { ZodParseErrorIssue } from '../dist';
import path from 'path';

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

describe("domainStateToReduxDeploymentsState", () => {
  it("converts domainState to ReduxDeploymentsState", () => {
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
    const result = domainStateToReduxDeploymentsState(domainState as any);
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
    const path: AbsolutePath = ["a", "b", 1, "c"];
    expect(safeResolvePathOnObject(obj, path)).toBe(2);
  });

  it("returns undefined for invalid path", () => {
    const path: AbsolutePath = ["a", "x", "y"];
    expect(safeResolvePathOnObject(obj, path)).toBeUndefined();
  });

  it("handles empty path", () => {
    expect(safeResolvePathOnObject(obj, [])).toBe(obj);
  });

  it("handles map type in path", () => {
    const arr = [{ foo: 1 }, { foo: 2 }];
    const path: AbsolutePath = [{ type: "map", key: "foo" }];
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
    const path: AbsolutePath = ["a", "b", 0, "c"];
    expect(resolvePathOnObject(obj, path)).toBe(1);
  });

  it("resolves a valid path when value is undefined", () => {
    const path: AbsolutePath = ["a", "b", 2, "c"];
    expect(resolvePathOnObject(obj, path)).toBe(undefined);
  });

  it("throws on invalid path", () => {
    const path: AbsolutePath = ["a", "x", "y"];
    expect(() => resolvePathOnObject(obj, path)).toThrow();
  });

  it("handles map type in path", () => {
    const arr = [{ foo: 1 }, { foo: 2 }];
    const path: AbsolutePath = [{ type: "map", key: "foo" }];
    expect(resolvePathOnObject(arr, path)).toEqual([1, 2]);
  });
});

describe("pushIfUnique", () => {
  it("adds the item when the array is empty", () => {
    const array: number[] = [];
    pushIfUnique(array, 1);
    expect(array).toEqual([1]);
  });

  it("adds the item when it doesn't exist in the array", () => {
    const array = [1, 2, 3];
    pushIfUnique(array, 4);
    expect(array).toEqual([1, 2, 3, 4]);
  });

  it("doesn't add the item when it already exists in the array", () => {
    const array = [1, 2, 3];
    pushIfUnique(array, 2);
    expect(array).toEqual([1, 2, 3]);
  });

  it("handles objects with deep equality check", () => {
    const array = [{ a: 1 }, { b: 2 }];
    pushIfUnique(array, { a: 1 });
    expect(array).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("adds different objects", () => {
    const array = [{ a: 1 }, { b: 2 }];
    pushIfUnique(array, { c: 3 } as any);
    expect(array).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it("works with complex nested objects", () => {
    const array = [{ a: { b: [1, 2] } }];
    pushIfUnique(array, { a: { b: [1, 2] } });
    pushIfUnique(array, { a: { b: [1, 3] } });
    expect(array).toEqual([{ a: { b: [1, 2] } }, { a: { b: [1, 3] } }]);
  });

  it("handles Zod ParseError objects", () => {
    const array: any[] = [];
    // const error = new Error("Test error");
    // (error as any).issues = [{ code: "test", message: "Test issue" }];
    const errors = [
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object, received string",
      },
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object, received string",
      },
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object, received string",
      },
    ];
    errors.forEach(error => {
      // error.issues = [error];
      pushIfUnique(array, error);
    });
    // pushIfUnique(array, error);
    expect(array).toEqual([
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object, received string",
      },
    ]);
  });
});

describe("mergeIfUnique", () => {
  it("adds all items to an empty array", () => {
    const array: number[] = [];
    mergeIfUnique(array, [1, 2, 3]);
    expect(array).toEqual([1, 2, 3]);
  });

  it("only adds items that don't exist in the array", () => {
    const array = [1, 2, 3];
    mergeIfUnique(array, [3, 4, 5]);
    expect(array).toEqual([1, 2, 3, 4, 5]);
  });

  it("doesn't modify the array when all items already exist", () => {
    const array = [1, 2, 3];
    mergeIfUnique(array, [1, 2, 3]);
    expect(array).toEqual([1, 2, 3]);
  });

  it("handles objects with deep equality check", () => {
    const array = [{ a: 1 }, { b: 2 }];
    mergeIfUnique(array, [{ a: 1 }, { c: 3 } as any]);
    expect(array).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it("works with duplicate items in the input array", () => {
    const array: number[] = [];
    mergeIfUnique(array, [1, 2, 2, 3, 3, 3]);
    expect(array).toEqual([1, 2, 3]);
  });

  it("handles complex nested objects", () => {
    const array = [{ a: { b: [1, 2] } }];
    mergeIfUnique(array, [
      { a: { b: [1, 2] } },
      { a: { b: [1, 3] } },
      { a: { b: [1, 4] } }
    ]);
    expect(array).toEqual([
      { a: { b: [1, 2] } },
      { a: { b: [1, 3] } },
      { a: { b: [1, 4] } }
    ]);
  });

  it("works with empty input array", () => {
    const array = [1, 2, 3];
    mergeIfUnique(array, []);
    expect(array).toEqual([1, 2, 3]);
  });

  it("handles Zod ParseError objects", () => {
    const array: ZodParseErrorIssue[] = [
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object, received string",
      },
    ];
    // const error = new Error("Test error");
    // (error as any).issues = [{ code: "test", message: "Test issue" }];
    const errors: ZodParseErrorIssue[] = [
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object, received string",
      },
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object, received string",
      },
    ];
    mergeIfUnique(array, errors);
    expect(array).toEqual([
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object, received string",
      },
    ]);
  });
});

describe("resolveRelativePath", () => {
  const obj = {
    a: {
      b: [
        { c: 1, d: { e: 10 } },
        { c: 2, d: { e: 20 } }
      ],
      x: 99
    },
    z: 42
  };

  it("resolves path without parent reference", () => {
    const initialPath: AbsolutePath = ["a", "b", 0, "d"];
    const path: AbsolutePath = ["e"];
    expect(resolveRelativePath(obj, initialPath, path)).toBe(10);
  });

  it("resolves path with parent reference (#)", () => {
    const initialPath: AbsolutePath = ["a", "b", 1, "d"];
    const path: AbsolutePath = ["#", "d", "e"];
    expect(resolveRelativePath(obj, initialPath, path)).toBe(20);
  });

  it("handles multiple parent references", () => {
    const initialPath: AbsolutePath = ["a", "b", 1, "d"];
    const path: AbsolutePath = ["#", "#", "#", "x"];
    expect(resolveRelativePath(obj, initialPath, path)).toBe(99);
  });

  it("throws if parent reference goes above root", () => {
    const initialPath: AbsolutePath = ["a", "b", 0];
    const path: AbsolutePath = ["#", "#", "#", "#"];
    expect(() => resolveRelativePath(obj, initialPath, path)).toThrow("No parent to go up to with '#'");
  });

  it("throws if initialPath traverses non-array with map segment", () => {
    const badObj = { foo: { bar: 1 } };
    const initialPath: AbsolutePath = ["foo", { type: "map", key: "bar" }];
    const path: AbsolutePath = [];
    expect(() => resolveRelativePath(badObj, initialPath, path)).toThrow("Initial path traverses non-array with map segment");
  });

  it("throws if initialPath segment not found", () => {
    const initialPath: AbsolutePath = ["a", "y"];
    const path: AbsolutePath = [];
    expect(() => resolveRelativePath(obj, initialPath, path)).toThrow('path segment \'y\' not found in object {"b":[{"c":1,"d":{"e":10}},{"c":2,"d":{"e":20}}],"x":99}');
  });

  it("throws if map segment on non-array in path", () => {
    const initialPath: AbsolutePath = ["a"];
    const path: AbsolutePath = [{ type: "map", key: "x" }];
    expect(() => resolveRelativePath(obj, initialPath, path)).toThrow("resolveRelativePath: map segment on non-array");
  });

  it("throws if segment not found in path", () => {
    const initialPath: AbsolutePath = ["a", "b", 0];
    const path: AbsolutePath = ["y"];
    expect(() => resolveRelativePath(obj, initialPath, path)).toThrow('path segment \'y\' not found in object {"c":1,"d":{"e":10}}');
  });

  it("works with array map segment in initialPath", () => {
    const arrObj = { arr: [{ foo: 1 }, { foo: 2 }] };
    const initialPath: AbsolutePath = ["arr", { type: "map", key: "foo" }];
    const path: AbsolutePath = [];
    expect(resolveRelativePath(arrObj, initialPath, path)).toEqual([1, 2]);
  });

  it("works with array map segment in path", () => {
    const arrObj = { arr: [{ foo: { bar: 1 } }, { foo: { bar: 2 } }] };
    const initialPath: AbsolutePath = ["arr"];
    const path: AbsolutePath = [{ type: "map", key: "foo" }, { type: "map", key: "bar" }];
    expect(resolveRelativePath(arrObj, initialPath, path)).toEqual([1, 2]);
  });
});
