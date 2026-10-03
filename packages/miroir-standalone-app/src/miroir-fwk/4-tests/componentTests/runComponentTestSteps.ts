import {
  resolveReportTestStepReferences,
  type ComponentRenderMeasurement,
  type ReactComponentTestStep,
  type ResolvedReactComponentTestStep,
  type ResolvedReactComponentTestTarget,
} from "miroir-core";

import {
  componentTestAct,
  waitAfterUserInteraction,
  type ComponentTestEnvironment,
} from "./componentTestEnvironment.js";
import { describeTarget, queryAllTarget, resolveTarget } from "./componentTestTargets.js";
import { runMeasureRendering } from "./measureRendering.js";
import {
  extractValuesFromRenderedElements,
  formValuesToJSON,
  testSectionName,
} from "./componentTestTools.js";
import {
  EMPTY_CONTAINER_ATTRIBUTE,
  ML_NAME_ATTRIBUTE,
} from "../../4_view/components/ValueObjectEditor/renderedValueMarkers.js";

// ################################################################################################
// Interpreter of the declarative component test steps (#292, analysis §5.3, §5.4).
//
// - After each action step (DOM events, typing, widget steps), it awaits `componentTestAct`, then
//   `waitAfterUserInteraction(container)` (D9), then `options.afterInteraction` (a Report test
//   waits there for the actions the step started, #330). Widget steps also wait for their own
//   postcondition (e.g. `data-test-is-open`).
// - A failing step throws a `ComponentTestStepError` whose message is
//   `step <n> (<kind>[ "<label>"]): <message>`, `n` 1-based (T10). An `expectRenderedValues`
//   failure also carries the expected and actual values, as does any `StepValuesMismatch`.
// - `saveAs` keeps the element of a step for the later targets `{"ref": <name>}` (T11).
// - Other step kinds run through `options.extraStepHandlers` (the action and assertion steps of a
//   Report test, #330).
// - Before a component test step runs, its `getFromContext` references are replaced by the values
//   of `options.storedValues` (#333); an unresolved reference fails the step.
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

/**
 * Thrown by a step whose check compares values (`expectRenderedValues`, or an extra step), to
 * carry them to its `ComponentTestStepError`.
 */
export class StepValuesMismatch extends Error {
  constructor(
    message: string,
    readonly expected: unknown,
    readonly actual: unknown,
  ) {
    super(message);
  }
}

type StepOf<K extends ReactComponentTestStep["step"]> = Extract<ResolvedReactComponentTestStep, { step: K }>;

/** The elements saved by `saveAs`, by name, kept across the steps of one case. */
interface ComponentTestStepContext {
  elements: Record<string, HTMLElement>;
}

const selectOpenTimeout = 1000;
const selectCommitTimeout = 2000;

/** The fields every step kind has. */
interface AnyStep {
  step: string;
  label?: string | undefined;
}

function stepPrefix(step: AnyStep, index: number): string {
  return `step ${index + 1} (${step.step}${step.label !== undefined ? ` "${step.label}"` : ""})`;
}

