import equal from "fast-deep-equal";// A minimal "expect" function with a Vitest-like interface, returning {result:boolean, message?:string}

type ExpectResult = { result: boolean; message?: string };
type Expect = (actual: any, testName?: string) => {
  toBe(expected: any): ExpectResult;
  toEqual(expected: any): ExpectResult;
  toBeTruthy(): ExpectResult;
  toBeFalsy(): ExpectResult;
  toContain(item: any): ExpectResult;
};

function formatMessage(testName: string | undefined, message: string) {
  return testName ? `[${testName}] ${message}` : message;
}

type DescribeEachFunction = (data: any[]) => (template: string, testFn: (item: any) => void | Promise<void>, timeout?: number) => Promise<void>;
type Describe = {
  (title: string, testFn: () => void | Promise<void>): void | Promise<void>;
  each: DescribeEachFunction;
};

type Test = {
  (title: string, testFn: () => void | Promise<void>, timeout?: number): void | Promise<void>;
  skip(title: string, testFn: () => void | Promise<void>, timeout?: number): void | Promise<void>;
};

export function describe(title: string, testFn: () => void | Promise<void>): void | Promise<void> {
  // console.log(`Describe: ${title}`);
  return testFn();
}

function testImpl(title: string, testFn: () => void | Promise<void>, timeout?: number): void | Promise<void> {
  // console.log(`Test: ${title}`);
  return testFn();
}

function testSkip(title: string, _testFn: () => void | Promise<void>, _timeout?: number): void {
  // console.log(`Test skipped: ${title}`);
}

export const test = Object.assign(testImpl, { skip: testSkip }) as Test;

describe.each = function(data: any[]): (template: string, testFn: (item: any) => void | Promise<void>, timeout?: number) => Promise<void> {
  return async function(template: string, testFn: (item: any) => void | Promise<void>, timeout?: number): Promise<void> {
    // console.log(`Describe.each with template: ${template}`);
    const promises = data.map(async (item, index) => {
      const testTitle = template.replace('$currentTestSuiteName', item.transformerTestLabel || `Item ${index}`);
      // console.log(`Running test: ${testTitle}`);
      try {
        await testFn(item);
      } catch (error) {
        console.error(`Test failed: ${testTitle}`, error);
        throw error;
      }
    });
    await Promise.all(promises);
  };
} as DescribeEachFunction;

// ################################################################################################
/**
 * 
 * @param value 
 * @returns 
 */
export function jsonify(value: any): any {
  if (value instanceof Map) {
    const obj: any = {};
    for (const [k, v] of value.entries()) {
      obj[k] = jsonify(v);
    }
    return obj;
  } else if (value instanceof Set) {
    return Array.from(value).map(jsonify);
  } else if (Array.isArray(value)) {
    return value.map(jsonify);
  } else if (value && typeof value === 'object') {
    const obj: any = {};
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        obj[k] = jsonify(value[k]);
      }
    }
    return obj;
  } else {
    return value;
  }
}

// Test framework namespace to avoid naming conflicts with generated types
export const TestFramework = {
  describe,
  test,
  expect,
};

function findFirstDiffPath(a: any, b: any, path: string[] = []): string[] | null {
  if (a === b) return null;
  if (typeof a !== typeof b) return path;
  if (typeof a !== 'object' || a === null || b === null) return path;
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (i >= a.length || i >= b.length) return path.concat([i.toString()]);
      const sub = findFirstDiffPath(a[i], b[i], path.concat([i.toString()]));
      if (sub) return sub;
    }
    return null;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const key of new Set([...aKeys, ...bKeys])) {
    if (!(key in a) || !(key in b)) return path.concat([key]);
    const sub = findFirstDiffPath(a[key], b[key], path.concat([key]));
    if (sub) return sub;
  }
  return null;
}

