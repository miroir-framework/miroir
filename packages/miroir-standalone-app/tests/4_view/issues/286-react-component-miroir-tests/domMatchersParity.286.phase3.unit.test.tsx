/**
 * Issue #286 Slice 3: the DOM matchers of miroir-core `createThrowingExpect` agree with jest-dom.
 *
 * For each matcher, the same fixture DOM goes through vitest's `expect` with jest-dom (loaded by
 * `tests/setup.ts`) and through the throwing `expect`, and both must pass or both must fail.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- domMatchersParity.286.phase3
 * ```
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createThrowingExpect } from "miroir-core";

const throwingExpect = createThrowingExpect("domMatchersParity.286.phase3");

function passes(callback: () => void): boolean {
  try {
    callback();
    return true;
  } catch {
    return false;
  }
}

type MatcherCall = { label: string; jestDom: () => void; miroir: () => void };

function checkParity(calls: MatcherCall[], expectedOutcomes: boolean[]) {
  const outcomes = calls.map((call) => ({
    label: call.label,
    jestDom: passes(call.jestDom),
    miroir: passes(call.miroir),
  }));
  // Both libraries agree on each call.
  expect(outcomes.map((o) => ({ label: o.label, pass: o.miroir }))).toEqual(
    outcomes.map((o) => ({ label: o.label, pass: o.jestDom })),
  );
  // And the fixture exercises both outcomes as expected (so the parity is not vacuous).
  expect(outcomes.map((o) => ({ label: o.label, pass: o.jestDom }))).toEqual(
    outcomes.map((o, index) => ({ label: o.label, pass: expectedOutcomes[index] })),
  );
}

let fixture: HTMLElement;

beforeEach(() => {
  fixture = document.createElement("div");
  fixture.innerHTML = `
    <input id="text" type="text" value="foo" />
    <input id="emptyText" type="text" value="" />
    <input id="number" type="number" value="42" />
    <input id="emptyNumber" type="number" value="" />
    <select id="select"><option value="a">A</option><option value="b" selected>B</option></select>
    <textarea id="textarea">some text</textarea>
    <input id="checked" type="checkbox" checked />
    <input id="unchecked" type="checkbox" />
    <div id="ariaChecked" role="checkbox" aria-checked="true"></div>
    <div id="html"><span class="inner">new value</span></div>
  `;
  document.body.appendChild(fixture);
});

afterEach(() => {
  fixture.remove();
});

const byId = (id: string) => fixture.querySelector(`#${id}`) as HTMLElement;

// ################################################################################################
describe("toBeInTheDocument", () => {
  it("attached, detached, and null, in positive and .not form", () => {
    const attached = byId("text");
    const detached = document.createElement("div");
    const nothing: HTMLElement | null = fixture.querySelector("#doesNotExist");
    checkParity(
      [
        { label: "attached", jestDom: () => expect(attached).toBeInTheDocument(), miroir: () => throwingExpect(attached).toBeInTheDocument() },
        { label: "not attached", jestDom: () => expect(attached).not.toBeInTheDocument(), miroir: () => throwingExpect(attached).not.toBeInTheDocument() },
        { label: "detached", jestDom: () => expect(detached).toBeInTheDocument(), miroir: () => throwingExpect(detached).toBeInTheDocument() },
        { label: "not detached", jestDom: () => expect(detached).not.toBeInTheDocument(), miroir: () => throwingExpect(detached).not.toBeInTheDocument() },
        { label: "null", jestDom: () => expect(nothing).toBeInTheDocument(), miroir: () => throwingExpect(nothing).toBeInTheDocument() },
        { label: "not null", jestDom: () => expect(nothing).not.toBeInTheDocument(), miroir: () => throwingExpect(nothing).not.toBeInTheDocument() },
      ],
      [true, false, false, true, false, true],
    );
  });
});

// ################################################################################################
describe("toHaveValue", () => {
  it("text input, number input, select, and textarea", () => {
    const text = byId("text");
    const emptyText = byId("emptyText");
    const numberInput = byId("number");
    const emptyNumber = byId("emptyNumber");
    const select = byId("select");
    const textarea = byId("textarea");
    checkParity(
      [
        { label: "text foo", jestDom: () => expect(text).toHaveValue("foo"), miroir: () => throwingExpect(text).toHaveValue("foo") },
        { label: "text bar", jestDom: () => expect(text).toHaveValue("bar"), miroir: () => throwingExpect(text).toHaveValue("bar") },
        { label: "not text bar", jestDom: () => expect(text).not.toHaveValue("bar"), miroir: () => throwingExpect(text).not.toHaveValue("bar") },
        { label: "text any", jestDom: () => expect(text).toHaveValue(), miroir: () => throwingExpect(text).toHaveValue() },
        { label: "empty text any", jestDom: () => expect(emptyText).toHaveValue(), miroir: () => throwingExpect(emptyText).toHaveValue() },
        { label: "number 42", jestDom: () => expect(numberInput).toHaveValue(42), miroir: () => throwingExpect(numberInput).toHaveValue(42) },
        { label: "number '42'", jestDom: () => expect(numberInput).toHaveValue("42"), miroir: () => throwingExpect(numberInput).toHaveValue("42") },
        { label: "empty number null", jestDom: () => expect(emptyNumber).toHaveValue(null), miroir: () => throwingExpect(emptyNumber).toHaveValue(null) },
        { label: "select b", jestDom: () => expect(select).toHaveValue("b"), miroir: () => throwingExpect(select).toHaveValue("b") },
        { label: "select a", jestDom: () => expect(select).toHaveValue("a"), miroir: () => throwingExpect(select).toHaveValue("a") },
        { label: "textarea", jestDom: () => expect(textarea).toHaveValue("some text"), miroir: () => throwingExpect(textarea).toHaveValue("some text") },
        { label: "not textarea other", jestDom: () => expect(textarea).not.toHaveValue("other"), miroir: () => throwingExpect(textarea).not.toHaveValue("other") },
      ],
      [true, false, true, true, false, true, false, true, true, false, true, true],
    );
  });
});

// ################################################################################################
describe("toBeChecked and toContainHTML", () => {
  it("toBeChecked on checked and unchecked checkboxes and on role=checkbox with aria-checked", () => {
    const checked = byId("checked");
    const unchecked = byId("unchecked");
    const ariaChecked = byId("ariaChecked");
    checkParity(
      [
        { label: "checked", jestDom: () => expect(checked).toBeChecked(), miroir: () => throwingExpect(checked).toBeChecked() },
        { label: "unchecked", jestDom: () => expect(unchecked).toBeChecked(), miroir: () => throwingExpect(unchecked).toBeChecked() },
        { label: "not unchecked", jestDom: () => expect(unchecked).not.toBeChecked(), miroir: () => throwingExpect(unchecked).not.toBeChecked() },
        { label: "aria-checked", jestDom: () => expect(ariaChecked).toBeChecked(), miroir: () => throwingExpect(ariaChecked).toBeChecked() },
      ],
      [true, false, true, true],
    );
  });

  it("toContainHTML on an element and on a text input whose value was changed", () => {
    const html = byId("html");
    const text = byId("text") as HTMLInputElement;
    checkParity(
      [
        { label: "inner span", jestDom: () => expect(html).toContainHTML('<span class="inner">new value</span>'), miroir: () => throwingExpect(html).toContainHTML('<span class="inner">new value</span>') },
        { label: "text", jestDom: () => expect(html).toContainHTML("new value"), miroir: () => throwingExpect(html).toContainHTML("new value") },
        { label: "missing", jestDom: () => expect(html).toContainHTML("old value"), miroir: () => throwingExpect(html).toContainHTML("old value") },
        { label: "not missing", jestDom: () => expect(html).not.toContainHTML("old value"), miroir: () => throwingExpect(html).not.toContainHTML("old value") },
        { label: "input value attribute", jestDom: () => expect(text).toContainHTML("foo"), miroir: () => throwingExpect(text).toContainHTML("foo") },
      ],
      [true, true, false, true, true],
    );
  });
});