/** Runs `callback` without React `act`, then waits for React to settle (D9), then `afterInteraction`. */
async function runAction(
  env: ComponentTestEnvironment,
  callback: () => unknown,
  afterInteraction: (() => Promise<void>) | undefined,
): Promise<void> {
  await componentTestAct(callback);
  await waitAfterUserInteraction(env.container);
  await afterInteraction?.();
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
  target: ResolvedReactComponentTestTarget,
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
 * name without the environment's `fieldNamePrefix`, texts in DOM order.
 */
function renderedOptions(env: ComponentTestEnvironment): Record<string, string[]> {
  const options: Record<string, string[]> = {};
  const prefix = env.fieldNamePrefix;
  const selectNames = Array.from(
    env.sandboxElement.querySelectorAll<HTMLElement>(`[data-testid^="${selectStateTestIdPrefix}"]`),
  ).map((tracker) => (tracker.getAttribute("data-testid") ?? "").slice(selectStateTestIdPrefix.length));
  for (const option of Array.from(env.sandboxElement.querySelectorAll<HTMLElement>('[role="option"]'))) {
    const formikName = optionFormikName(option.getAttribute("aria-label") ?? "", selectNames);
    if (formikName === undefined) {
      continue;
    }
    const field = prefix && formikName.startsWith(prefix) ? formikName.slice(prefix.length) : formikName;
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

/**
 * A copy of `value` without the sub-values at the dot paths of `ignorePaths` (#303 T1). A numeric
 * segment indexes an array; an ignored array item is removed. A missing path is left as is.
 */
function withoutIgnoredPaths(value: unknown, ignorePaths: readonly string[]): unknown {
  const copy: unknown = structuredClone(value);
  for (const ignorePath of ignorePaths) {
    const segments = ignorePath.split(".");
    const parent = valueAtPath(copy, segments.slice(0, -1));
    const last = segments[segments.length - 1];
    if (Array.isArray(parent) && /^\d+$/.test(last)) {
      parent.splice(Number(last), 1);
      continue;
    }
    if (isPlainObject(parent)) {
      delete parent[last];
    }
  }
  return copy;
}

/** Whether the editor of the form field `fieldName` is an empty array editor (#305 D4 marker). */
function isEmptyArrayEditor(env: ComponentTestEnvironment, fieldName: string): boolean {
  return [env.container, env.portalElement].some((root) =>
    Array.from(root?.querySelectorAll(`[${EMPTY_CONTAINER_ATTRIBUTE}="array"]`) ?? []).some(
      (element) => element.getAttribute(ML_NAME_ATTRIBUTE) === fieldName,
    ),
  );
}

const shortTextLength = 200;

/** `text` cut to `shortTextLength` characters, for an error message. */
function shortText(text: string | null): string {
  const value = text ?? "";
  return value.length > shortTextLength ? `${value.slice(0, shortTextLength)}…` : value;
}

/** `<tag data-testid="…">` and the start of the text of `element`, for an error message. */
function describeElement(element: HTMLElement): string {
  const testId = element.getAttribute("data-testid");
  const tag = `<${element.tagName.toLowerCase()}${testId === null ? "" : ` data-testid="${testId}"`}>`;
  return `${tag} ${JSON.stringify(shortText(element.textContent))}`;
}

/** The `value` of a form element, as the old `(element as HTMLInputElement).value` reads. */
function elementValue(element: HTMLElement): unknown {
  return (element as HTMLInputElement).value;
}

export interface ComponentTestStepsOptions<ExtraStep extends AnyStep = never> {
  /** Replaces the `iterations` of every `measureRendering` step (#303 T7, one run of the app). */
  iterationsOverride?: number;
  /**
   * Handlers of step kinds that are not component test steps, by kind (the action and assertion
   * steps of a Report test, #330). Their errors are reported like those of the other steps.
   */
  extraStepHandlers?: Record<ExtraStep["step"], (step: ExtraStep) => Promise<void>>;
  /** Awaited after each action step, once React has settled (a Report test waits for its actions, #330). */
  afterInteraction?: () => Promise<void>;
  /**
   * The values the `getFromContext` references of the component test steps read, taken when each
   * step starts (#333): a Report test's parameters and kept results. Without it, a reference fails.
   */
  storedValues?: () => Record<string, unknown>;
}

export interface ComponentTestStepsResult {
  /** Measurements of the `measureRendering` steps, in step order (#303 T5); empty without such steps. */
  measurements: ComponentRenderMeasurement[];
}

// ################################################################################################
/** Runs `steps` in order against the mounted case of `env`. */
export async function runComponentTestSteps<ExtraStep extends AnyStep = never>(
  env: ComponentTestEnvironment,
  steps: readonly (ReactComponentTestStep | ExtraStep)[],
  options: ComponentTestStepsOptions<ExtraStep> = {},
): Promise<ComponentTestStepsResult> {
  const context: ComponentTestStepContext = { elements: {} };
  const measurements: ComponentRenderMeasurement[] = [];
  let user: ReturnType<ComponentTestEnvironment["userEvent"]["setup"]> | undefined;
  const userSession = () => (user ??= env.userEvent.setup());

  const resolve = (target: ResolvedReactComponentTestTarget) => resolveTarget(env, target, context.elements);
  const interact = (callback: () => unknown) => runAction(env, callback, options.afterInteraction);
  const save = (element: HTMLElement, saveAs: string | undefined) => {
    if (saveAs !== undefined) {
      context.elements[saveAs] = element;
    }
  };

  /** `expectRenderedValues` once: throws `StepValuesMismatch` when the values differ. */
  const checkRenderedValues = (step: StepOf<"expectRenderedValues">): void => {
    const fieldName = step.field === undefined ? testSectionName : env.formikFieldName(step.field);
    const extracted = extractValuesFromRenderedElements(
      env.expect,
      step.filter === undefined ? undefined : [...step.filter],
      env.container,
      fieldName,
      step.label,
      step.detectOptions ?? false,
      env.portalElement,
    );
    // non-empty array-valued entries are the extractor's option lists, replaced by `$options` (T8);
    // an empty array is an empty array editor (#305 D4), option lists are never empty
    const fieldValues = Object.fromEntries(
      Object.entries(extracted).filter(([, value]) => !Array.isArray(value) || value.length === 0),
    );
    // #305: the field under test is itself an empty array editor: an empty map rebuilds as `{}`
    let actual: unknown =
      Object.keys(fieldValues).length === 0 && isEmptyArrayEditor(env, fieldName)
        ? []
        : formValuesToJSON(fieldValues);
    if (step.path !== undefined) {
      actual = valueAtPath(actual, step.path);
    }
    let expected: unknown = step.expectedValue;
    if (step.ignorePaths !== undefined) {
      actual = withoutIgnoredPaths(actual, step.ignorePaths);
      expected = withoutIgnoredPaths(expected, step.ignorePaths);
    }
    const options = renderedOptions(env);
    if (Object.keys(options).length > 0 && isPlainObject(actual)) {
      actual = { ...actual, $options: options };
    }
    env.log.info("expectRenderedValues", step.label, actual);
    try {
      env.expect(actual, "rendered values").toEqual(expected);
    } catch (error) {
      throw new StepValuesMismatch(
        error instanceof Error ? error.message : String(error),
        expected,
        actual,
      );
    }
  };

  /** `expectElement` once. */
  const checkElement = (step: StepOf<"expectElement">): void => {
    if (step.present === false) {
      const matches = queryAllTarget(env, step.target, context.elements);
      if (matches.length > 0) {
        throw new Error(
          `expected no element to match target ${describeTarget(step.target)}, found ${matches.length}: ${matches
            .slice(0, 3)
            .map(describeElement)
            .join(", ")}`,
        );
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
      // the element's text in the message: the matcher's own message does not show it
      env.expect(element, `element html (text ${JSON.stringify(shortText(element.textContent))})`).toContainHTML(
        step.containsHtml,
      );
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
      await interact(() => env.fireEvent.click(element));
    },
    change: async (step) => {
      const element = resolve(step.target);
      save(element, step.saveAs);
      await interact(() => env.fireEvent.change(element, { target: { value: step.value } }));
    },
    clickArrayButton: async (step) => {
      const element = resolve({ widget: "arrayButton", field: step.field, action: step.action, index: step.index });
      await interact(() => env.fireEvent.click(element));
    },
    clickObjectButton: async (step) => {
      const element = resolve({
        widget: "objectButton",
        field: step.field,
        action: step.action,
        attribute: step.attribute,
      });
      await interact(() => env.fireEvent.click(element));
    },
    renameRecordEntry: async (step) => {
      const element = resolve({ widget: "recordEntryName", field: step.field, entry: step.entry });
      await componentTestAct(() => env.fireEvent.change(element, { target: { value: step.newName } }));
      await interact(() => env.fireEvent.blur(element));
    },
    submit: async (step) => {
      const element = resolve(step.target);
      await interact(() => env.fireEvent.submit(element));
    },
    blur: async (step) => {
      const element = resolve(step.target);
      await interact(() => env.fireEvent.blur(element));
    },
    type: async (step) => {
      const element = resolve(step.target);
      await interact(() => userSession().type(element, step.text));
    },
    clear: async (step) => {
      const element = resolve(step.target);
      await interact(() => userSession().clear(element));
    },
    keyboard: async (step) => {
      await interact(() => userSession().keyboard(step.keys));
    },
    uploadFile: async (step) => {
      const element = resolve(step.target);
      const file = new File([step.content], step.fileName, { type: step.mimeType ?? "" });
      await interact(() => userSession().upload(element, file));
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
      const state: ResolvedReactComponentTestTarget = { widget: "selectState", field: step.field, select: step.select };
      await interact(async () => {
        env.fireEvent.click(combobox);
        await waitForAttributeValue(env, state, "data-test-is-open", "true", selectOpenTimeout, context.elements);
        // the select ignores option clicks for 150 ms after it opens (`ThemedSelectWithPortal`): a
        // `click` on an option right after this step would be dropped in a fast run (the app, #406)
        await waitForAttributeValue(env, state, "data-test-dropdown-just-opened", "false", selectOpenTimeout, context.elements);
      });
    },
    filterSelect: async (step) => {
      const combobox = resolve({ widget: "combobox", field: step.field, select: step.select });
      const state: ResolvedReactComponentTestTarget = { widget: "selectState", field: step.field, select: step.select };
      await interact(async () => {
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
      await interact(async () => {
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
      const input: ResolvedReactComponentTestTarget = { widget: "unionTypeInput", field: step.field };
      const wasShown = queryAllTarget(env, input, context.elements).length > 0;
      await interact(async () => {
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
    measureRendering: async (step) => {
      measurements.push(...(await runMeasureRendering(env, step, options.iterationsOverride ?? step.iterations)));
    },
  };

  const extraStepHandlers: Record<string, ((step: never) => Promise<void>) | undefined> =
    options.extraStepHandlers ?? {};
  for (const [index, step] of steps.entries()) {
    try {
      const isComponentTestStep = Object.prototype.hasOwnProperty.call(handlers, step.step);
      const handler = (isComponentTestStep
        ? handlers[step.step as ReactComponentTestStep["step"]]
        : extraStepHandlers[step.step]) as
        | ((step: ResolvedReactComponentTestStep | ExtraStep) => Promise<void>)
        | undefined;
      if (!handler) {
        // every kind of the schema has a handler: only JSON that bypassed the schema gets here
        throw new Error("unknown step kind");
      }
      await handler(
        isComponentTestStep
          ? resolveReportTestStepReferences(step as ReactComponentTestStep, options.storedValues?.() ?? {})
          : (step as ExtraStep),
      );
    } catch (error) {
      const message = `${stepPrefix(step, index)}: ${error instanceof Error ? error.message : String(error)}`;
      throw new ComponentTestStepError(
        message,
        error instanceof StepValuesMismatch ? { expected: error.expected, actual: error.actual } : undefined,
      );
    }
  }
  return { measurements };
}
