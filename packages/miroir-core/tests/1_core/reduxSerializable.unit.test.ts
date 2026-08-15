import { describe, expect, it } from "vitest";

import { toReduxSerializable } from "../../src/1_core/reduxSerializable.js";

const ISO = "2026-08-15T06:54:21.336Z";

describe("toReduxSerializable", () => {
  it("converts Date values to ISO-8601 strings", () => {
    expect(toReduxSerializable(new Date(ISO))).toBe(ISO);
  });

  it("converts Date attributes on a plain object, including nested ones", () => {
    const timestamp = new Date(ISO);
    const input = {
      uuid: "58dbe40e-87b2-4d51-8d1f-0add3e3d3ab0",
      timestamp,
      createdAt: timestamp,
      nested: { lendStartDate: timestamp },
      name: "ApplicationEvolutionTrace",
    };

    const result = toReduxSerializable(input);

    expect(result.timestamp).toBe(ISO);
    expect(result.createdAt).toBe(ISO);
    expect(result.nested.lendStartDate).toBe(ISO);
    expect(result.name).toBe("ApplicationEvolutionTrace");
    expect(result).not.toBe(input);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("converts Dates inside arrays", () => {
    const result = toReduxSerializable({
      instances: [{ timestamp: new Date(ISO) }],
    });
    expect(result.instances[0].timestamp).toBe(ISO);
  });

  it("returns the same reference when nothing needs conversion", () => {
    const input = { uuid: "a", name: "plain", count: 1 };
    expect(toReduxSerializable(input)).toBe(input);
  });

  it("leaves functions and non-plain objects unchanged", () => {
    const fn = () => undefined;
    const blob = typeof Blob !== "undefined" ? new Blob(["x"]) : { notADate: true };
    const input = { asyncDispatch: fn, file: blob, ok: 1 };
    const result = toReduxSerializable(input);
    expect(result.asyncDispatch).toBe(fn);
    expect(result.file).toBe(blob);
    expect(result.ok).toBe(1);
  });

  it("converts invalid Dates to null so they stay serializable", () => {
    expect(toReduxSerializable(new Date("not-a-date"))).toBeNull();
  });
});
