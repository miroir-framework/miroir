/**
 * Phase 8.3 — Footprint acceptance (#211 negligible-impact gate).
 *
 * With the LocalCache monitor off, the docked panel must not mount.
 * Registry/indicator no-op when OFF is covered in localCacheMonitorSession.unit.test.ts.
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen } from "@testing-library/react";
import { MiroirContextReactTestProvider } from "miroir-react";
import "@testing-library/jest-dom";

const showLocalCacheMonitorRef = { current: false };

import { LocalCacheMonitorSummary } from "../../src/miroir-fwk/4_view/components/LocalCacheMonitorSummary.js";
import { applyLocalCacheMonitorGate } from "miroir-react";
import {
  LOCAL_CACHE_MONITOR_SESSION_KEY,
  resetLocalCacheMonitorConfig,
} from "miroir-react";
import { localCacheMonitorRegistry } from "miroir-react";

const TestContext = ({ children }: { children: React.ReactNode }) => (
  <MiroirContextReactTestProvider value={{ showLocalCacheMonitor: showLocalCacheMonitorRef.current, domainController: undefined } as any}>
    {children}
  </MiroirContextReactTestProvider>
);
const render = ((ui: React.ReactElement, options?: Parameters<typeof rtlRender>[1]) =>
  rtlRender(ui, { wrapper: TestContext, ...options })) as typeof rtlRender;

describe("localCacheMonitorFootprint acceptance (Phase 8.3)", () => {
  beforeEach(() => {
    showLocalCacheMonitorRef.current = false;
    resetLocalCacheMonitorConfig();
    localCacheMonitorRegistry.resetAll();
    sessionStorage.removeItem(LOCAL_CACHE_MONITOR_SESSION_KEY);
    applyLocalCacheMonitorGate(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("when monitor off, summary does not mount", () => {
    const { container, rerender } = render(<LocalCacheMonitorSummary />);
    for (let i = 0; i < 10; i++) {
      rerender(<LocalCacheMonitorSummary />);
    }
    expect(screen.queryByTestId("localcache-monitor-summary")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
    expect(localCacheMonitorRegistry.size()).toBe(0);
  });
});
