/**
 * Convert values that Redux Toolkit's serializableCheck rejects (notably Date)
 * into JSON-safe equivalents. Dates become ISO-8601 strings via toISOString().
 *
 * Used at the local-cache write boundary so both actions and state stay serializable.
 * Plain objects / arrays are copied only when a Date (or nested Date) is found.
 * Functions, Blobs, Maps, Sets, and other class instances are left unchanged.
 */
export function toReduxSerializable<T>(value: T): T {
  return convertReduxSerializable(value, new WeakSet<object>()) as T;
}

function convertReduxSerializable(value: unknown, visited: WeakSet<object>): unknown {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : value.toISOString();
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (visited.has(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    visited.add(value);
    let changed = false;
    const next = value.map((item) => {
      const converted = convertReduxSerializable(item, visited);
      if (converted !== item) {
        changed = true;
      }
      return converted;
    });
    return changed ? next : value;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return value;
  }
  visited.add(value);
  let changed = false;
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const converted = convertReduxSerializable(nested, visited);
    if (converted !== nested) {
      changed = true;
    }
    result[key] = converted;
  }
  return changed ? result : value;
}
