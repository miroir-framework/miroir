import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { formValuesToJSON } from "./4_view/JzodElementEditorTestTools";

describe("formValuesToJSON", () => {
  it("top-level array: should convert flat object with dot notation keys to array of objects", () => {
    const input = {
      "0.a": "foo",
      "0.b": "bar",
      "1.a": "baz",
      "1.b": "qux"
    };
    const result = formValuesToJSON(input);
    expect(result).toEqual([
      { a: "foo", b: "bar" },
      { a: "baz", b: "qux" }
    ]);
  });

  it("top-level array: should handle nested keys", () => {
    const input = {
      "0.a.b": "foo",
      "0.a.c": "bar",
      "1.a.b": "baz",
      "1.a.c": "qux"
    };
    const result = formValuesToJSON(input);
    expect(result).toEqual([
      { a: { b: "foo", c: "bar" } },
      { a: { b: "baz", c: "qux" } }
    ]);
  });

  it("top-level array: example from JzodElementEditor tests", () => {
    const input = {
      "0.a": "value1",
      "0.b.c": 1,
      "0.d": true,
      "0.e": "123",
      //
      "1.a": "value2",
      "1.b.c": 2,
      "1.d": false,
      "1.e": "456",
      //
      "2.b.c": 0,
      "2.d": false,
      "2.e": "0",
    };
    const result = formValuesToJSON(input);
    expect(result).toEqual([
      {
        a: "value1",
        b: { c: 1 },
        d: true,
        e: 123n,
      },
      {
        a: "value2",
        b: { c: 2 },
        d: false,
        e: 456n,
      },
    ]);
  });

  it("top-level array: should handle single-level keys", () => {
    const input = {
      "0.a": "foo"
    };
    const result = formValuesToJSON(input);
    expect(result).toEqual([{ a: "foo" }]);
  });

  it("top-level array: should handle multiple nested levels", () => {
    const input = {
      "0.a.b.c": "foo",
      "0.a.b.d": "bar"
    };
    const result = formValuesToJSON(input);
    expect(result).toEqual([{ a: { b: { c: "foo", d: "bar" } } }]);
  });

  it("top-level object: should convert flat object with dot notation keys to nested object", () => {
    const input = {
      "a.b": "foo",
      "a.c": "bar",
      "d.e": "baz"
    };
    const result = formValuesToJSON(input);
    expect(result).toEqual({
      a: { b: "foo", c: "bar" },
      d: { e: "baz" }
    });
  });


});