// ################################################################################################
export function expect(actual: any, testName?: string) {
  // console.log(`@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Expect called with actual: ${actual}, testName: ${testName}`);
  const matchers = {
    toBe(expected: any): ExpectResult {
      const pass = Object.is(actual, expected);
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to be ${expected}`) };
    },
    toEqual(expected: any): ExpectResult {
      const pass = typeof actual == "object" && typeof expected == "object"? equal(actual,expected): actual == expected;
      if (pass) {
        return { result: true };
      } else {
        let diffPath = findFirstDiffPath(actual, expected);
        return {
          result: false,
          message: formatMessage(testName, `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}. First difference at path: ${diffPath ? JSON.stringify(diffPath) : 'unknown'}`)
        };
      }
    },
    toStrictEqual(expected: any): ExpectResult {
      // const pass = JSON.stringify(actual) === JSON.stringify(expected);
      const pass = actual === expected;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${JSON.stringify(actual)} to strictly equal ${JSON.stringify(expected)}`) };
    },
    toBeTruthy(): ExpectResult {
      const pass = !!actual;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to be truthy`) };
    },
    toBeFalsy(): ExpectResult {
      const pass = !actual;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to be falsy`) };
    },
    toBeDefined(): ExpectResult {
      const pass = actual !== undefined;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected value to be defined`) };
    },
    toBeUndefined(): ExpectResult {
      const pass = actual === undefined;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected value to be undefined`) };
    },
    toBeNull(): ExpectResult {
      const pass = actual === null;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected value to be null`) };
    },
    toBeNaN(): ExpectResult {
      const pass = Number.isNaN(actual);
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected value to be NaN`) };
    },
    toContain(item: any): ExpectResult {
      const pass = Array.isArray(actual) && actual.includes(item);
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${JSON.stringify(actual)} to contain ${item}`) };
    },
    toHaveLength(length: number): ExpectResult {
      const pass = actual != null && typeof actual.length === 'number' && actual.length === length;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected length ${length}, got ${actual && actual.length}`) };
    },
    toMatch(regexp: RegExp | string): ExpectResult {
      const pass = typeof actual === 'string' && new RegExp(regexp).test(actual);
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to match ${regexp}`) };
    },
    toMatchObject(obj: object): ExpectResult {
      const pass = typeof actual === 'object' && actual !== null && Object.entries(obj).every(([k, v]) => JSON.stringify((actual as any)[k]) === JSON.stringify(v));
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected object to match ${JSON.stringify(obj)}`) };
    },
    toThrow(expected?: any): ExpectResult {
      let threw = false;
      let error: any;
      if (typeof actual !== 'function') {
        return { result: false, message: formatMessage(testName, `Actual is not a function`) };
      }
      try {
        actual();
      } catch (e) {
        threw = true;
        error = e;
      }
      if (!threw) {
        return { result: false, message: formatMessage(testName, `Expected function to throw`) };
      }
      if (expected !== undefined) {
        if (typeof expected === 'string') {
          if (error && error.message && error.message.includes(expected)) {
            return { result: true };
          } else {
            return { result: false, message: formatMessage(testName, `Expected error message to include ${expected}`) };
          }
        } else if (expected instanceof RegExp) {
          if (error && error.message && expected.test(error.message)) {
            return { result: true };
          } else {
            return { result: false, message: formatMessage(testName, `Expected error message to match ${expected}`) };
          }
        } else if (typeof expected === 'function') {
          if (error instanceof expected) {
            return { result: true };
          } else {
            return { result: false, message: formatMessage(testName, `Expected error to be instance of ${expected.name}`) };
          }
        }
      }
      return { result: true };
    },
    toBeGreaterThan(n: number): ExpectResult {
      const pass = typeof actual === 'number' && actual > n;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to be greater than ${n}`) };
    },
    toBeGreaterThanOrEqual(n: number): ExpectResult {
      const pass = typeof actual === 'number' && actual >= n;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to be greater than or equal to ${n}`) };
    },
    toBeLessThan(n: number): ExpectResult {
      const pass = typeof actual === 'number' && actual < n;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to be less than ${n}`) };
    },
    toBeLessThanOrEqual(n: number): ExpectResult {
      const pass = typeof actual === 'number' && actual <= n;
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to be less than or equal to ${n}`) };
    },
    toHaveProperty(prop: string, value?: any): ExpectResult {
      const hasProp = actual != null && Object.prototype.hasOwnProperty.call(actual, prop);
      if (!hasProp) {
        return { result: false, message: formatMessage(testName, `Expected object to have property ${prop}`) };
      }
      if (arguments.length === 2 && value !== undefined) {
        const pass = JSON.stringify((actual as any)[prop]) === JSON.stringify(value);
        return pass
          ? { result: true }
          : { result: false, message: formatMessage(testName, `Expected property ${prop} to be ${JSON.stringify(value)}, got ${JSON.stringify((actual as any)[prop])}`) };
      }
      return { result: true };
    },
  };
  // Add .not support
  const not: any = {};
  for (const key in matchers) {
    not[key] = (...args: any[]) => {
      const res = (matchers as any)[key](...args);
      return res.result
        ? { result: false, message: formatMessage(testName, `[not] Unexpected pass for ${key}`) }
        : { result: true };
    };
  }
  return { ...matchers, not };
}

