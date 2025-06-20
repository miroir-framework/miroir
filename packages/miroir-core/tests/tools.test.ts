import { describe, it, expect } from 'vitest';
import {

stringTuple,
circularReplacer,
domainStateToDeploymentEntityState,
safeResolvePathOnObject,
resolvePathOnObject,
ResultAccessPath,
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