/**
 * Lossless JSON encoding of BigInt values (#48).
 *
 * JSON has no bigint type: `JSON.stringify` throws on a BigInt, or calls the `BigInt.prototype.toJSON`
 * that miroir-core defines, which returns a `number` and loses the digits beyond 2^53. Values that
 * cross the REST wire use these functions instead: a BigInt is written `{"$bigint": "<digits>"}`, the
 * notation MiroirTest JSON already uses, and read back as a BigInt.
 */

export const BIGINT_JSON_TAG = "$bigint";

/**
 * `JSON.stringify` replacer writing each BigInt as `{"$bigint": "<digits>"}`. It reads the value
 * from its holder because `JSON.stringify` applies `toJSON` before calling the replacer.
 */
export function bigintJsonReplacer(this: any, key: string, value: unknown): unknown {
  const original = this?.[key];
  return typeof original === "bigint" ? { [BIGINT_JSON_TAG]: original.toString() } : value;
}

/** `JSON.parse` reviver turning each `{"$bigint": "<digits>"}` back into a BigInt. */
export function bigintJsonReviver(_key: string, value: any): unknown {
  const digits = value?.[BIGINT_JSON_TAG];
  return typeof digits === "string" && /^-?\d+$/.test(digits) && Object.keys(value).length === 1
    ? BigInt(digits)
    : value;
}

/** `JSON.stringify` keeping BigInt values whole (see {@link bigintJsonReplacer}). */
export function stringifyWithBigint(value: unknown): string {
  return JSON.stringify(value, bigintJsonReplacer);
}

/** `JSON.parse` restoring the BigInt values written by {@link stringifyWithBigint}. */
export function parseWithBigint(text: string): any {
  return JSON.parse(text, bigintJsonReviver);
}
