import React, { useEffect, useState } from "react";
import { useMiroirContextService } from "miroir-react";
import {
  buildAttributedInstanceIndex,
  measureLocalCacheMemory,
  type LocalCacheMemoryBreakdown,
} from "miroir-core";
import { localCacheMonitorRegistry } from "../tools/localCacheMonitorRegistry.js";

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const EMPTY_BREAKDOWN: LocalCacheMemoryBreakdown = {
  presentSnapshotBytes: 0,
  transactionHistoryBytes: 0,
  queriesResultsCacheBytes: 0,
  effectiveBytes: 0,
};

/**
 * Prefer a live `measureLocalCacheMemory(getState())` walk.
 * Session snapshot / enable APIs are optional (attributed deltas, indicators).
 */
export function readLocalCacheMonitorBreakdown(localCache: {
  getState?: () => unknown;
  setLocalCacheMonitorEnabled?: (enabled: boolean) => void;
  getLocalCacheMonitorSnapshot?: () => {
    breakdown: LocalCacheMemoryBreakdown;
    attributedInstances: unknown[];
  } | null;
} | null | undefined): LocalCacheMemoryBreakdown | null {
  if (!localCache) {
    return null;
  }

  try {
    localCache.setLocalCacheMonitorEnabled?.(true);
  } catch {
    // Optional session API — ignore if absent or throws.
  }

  const state = localCache.getState?.();
  if (state && typeof state === "object") {
    const breakdown = measureLocalCacheMemory(state as any);
    const present = (state as { presentModelSnapshot?: unknown }).presentModelSnapshot;
    localCacheMonitorRegistry.setSnapshot({
      breakdown,
      attributedInstances:
        present && typeof present === "object"
          ? buildAttributedInstanceIndex(present as any)
          : [],
    });
    return breakdown;
  }

  try {
    const snap = localCache.getLocalCacheMonitorSnapshot?.();
    if (snap?.breakdown) {
      localCacheMonitorRegistry.setSnapshot(snap as any);
      return snap.breakdown;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Docked (non-floating) LocalCache memory summary (#211).
 * Folded by default; polls ≤1s when the monitor gate is ON.
 */
export const LocalCacheMonitorSummary: React.FC = () => {
  const context = useMiroirContextService();
  const [collapsed, setCollapsed] = useState(true);
  const [breakdown, setBreakdown] = useState<LocalCacheMemoryBreakdown | null>(null);

  useEffect(() => {
    if (!context.showLocalCacheMonitor) {
      setBreakdown(null);
      return;
    }

    const poll = () => {
      try {
        const localCache = context.domainController?.getLocalCache?.();
        const live = readLocalCacheMonitorBreakdown(localCache);
        if (live) {
          setBreakdown(live);
          return;
        }
      } catch {
        // Fall through to registry (unit tests inject snapshots there).
      }
      const fromReg = localCacheMonitorRegistry.getSnapshot();
      setBreakdown(fromReg?.breakdown ?? EMPTY_BREAKDOWN);
    };

    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [context.showLocalCacheMonitor, context.domainController]);

  if (!context.showLocalCacheMonitor) {
    return null;
  }

  const b = breakdown ?? EMPTY_BREAKDOWN;

  return (
    <div
      data-testid="localcache-monitor-summary"
      style={{
        margin: "8px 0",
        padding: "8px 12px",
        border: "1px solid #64748b",
        borderRadius: 6,
        background: "#0f172a",
        color: "#e2e8f0",
        fontSize: 13,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: collapsed ? 0 : 8,
        }}
      >
        <span
          data-testid="localcache-monitor-badge"
          style={{
            backgroundColor: "#94a3b8",
            color: "#0f172a",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "0 5px",
            borderRadius: 999,
            lineHeight: "18px",
          }}
        >
          localcache
        </span>
        <span style={{ fontWeight: 600 }}>LocalCache (in-memory)</span>
        <span data-testid="localcache-monitor-effective-inline">
          Effective {formatBytes(b.effectiveBytes)}
        </span>
        <button
          type="button"
          aria-label={
            collapsed
              ? "Expand LocalCache monitor summary"
              : "Collapse LocalCache monitor summary"
          }
          onClick={() => setCollapsed((c) => !c)}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "1px solid #64748b",
            color: "#e2e8f0",
            borderRadius: 4,
            padding: "2px 8px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      {!collapsed && (
        <dl
          data-testid="localcache-monitor-breakdown"
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "4px 16px",
            margin: 0,
          }}
        >
          <dt>Effective</dt>
          <dd data-testid="localcache-monitor-effective">{formatBytes(b.effectiveBytes)}</dd>
          <dt>Present</dt>
          <dd data-testid="localcache-monitor-present">{formatBytes(b.presentSnapshotBytes)}</dd>
          <dt>Transaction / history</dt>
          <dd data-testid="localcache-monitor-history">
            {formatBytes(b.transactionHistoryBytes)}
          </dd>
          <dt>Query cache</dt>
          <dd data-testid="localcache-monitor-query-cache">
            {formatBytes(b.queriesResultsCacheBytes)}
          </dd>
        </dl>
      )}
    </div>
  );
};
