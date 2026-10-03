// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FeedbackGlowBoundary } from "../src/components/FeedbackGlow/FeedbackGlowBoundary.js";
import {
  feedbackGlowAttribute,
  feedbackGlowClass,
  feedbackGlowStylesAttribute,
} from "../src/components/FeedbackGlow/feedbackGlow.js";

// Feedback glow (#438): nested boundaries, the innermost decides; with no enabled boundary nothing is
// attached and no stylesheet is added.

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const click = (id: string) => {
  const element = document.getElementById(id) as HTMLElement;
  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  return element.classList.contains(feedbackGlowClass);
};

describe("FeedbackGlowBoundary", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderTree = (tree: React.ReactElement) => act(() => root.render(tree));

  it("with only disabled or inheriting boundaries, nothing glows and no stylesheet is added", () => {
    renderTree(
      <FeedbackGlowBoundary enabled={false}>
        <FeedbackGlowBoundary enabled="inherit">
          <button id="inner">inner</button>
        </FeedbackGlowBoundary>
      </FeedbackGlowBoundary>,
    );
    expect([click("inner"), document.querySelectorAll(`style[${feedbackGlowStylesAttribute}]`).length]).toEqual([
      false,
      0,
    ]);
  });

  it("an off boundary inside an on boundary turns the glow off for its subtree only", () => {
    renderTree(
      <FeedbackGlowBoundary enabled>
        <button id="outer">outer</button>
        <FeedbackGlowBoundary enabled={false}>
          <button id="inner">inner</button>
        </FeedbackGlowBoundary>
      </FeedbackGlowBoundary>,
    );
    expect([click("outer"), click("inner")]).toEqual([true, false]);
  });

  it("an on boundary inside an off boundary turns the glow on for its subtree only", () => {
    renderTree(
      <FeedbackGlowBoundary enabled={false}>
        <button id="outer">outer</button>
        <FeedbackGlowBoundary enabled>
          <button id="inner">inner</button>
        </FeedbackGlowBoundary>
      </FeedbackGlowBoundary>,
    );
    expect([click("outer"), click("inner")]).toEqual([false, true]);
  });

  it("an inheriting boundary renders no attribute and follows the enclosing boundary", () => {
    renderTree(
      <FeedbackGlowBoundary enabled>
        <FeedbackGlowBoundary enabled="inherit" data-testid="inherit">
          <button id="inner">inner</button>
        </FeedbackGlowBoundary>
      </FeedbackGlowBoundary>,
    );
    const inheriting = container.querySelector('[data-testid="inherit"]') as HTMLElement;
    expect([inheriting.hasAttribute(feedbackGlowAttribute), click("inner")]).toEqual([false, true]);
  });

  it("switching enabled from true to false detaches the boundary", () => {
    renderTree(
      <FeedbackGlowBoundary enabled data-testid="boundary">
        <button id="button">b</button>
      </FeedbackGlowBoundary>,
    );
    renderTree(
      <FeedbackGlowBoundary enabled={false} data-testid="boundary">
        <button id="button">b</button>
      </FeedbackGlowBoundary>,
    );
    const boundary = container.querySelector('[data-testid="boundary"]') as HTMLElement;
    expect([boundary.getAttribute(feedbackGlowAttribute), click("button")]).toEqual(["off", false]);
  });

  it("target=document makes the document element the boundary, and unmount detaches it", () => {
    renderTree(<FeedbackGlowBoundary enabled target="document" />);
    const attached = document.documentElement.getAttribute(feedbackGlowAttribute);
    act(() => root.render(<></>));
    expect([attached, document.documentElement.hasAttribute(feedbackGlowAttribute)]).toEqual(["on", false]);
  });
});
