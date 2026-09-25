import type { ReactComponentTestStep, ReactComponentTestTarget } from "miroir-core";

import {
  componentTestAct,
  waitAfterUserInteraction,
  type ComponentTestEnvironment,
} from "./componentTestEnvironment.js";
import { describeTarget, queryAllTarget, resolveTarget } from "./componentTestTargets.js";
import {
  extractValuesFromRenderedElements,
  formValuesToJSON,
  testSectionName,
} from "./componentTestTools.js";
import {
  customStepRegistry,
  type ComponentTestStepContext,
  type CustomStep,
} from "./customStepRegistry.js";

// ################################################################################################
// Interpreter of the declarative component test steps (#292, analysis §5.3, §5.4).
//
// - After each action step (DOM events, typing, widget steps), it awaits `componentTestAct`, then
//   `waitAfterUserInteraction(container)` (D9). Widget steps also wait for their own
//   postcondition (e.g. `data-test-is-open`).
// - A failing step throws a `ComponentTestStepError` whose message is
//   `step <n> (<kind>[ "<label>"]): <message>`, `n` 1-based (T10). An `expectRenderedValues`
//   failure also carries the expected and actual values.
// - `saveAs` keeps the element of a step for the later targets `{"ref": <name>}` (T11).
//
// It does not import `@testing-library/react`: it runs in the app too.
// ################################################################################################

/** A failed step, with the T10 message and, for `expectRenderedValues`, the compared values. */
export class ComponentTestStepError extends Error {
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly hasComparedValues: boolean;
  constructor(message: string, comparedValues?: { expected: unknown; actual: unknown }) {
    super(message);
    this.name = "ComponentTestStepError";
    this.hasComparedValues = comparedValues !== undefined;
    this.expected = comparedValues?.expected;
    this.actual = comparedValues?.actual;
  }
}

/** Thrown by `expectRenderedValues` when the rendered values differ from `expectedValue`. */
class RenderedValuesMismatch extends Error {
  constructor(
    message: string,
    readonly expected: unknown,
    readonly actual: unknown,
  ) {
    super(message);
  }
}

export interface RunComponentTestStepsOptions {
  /** Defaults to `customStepRegistry`. */
  customSteps?: Record<string, CustomStep>;
}

type StepOf<K extends ReactComponentTestStep["step"]> = Extract<ReactComponentTestStep, { step: K }>;

const selectOpenTimeout = 1000;

function notImplemented(what?: string): Error {
  return new Error(what ? `${what}: not implemented` : "not implemented");
}

function stepPrefix(step: ReactComponentTestStep, index: number): string {
  return `step ${index + 1} (${step.step}${step.label !== undefined ? ` "${step.label}"` : ""})`;
}

/** Runs `callback` without React `act`, then waits for React to settle (D9). */
async function runAction(env: ComponentTestEnvironment, callback: () => unknown): Promise<void> {
  await componentTestAct(callback);
  await waitAfterUserInteraction(env.container);
}

/** Retries `check` until it does not throw, for at most `timeout` ms, keeping the last error. */
async function waitUntil(env: ComponentTestEnvironment, check: () => void, timeout: number): Promise<void> {
  await env.waitFor(check, { timeout, onTimeout: (error: Error) => error });
}

function checkAttribute(element: HTMLElement, attribute: string, value: string): void {
  const actual = element.getAttribute(attribute);
  if (actual !== value) {
    throw new Error(`attribute ${attribute} is ${JSON.stringify(actual)}, expected ${JSON.stringify(value)}`);
  }
}

/** Waits until the element of `target` has `attribute` equal to `value`, resolving it at each try. */
async function waitForAttributeValue(
  env: ComponentTestEnvironment,
  target: ReactComponentTestTarget,
  attribute: string,
  value: string,
  timeout: number,
  elements: Record<string, HTMLElement>,
): Promise<void> {
  await waitUntil(env, () => checkAttribute(resolveTarget(env, target, elements), attribute, value), timeout);
}

/**
 * The option lists rendered in the sandbox, by field (T8): `[role="option"]` elements whose
 * `aria-label` is `<formik name>-option-<value>` (`ThemedSelectWithPortal`), grouped by the formik
 * name without its `TESTSECTION.` prefix, texts in DOM order.
 */
