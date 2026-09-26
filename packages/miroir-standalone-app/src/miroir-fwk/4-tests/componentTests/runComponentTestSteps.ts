import type { ReactComponentTestStep, ReactComponentTestTarget } from "miroir-core";

import {
  componentTestAct,
  waitAfterUserInteraction,
  type ComponentTestEnvironment,
} from "./componentTestEnvironment.js";
import { describeTarget, queryAllTarget, resolveTarget } from "./componentTestTargets.js";
import {
  extractValuesFromRenderedElements,
  formikFieldName,
  formValuesToJSON,
  testSectionName,
} from "./componentTestTools.js";

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

type StepOf<K extends ReactComponentTestStep["step"]> = Extract<ReactComponentTestStep, { step: K }>;

/** The elements saved by `saveAs`, by name, kept across the steps of one case. */
interface ComponentTestStepContext {
  elements: Record<string, HTMLElement>;
}

const selectOpenTimeout = 1000;
const selectCommitTimeout = 2000;

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

const optionSeparator = "-option-";
const selectStateTestIdPrefix = "themed-select-state-";

/**
 * The formik name of an option whose `aria-label` is `<formik name>-option-<value>`. Both the name
 * and the value may contain `-option-`, so the name is the longest rendered select name (from the
 * `themed-select-state-<name>` trackers) that the label starts with, followed by the separator.
 * Without such a select, the label is split at its first separator.
 */
export function optionFormikName(ariaLabel: string, selectNames: readonly string[]): string | undefined {
  const selectName = selectNames
    .filter((name) => ariaLabel.startsWith(name + optionSeparator))
    .reduce<string | undefined>((longest, name) => (!longest || name.length > longest.length ? name : longest), undefined);
  if (selectName !== undefined) {
    return selectName;
  }
  const separator = ariaLabel.indexOf(optionSeparator);
  return separator < 0 ? undefined : ariaLabel.slice(0, separator);
}

/**
 * The option lists rendered in the sandbox, by field (T8): `[role="option"]` elements whose
 * `aria-label` is `<formik name>-option-<value>` (`ThemedSelectWithPortal`), grouped by the formik
 * name without its `TESTSECTION.` prefix, texts in DOM order.
 */
