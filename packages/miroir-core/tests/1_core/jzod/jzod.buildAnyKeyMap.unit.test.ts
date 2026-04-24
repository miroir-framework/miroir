import { describe, expect, it } from "vitest";
import {
  ANY_IMPLICIT_UNION_TYPE,
  ANY_SCHEMA,
  buildAnyObjectEntry,
  buildAnySubnodeKeyMap,
} from "../../../src/1_core/jzod/jzodTypeCheck";

// #####################################################################################################
// buildAnyObjectEntry
// #####################################################################################################
describe("buildAnyObjectEntry", () => {
  it("flat object: sets rawSchema to ANY_SCHEMA, resolvedSchema to inferred object schema, valuePath/typePath, and embeds scalar children", () => {
    const v = { a: "hello", b: 42 };
    const childPath = ["outer"];
    const childTypePath = ["outer"];
    const entry = buildAnyObjectEntry(v, childPath, childTypePath);

    expect(entry.rawSchema).toEqual(ANY_SCHEMA);
    expect(entry.resolvedSchema).toEqual({
      type: "object",
      definition: { a: { type: "string" }, b: { type: "number" } },
    });
    expect(entry.valuePath).toEqual(["outer"]);
    expect(entry.typePath).toEqual(["outer"]);

    // scalar children embedded as named properties
    expect(entry.a.rawSchema).toEqual(ANY_SCHEMA);
    expect(entry.a.resolvedSchema).toEqual({ type: "string" });
    expect(entry.a.valuePath).toEqual(["outer", "a"]);
    expect(entry.a.typePath).toEqual(["outer", "a"]);

    expect(entry.b.rawSchema).toEqual(ANY_SCHEMA);
    expect(entry.b.resolvedSchema).toEqual({ type: "number" });
    expect(entry.b.valuePath).toEqual(["outer", "b"]);
  });

  it("nested object: child object entries are recursively built with ANY_SCHEMA rawSchema", () => {
    const v = { inner: { x: true } };
    const entry = buildAnyObjectEntry(v, ["outer"], ["outer"]);

    expect(entry.rawSchema).toEqual(ANY_SCHEMA);
    // child "inner" should itself be a buildAnyObjectEntry result
    expect(entry.inner.rawSchema).toEqual(ANY_SCHEMA);
    expect(entry.inner.resolvedSchema).toEqual({
      type: "object",
      definition: { x: { type: "boolean" } },
    });
    expect(entry.inner.valuePath).toEqual(["outer", "inner"]);

    // grandchild scalar
    expect(entry.inner.x.rawSchema).toEqual(ANY_SCHEMA);
    expect(entry.inner.x.resolvedSchema).toEqual({ type: "boolean" });
    expect(entry.inner.x.valuePath).toEqual(["outer", "inner", "x"]);
  });

  it("empty object: produces entry with empty definition resolvedSchema and no child keys beyond rawSchema/resolvedSchema/valuePath/typePath", () => {
    const entry = buildAnyObjectEntry({}, ["p"], ["p"]);
    expect(entry.rawSchema).toEqual(ANY_SCHEMA);
    expect(entry.resolvedSchema).toEqual({ type: "object", definition: {} });
    expect(entry.valuePath).toEqual(["p"]);
    // no extra keys
    const extraKeys = Object.keys(entry).filter(
      (k) => !["rawSchema", "resolvedSchema", "valuePath", "typePath"].includes(k)
    );
    expect(extraKeys).toHaveLength(0);
  });

  it("uses provided basePath/typePath in all descendant entries", () => {
    const entry = buildAnyObjectEntry({ n: 1 }, ["a", "b"], ["ta", "tb"]);
    expect(entry.valuePath).toEqual(["a", "b"]);
    expect(entry.typePath).toEqual(["ta", "tb"]);
    expect(entry.n.valuePath).toEqual(["a", "b", "n"]);
    expect(entry.n.typePath).toEqual(["ta", "tb", "n"]);
  });
});