function renderedOptions(env: ComponentTestEnvironment): Record<string, string[]> {
  const options: Record<string, string[]> = {};
  const prefix = `${testSectionName}.`;
  for (const option of Array.from(env.sandboxElement.querySelectorAll<HTMLElement>('[role="option"]'))) {
    const ariaLabel = option.getAttribute("aria-label") ?? "";
    const separator = ariaLabel.indexOf("-option-");
    if (separator < 0) {
      continue;
    }
    const formikName = ariaLabel.slice(0, separator);
    const field = formikName.startsWith(prefix) ? formikName.slice(prefix.length) : formikName;
    (options[field] ??= []).push(option.textContent?.trim() ?? "");
  }
  return options;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// ################################################################################################
/** Runs `steps` in order against the mounted case of `env`. */
export async function runComponentTestSteps(
  env: ComponentTestEnvironment,
  steps: readonly ReactComponentTestStep[],
  options: RunComponentTestStepsOptions = {},
): Promise<void> {
  const customSteps = options.customSteps ?? customStepRegistry;
  const context: ComponentTestStepContext = { elements: {} };
  let user: ReturnType<ComponentTestEnvironment["userEvent"]["setup"]> | undefined;
  const userSession = () => (user ??= env.userEvent.setup());

  const resolve = (target: ReactComponentTestTarget) => resolveTarget(env, target, context.elements);
  const save = (element: HTMLElement, saveAs: string | undefined) => {
    if (saveAs !== undefined) {
      context.elements[saveAs] = element;
    }
  };

  const handlers: {
    [K in ReactComponentTestStep["step"]]?: (step: StepOf<K>) => Promise<void>;
  } = {
    click: async (step) => {
      const element = resolve(step.target);
      save(element, step.saveAs);
      await runAction(env, () => env.fireEvent.click(element));
    },
    change: async (step) => {
      const element = resolve(step.target);
      save(element, step.saveAs);
      await runAction(env, () => env.fireEvent.change(element, { target: { value: step.value } }));
    },
    blur: async (step) => {
      const element = resolve(step.target);
      await runAction(env, () => env.fireEvent.blur(element));
    },
    type: async (step) => {
      const element = resolve(step.target);
      await runAction(env, () => userSession().type(element, step.text));
    },
    clear: async (step) => {
      const element = resolve(step.target);
      await runAction(env, () => userSession().clear(element));
    },
    keyboard: async (step) => {
      await runAction(env, () => userSession().keyboard(step.keys));
    },
    waitForAttribute: async (step) => {
      await waitForAttributeValue(
        env,
        step.target,
        step.attribute,
        step.value,
        step.timeout ?? 1000,
        context.elements,
      );
    },
    openSelect: async (step) => {
      const combobox = resolve({ widget: "combobox", field: step.field, select: step.select });
      const state: ReactComponentTestTarget = { widget: "selectState", field: step.field, select: step.select };
      await runAction(env, async () => {
        env.fireEvent.click(combobox);
        await waitForAttributeValue(env, state, "data-test-is-open", "true", selectOpenTimeout, context.elements);
      });
    },
    filterSelect: async (step) => {
      const combobox = resolve({ widget: "combobox", field: step.field, select: step.select });
      const state: ReactComponentTestTarget = { widget: "selectState", field: step.field, select: step.select };
      await runAction(env, async () => {
        await userSession().clear(combobox);
        await userSession().type(combobox, step.text);
        await waitForAttributeValue(env, state, "data-test-filter-text", step.text, selectOpenTimeout, context.elements);
      });
    },
    expectRenderedValues: async (step) => {
      for (const parameter of ["field", "path", "filter", "timeout"] as const) {
        if (step[parameter] !== undefined) {
          throw notImplemented(`expectRenderedValues.${parameter}`);
        }
      }
      const extracted = extractValuesFromRenderedElements(
        env.expect,
        undefined,
        env.container,
        testSectionName,
        step.label,
        step.detectOptions ?? false,
        env.portalElement,
      );
      // array-valued entries are the extractor's option lists, replaced by `$options` (T8)
      const fieldValues = Object.fromEntries(
        Object.entries(extracted).filter(([, value]) => !Array.isArray(value)),
      );
      let actual: unknown = formValuesToJSON(fieldValues);
      const options = renderedOptions(env);
      if (Object.keys(options).length > 0 && isPlainObject(actual)) {
        actual = { ...actual, $options: options };
      }
      context.lastValues = actual;
      env.log.info("expectRenderedValues", step.label, actual);
      try {
        env.expect(actual, "rendered values").toEqual(step.expectedValue);
      } catch (error) {
        throw new RenderedValuesMismatch(
          error instanceof Error ? error.message : String(error),
          step.expectedValue,
          actual,
        );
      }
    },
    expectElement: async (step) => {
      for (const parameter of ["count", "values", "checked", "containsHtml", "parentContains", "timeout"] as const) {
        if (step[parameter] !== undefined) {
          throw notImplemented(`expectElement.${parameter}`);
        }
      }
      if (step.present === false) {
        const matches = queryAllTarget(env, step.target, context.elements);
        if (matches.length > 0) {
          throw new Error(`expected no element to match target ${describeTarget(step.target)}, found ${matches.length}`);
        }
        return;
      }
      const element = resolve(step.target);
      save(element, step.saveAs);
      if (step.value !== undefined) {
        env.expect(element, "element value").toHaveValue(step.value);
      }
      if (step.attribute !== undefined) {
        checkAttribute(element, step.attribute.name, step.attribute.value);
      }
    },
    custom: async (step) => {
      const customStep = customSteps[step.function];
      if (!customStep) {
        throw new Error(`custom step "${step.function}" is not in the custom step registry`);
      }
      await customStep(env, step.params, context);
    },
  };

  for (const [index, step] of steps.entries()) {
    try {
      const handler = handlers[step.step] as ((step: ReactComponentTestStep) => Promise<void>) | undefined;
      if (!handler) {
        throw notImplemented();
      }
      await handler(step);
    } catch (error) {
      const message = `${stepPrefix(step, index)}: ${error instanceof Error ? error.message : String(error)}`;
      throw new ComponentTestStepError(
        message,
        error instanceof RenderedValuesMismatch ? { expected: error.expected, actual: error.actual } : undefined,
      );
    }
  }
}
