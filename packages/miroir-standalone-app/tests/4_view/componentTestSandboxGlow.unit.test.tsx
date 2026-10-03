import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { defaultFeedbackGlow, feedbackGlowAttribute, feedbackGlowClass } from "miroir-react";

import { ComponentTestSandboxProvider } from "../../src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox.js";

// Feedback glow (#438): the Component Test Sandbox is an enabled feedback glow boundary, so the controls a
// displayed test run clicks glow. The runner mounts each case in its own container and React root
// under the sandbox element; the case here is a plain button appended the same way.

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
});
