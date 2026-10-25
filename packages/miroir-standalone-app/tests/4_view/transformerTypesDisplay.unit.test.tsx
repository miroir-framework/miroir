/**
 * The TransformerEditor's "Show transformer types" switch in a Component Test Sandbox run: every
 * case starts with the run's value, set before the run next to its Run button, and a toggle in a
 * case stays in that case (#453, replaced: the value no longer goes from one case to the next nor
 * to the app's ViewParams, so that the cases do not depend on their order or on the app).
 *
 * - Runner: with a host giving `showTransformerTypes`, each case of the real TransformerEditor
 *   starts with the host's value, and a toggle in a case does not reach the next case.
 * - Sandbox: the host it registers gives the value passed to `prepareComponentTests`, for the
 *   whole run, and a run saves nothing in ViewParams.
 * - Editor switch: a toggle shows at once; a later ViewParams change made elsewhere replaces it.
 * - Primitive literals: an `applyTo: "a"` has no title row, its badge follows its label.
 * - Badge parts (#470): one chip per part, the declared types only when they differ from the actual
 *   ones, only the parts of a mismatch marked; the badge sits under the title row, not in it.
 * - Badge labels (D18): an entity type shows the entity name, an unknown entity uuid its first
 *   8 characters.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- transformerTypesDisplay
 * ```
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkTransformerInterfaceRecursively,
  ConfigurationService,
  type MiroirTestForReactComponent,
  type ReactComponentTestStep,
  type ReactComponentTestSuiteContext,
} from "miroir-core";
import { LocalCacheProvider, MiroirContextReactProvider } from "miroir-react";

vi.mock("../../src/miroir-fwk/4-tests/componentTests/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/miroir-fwk/4-tests/componentTests/index")>();
  return {
    ...actual,
    registerComponentTests: vi.fn(actual.registerComponentTests),
  };
});

import * as componentTestsEntry from "../../src/miroir-fwk/4-tests/componentTests/index";
import { createReactComponentTestRunner } from "../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import {
  ComponentTestSandboxProvider,
  useComponentTestSandbox,
} from "../../src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox";
import { transformerTypeBadges } from "../../src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor";
import { useShowTransformerTypes } from "../../src/miroir-fwk/4_view/components/TransformerEditor/TransformerTypesDisplay";
import type { TransformerTypeBadge } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/MlElementEditorInterface";
import { buildAdminViewParamsHarness, loadViewParams } from "../helpers/adminViewParamsHarness";

const RUN_TEST_TIMEOUT = 120_000;
const switchTarget = { byTestId: "transformer-editor-show-types-switch" };
const rootBadgeTarget = { byTestId: "transformer-type-badge-transformer" };

const transformerEditorSuite: ReactComponentTestSuiteContext = {
  suitePath: ["transformerTypesDisplay", "TransformerEditor"],
  component: "TransformerEditor",
  componentProps: {
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    entityUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  },
  caseLabels: ["first case", "second case"],
};

function leaf(label: string, steps: ReactComponentTestStep[]): MiroirTestForReactComponent {
  return { miroirTestType: "reactComponentTest", miroirTestLabel: label, steps };
}

// ################################################################################################
describe("transformerTypesDisplay: the switch value through the runner's host", () => {
  let sandboxElement: HTMLElement;
  let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  });
  beforeEach(() => {
    sandboxElement = document.createElement("div");
    document.body.appendChild(sandboxElement);
  });
  afterEach(() => {
    runner?.close();
    runner = undefined;
    sandboxElement.remove();
  });

  it(
    "every case starts with the host value, and a toggle in a case does not reach the next one",
    async () => {
      runner = createReactComponentTestRunner({ sandboxElement, showTransformerTypes: () => true });

      const first = await runner({
        testNamePath: [...transformerEditorSuite.suitePath, "first case"],
        leaf: leaf("first case", [
          { step: "expectElement", label: "starts on", target: switchTarget, checked: true },
          { step: "expectElement", label: "root badge shown", target: rootBadgeTarget, timeout: 2000 },
          { step: "click", label: "switch off", target: switchTarget },
          { step: "expectElement", label: "off", target: switchTarget, checked: false },
          { step: "expectElement", label: "root badge gone", target: rootBadgeTarget, present: false },
        ]),
        suite: transformerEditorSuite,
      });
      expect(first).toEqual({ status: "ok" });

      const second = await runner({
        testNamePath: [...transformerEditorSuite.suitePath, "second case"],
        leaf: leaf("second case", [
          { step: "expectElement", label: "starts on again", target: switchTarget, checked: true },
          { step: "expectElement", label: "root badge shown", target: rootBadgeTarget, timeout: 2000 },
        ]),
        suite: transformerEditorSuite,
      });
      expect(second).toEqual({ status: "ok" });
    },
    RUN_TEST_TIMEOUT,
  );

  it(
    "setChecked sets the switch whatever its starting value, and leaves it alone when it already has the value",
    async () => {
      runner = createReactComponentTestRunner({ sandboxElement, showTransformerTypes: () => true });
      const result = await runner({
        testNamePath: [...transformerEditorSuite.suitePath, "first case"],
        leaf: leaf("first case", [
          { step: "setChecked", label: "types off", target: switchTarget, checked: false },
          { step: "setChecked", label: "types off again", target: switchTarget, checked: false },
          { step: "expectElement", label: "still off", target: switchTarget, checked: false },
          { step: "expectElement", label: "no root badge", target: rootBadgeTarget, present: false },
          { step: "setChecked", label: "types on", target: switchTarget, checked: true },
          { step: "expectElement", label: "root badge shown", target: rootBadgeTarget, timeout: 2000 },
        ]),
        suite: transformerEditorSuite,
      });
      expect(result).toEqual({ status: "ok" });
    },
    RUN_TEST_TIMEOUT,
  );
});

// ################################################################################################
describe("transformerTypesDisplay: badge labels (D18)", () => {
  const bookUuid = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
  const walk = checkTransformerInterfaceRecursively(
    {
      transformerType: "mapList",
      interpolation: "runtime",
      elementTransformer: { transformerType: "getFromContext", interpolation: "runtime", referenceName: "defaultInput" },
    },
    { type: "array", payload: bookUuid },
    { entityMlSchemas: { [bookUuid]: { type: "object", definition: { uuid: { type: "uuid" } } } } },
  );
  const badgeAt = (badges: TransformerTypeBadge[], path: string[]) =>
    badges.find((badge) => badge.path.join(".") === path.join("."));

  it("an entity type shows the entity name, its uuid stays in the tooltip", () => {
    const badges = transformerTypeBadges(walk, [{ uuid: bookUuid, name: "Book" }]);
    expect(badgeAt(badges, ["transformer"])).toMatchObject({ givenLabel: "array<Book>" });
    expect(badgeAt(badges, ["transformer", "elementTransformer"])).toMatchObject({ givenLabel: "Book" });
    expect(badgeAt(badges, ["transformer"])?.title).toContain(bookUuid);
  });

  it("a tuple reads as a type in its label and its tooltip, not as JSON (#449)", () => {
    const tupleWalk = checkTransformerInterfaceRecursively(
      {
        transformerType: "returnValue",
        interpolation: "runtime",
        mlSchema: { type: "tuple", definition: [{ type: "string" }, { type: "number" }] },
        value: ["a", 1],
      },
      "any",
    );
    const badge = badgeAt(transformerTypeBadges(tupleWalk, []), ["transformer"]);
    expect(badge).toMatchObject({ outputLabel: "tuple<string, number>" });
    expect(badge?.title).toContain("output tuple<string, number>");
    expect(badge?.title).not.toContain("{");
  });

  it("a value mismatch in the tooltip names both types (#449)", () => {
    const recordWalk = checkTransformerInterfaceRecursively(
      {
        transformerType: "returnValue",
        interpolation: "runtime",
        mlSchema: { type: "record", definition: { type: "string" } },
        value: { a: 1 },
      },
      "any",
    );
    const badge = badgeAt(transformerTypeBadges(recordWalk, []), ["transformer"]);
    expect(badge?.title).toContain("value: given record<number>, declared record<string>");
  });

  it("an unknown entity uuid shows its first 8 characters", () => {
    const badges = transformerTypeBadges(walk, []);
    expect(badgeAt(badges, ["transformer"])).toMatchObject({ givenLabel: "array<e8ba151b>" });
    expect(badgeAt(badges, ["transformer", "elementTransformer"])).toMatchObject({ givenLabel: "e8ba151b" });
  });
});

// ################################################################################################
describe("transformerTypesDisplay: badge parts (#470)", () => {
  const badgeAt = (badges: TransformerTypeBadge[], path: string[]) =>
    badges.find((badge) => badge.path.join(".") === path.join("."));
  const kinds = (badge: TransformerTypeBadge | undefined) => badge?.parts.map((part) => part.kind);

  it("a node shows in, applyTo, declared and out chips, and only the parts of a mismatch are marked", () => {
    const walk = checkTransformerInterfaceRecursively(
      {
        transformerType: "mapList",
        interpolation: "runtime",
        applyTo: { transformerType: "returnValue", interpolation: "runtime", value: "a" },
        elementTransformer: { transformerType: "returnValue", interpolation: "runtime", value: 1 },
      },
      "any",
    );
    const badge = badgeAt(transformerTypeBadges(walk, []), ["transformer"]);
    expect(kinds(badge)).toEqual(["in", "applyTo", "declared", "out"]);
    expect(badge?.parts.filter((part) => part.mismatch).map((part) => part.kind)).toEqual(["applyTo", "declared"]);
    expect(badge?.parts.find((part) => part.kind === "declared")).toMatchObject({ label: "array → array" });
    expect(badge?.declaredMatchesActual).toBe(false);
  });

  it("a declared type equal to the actual one is not repeated", () => {
    const walk = checkTransformerInterfaceRecursively(
      { transformerType: "mustacheStringTemplate", interpolation: "runtime", definition: "{{a}}" },
      "string",
    );
    const badge = badgeAt(transformerTypeBadges(walk, []), ["transformer"]);
    expect(kinds(badge)).toEqual(["in", "out"]);
    expect(badge?.declaredMatchesActual).toBe(true);
  });

  it("a declared any or undefined side constrains nothing, so it does not count as a difference", () => {
    const walk = checkTransformerInterfaceRecursively(
      { transformerType: "returnValue", interpolation: "runtime", value: "a" },
      "any",
    );
    const badge = badgeAt(transformerTypeBadges(walk, []), ["transformer"]);
    expect(kinds(badge)).toEqual(["in", "out"]);
    expect(badge?.declaredMatchesActual).toBeUndefined(); // no "✓ declared" for a declaration of nothing
  });

  it("a chip's title holds the full type, entity uuid included", () => {
    const bookUuid = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
    const walk = checkTransformerInterfaceRecursively(
      { transformerType: "getFromContext", interpolation: "runtime", referenceName: "defaultInput" },
      { type: "array", payload: bookUuid },
    );
    const badge = badgeAt(transformerTypeBadges(walk, [{ uuid: bookUuid, name: "Book" }]), ["transformer"]);
    expect(badge?.parts.find((part) => part.kind === "in")).toMatchObject({ label: "array<Book>" });
    expect(badge?.parts.find((part) => part.kind === "in")?.title).toContain(bookUuid);
  });

  it("a returnValue whose value does not fit its mlSchema shows the value's type, marked with out", () => {
    const walk = checkTransformerInterfaceRecursively(
      {
        transformerType: "returnValue",
        interpolation: "runtime",
        mlSchema: { type: "record", definition: { type: "string" } },
        value: { a: 1 },
      },
      "any",
    );
    const badge = badgeAt(transformerTypeBadges(walk, []), ["transformer"]);
    expect(kinds(badge)).toEqual(["in", "value", "out"]);
    expect(badge?.parts.find((part) => part.kind === "value")).toMatchObject({ label: "record<number>", mismatch: true });
    expect(badge?.parts.find((part) => part.kind === "out")).toMatchObject({ label: "record<string>", mismatch: true });
  });

  it("a literal has one value chip", () => {
    const walk = checkTransformerInterfaceRecursively(
      { transformerType: "aggregate", interpolation: "runtime", applyTo: ["a", "b"] },
      "any",
    );
    const badge = badgeAt(transformerTypeBadges(walk, []), ["transformer", "applyTo"]);
    expect(badge?.parts).toEqual([{ kind: "value", label: "array<string>", title: "array<string>", mismatch: false }]);
  });
});

// ################################################################################################
describe("transformerTypesDisplay: badges of primitive literals", () => {
  let sandboxElement: HTMLElement;
  let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  });
  beforeEach(() => {
    sandboxElement = document.createElement("div");
    document.body.appendChild(sandboxElement);
  });
  afterEach(() => {
    runner?.close();
    runner = undefined;
    sandboxElement.remove();
  });

  it(
    "a primitive literal applyTo shows its badge after its label, an object node once under its title row",
    async () => {
      runner = createReactComponentTestRunner({ sandboxElement });
      const badge = (path: string[], outputLabel: string): TransformerTypeBadge => ({
        path,
        outputLabel,
        status: "unknown",
        title: `value ${outputLabel}`,
        parts: [{ kind: "value", label: outputLabel, title: outputLabel, mismatch: false }],
      });
      const suite: ReactComponentTestSuiteContext = {
        suitePath: ["transformerTypesDisplay", "MlElementEditor"],
        component: "MlElementEditor",
        componentProps: {
          name: "testField",
          listKey: "ROOT.testField",
          rootLessListKey: "testField",
          rootLessListKeyArray: ["testField"],
          rawMlSchema: {
            type: "object",
            definition: { transformerType: { type: "string" }, applyTo: { type: "string" } },
          },
          initialFormState: { transformerType: "aggregate", applyTo: "a" },
          transformerTypeBadges: [badge(["testField", "applyTo"], "string"), badge(["testField"], "number")],
        },
        caseLabels: ["badges"],
      };
      const result = await runner({
        testNamePath: [...suite.suitePath, "badges"],
        leaf: leaf("badges", [
          {
            step: "expectElement",
            label: "the literal's badge",
            target: { byTestId: "transformer-type-badge-testField.applyTo" },
            attribute: { name: "data-transformer-type-output", value: "string" },
            count: 1,
            timeout: 2000,
          },
          {
            step: "expectElement",
            label: "the object's badge, once",
            target: { byTestId: "transformer-type-badge-testField" },
            count: 1,
          },
          {
            step: "expectElement",
            label: "the object's badge has its value chip",
            target: { byTestId: "transformer-type-part-testField-value" },
            attribute: { name: "data-transformer-type-part-status", value: "neutral" },
          },
        ]),
        suite,
      });
      expect(result).toEqual({ status: "ok" });
      // #470: the badge is under the title row, not in it, so it cannot move the fold buttons.
      const titleRow = sandboxElement.querySelector('[id="testFieldhead"]')?.parentElement;
      const objectBadge = sandboxElement.querySelector('[data-testid="transformer-type-badge-testField"]');
      expect(titleRow).toBeTruthy();
      expect(objectBadge).toBeTruthy();
      expect(titleRow?.contains(objectBadge)).toBe(false);
      // #470: a primitive literal's badge stacks under its label, apart from the input
      const literalBadge = sandboxElement.querySelector('[data-testid="transformer-type-badge-testField.applyTo"]');
      expect(literalBadge?.parentElement?.querySelector("input")).toBeNull();
    },
    RUN_TEST_TIMEOUT,
  );
});

// ################################################################################################
const PrepareButton: React.FC = () => {
  const sandbox = useComponentTestSandbox();
  return (
    <button type="button" onClick={() => void sandbox?.prepareComponentTests({ showTransformerTypes: true })}>
      prepare
    </button>
  );
};

describe("transformerTypesDisplay: the sandbox host", () => {
  afterEach(() => {
    vi.mocked(componentTestsEntry.registerComponentTests).mockClear();
    ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
  });

  it(
    "the host gives the value passed to prepareComponentTests, whatever ViewParams holds, and saves nothing",
    async () => {
      const harness = buildAdminViewParamsHarness({ showTransformerTypes: false });
      const { unmount } = render(
        <LocalCacheProvider store={harness.localCache.getInnerStore()}>
          <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={harness.domainController}>
            <ComponentTestSandboxProvider>
              <PrepareButton />
            </ComponentTestSandboxProvider>
          </MiroirContextReactProvider>
        </LocalCacheProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "prepare" }));
      await waitFor(() => expect(componentTestsEntry.registerComponentTests).toHaveBeenCalled());
      const host = vi.mocked(componentTestsEntry.registerComponentTests).mock.calls[0][0];
      expect(host.showTransformerTypes?.()).toBe(true);
      expect("saveShowTransformerTypes" in host).toBe(false);
      loadViewParams(harness.localCache, { showTransformerTypes: true }); // changed in the app meanwhile
      loadViewParams(harness.localCache, { showTransformerTypes: false });
      expect(host.showTransformerTypes?.()).toBe(true);
      expect(harness.handledActions).toEqual([]);
      unmount();
    },
    RUN_TEST_TIMEOUT,
  );
});

// ################################################################################################
const SwitchProbe: React.FC = () => {
  const [showTransformerTypes, setShowTransformerTypes] = useShowTransformerTypes();
  return (
    <button type="button" onClick={() => setShowTransformerTypes(!showTransformerTypes)}>
      {showTransformerTypes ? "types on" : "types off"}
    </button>
  );
};

describe("transformerTypesDisplay: the editor's switch and the app's ViewParams", () => {
  it(
    "a toggle shows at once, and a later ViewParams change made elsewhere replaces it",
    async () => {
      const harness = buildAdminViewParamsHarness({ showTransformerTypes: false });
      const { unmount } = render(
        <LocalCacheProvider store={harness.localCache.getInnerStore()}>
          <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={harness.domainController}>
            <SwitchProbe />
          </MiroirContextReactProvider>
        </LocalCacheProvider>,
      );
      await waitFor(() => screen.getByRole("button", { name: "types off" }));
      fireEvent.click(screen.getByRole("button", { name: "types off" }));
      await waitFor(() => screen.getByRole("button", { name: "types on" }));
      await waitFor(() => expect(harness.handledActions).toHaveLength(1));

      loadViewParams(harness.localCache, { showTransformerTypes: true }); // the save lands
      await waitFor(() => screen.getByRole("button", { name: "types on" }));
      loadViewParams(harness.localCache, { showTransformerTypes: false }); // changed in the ViewParams report
      await waitFor(() => screen.getByRole("button", { name: "types off" }));
      unmount();
    },
    RUN_TEST_TIMEOUT,
  );
});