// ################################################################################################
/** Thrown by the matchers of `createThrowingExpect` when an assertion fails (#286). */
export class MiroirAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MiroirAssertionError";
  }
}

type NonThrowingMatchers = ReturnType<typeof expect>;
type MatcherName = Exclude<keyof NonThrowingMatchers, "not">;

/**
 * DOM matchers of the throwing `expect`, following jest-dom. The actual value is an element or
 * `null`. They read element properties only (no `instanceof HTMLElement`), so they work with any
 * DOM implementation and with element fakes.
 */
export interface ThrowingDomMatchers {
  toBeInTheDocument(): void;
  toHaveValue(expected?: unknown): void;
  toBeChecked(): void;
  toContainHTML(html: string): void;
}

type ThrowingValueMatchers = {
  [K in MatcherName]: (...args: Parameters<NonThrowingMatchers[K]>) => void;
};
export type ThrowingMatchers = ThrowingValueMatchers &
  ThrowingDomMatchers & {
    not: ThrowingValueMatchers & ThrowingDomMatchers;
  };
export type ThrowingExpect = ((actual: any, message?: string) => ThrowingMatchers) & {
  /** As vitest's `expect.getState()`, restricted to `currentTestName`. */
  getState(): { currentTestName: string };
};

/**
 * Deep copy of `value` without the object keys whose value is `undefined`, since vitest's
 * `toEqual` ignores them. Array entries are kept, `undefined` ones included. Only plain objects
 * are copied.
 */
function withoutUndefinedKeys(value: any): any {
  if (Array.isArray(value)) {
    return value.map(withoutUndefinedKeys);
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const result: any = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) {
        result[key] = withoutUndefinedKeys(entry);
      }
    }
    return result;
  }
  return value;
}

function describeElement(element: any): string {
  if (element === null || element === undefined) {
    return String(element);
  }
  const tagName = typeof element.tagName === "string" ? element.tagName.toLowerCase() : "element";
  const name = typeof element.getAttribute === "function" ? element.getAttribute("name") : element.name;
  return name ? `<${tagName} name="${name}">` : `<${tagName}>`;
}

/** Value of an input, select, or textarea, read as jest-dom's `toHaveValue` reads it. */
function elementValue(element: any): unknown {
  const type = typeof element.type === "string" ? element.type.toLowerCase() : "";
  const tagName = typeof element.tagName === "string" ? element.tagName.toUpperCase() : "";
  if (type === "number") {
    return element.value === "" || element.value === undefined || element.value === null
      ? null
      : Number(element.value);
  }
  if (tagName === "SELECT" && element.multiple) {
    return Array.from(element.selectedOptions ?? []).map((option: any) => option.value);
  }
  return element.value;
}

