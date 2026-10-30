/**
 * Replace every string equal to a key of `replacements` by its value, at any depth, without
 * mutating `value`. Used to move a test definition or testbed seed onto another run target.
 * Only arrays and plain objects are walked: other objects (Date, Map, class instances) are kept.
 */
export function deepReplaceUuidStrings<T>(value: T, replacements: Record<string, string>): T {
  if (typeof value === "string") {
    return (replacements[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => deepReplaceUuidStrings(entry, replacements)) as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = deepReplaceUuidStrings(entry, replacements);
    }
    return out as T;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
