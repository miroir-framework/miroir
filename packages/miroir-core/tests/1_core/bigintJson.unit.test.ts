import { describe, expect, it } from "vitest";
import {
  bigintJsonReviver,
  parseWithBigint,
  stringifyWithBigint,
} from "../../src/1_core/bigintJson";
import "../../src/2_domain/TransformersForRuntime"; // defines BigInt.prototype.toJSON, as at runtime

// #48: BigInt values beyond 2^53 cross the REST wire without losing digits
describe("bigintJson", () => {
  const big = 12345678901234567890n; // beyond Number.MAX_SAFE_INTEGER

  it("writes a BigInt as {\"$bigint\": \"<digits>\"}, even with BigInt.prototype.toJSON defined", () => {
    expect(stringifyWithBigint({ count: big })).toBe('{"count":{"$bigint":"12345678901234567890"}}');
  });

  it("round-trips nested and top-level BigInt values whole", () => {
    const value = { a: [1n, -big], b: { c: big, d: "text", e: 3 } };
    expect(parseWithBigint(stringifyWithBigint(value))).toEqual(value);
    expect(parseWithBigint(stringifyWithBigint(big))).toBe(big);
  });

  it("leaves other objects and malformed tags as they are", () => {
    expect(parseWithBigint('{"$bigint":"12a"}')).toEqual({ $bigint: "12a" });
    expect(parseWithBigint('{"$bigint":"1","other":2}')).toEqual({ $bigint: "1", other: 2 });
    expect(bigintJsonReviver("", { $bigint: 1 })).toEqual({ $bigint: 1 });
    expect(parseWithBigint('{"n":12}')).toEqual({ n: 12 });
  });
});
