import type { ReactComponentTestTarget, ReactComponentTestTextMatch } from "miroir-core";

import type { ComponentTestEnvironment } from "./componentTestEnvironment.js";
import { formikFieldName } from "./componentTestTools.js";

// ################################################################################################
// Targets of the declarative component test steps (#292, analysis T6, §5.4) and the revival of
// tagged values in JSON component props (T9).
//
// A target has exactly one locator. Queries run on `env.view`, bound to the sandbox element, so
// they see the case container and the portal element, and nothing else of the page.
// ################################################################################################

const locatorKeys = ["byRole", "byTestId", "byText", "byDisplayValue", "byLabelText", "widget", "ref"] as const;
const refinementKeys = ["fieldName", "fieldNamePrefix", "id"] as const;

export function describeTarget(target: ReactComponentTestTarget): string {
  return JSON.stringify(target);
}

function notImplemented(what: string): Error {
  return new Error(`${what}: not implemented`);
}

/** A Testing Library text matcher: a string or a number as is, `{regex, flags?}` as a `RegExp`. */
function textMatch(match: ReactComponentTestTextMatch): string | number | RegExp {
  if (typeof match === "string" || typeof match === "number") {
    return match;
  }
  return new RegExp(match.regex, match.flags);
}

/** The `name` option of a `byRole` query, which takes no number: a number is compared as text. */
function accessibleNameMatch(match: ReactComponentTestTextMatch): string | RegExp {
  const matcher = textMatch(match);
  return typeof matcher === "number" ? String(matcher) : matcher;
}

/** A CSS attribute value, quoted. */
function cssString(value: string): string {
  return `"${value.replace(/["\\]/g, "\\$&")}"`;
}

function querySandbox(env: ComponentTestEnvironment, selector: string): HTMLElement[] {
  return Array.from(env.sandboxElement.querySelectorAll<HTMLElement>(selector));
}

/** The elements of a `widget` target (analysis §5.4), addressed by the field's `rootLessListKey`. */
function widgetElements(env: ComponentTestEnvironment, target: ReactComponentTestTarget): HTMLElement[] {
  if (target.field === undefined) {
    throw new Error(`widget "${target.widget}" needs a field`);
  }
  const fieldName = formikFieldName(target.field);
  switch (target.widget) {
    case "combobox": {
      if (target.select !== undefined && target.select !== "value") {
        throw notImplemented(`widget "combobox" with select "${target.select}"`);
      }
      return querySandbox(env, `input[role="combobox"][name=${cssString(fieldName)}]`);
    }
    case "selectState": {
      if (target.select !== undefined && target.select !== "value") {
        throw notImplemented(`widget "selectState" with select "${target.select}"`);
      }
      return querySandbox(env, `[data-testid=${cssString(`themed-select-state-${fieldName}`)}]`);
    }
    case "arrayButton":
      return arrayButtonElements(env, target, fieldName);
    case "objectButton":
      return objectButtonElements(env, target, fieldName);
    case "recordEntryName": {
      if (target.entry === undefined) {
        throw new Error(`widget "recordEntryName" needs an entry, in ${describeTarget(target)}`);
      }
      // the name input of a record entry (`JzodObjectEditor.tsx`, `formikRootLessListKey + "-NAME"`)
      return env.view.queryAllByRole("textbox", { name: `${formikFieldName(`${target.field}.${target.entry}`)}-NAME` });
    }
    default:
      throw notImplemented(`widget "${target.widget}"`);
  }
}

/**
 * The array buttons of `JzodArrayEditor.tsx`: `up` / `down` are the elements whose role is
 * `F(field).button.<action>`, one per item (`index` picks one); `add` is the button named
 * `<field>.add` (no `TESTSECTION.` prefix); `duplicate` / `delete` are the buttons named
 * `F(field.<index>)-duplicateArrayItem` / `-removeArrayItem`, where `index` is the item index.
 */
function arrayButtonElements(
  env: ComponentTestEnvironment,
  target: ReactComponentTestTarget,
  fieldName: string,
): HTMLElement[] {
  switch (target.action) {
    case "up":
    case "down":
      return env.view.queryAllByRole(`${fieldName}.button.${target.action}`);
    case "add":
      return env.view.queryAllByRole("button", { name: `${target.field}.add` });
    case "duplicate":
    case "delete": {
      if (target.index === undefined) {
        throw new Error(`widget "arrayButton" with action "${target.action}" needs an index, in ${describeTarget(target)}`);
      }
      const suffix = target.action === "duplicate" ? "duplicateArrayItem" : "removeArrayItem";
      return env.view.queryAllByRole("button", { name: `${formikFieldName(`${target.field}.${target.index}`)}-${suffix}` });
    }
    default:
      throw new Error(
        `widget "arrayButton" has no action ${JSON.stringify(target.action)} (up, down, add, duplicate, delete), in ${describeTarget(target)}`,
      );
  }
}

/**
 * The object and record buttons of `JzodObjectEditor.tsx`: `addOptionalAttribute` is named
 * `F(field).addObjectOptionalAttribute.<attribute>`, `addRecordEntry` `F(field).addRecordAttribute`,
 * and `remove` / `duplicate` `F(field.<attribute>)-removeOptionalAttributeOrRecordEntry` /
 * `-duplicateRecordEntry`.
 */
