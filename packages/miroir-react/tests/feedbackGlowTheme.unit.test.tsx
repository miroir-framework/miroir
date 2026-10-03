// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultStoredMiroirTheme } from "miroir-app-miroir";

import { FeedbackGlowBoundary } from "../src/components/FeedbackGlow/FeedbackGlowBoundary.js";
import {
  feedbackGlowClass,
  feedbackGlowColorProperty,
  feedbackGlowDurationProperty,
  feedbackGlowIntensityProperty,
  feedbackGlowStylesAttribute,
} from "../src/components/FeedbackGlow/feedbackGlow.js";
import { resolveThemeColors } from "../src/components/Themes/ThemeColorDefaults.js";
import { MiroirThemeProvider } from "../src/contexts/MiroirThemeContext.js";

// Feedback glow (#438): glow colour, duration and intensity come from the Theme (`components.feedbackGlow`), and
// reduced motion gets a static glow.

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const orangeTheme = {
  ...defaultStoredMiroirTheme.definition,
  components: {
    ...defaultStoredMiroirTheme.definition.components,
    feedbackGlow: { color: "#ff9800", durationMs: 800, intensity: 4 },
  },
};

describe("feedbackGlow theme", () => {
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
    vi.useRealTimers();
  });

  it("the default theme resolves the glow to #ffd54f, 1000 ms and intensity 2.5", () => {
    expect(resolveThemeColors(defaultStoredMiroirTheme.definition).components.feedbackGlow).toEqual({
      color: "#ffd54f",
      durationMs: 1000,
      intensity: 2.5,
    });
  });

  it("a theme's glow colour, duration and intensity are kept", () => {
    expect(resolveThemeColors(orangeTheme).components.feedbackGlow).toEqual({
      color: "#ff9800",
      durationMs: 800,
      intensity: 4,
    });
  });

  it("the boundary takes colour, duration and intensity from the current theme", () => {
    vi.useFakeTimers();
    act(() =>
      root.render(
        <MiroirThemeProvider
          currentThemeId="orange"
          currentThemeOptions={[{ id: "orange", name: "Orange", description: "", theme: orangeTheme }]}
        >
          <FeedbackGlowBoundary enabled data-testid="boundary">
            <button id="button">b</button>
          </FeedbackGlowBoundary>
        </MiroirThemeProvider>,
      ),
    );
    const boundary = container.querySelector('[data-testid="boundary"]') as HTMLElement;
    const button = document.getElementById("button") as HTMLElement;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    vi.advanceTimersByTime(400);
    const glowingAt400 = button.classList.contains(feedbackGlowClass);
    vi.advanceTimersByTime(400);
    expect([
      boundary.style.getPropertyValue(feedbackGlowColorProperty),
      boundary.style.getPropertyValue(feedbackGlowDurationProperty),
      boundary.style.getPropertyValue(feedbackGlowIntensityProperty),
      glowingAt400,
      button.classList.contains(feedbackGlowClass),
    ]).toEqual(["#ff9800", "800ms", "4", true, false]);
  });

  it("under reduced motion the glow is static", () => {
    act(() => root.render(<FeedbackGlowBoundary enabled />));
    const css = document.head.querySelector(`style[${feedbackGlowStylesAttribute}]`)?.textContent ?? "";
    const reducedMotion = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect([reducedMotion.includes("animation: none"), reducedMotion.includes(`.${feedbackGlowClass}`)]).toEqual([
      true,
      true,
    ]);
  });
});
