/**
 * Issue #286 Slice 3: the throwing `expect` used by React component test bodies.
 *
 * Runs in the node environment with no DOM: the DOM matchers are checked on minimal element fakes
 * (objects with `ownerDocument.contains`, `value`, `checked`, `outerHTML`), so they must not rely on
 * `instanceof HTMLInputElement`. The parity with jest-dom on a real DOM is checked in the app
 * (`domMatchersParity.286.phase3`).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-core -- throwingExpect.286.phase3
 * ```
 */
import { describe, expect, it } from "vitest";

import {
  createThrowingExpect,
  MiroirAssertionError,
} from "../../../../src/1_core/testing/test-expect";

const testName = "throwingExpect.286.phase3";

/** Minimal element fake: attached to its fake document when `attached` is true. */
function fakeElement(fields: Record<string, any>, attached: boolean = true): any {
  const element: any = { ...fields };
  element.ownerDocument = {
    contains: (node: any) => attached && node === element,
  };
  return element;
}

function thrownBy(callback: () => void): unknown {
  try {
    callback();
  } catch (error) {
    return error;
  }
  return undefined;
}

// ################################################################################################
describe("createThrowingExpect: value matchers", () => {
  it("toEqual ignores undefined-valued keys, as vitest does", () => {
    const throwingExpect = createThrowingExpect(testName);
    expect(() => throwingExpect({ a: 1, b: undefined }).toEqual({ a: 1 })).not.toThrow();
    expect(() => throwingExpect({ a: 1 }).toEqual({ a: 1, b: undefined })).not.toThrow();
    expect(() =>
      throwingExpect([{ a: 1, b: { c: undefined, d: 2 } }]).toEqual([{ a: 1, b: { d: 2 } }]),
    ).not.toThrow();
    expect(() => throwingExpect({ a: 1, b: undefined }).not.toEqual({ a: 1 })).toThrow(
      MiroirAssertionError,
    );
  });

  it("toEqual of different values throws a MiroirAssertionError with both values in the message", () => {
    const throwingExpect = createThrowingExpect(testName);
    const error = thrownBy(() => throwingExpect({ a: 1, b: "x" }).toEqual({ a: 1, b: "y" }));
    expect(error).toBeInstanceOf(MiroirAssertionError);
    const message = (error as Error).message;
    expect(message).toContain(JSON.stringify({ a: 1, b: "x" }));
    expect(message).toContain(JSON.stringify({ a: 1, b: "y" }));
  });

  it("the second argument of expect is a message that appears in the failure", () => {
    const throwingExpect = createThrowingExpect(testName);
    const error = thrownBy(() =>
      throwingExpect(false, "number textBox content is not a number").toBe(true),
    );
    expect(error).toBeInstanceOf(MiroirAssertionError);
    expect((error as Error).message).toContain("number textBox content is not a number");
  });

  it("getState().currentTestName returns the name given to createThrowingExpect", () => {
    const throwingExpect = createThrowingExpect("some suite#some case");
    expect(throwingExpect.getState().currentTestName).toBe("some suite#some case");
  });
});

// ################################################################################################
describe("createThrowingExpect: DOM matchers on element fakes", () => {
  it("toBeInTheDocument: attached passes, detached fails, and .not is the inverse", () => {
    const throwingExpect = createThrowingExpect(testName);
    const attached = fakeElement({ tagName: "DIV" }, true);
    const detached = fakeElement({ tagName: "DIV" }, false);
    expect(() => throwingExpect(attached).toBeInTheDocument()).not.toThrow();
    expect(() => throwingExpect(attached).not.toBeInTheDocument()).toThrow(MiroirAssertionError);
    expect(() => throwingExpect(detached).toBeInTheDocument()).toThrow(MiroirAssertionError);
    expect(() => throwingExpect(detached).not.toBeInTheDocument()).not.toThrow();
  });

  it("null: positive DOM matchers fail with a MiroirAssertionError, .not forms pass, never a TypeError", () => {
    const throwingExpect = createThrowingExpect(testName);
    expect(() => throwingExpect(null).not.toBeInTheDocument()).not.toThrow();
    const error = thrownBy(() => throwingExpect(null).toBeInTheDocument());
    expect(error).toBeInstanceOf(MiroirAssertionError);
    for (const call of [
      () => throwingExpect(null).toHaveValue("x"),
      () => throwingExpect(null).toBeChecked(),
      () => throwingExpect(null).toContainHTML("x"),
    ]) {
      const callError = thrownBy(call);
      expect(callError).toBeInstanceOf(MiroirAssertionError);
    }
    expect(() => throwingExpect(null).not.toHaveValue("x")).not.toThrow();
    expect(() => throwingExpect(null).not.toBeChecked()).not.toThrow();
    expect(() => throwingExpect(null).not.toContainHTML("x")).not.toThrow();
  });

  it("toHaveValue: text value, number coercion for type=number, and no-argument form", () => {
    const throwingExpect = createThrowingExpect(testName);
    const text = fakeElement({ tagName: "INPUT", type: "text", value: "foo" });
    const numberInput = fakeElement({ tagName: "INPUT", type: "number", value: "42" });
    const emptyNumber = fakeElement({ tagName: "INPUT", type: "number", value: "" });
    const emptyText = fakeElement({ tagName: "INPUT", type: "text", value: "" });
    expect(() => throwingExpect(text).toHaveValue("foo")).not.toThrow();
    expect(() => throwingExpect(text).toHaveValue("bar")).toThrow(MiroirAssertionError);
    expect(() => throwingExpect(text).not.toHaveValue("bar")).not.toThrow();
    expect(() => throwingExpect(numberInput).toHaveValue(42)).not.toThrow();
    expect(() => throwingExpect(numberInput).toHaveValue("42")).toThrow(MiroirAssertionError);
    expect(() => throwingExpect(emptyNumber).toHaveValue(null)).not.toThrow();
    expect(() => throwingExpect(text).toHaveValue()).not.toThrow();
    expect(() => throwingExpect(emptyText).toHaveValue()).toThrow(MiroirAssertionError);
  });

  it("toBeChecked reads checked, and aria-checked when there is no checked property", () => {
    const throwingExpect = createThrowingExpect(testName);
    const checked = fakeElement({ tagName: "INPUT", type: "checkbox", checked: true });
    const unchecked = fakeElement({ tagName: "INPUT", type: "checkbox", checked: false });
    const ariaChecked = fakeElement({
      tagName: "DIV",
      getAttribute: (name: string) => (name === "aria-checked" ? "true" : null),
    });
    expect(() => throwingExpect(checked).toBeChecked()).not.toThrow();
    expect(() => throwingExpect(unchecked).toBeChecked()).toThrow(MiroirAssertionError);
    expect(() => throwingExpect(unchecked).not.toBeChecked()).not.toThrow();
    expect(() => throwingExpect(ariaChecked).toBeChecked()).not.toThrow();
  });

  it("toContainHTML searches the element's outerHTML", () => {
    const throwingExpect = createThrowingExpect(testName);
    const element = fakeElement({ tagName: "INPUT", outerHTML: '<input value="new value">' });
    expect(() => throwingExpect(element).toContainHTML("new value")).not.toThrow();
    expect(() => throwingExpect(element).toContainHTML("old value")).toThrow(MiroirAssertionError);
    expect(() => throwingExpect(element).not.toContainHTML("old value")).not.toThrow();
  });
});
