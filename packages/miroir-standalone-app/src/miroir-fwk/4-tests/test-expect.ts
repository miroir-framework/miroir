// A minimal "expect" function with a Vitest-like interface, returning {result:boolean, message?:string}

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

export function describe(title: string, testFn: () => void | Promise<void>): void | Promise<void> {
  console.log(`Describe: ${title}`);
  return testFn();
}

describe.each = function(data: any[]): (template: string, testFn: (item: any) => void | Promise<void>, timeout?: number) => Promise<void> {
  return async function(template: string, testFn: (item: any) => void | Promise<void>, timeout?: number): Promise<void> {
    console.log(`Describe.each with template: ${template}`);
    const promises = data.map(async (item, index) => {
      const testTitle = template.replace('$currentTestSuiteName', item.transformerTestLabel || `Item ${index}`);
      console.log(`Running test: ${testTitle}`);
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

export function expect(actual: any, testName?: string) {
  const matchers = {
    toBe(expected: any): ExpectResult {
      const pass = Object.is(actual, expected);
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${actual} to be ${expected}`) };
    },
    toEqual(expected: any): ExpectResult {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
      return pass
        ? { result: true }
        : { result: false, message: formatMessage(testName, `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`) };
    },
    toStrictEqual(expected: any): ExpectResult {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
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