function renderedOptions(env: ComponentTestEnvironment): Record<string, string[]> {
  const options: Record<string, string[]> = {};
  const prefix = `${testSectionName}.`;
  const selectNames = Array.from(
    env.sandboxElement.querySelectorAll<HTMLElement>(`[data-testid^="${selectStateTestIdPrefix}"]`),
  ).map((tracker) => (tracker.getAttribute("data-testid") ?? "").slice(selectStateTestIdPrefix.length));
  for (const option of Array.from(env.sandboxElement.querySelectorAll<HTMLElement>('[role="option"]'))) {
    const formikName = optionFormikName(option.getAttribute("aria-label") ?? "", selectNames);
    if (formikName === undefined) {
      continue;
    }
    const field = formikName.startsWith(prefix) ? formikName.slice(prefix.length) : formikName;
    (options[field] ??= []).push(option.textContent?.trim() ?? "");
  }
  return options;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** The sub-value of `value` at `path` (T7); `undefined` when a segment is missing. */
function valueAtPath(value: unknown, path: readonly (string | number)[]): unknown {
  let current: any = value;
  for (const segment of path) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

/** The `value` of a form element, as the old `(element as HTMLInputElement).value` reads. */
function elementValue(element: HTMLElement): unknown {
  return (element as HTMLInputElement).value;
}

// ################################################################################################
/** Runs `steps` in order against the mounted case of `env`. */
export async function runComponentTestSteps(
  env: ComponentTestEnvironment,
  steps: readonly ReactComponentTestStep[],
): Promise<void> {
  const context: ComponentTestStepContext = { elements: {} };
  let user: ReturnType<ComponentTestEnvironment["userEvent"]["setup"]> | undefined;
  const userSession = () => (user ??= env.userEvent.setup());

  const resolve = (target: ReactComponentTestTarget) => resolveTarget(env, target, context.elements);
  const save = (element: HTMLElement, saveAs: string | undefined) => {
    if (saveAs !== undefined) {
      context.elements[saveAs] = element;
    }
  };

  /** `expectRenderedValues` once: throws `RenderedValuesMismatch` when the values differ. */
  const checkRenderedValues = (step: StepOf<"expectRenderedValues">): void => {
    const extracted = extractValuesFromRenderedElements(
      env.expect,
      step.filter === undefined ? undefined : [...step.filter],
      env.container,
      step.field === undefined ? testSectionName : formikFieldName(step.field),
      step.label,
      step.detectOptions ?? false,
      env.portalElement,
    );
    // array-valued entries are the extractor's option lists, replaced by `$options` (T8)
    const fieldValues = Object.fromEntries(
      Object.entries(extracted).filter(([, value]) => !Array.isArray(value)),
    );
    let actual: unknown = formValuesToJSON(fieldValues);
    if (step.path !== undefined) {
      actual = valueAtPath(actual, step.path);
    }
    const options = renderedOptions(env);
    if (Object.keys(options).length > 0 && isPlainObject(actual)) {
      actual = { ...actual, $options: options };
    }
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
  };

  /** `expectElement` once. */
  const checkElement = (step: StepOf<"expectElement">): void => {
    if (step.present === false) {
      const matches = queryAllTarget(env, step.target, context.elements);
      if (matches.length > 0) {
        throw new Error(`expected no element to match target ${describeTarget(step.target)}, found ${matches.length}`);
      }
      return;
    }
    if (step.count !== undefined) {
      const matches = queryAllTarget(env, step.target, context.elements);
      if (matches.length !== step.count) {
        throw new Error(
          `expected ${step.count} elements to match target ${describeTarget(step.target)}, found ${matches.length}`,
        );
      }
    }
    if (step.values !== undefined) {
      const matches = queryAllTarget(env, step.target, context.elements);
      env.expect(matches.map(elementValue), "element values").toEqual(step.values);
    }
    if (
      (step.count !== undefined || step.values !== undefined) &&
      step.value === undefined &&
      step.checked === undefined &&
      step.containsHtml === undefined &&
      step.attribute === undefined &&
      step.parentContains === undefined &&
      step.saveAs === undefined
    ) {
      return;
    }
    const element = resolve(step.target);
    save(element, step.saveAs);
    // A `ref` designates an element saved earlier, which a re-render may have detached (e.g. a
    // renamed record entry): the old cases asserted only its value, not its presence.
    if (step.target.ref === undefined) {
      env.expect(element, "element").toBeInTheDocument();
    }
    if (step.value !== undefined) {
      env.expect(element, "element value").toHaveValue(step.value);
    }
    if (step.checked === true) {
      env.expect(element, "element checked").toBeChecked();
    }
    if (step.checked === false) {
      env.expect(element, "element checked").not.toBeChecked();
    }
    if (step.containsHtml !== undefined) {
      env.expect(element, "element html").toContainHTML(step.containsHtml);
    }
    if (step.attribute !== undefined) {
      checkAttribute(element, step.attribute.name, step.attribute.value);
    }
    if (step.parentContains !== undefined) {
      const inner = resolve(step.parentContains);
      if (!element.parentElement?.contains(inner)) {
        throw new Error(
          `the parent of target ${describeTarget(step.target)} does not contain target ${describeTarget(step.parentContains)}`,
        );
      }
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
    clickArrayButton: async (step) => {
      const element = resolve({ widget: "arrayButton", field: step.field, action: step.action, index: step.index });
      await runAction(env, () => env.fireEvent.click(element));
    },
    clickObjectButton: async (step) => {
      const element = resolve({
        widget: "objectButton",
        field: step.field,
        action: step.action,
        attribute: step.attribute,
      });
      await runAction(env, () => env.fireEvent.click(element));
    },
    renameRecordEntry: async (step) => {
      const element = resolve({ widget: "recordEntryName", field: step.field, entry: step.entry });
      await componentTestAct(() => env.fireEvent.change(element, { target: { value: step.newName } }));
      await runAction(env, () => env.fireEvent.blur(element));
    },
    submit: async (step) => {
      const element = resolve(step.target);
      await runAction(env, () => env.fireEvent.submit(element));
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
    selectOption: async (step) => {
      const combobox = resolve({ widget: "combobox", field: step.field, select: step.select });
      // The state tracker is resolved once, as the old cases did: the union type selector unmounts
      // when a type is chosen, and its detached tracker keeps the last state it rendered.
      const state = resolve({ widget: "selectState", field: step.field, select: step.select });
      const stateIs = (attribute: string, value: string) => () => checkAttribute(state, attribute, value);
      await runAction(env, async () => {
        if (state.getAttribute("data-test-is-open") !== "true") {
          env.fireEvent.click(combobox);
          await waitUntil(env, stateIs("data-test-is-open", "true"), selectOpenTimeout);
        }
        await userSession().clear(combobox);
        await userSession().type(combobox, step.option);
        await waitUntil(
          env,
          () => {
            stateIs("data-test-filter-text", step.option)();
            stateIs("data-test-filtered-options-count", "1")();
          },
          selectOpenTimeout,
        );
        await userSession().keyboard("{Enter}");
        await waitUntil(
          env,
          () => {
            stateIs("data-test-is-open", "false")();
            stateIs("data-test-selected-value", step.option)();
          },
          selectCommitTimeout,
        );
      });
    },
    toggleUnionTypeSelector: async (step) => {
      const star = resolve({ widget: "unionTypeStar", field: step.field });
      const input: ReactComponentTestTarget = { widget: "unionTypeInput", field: step.field };
      const wasShown = queryAllTarget(env, input, context.elements).length > 0;
      await runAction(env, async () => {
        env.fireEvent.click(star);
        await waitUntil(
          env,
          () => {
            const shown = queryAllTarget(env, input, context.elements).length > 0;
            if (shown === wasShown) {
              throw new Error(`the union type selector of "${step.field}" is still ${shown ? "shown" : "hidden"}`);
            }
          },
          selectOpenTimeout,
        );
      });
    },
    expectRenderedValues: async (step) => {
      if (step.timeout === undefined) {
        checkRenderedValues(step);
        return;
      }
      const timeout = step.timeout;
      await waitUntil(env, () => checkRenderedValues(step), timeout);
    },
    expectElement: async (step) => {
      if (step.timeout === undefined) {
        checkElement(step);
        return;
      }
      await waitUntil(env, () => checkElement(step), step.timeout);
    },
  };

  for (const [index, step] of steps.entries()) {
    try {
      const handler = handlers[step.step] as ((step: ReactComponentTestStep) => Promise<void>) | undefined;
      if (!handler) {
        // every kind of the schema has a handler: only JSON that bypassed the schema gets here
        throw new Error("unknown step kind");
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
