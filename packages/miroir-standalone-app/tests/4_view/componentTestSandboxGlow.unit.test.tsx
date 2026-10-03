import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { defaultFeedbackGlow, FeedbackGlowBoundary, feedbackGlowAttribute, feedbackGlowClass } from "miroir-react";

import { ComponentTestSandboxProvider } from "../../src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox.js";

// Feedback glow (#438): the Component Test Sandbox is an enabled feedback glow boundary, so the controls a
// displayed test run clicks glow. The runner mounts each case in its own container and React root
// under the sandbox element; the case here is a plain button appended the same way. The header's
// "Glow on interactions" checkbox, checked by default, turns the glow off for the sandbox, also when the
// global switch is on (the innermost boundary decides).

const appendCaseButton = () => {
  const caseContainer = document.createElement("div");
  const button = document.createElement("button");
  caseContainer.appendChild(button);
  screen.getByTestId("component-test-sandbox").appendChild(caseContainer);
  return button;
};

const glowsOnClick = (button: HTMLElement) => {
  fireEvent.click(button);
  const glows = button.classList.contains(feedbackGlowClass);
  vi.advanceTimersByTime(defaultFeedbackGlow.durationMs);
  return glows;
};

describe("componentTestSandboxGlow", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("the sandbox element is inside an enabled boundary", () => {
    render(<ComponentTestSandboxProvider />);
    const boundary = screen.getByTestId("component-test-sandbox").closest(`[${feedbackGlowAttribute}]`);
    expect(boundary?.getAttribute(feedbackGlowAttribute)).toBe("on");
  });

  it("a click on a control of a case container glows it, then the glow ends", () => {
    vi.useFakeTimers();
    render(<ComponentTestSandboxProvider />);
    const caseContainer = document.createElement("div");
    const button = document.createElement("button");
    caseContainer.appendChild(button);
    screen.getByTestId("component-test-sandbox").appendChild(caseContainer);

    fireEvent.click(button);
    const glowedOnClick = button.classList.contains(feedbackGlowClass);
    vi.advanceTimersByTime(defaultFeedbackGlow.durationMs);

    expect([glowedOnClick, button.classList.contains(feedbackGlowClass)]).toEqual([true, false]);
  });

  it("the header checkbox is checked; unchecking it turns the glow off, even under the global switch", () => {
    vi.useFakeTimers();
    render(
      <FeedbackGlowBoundary enabled target="document">
        <ComponentTestSandboxProvider />
      </FeedbackGlowBoundary>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Glow on interactions", hidden: true }) as HTMLInputElement;
    const checkedByDefault = checkbox.checked;
    fireEvent.click(checkbox);
    vi.advanceTimersByTime(defaultFeedbackGlow.durationMs);
    const boundary = screen.getByTestId("component-test-sandbox").closest(`[${feedbackGlowAttribute}]`);

    expect([
      checkedByDefault,
      checkbox.checked,
      boundary?.getAttribute(feedbackGlowAttribute),
      glowsOnClick(appendCaseButton()),
    ]).toEqual([true, false, "off", false]);
  });

  it("checking the box again restores the glow", () => {
    vi.useFakeTimers();
    render(<ComponentTestSandboxProvider />);
    const checkbox = screen.getByRole("checkbox", { name: "Glow on interactions", hidden: true });
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    vi.advanceTimersByTime(defaultFeedbackGlow.durationMs);

    expect(glowsOnClick(appendCaseButton())).toBe(true);
  });
});
