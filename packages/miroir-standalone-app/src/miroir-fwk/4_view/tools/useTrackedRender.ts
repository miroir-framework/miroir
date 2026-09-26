/**
 * Timed render-insight tracking for editor components (#61, #303 T2).
 *
 * Call `useTrackedRender(navigationKey)` at the top of the component's render body (it starts the
 * timer), then `end(componentId, formikPath)` just before returning the JSX, on every return path
 * that should be measured: it records the component's own render duration (children excluded)
 * in `renderInsightRegistry` and returns the counts for the insight chips.
 *
 * Near-zero cost when `showPerformanceDisplay` is off: no timer read, no registry write, `end`
 * returns `NOOP_RENDER_COUNTS`. `end` is a plain function (not a hook), so it may be called
 * after early returns or with a `componentId` chosen late in the render (e.g. array vs tuple).
 */

import { useRef } from "react";

import { useMiroirContextService } from "miroir-react";
import {
  NOOP_RENDER_COUNTS,
  renderInsightRegistry,
  type RenderCounts,
} from "./renderInsightRegistry.js";

export interface TrackedRender {
  /** `context.showPerformanceDisplay`: when false, nothing is tracked. */
  enabled: boolean;
  /** Records this render of `componentId` at `formikPath` with its duration since the hook call. */
  end: (componentId: string, formikPath?: string) => RenderCounts;
}

/** Navigation key of the editor insight tracks: `<deploymentUuid>-<applicationSection>`. */
export function editorNavigationKey(
  currentDeploymentUuid: string | undefined,
  currentApplicationSection: string | undefined,
): string {
  return `${currentDeploymentUuid ?? ""}-${currentApplicationSection ?? ""}`;
}

export function useTrackedRender(navigationKey: string): TrackedRender {
  const context = useMiroirContextService();
  const renderStartRef = useRef(0);
  const enabled = !!context.showPerformanceDisplay;
  if (enabled) {
    renderStartRef.current = performance.now();
  }
  return {
    enabled,
    end: (componentId: string, formikPath?: string): RenderCounts =>
      enabled
        ? renderInsightRegistry.trackRender({
            componentId,
            navigationKey,
            formikPath,
            enabled: true,
            durationMs: performance.now() - renderStartRef.current,
          })
        : NOOP_RENDER_COUNTS,
  };
}
