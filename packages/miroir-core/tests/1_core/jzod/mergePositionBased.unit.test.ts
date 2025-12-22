import { mergePositionBased } from "../../../src/1_core/jzod/JzodToJzod";

describe(
  'mergePositionBased',
  () => {
    // ###########################################################################################
    it(
      'merges two undefineds into undefined',
      () => {
        const result = mergePositionBased(
          undefined,
          undefined
        );
        expect(result).toEqual(
          undefined
        );
      }
    )

    // ###########################################################################################
    it(
      'merges undefined and string into single element array',
      () => {
        const result = mergePositionBased(
          undefined,
          "test"
        );
        expect(result).toEqual(
          ["test"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges string and undefined into single element array',
      () => {
        const result = mergePositionBased(
          "test",
          undefined
        );
        expect(result).toEqual(
          ["test"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges two strings at same position into nested array',
      () => {
        const result = mergePositionBased(
          "a",
          "b"
        );
        expect(result).toEqual(
          [["a", "b"]]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges string and array with single element',
      () => {
        const result = mergePositionBased(
          "x",
          ["y", "z"]
        );
        expect(result).toEqual(
          [["x", "y"], "z"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges array and string at first position',
      () => {
        const result = mergePositionBased(
          ["a", "b"],
          "c"
        );
        expect(result).toEqual(
          [["a", "c"], "b"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges two arrays of same length with strings',
      () => {
        const result = mergePositionBased(
          ["a", "b"],
          ["c", "d"]
        );
        expect(result).toEqual(
          [["a", "c"], ["b", "d"]]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges arrays with nested arrays at positions',
      () => {
        const result = mergePositionBased(
          ["a", ["b", "c"]],
          ["d", ["e", "f"]]
        );
        expect(result).toEqual(
          [["a", "d"], ["b", "c", "e", "f"]]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges arrays of different lengths - first longer',
      () => {
        const result = mergePositionBased(
          ["a", "b", "c"],
          ["x"]
        );
        expect(result).toEqual(
          [["a", "x"], "b", "c"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges arrays of different lengths - second longer',
      () => {
        const result = mergePositionBased(
          ["a"],
          ["x", "y", "z"]
        );
        expect(result).toEqual(
          [["a", "x"], "y", "z"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges string with nested array',
      () => {
        const result = mergePositionBased(
          "single",
          [["nested1", "nested2"]]
        );
        expect(result).toEqual(
          [["single", "nested1", "nested2"]]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges nested array with string',
      () => {
        const result = mergePositionBased(
          [["nested1", "nested2"]],
          "single"
        );
        expect(result).toEqual(
          [["nested1", "nested2", "single"]]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges undefined with array',
      () => {
        const result = mergePositionBased(
          undefined,
          ["a", "b"]
        );
        expect(result).toEqual(
          ["a", "b"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges array with undefined',
      () => {
        const result = mergePositionBased(
          ["a", "b"],
          undefined
        );
        expect(result).toEqual(
          ["a", "b"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges complex nested structure',
      () => {
        const result = mergePositionBased(
          ["a", ["b", "c"], "d"],
          [["e", "f"], "g", ["h", "i"]]
        );
        expect(result).toEqual(
          [["a", "e", "f"], ["b", "c", "g"], ["d", "h", "i"]]
        );
      }
    )

    // ###########################################################################################
    it(
      'handles empty arrays correctly',
      () => {
        const result = mergePositionBased(
          [],
          []
        );
        expect(result).toEqual(
          []
        );
      }
    )

    // ###########################################################################################
    it(
      'merges empty array with string',
      () => {
        const result = mergePositionBased(
          [],
          "test"
        );
        expect(result).toEqual(
          ["test"]
        );
      }
    )

    // ###########################################################################################
    it(
      'merges string with empty array',
      () => {
        const result = mergePositionBased(
          "test",
          []
        );
        expect(result).toEqual(
          ["test"]
        );
      }
    )
  }
)