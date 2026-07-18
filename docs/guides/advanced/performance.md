# UI performance monitoring (render insights)

Developer note for diagnosing refresh storms and slow renders in the Miroir standalone app (GitHub [#61](https://github.com/miroir-framework/miroir/issues/61)).

## Timer toggle (AppBar)

The **timer** AppBar control sets `showPerformanceDisplay`. It is independent of the **bug** (visual-debug / `showDebugInfo`) toggle.

| Timer | Effect |
|---|---|
| **Off** (default) | No registry writes, no insight chrome, near-zero footprint |
| **On** | Instrumented components record render counts (and optional timing); teal `perf` chips and a docked summary appear |

Turning the timer **off** clears the in-memory insight registry and timing metrics.

## What you see

- **Inline chips** (`RenderInsightHeader`) — compact teal pills next to instrumented components (`×nav · Σtotal`, optional `ms`). Distinct from amber visual-debug bars (`🔍`).
- **Docked summary** (`RenderInsightSummary`) — at the **top** of the report, **folded by default**. Expand for a hottest-first list, live **max depth** control, Clear, and Export JSON.

Theme tokens live under `theme.components.renderInsight` (resolved like other component themes).

## Depth filter

Default **max depth** is `2` (session-persisted). Nodes deeper than max depth are collapsed into an **aggregate** on the last visible ancestor (descendant count, avg / min / max nav renders). Raising max depth reveals more inline chips; it never unmounts real editors.

## Instrumenting a component

```tsx
import { useRenderInsight } from "../tools/useRenderInsight.js";
import { RenderInsightHeader } from "../components/RenderInsightHeader.js";

const navigationKey = `${deploymentUuid}-${applicationSection}`;
const { navigationCount, totalCount, lastRenderTime } = useRenderInsight(
  "MyComponent",
  navigationKey,
  formikPath // optional — distinguishes siblings
);

// … later in JSX (null when timer off)
<RenderInsightHeader
  componentName="MyComponent"
  navigationCount={navigationCount}
  totalCount={totalCount}
  formikPath={formikPath}
  lastRenderTime={lastRenderTime}
/>
```

For timing as well as counts, call `renderInsightRegistry.trackRender({ …, enabled: true, durationMs })` once near the end of render when `showPerformanceDisplay` is true (see `JzodObjectEditor` / `JzodArrayEditor` / `ValueObjectGrid`). Do **not** call `performance.now` or write the registry when the timer is off.

## Related APIs

| Piece | Role |
|---|---|
| `useRenderInsight` | Gated count hook |
| `renderInsightRegistry` | In-memory path-keyed metrics |
| `applyPerformanceDisplayGate` | Syncs AppBar timer → `performanceConfig.enabled` + clears on disable |
| `summarizeTree` / `getRenderInsightMaxDepth` | Depth collapse + aggregates |