function objectButtonElements(
  env: ComponentTestEnvironment,
  target: ReactComponentTestTarget,
  fieldName: string,
): HTMLElement[] {
  const needsAttribute = () => {
    if (target.attribute === undefined) {
      throw new Error(`widget "objectButton" with action "${target.action}" needs an attribute, in ${describeTarget(target)}`);
    }
    return target.attribute;
  };
  switch (target.action) {
    case "addOptionalAttribute":
      return env.view.queryAllByRole("button", { name: `${fieldName}.addObjectOptionalAttribute.${needsAttribute()}` });
    case "addRecordEntry":
      return env.view.queryAllByRole("button", { name: `${fieldName}.addRecordAttribute` });
    case "remove":
    case "duplicate": {
      const suffix = target.action === "remove" ? "removeOptionalAttributeOrRecordEntry" : "duplicateRecordEntry";
      return env.view.queryAllByRole("button", {
        name: `${formikFieldName(`${target.field}.${needsAttribute()}`)}-${suffix}`,
      });
    }
    default:
      throw new Error(
        `widget "objectButton" has no action ${JSON.stringify(target.action)} (addOptionalAttribute, addRecordEntry, remove, duplicate), in ${describeTarget(target)}`,
      );
  }
}

/**
 * True when `target.index` is part of the widget address (the item of an array `duplicate` /
 * `delete` button) rather than a pick among the matches.
 */
function indexIsWidgetAddress(target: ReactComponentTestTarget): boolean {
  return target.widget === "arrayButton" && (target.action === "duplicate" || target.action === "delete");
}

/** Every element matching `target`, in DOM order. `elements` holds the elements saved by `saveAs`. */
export function queryAllTarget(
  env: ComponentTestEnvironment,
  target: ReactComponentTestTarget,
  elements: Record<string, HTMLElement>,
): HTMLElement[] {
  const locators = locatorKeys.filter((key) => target[key] !== undefined);
  if (locators.length !== 1) {
    throw new Error(
      `a target needs exactly one locator among ${locatorKeys.join(", ")}, found ${locators.length} in ${describeTarget(target)}`,
    );
  }
  if (target.name !== undefined && target.byRole === undefined) {
    throw new Error(`"name" refines "byRole" only, in ${describeTarget(target)}`);
  }
  return refine(locatorMatches(env, target, locators[0], elements), target);
}

function hasRefinement(target: ReactComponentTestTarget): boolean {
  return refinementKeys.some((key) => target[key] !== undefined);
}

/**
 * Keeps the matches whose `name` is `F(fieldName)`, whose `name` starts with `F(fieldNamePrefix)`,
 * and whose `id` is `id`, when given.
 */
function refine(matches: HTMLElement[], target: ReactComponentTestTarget): HTMLElement[] {
  return matches.filter((element) => {
    const name = (element as HTMLInputElement).name ?? "";
    return (
      (target.fieldName === undefined || name === formikFieldName(target.fieldName)) &&
      (target.fieldNamePrefix === undefined || name.startsWith(formikFieldName(target.fieldNamePrefix))) &&
      (target.id === undefined || element.id === target.id)
    );
  });
}

function locatorMatches(
  env: ComponentTestEnvironment,
  target: ReactComponentTestTarget,
  locator: (typeof locatorKeys)[number],
  elements: Record<string, HTMLElement>,
): HTMLElement[] {
  switch (locator) {
    case "byRole":
      return env.view.queryAllByRole(
        target.byRole!,
        target.name === undefined ? undefined : { name: accessibleNameMatch(target.name) },
      );
    case "byTestId":
      return env.view.queryAllByTestId(target.byTestId!);
    case "byText":
      return env.view.queryAllByText(textMatch(target.byText!));
    case "byDisplayValue":
      return env.view.queryAllByDisplayValue(textMatch(target.byDisplayValue!));
    case "byLabelText":
      return env.view.queryAllByLabelText(textMatch(target.byLabelText!));
    case "widget":
      return widgetElements(env, target);
    case "ref": {
      const element = elements[target.ref!];
      if (!element) {
        throw new Error(`no element saved as "${target.ref}"`);
      }
      return [element];
    }
  }
}

/**
 * The one element designated by `target`: exactly one match when there is neither a refinement
 * nor an `index` (`getBy` semantics); otherwise the match at `index`, 0 by default (T6). The
 * `index` of an array `duplicate` / `delete` button names the item, so it picks nothing.
 */
export function resolveTarget(
  env: ComponentTestEnvironment,
  target: ReactComponentTestTarget,
  elements: Record<string, HTMLElement>,
): HTMLElement {
  const matches = queryAllTarget(env, target, elements);
  const pick = indexIsWidgetAddress(target) ? undefined : target.index;
  if (pick === undefined && !hasRefinement(target)) {
    if (matches.length !== 1) {
      throw new Error(
        matches.length === 0
          ? `no element matches target ${describeTarget(target)}`
          : `${matches.length} elements match target ${describeTarget(target)}, expected 1`,
      );
    }
    return matches[0];
  }
  const index = pick ?? 0;
  const element = matches[index];
  if (!element) {
    throw new Error(
      matches.length === 0
        ? `no element matches target ${describeTarget(target)}`
        : `target ${describeTarget(target)} has ${matches.length} matches, none at index ${index}`,
    );
  }
  return element;
}

// ################################################################################################
function isBigintTag(value: any): value is { $bigint: string } {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    typeof value.$bigint === "string"
  );
}

/** A copy of `value` where every `{"$bigint": "<digits>"}` is replaced by `BigInt(<digits>)` (T9). */
export function reviveComponentProps<T>(value: T): T {
  if (isBigintTag(value)) {
    return BigInt(value.$bigint) as any;
  }
  if (Array.isArray(value)) {
    return value.map((item) => reviveComponentProps(item)) as any;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, reviveComponentProps(entry)]),
    ) as any;
  }
  return value;
}
