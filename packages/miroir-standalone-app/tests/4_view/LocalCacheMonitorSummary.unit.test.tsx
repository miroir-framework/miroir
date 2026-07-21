import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { estimateObjectBytes, measureLocalCacheMemory } from "miroir-core";

const showLocalCacheMonitorRef = { current: false };
const domainControllerRef: { current: any } = { current: undefined };

vi.mock("miroir-react", () => ({
  useMiroirContextService: () => ({
    showLocalCacheMonitor: showLocalCacheMonitorRef.current,
    domainController: domainControllerRef.current,
  }),
}));

import { localCacheMonitorRegistry } from "../../src/miroir-fwk/4_view/tools/localCacheMonitorRegistry.js";
import {
  LocalCacheMonitorSummary,
  readLocalCacheMonitorBreakdown,
} from "../../src/miroir-fwk/4_view/components/LocalCacheMonitorSummary.js";

describe("LocalCacheMonitorSummary (Phase 7)", () => {
  beforeEach(() => {
    showLocalCacheMonitorRef.current = false;
    domainControllerRef.current = undefined;
    localCacheMonitorRegistry.resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("LocalCacheMonitorSummary renders nothing when monitor is off", () => {
    const { container } = render(<LocalCacheMonitorSummary />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows effective, present, history, and query-cache sizes when on", () => {
    showLocalCacheMonitorRef.current = true;
    localCacheMonitorRegistry.setSnapshot({
      breakdown: {
        presentSnapshotBytes: 3922,
        transactionHistoryBytes: 120,
        queriesResultsCacheBytes: 48,
        effectiveBytes: 4090,
      },
      attributedInstances: [],
    });

    render(<LocalCacheMonitorSummary />);

    expect(screen.getByTestId("localcache-monitor-summary")).toBeInTheDocument();
    expect(screen.getByTestId("localcache-monitor-badge")).toHaveTextContent("localcache");

    fireEvent.click(
      screen.getByRole("button", { name: /expand localcache monitor summary/i })
    );

    expect(screen.getByTestId("localcache-monitor-breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("localcache-monitor-effective")).toHaveTextContent("4.0 KB");
    expect(screen.getByTestId("localcache-monitor-present")).toHaveTextContent("3.8 KB");
    expect(screen.getByTestId("localcache-monitor-history")).toHaveTextContent("120 B");
    expect(screen.getByTestId("localcache-monitor-query-cache")).toHaveTextContent("48 B");
  });

  it("reads non-zero sizes from LocalCache.getState even without session monitor APIs", () => {
    const presentModelSnapshot = {
      current: {
        "dep_data_entity": {
          ids: ["a"],
          entities: {
            a: { uuid: "a", parentUuid: "entity", name: "Publisher Gallimard" },
          },
        },
      },
      loading: {},
    };
    const state = {
      presentModelSnapshot,
      previousModelSnapshot: presentModelSnapshot,
      pastModelPatches: [],
      futureModelPatches: [],
      currentTransaction: [],
      queriesResultsCache: {},
    };
    const expected = measureLocalCacheMemory(state as any);
    expect(expected.presentSnapshotBytes).toBeGreaterThan(0);
    expect(estimateObjectBytes(presentModelSnapshot)).toBeGreaterThan(0);

    // Simulate stale LocalCache dist: getState only, no setLocalCacheMonitorEnabled.
    const localCache = {
      getState: () => state,
    };
    const breakdown = readLocalCacheMonitorBreakdown(localCache);
    expect(breakdown).not.toBeNull();
    expect(breakdown!.presentSnapshotBytes).toBe(expected.presentSnapshotBytes);
    expect(breakdown!.effectiveBytes).toBeGreaterThan(0);

    showLocalCacheMonitorRef.current = true;
    domainControllerRef.current = {
      getLocalCache: () => localCache,
    };

    render(<LocalCacheMonitorSummary />);
    fireEvent.click(
      screen.getByRole("button", { name: /expand localcache monitor summary/i })
    );
    expect(screen.getByTestId("localcache-monitor-present")).not.toHaveTextContent("0 B");
    expect(screen.getByTestId("localcache-monitor-effective")).not.toHaveTextContent("0 B");
  });
});
