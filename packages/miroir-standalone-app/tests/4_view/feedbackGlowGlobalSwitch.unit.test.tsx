import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { DomainControllerInterface } from "miroir-core";
import { MiroirActivityTracker, MiroirEventService } from "miroir-core";
import {
  feedbackGlowAttribute,
  feedbackGlowClass,
  feedbackGlowStorageKey,
  MiroirContextReactProvider,
} from "miroir-react";

import { FeedbackGlowAppBarButton } from "../../src/miroir-fwk/4_view/components/Page/AppBar.js";
import { GlobalFeedbackGlow } from "../../src/miroir-fwk/4_view/components/Page/GlobalFeedbackGlow.js";

// Feedback glow (#438): the global switch. The AppBar button turns the glow on for the whole document
// (portals to document.body included); the choice is kept in localStorage; off by default.

const miroirActivityTracker = new MiroirActivityTracker();
const miroirContext = {
  miroirActivityTracker,
  miroirEventService: new MiroirEventService(miroirActivityTracker),
  extendMiroirConfigWithExtraDeploymentConfiguration: () => undefined,
};

function Shell({ initialFeedbackGlowEnabled }: { initialFeedbackGlowEnabled?: boolean }) {
  return (
    <MiroirContextReactProvider
      miroirContext={miroirContext as any}
      domainController={{} as DomainControllerInterface}
      initialFeedbackGlowEnabled={initialFeedbackGlowEnabled}
    >
      <GlobalFeedbackGlow />
      <FeedbackGlowAppBarButton />
    </MiroirContextReactProvider>
  );
}

/** A control outside the React tree, as an option list portalled to `document.body`. */
function clickPortalledOption(): boolean {
  const option = document.createElement("li");
  option.setAttribute("role", "option");
  document.body.appendChild(option);
  fireEvent.click(option);
  const glows = option.classList.contains(feedbackGlowClass);
  option.remove();
  return glows;
}

describe("feedbackGlowGlobalSwitch", () => {
  beforeEach(() => localStorage.removeItem(feedbackGlowStorageKey));
  afterEach(() => {
    cleanup();
    localStorage.removeItem(feedbackGlowStorageKey);
  });

  it("is off by default: no attribute on the document element, nothing glows", () => {
    render(<Shell />);
    expect([document.documentElement.hasAttribute(feedbackGlowAttribute), clickPortalledOption()]).toEqual([
      false,
      false,
    ]);
  });

  it("the AppBar button turns it on for the whole document and stores the choice", () => {
    render(<Shell />);
    fireEvent.click(screen.getByLabelText("Interaction glow"));
    expect([
      document.documentElement.getAttribute(feedbackGlowAttribute),
      localStorage.getItem(feedbackGlowStorageKey),
      clickPortalledOption(),
    ]).toEqual(["on", "true", true]);
  });

  it("starts on when localStorage says so (reload)", () => {
    localStorage.setItem(feedbackGlowStorageKey, "true");
    render(<Shell />);
    expect(document.documentElement.getAttribute(feedbackGlowAttribute)).toBe("on");
  });

  it("initialFeedbackGlowEnabled wins over localStorage and is not written back", () => {
    localStorage.setItem(feedbackGlowStorageKey, "true");
    render(<Shell initialFeedbackGlowEnabled={false} />);
    const attributeBefore = document.documentElement.hasAttribute(feedbackGlowAttribute);
    fireEvent.click(screen.getByLabelText("Interaction glow"));
    fireEvent.click(screen.getByLabelText("Interaction glow"));
    expect([attributeBefore, localStorage.getItem(feedbackGlowStorageKey)]).toEqual([false, "true"]);
  });
});