function domMatchers(
  actual: any,
  label: string | undefined,
): Record<keyof ThrowingDomMatchers, (...args: any[]) => ExpectResult> {
  const nullResult = (matcher: string): ExpectResult => ({
    result: false,
    message: formatMessage(label, `${matcher}: expected an element, received ${describeElement(actual)}`),
  });
  return {
    toBeInTheDocument(): ExpectResult {
      if (actual === null || actual === undefined) {
        return nullResult("toBeInTheDocument");
      }
      const pass = !!actual.ownerDocument && !!actual.ownerDocument.contains(actual);
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(label, `Expected ${describeElement(actual)} to be in the document`) };
    },
    toHaveValue(...args: unknown[]): ExpectResult {
      if (actual === null || actual === undefined) {
        return nullResult("toHaveValue");
      }
      const received = elementValue(actual);
      const expectsValue = args.length > 0 && args[0] !== undefined;
      const pass = expectsValue
        ? equal(received, args[0])
        : Array.isArray(received)
          ? received.length > 0
          : Boolean(received);
      return pass
        ? { result: true }
        : {
            result: false,
            message: formatMessage(
              label,
              expectsValue
                ? `Expected ${describeElement(actual)} to have value ${JSON.stringify(args[0])}, received ${JSON.stringify(received)}`
                : `Expected ${describeElement(actual)} to have a value, received ${JSON.stringify(received)}`,
            ),
          };
    },
    toBeChecked(): ExpectResult {
      if (actual === null || actual === undefined) {
        return nullResult("toBeChecked");
      }
      const pass =
        typeof actual.checked === "boolean"
          ? actual.checked
          : typeof actual.getAttribute === "function" && actual.getAttribute("aria-checked") === "true";
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(label, `Expected ${describeElement(actual)} to be checked`) };
    },
    toContainHTML(html: string): ExpectResult {
      if (actual === null || actual === undefined) {
        return nullResult("toContainHTML");
      }
      // As jest-dom, normalize the searched HTML by parsing it in the element's document.
      let normalizedHtml = html;
      if (typeof actual.ownerDocument?.createElement === "function") {
        const parsed = actual.ownerDocument.createElement("div");
        parsed.innerHTML = html;
        normalizedHtml = parsed.innerHTML;
      }
      const outerHTML: string = typeof actual.outerHTML === "string" ? actual.outerHTML : "";
      const pass = outerHTML.includes(normalizedHtml);
      return pass
        ? { result: true }
        : {
            result: false,
            message: formatMessage(label, `Expected ${describeElement(actual)} to contain HTML ${JSON.stringify(html)}`),
          };
    },
  };
}

/**
 * An `expect` with vitest's `(actual, message)` signature whose matchers throw a
 * `MiroirAssertionError` when they fail (#286). Used by React component test bodies, in vitest
 * and in the running app.
 *
 * - The value matchers are those of the non-throwing `expect` above, except `toEqual`, which
 *   ignores object keys whose value is `undefined`, as vitest does. The non-throwing `expect`
 *   keeps its own `toEqual`.
 * - The DOM matchers `toBeInTheDocument`, `toHaveValue`, `toBeChecked`, and `toContainHTML`
 *   follow jest-dom. A `null` actual fails their positive form and passes their `.not` form.
 * - `getState().currentTestName` is `testName`.
 *
 * `testName` names the running test in failure messages when no message is given.
 */
export function createThrowingExpect(testName: string): ThrowingExpect {
  const throwingExpect = (actual: any, message?: string): ThrowingMatchers => {
    const label = message ?? testName;
    const { not: _not, ...valueMatchers } = expect(actual, label);
    const matchers: Record<string, (...args: any[]) => ExpectResult> = {
      ...valueMatchers,
      toEqual: (expected: any) =>
        expect(withoutUndefinedKeys(actual), label).toEqual(withoutUndefinedKeys(expected)),
      ...domMatchers(actual, label),
    };
    const toThrowing = (negate: boolean) => {
      const result: any = {};
      for (const [key, matcher] of Object.entries(matchers)) {
        result[key] = (...args: any[]): void => {
          const outcome: ExpectResult = matcher(...args);
          if (outcome.result === negate) {
            throw new MiroirAssertionError(
              negate
                ? formatMessage(label, `[not] Unexpected pass for ${key}`)
                : outcome.message ?? formatMessage(label, `${key} failed`),
            );
          }
        };
      }
      return result;
    };
    return {
      ...toThrowing(false),
      not: toThrowing(true),
    } as ThrowingMatchers;
  };
  return Object.assign(throwingExpect, {
    getState: () => ({ currentTestName: testName }),
  });
}