// #####################################################################################################
// buildAnySubnodeKeyMap
// #####################################################################################################
describe("buildAnySubnodeKeyMap", () => {
  it("scalar value: key is full dotted path, rawSchema is ANY_SCHEMA", () => {
    const result = buildAnySubnodeKeyMap({ a: "hello" }, [], []);
    expect(Object.keys(result)).toEqual(["a"]);
    expect(result["a"].rawSchema).toEqual(ANY_SCHEMA);
    expect(result["a"].resolvedSchema).toEqual({ type: "string" });
    expect(result["a"].valuePath).toEqual(["a"]);
    expect(result["a"].typePath).toEqual(["a"]);
  });

  it("scalar value with non-empty basePath: key uses full dotted path", () => {
    const result = buildAnySubnodeKeyMap({ a: 42 }, ["root"], ["root"]);
    expect(Object.keys(result)).toEqual(["root.a"]);
    expect(result["root.a"].rawSchema).toEqual(ANY_SCHEMA);
    expect(result["root.a"].resolvedSchema).toEqual({ type: "number" });
    expect(result["root.a"].valuePath).toEqual(["root", "a"]);
  });

  it("object value: key is full dotted path, entry has ANY_SCHEMA rawSchema and embedded child navigation", () => {
    const result = buildAnySubnodeKeyMap({ obj: { x: "hi" } }, [], []);
    expect(Object.keys(result)).toEqual(["obj"]);
    expect(result["obj"].rawSchema).toEqual(ANY_SCHEMA);
    expect(result["obj"].resolvedSchema).toEqual({
      type: "object",
      definition: { x: { type: "string" } },
    });
    // embedded child accessible for getValueByDottedPath("keyMap.obj.x.rawSchema")
    expect(result["obj"].x.rawSchema).toEqual(ANY_SCHEMA);
    expect(result["obj"].x.resolvedSchema).toEqual({ type: "string" });
    expect(result["obj"].x.valuePath).toEqual(["obj", "x"]);
  });

  it("mixed flat and object children produce correct keys", () => {
    const result = buildAnySubnodeKeyMap({ s: "str", n: 1, o: { y: false } }, [], []);
    expect(Object.keys(result).sort()).toEqual(["n", "o", "s"]);

    expect(result["s"].rawSchema).toEqual(ANY_SCHEMA);
    expect(result["s"].resolvedSchema).toEqual({ type: "string" });

    expect(result["n"].rawSchema).toEqual(ANY_SCHEMA);
    expect(result["n"].resolvedSchema).toEqual({ type: "number" });

    expect(result["o"].rawSchema).toEqual(ANY_SCHEMA);
    expect(result["o"].resolvedSchema).toEqual({
      type: "object",
      definition: { y: { type: "boolean" } },
    });
    expect(result["o"].y.rawSchema).toEqual(ANY_SCHEMA);
    expect(result["o"].y.resolvedSchema).toEqual({ type: "boolean" });
  });

  it("deeply nested object: nested object child gets ANY_SCHEMA rawSchema, grandchildren are embedded", () => {
    const result = buildAnySubnodeKeyMap({ outer: { inner: 99 } }, [], []);
    expect(Object.keys(result)).toEqual(["outer"]);
    expect(result["outer"].rawSchema).toEqual(ANY_SCHEMA);
    // navigate like getValueByDottedPath("keyMap.outer.inner.resolvedSchema")
    expect(result["outer"].inner.rawSchema).toEqual(ANY_SCHEMA);
    expect(result["outer"].inner.resolvedSchema).toEqual({ type: "number" });
    expect(result["outer"].inner.valuePath).toEqual(["outer", "inner"]);
  });

  it("empty object produces empty result", () => {
    const result = buildAnySubnodeKeyMap({}, [], []);
    expect(result).toEqual({});
  });

  it("ANY_IMPLICIT_UNION_TYPE is NOT used — all rawSchemas are ANY_SCHEMA", () => {
    const result = buildAnySubnodeKeyMap(
      { a: "x", b: { c: 1 } },
      [],
      []
    );
    expect(result["a"].rawSchema).toEqual(ANY_SCHEMA);
    expect(result["b"].rawSchema).toEqual(ANY_SCHEMA);
    expect(result["b"].c.rawSchema).toEqual(ANY_SCHEMA);
    // confirm it is NOT the union type
    expect(result["a"].rawSchema).not.toEqual(ANY_IMPLICIT_UNION_TYPE);
    expect(result["b"].rawSchema).not.toEqual(ANY_IMPLICIT_UNION_TYPE);
  });
});
