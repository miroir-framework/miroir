import { describe, expect, it } from "vitest";
import { circularReplacer } from "../../src/tools";

describe("circularReplacer", () => {
  it("writes [circular] for a reference to an ancestor", () => {
    const node: Record<string, unknown> = { name: "loop" };
    node.child = { parent: node };
    expect(JSON.parse(JSON.stringify(node, circularReplacer()))).toEqual({
      name: "loop",
      child: { parent: "[circular]" },
    });
  });

  it("writes an object shared by two siblings twice", () => {
    const shared = { kept: true };
    expect(JSON.parse(JSON.stringify({ a: shared, b: [shared] }, circularReplacer()))).toEqual({
      a: { kept: true },
      b: [{ kept: true }],
    });
  });

  it("writes bigints, functions and errors as text", () => {
    function named() {}
    const parsed = JSON.parse(
      JSON.stringify({ big: 12n, fn: named, error: new Error("boom") }, circularReplacer()),
    );
    expect(parsed.big).toBe("12");
    expect(parsed.fn).toBe("[function named]");
    expect(parsed.error).toMatch(/boom/);
  });
});
