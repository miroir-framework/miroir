/**
 * Lossless JSON encoding of BigInt values (#48).
 *
 * JSON has no bigint type: `JSON.stringify` throws on a BigInt, or calls the `BigInt.prototype.toJSON`
 * that miroir-core defines, which returns a `number` and loses the digits beyond 2^53. Values that
 * cross the REST wire use these functions instead: a BigInt is written `{"$bigint": "<digits>"}`, the
 * notation MiroirTest JSON already uses, and read back as a BigInt.
 */

export const BIGINT_JSON_TAG = "$bigint";

const bigintDigits = /^-?\d+$/;

/**
 * `JSON.stringify` replacer writing each BigInt as `{"$bigint": "<digits>"}`. It reads the value
 * from its holder because `JSON.stringify` applies `toJSON` before calling the replacer.
 */
export function bigintJsonReplacer(this: unknown, key: string, value: unknown): unknown {
  const original = this !== null && typeof this === "object" ? (this as Record<string, unknown>)[key] : value;
  if (typeof original === "bigint") {
    return { [BIGINT_JSON_TAG]: original.toString() };
  }
  if (typeof value === "bigint") {
    return { [BIGINT_JSON_TAG]: value.toString() };
  }
  return value;
}

/** `JSON.parse` reviver turning each `{"$bigint": "<digits>"}` back into a BigInt. */
export function bigintJsonReviver(_key: string, value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== BIGINT_JSON_TAG) {
    return value;
  }
  const digits = (value as Record<string, unknown>)[BIGINT_JSON_TAG];
  return typeof digits === "string" && bigintDigits.test(digits) ? BigInt(digits) : value;
}

/** `JSON.stringify` keeping BigInt values whole (see {@link bigintJsonReplacer}). */
export function stringifyWithBigint(value: unknown, space?: string | number): string {
  return JSON.stringify(value, bigintJsonReplacer, space);
}

/** `JSON.parse` restoring the BigInt values written by {@link stringifyWithBigint}. */
export function parseWithBigint(text: string): any {
  return JSON.parse(text, bigintJsonReviver);
}
