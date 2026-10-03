// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  attachFeedbackGlow,
  feedbackGlowAttribute,
  feedbackGlowClass,
  feedbackGlowDurationBoundsMs,
  feedbackGlowStylesAttribute,
} from "../src/components/FeedbackGlow/feedbackGlow.js";

// Feedback glow (#438): the mechanism on one boundary element, driven by real DOM events (the
// in-browser test runner dispatches the same untrusted events).

function click(element: Element) {
  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}
function focusIn(element: Element) {
  element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
}
function change(element: Element) {
  element.dispatchEvent(new Event("change", { bubbles: true }));
}
function keyDown(element: Element, key: string) {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}
const glows = (element: Element) => element.classList.contains(feedbackGlowClass);

describe("feedbackGlow", () => {
  let boundary: HTMLDivElement;
  let detach: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="boundary">
        <button id="button"><span id="label">Go</span></button>
        <input id="text" type="text" />
        <textarea id="area"></textarea>
        <input id="checkbox" type="checkbox" />
        <select id="select"><option value="a">a</option></select>
        <div id="roleButton" role="button" tabindex="0">act</div>
        <div data-miroir-no-glow><button id="optedOut">no</button></div>
        <p id="plain">text</p>
      </div>`;
    boundary = document.getElementById("boundary") as HTMLDivElement;
    detach = attachFeedbackGlow(boundary);
  });

  afterEach(() => {
    detach?.();
    detach = undefined;
    vi.useRealTimers();
  });

  const byId = (id: string) => document.getElementById(id) as HTMLElement;

  it("a click glows the button, and the glow ends after the duration", () => {
    click(byId("button"));
    expect(glows(byId("button"))).toBe(true);
    vi.advanceTimersByTime(399);
    expect(glows(byId("button"))).toBe(true);
    vi.advanceTimersByTime(1);
    expect(glows(byId("button"))).toBe(false);
  });

  it("focus, commit and keyboard activation glow their control", () => {
    focusIn(byId("text"));
    change(byId("select"));
    keyDown(byId("roleButton"), "Enter");
    keyDown(byId("checkbox"), " ");
    expect([glows(byId("text")), glows(byId("select")), glows(byId("roleButton")), glows(byId("checkbox"))]).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("typing in a text input does not glow", () => {
    keyDown(byId("text"), "a");
    keyDown(byId("text"), " ");
    expect(glows(byId("text"))).toBe(false);
  });

  it("Enter in a text input glows it (commit, e.g. the option chosen in a filtered select)", () => {
    keyDown(byId("text"), "Enter");
    expect(glows(byId("text"))).toBe(true);
  });

  it("Enter in a textarea does not glow (new line)", () => {
    keyDown(byId("area"), "Enter");
    expect(glows(byId("area"))).toBe(false);
  });

  it("a duration outside the bounds is clamped", () => {
    detach?.();
    detach = attachFeedbackGlow(boundary, { durationMs: 0 });
    click(byId("button"));
    vi.advanceTimersByTime(feedbackGlowDurationBoundsMs.min - 1);
    expect(glows(byId("button"))).toBe(true);
  });

  it("a click on a child of a button glows the button", () => {
    click(byId("label"));
    expect(glows(byId("button"))).toBe(true);
    expect(glows(byId("label"))).toBe(false);
  });

  it("a non-interactive element does not glow", () => {
    click(byId("plain"));
    expect(boundary.querySelectorAll(`.${feedbackGlowClass}`).length).toBe(0);
  });

  it("an element under data-miroir-no-glow does not glow", () => {
    click(byId("optedOut"));
    expect(glows(byId("optedOut"))).toBe(false);
  });

  it("a second event on a glowing control does not restart the glow", () => {
    click(byId("button"));
    vi.advanceTimersByTime(300);
    focusIn(byId("button"));
    vi.advanceTimersByTime(100);
    expect(glows(byId("button"))).toBe(false);
  });

  it("detach removes the attribute and the listeners", () => {
    detach?.();
    detach = undefined;
    click(byId("button"));
    expect([boundary.hasAttribute(feedbackGlowAttribute), glows(byId("button"))]).toEqual([false, false]);
  });

  it("the stylesheet is added once per document", () => {
    const second = document.createElement("div");
    document.body.appendChild(second);
    const detachSecond = attachFeedbackGlow(second);
    expect(document.head.querySelectorAll(`style[${feedbackGlowStylesAttribute}]`).length).toBe(1);
    detachSecond();
  });

  it("the stylesheet is removed when the last boundary detaches", () => {
    const second = document.createElement("div");
    document.body.appendChild(second);
    const detachSecond = attachFeedbackGlow(second);
    detach?.();
    detach = undefined;
    const afterFirst = document.head.querySelectorAll(`style[${feedbackGlowStylesAttribute}]`).length;
    detachSecond();
    expect([afterFirst, document.head.querySelectorAll(`style[${feedbackGlowStylesAttribute}]`).length]).toEqual([
      1, 0,
    ]);
  });
});
