import type { ComponentRenderMeasurement, ReactComponentTestStep } from "miroir-core";

import { renderInsightRegistry, type RenderInsightNode } from "../../4_view/tools/renderInsightRegistry.js";
import type { ComponentTestEnvironment } from "./componentTestEnvironment.js";

// ################################################################################################
// `measureRendering` step (#303 analysis D5, D9, T4, T5).
//
// The step resets the render insight registry, then for each mode (`remount`, `update`, or both,
// in that order) and each iteration: acts on the mounted case (`env.remount()`, or `env.rerender`
// alternating the step's `updateProps` and the leaf's own props), waits for the rendering to
// settle, and takes the registry snapshot delta of the iteration. The delta of a component (its
// formik paths folded) is one sample; the samples are aggregated per component and mode. Timings
// never make the step fail (D9): only a render error or an empty sample set does.
// ################################################################################################

export type MeasureRenderingStep = Extract<ReactComponentTestStep, { step: "measureRendering" }>;
export type MeasureRenderingMode = ComponentRenderMeasurement["mode"];

/** The render time of one component in one iteration, all its formik paths together. */
export interface RenderSample {
  mode: MeasureRenderingMode;
  componentId: string;
  durationMs: number;
}

/** Component id of the measurement that sums every component of an iteration. */
export const TOTAL_MEASUREMENT_COMPONENT_ID = "(total)";

/** Registry snapshot folded per component id: render count and total render time. */
export type RenderTotals = Map<string, { count: number; totalMs: number }>;

/** The modes run by a step, in order. */
export function measureRenderingModes(mode: MeasureRenderingStep["mode"]): MeasureRenderingMode[] {
  return mode === "both" ? ["remount", "update"] : [mode];
}

/** Folds the formik paths of a registry snapshot: count and render time per component id. */
export function renderTotalsByComponent(snapshot: readonly RenderInsightNode[]): RenderTotals {
  const totals: RenderTotals = new Map();
  for (const node of snapshot) {
    const current = totals.get(node.componentId) ?? { count: 0, totalMs: 0 };
    current.count += node.totalCount;
    current.totalMs += node.totalRenderTime ?? 0;
    totals.set(node.componentId, current);
  }
  return totals;
}

/**
 * The samples of one iteration: one per component that rendered between `before` and `after`,
 * plus the `(total)` sample summing them. Empty when nothing rendered.
 */
export function iterationSamples(
  mode: MeasureRenderingMode,
  before: RenderTotals,
  after: RenderTotals,
): RenderSample[] {
  const samples: RenderSample[] = [];
  for (const [componentId, { count, totalMs }] of after) {
    const previous = before.get(componentId) ?? { count: 0, totalMs: 0 };
    if (count > previous.count) {
      samples.push({ mode, componentId, durationMs: totalMs - previous.totalMs });
    }
  }
  if (samples.length > 0) {
    samples.push({
      mode,
      componentId: TOTAL_MEASUREMENT_COMPONENT_ID,
      durationMs: samples.reduce((sum, sample) => sum + sample.durationMs, 0),
    });
  }
  return samples;
}

function median(sortedValues: readonly number[]): number {
  const middle = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 1
    ? sortedValues[middle]
    : (sortedValues[middle - 1] + sortedValues[middle]) / 2;
}

/**
 * Pure aggregation (T5): per mode and component id, in order of first sample, the number of
 * samples and their min / median / max / total.
 */
export function aggregateRenderSamples(samples: readonly RenderSample[]): ComponentRenderMeasurement[] {
  const byKey = new Map<string, { mode: MeasureRenderingMode; componentId: string; durations: number[] }>();
  for (const sample of samples) {
    const key = `${sample.mode}\u0000${sample.componentId}`;
    const entry = byKey.get(key) ?? { mode: sample.mode, componentId: sample.componentId, durations: [] };
    entry.durations.push(sample.durationMs);
    byKey.set(key, entry);
  }
  return [...byKey.values()].map(({ mode, componentId, durations }) => {
    const sorted = [...durations].sort((a, b) => a - b);
    return {
      mode,
      componentId,
      count: sorted.length,
      minMs: sorted[0],
      medianMs: median(sorted),
      maxMs: sorted[sorted.length - 1],
      totalMs: sorted.reduce((sum, value) => sum + value, 0),
    };
  });
}

function formatMs(value: number): string {
  return value.toFixed(2);
}

/** A text table of `measurements` (component, mode, count, min, median, max), for the log. */
export function formatMeasurementTable(measurements: readonly ComponentRenderMeasurement[]): string {
  const header = ["component", "mode", "count", "min ms", "median ms", "max ms"];
  const rows = measurements.map((entry) => [
    entry.componentId,
    entry.mode,
    String(entry.count),
    formatMs(entry.minMs),
    formatMs(entry.medianMs),
    formatMs(entry.maxMs),
  ]);
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => row[column].length)),
  );
  const line = (cells: string[]) => cells.map((cell, column) => cell.padEnd(widths[column])).join(" | ");
  return [line(header), widths.map((width) => "-".repeat(width)).join("-|-"), ...rows.map(line)].join("\n");
}

// ################################################################################################
const errorFallbackText = "Something went wrong in";

/** The number of error boundary fallbacks (`ErrorFallbackComponent`) rendered by the case. */
function errorFallbackCount(env: ComponentTestEnvironment): number {
  return (env.container.textContent ?? "").split(errorFallbackText).length - 1;
}

/**
 * Runs a `measureRendering` step on the mounted case of `env` with `iterations` iterations per
 * mode, and returns its measurements. Throws when an iteration renders an error boundary fallback
 * that was not there before the step (a pre-existing one, e.g. a known defect of the rendered
 * value, is not the step's failure), when `remount` / `rerender` throws, or when no sample is
 * collected (D9).
 */
export async function runMeasureRendering(
  env: ComponentTestEnvironment,
  step: MeasureRenderingStep,
  iterations: number,
): Promise<ComponentRenderMeasurement[]> {
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error(`iterations must be a positive integer, got ${iterations}`);
  }
  const fallbacksBefore = errorFallbackCount(env);
  renderInsightRegistry.resetAll();
  const samples: RenderSample[] = [];
  for (const mode of measureRenderingModes(step.mode)) {
    for (let iteration = 0; iteration < iterations; iteration++) {
      const before = renderTotalsByComponent(renderInsightRegistry.getSnapshot());
      if (mode === "remount") {
        await env.remount();
      } else {
        // alternates the step's updateProps and the leaf's own props, starting with updateProps
        await env.rerender(iteration % 2 === 0 ? step.updateProps : undefined);
      }
      const fallbacks = errorFallbackCount(env);
      if (fallbacks > fallbacksBefore) {
        throw new Error(`${mode} iteration ${iteration + 1}: the component rendered ${fallbacks - fallbacksBefore} error fallback(s)`);
      }
      samples.push(...iterationSamples(mode, before, renderTotalsByComponent(renderInsightRegistry.getSnapshot())));
    }
  }
  const measurements = aggregateRenderSamples(samples);
  const modesWithoutSamples = measureRenderingModes(step.mode).filter(
    (mode) => !measurements.some((entry) => entry.mode === mode),
  );
  if (modesWithoutSamples.length > 0) {
    throw new Error(
      `no render measurement collected for mode ${modesWithoutSamples.join(", ")} (is render tracking on for the suite?)`,
    );
  }
  return measurements;
}
