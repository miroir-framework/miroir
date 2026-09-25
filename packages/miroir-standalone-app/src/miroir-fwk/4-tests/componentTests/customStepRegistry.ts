import type { ComponentTestEnvironment } from "./componentTestEnvironment.js";

// ################################################################################################
// Registry of the `custom` steps of the declarative component tests (#292, analysis D2): the
// escape hatch for a step the vocabulary cannot express yet. Removed at #292 M2.
// ################################################################################################

/** What a `custom` step sees of the steps run before it in the same case. */
export interface ComponentTestStepContext {
  /** The actual value of the last `expectRenderedValues` step, if any. */
  lastValues?: unknown;
  /** The elements saved by `saveAs`, by name. */
  elements: Record<string, HTMLElement>;
}

export type CustomStep = (
  env: ComponentTestEnvironment,
  params: Record<string, any> | undefined,
  context: ComponentTestStepContext,
) => Promise<void>;

export const customStepRegistry: Record<string, CustomStep> = {};
