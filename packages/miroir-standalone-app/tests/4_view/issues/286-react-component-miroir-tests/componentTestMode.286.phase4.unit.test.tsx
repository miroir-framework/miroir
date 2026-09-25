/**
 * Issue #286 Slice 4: `ComponentTestModeContext` makes the editors render the vitest DOM in the
 * app (analysis §5.4).
 *
 * The editors see the environment of the running app: `isVitestTestMode()` (the one reader of
 * `VITE_TEST_MODE` in the editors) is mocked to return `false` and the modules are reloaded.
 * `vi.stubEnv("VITE_TEST_MODE", "false")` alone does not reach the src modules: Vite replaces
 * their `import.meta.env` with a literal at transform time, and `vi.resetModules()` does not
 * transform them again (checked with a probe test: `isVitestTestMode()` stayed `true`). With the context `{ progressiveRenderDisabled: true,
 * codeMirrorPlaceholder: true }`, an object schema renders with no progressive-reveal placeholder
 * and, in code editor mode, the `<pre>codeMirrorValue:` box. Without the context it renders the
 * placeholders and the real CodeMirror editor chrome.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestMode.286.phase4
 * ```
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultSelfApplicationDeploymentMap } from "miroir-core";

type LoadedModules = {
  ComponentTestModeContext: typeof import("../../../../src/miroir-fwk/4_view/tools/ComponentTestModeContext").ComponentTestModeContext;
  componentTestSandboxMode: typeof import("../../../../src/miroir-fwk/4_view/tools/ComponentTestModeContext").componentTestSandboxMode;
  buildComponentTestWrapper: typeof import("../../../../src/miroir-fwk/4-tests/componentTests/componentTestTools").buildComponentTestWrapper;
  getJzodElementEditorForTest: typeof import("../../../../src/miroir-fwk/4-tests/componentTests/componentTestTools").getJzodElementEditorForTest;
};

/** Loads the editors after `VITE_TEST_MODE` is stubbed, so that module-level reads see the stub. */
async function loadModules(): Promise<LoadedModules> {
  await import("../../../../src/miroir-fwk/4_view/components/ValueObjectEditor/JzodElementEditor");
  const context = await import("../../../../src/miroir-fwk/4_view/tools/ComponentTestModeContext");
  const tools = await import("../../../../src/miroir-fwk/4-tests/componentTests/componentTestTools");
  return {
    ComponentTestModeContext: context.ComponentTestModeContext,
    componentTestSandboxMode: context.componentTestSandboxMode,
    buildComponentTestWrapper: tools.buildComponentTestWrapper,
    getJzodElementEditorForTest: tools.getJzodElementEditorForTest,
  };
}

const objectProps = {
  label: "Test Object",
  name: "testField",
  listKey: "ROOT.testField",
  rootLessListKey: "testField",
  rootLessListKeyArray: ["testField"],
  rawJzodSchema: {
    type: "object",
    definition: {
      firstAttribute: { type: "string" },
      secondAttribute: { type: "number" },
    },
  },
  initialFormState: { firstAttribute: "some text", secondAttribute: 42 },
} as const;

function renderObjectEditor(modules: LoadedModules, withSandboxMode: boolean) {
  const { Wrapper } = modules.buildComponentTestWrapper({
    applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
  });
  const Component = modules.getJzodElementEditorForTest("componentTestMode.286.phase4");
  const editor = (
    <Wrapper>
      <Component {...(objectProps as any)} />
    </Wrapper>
  );
  return render(
    withSandboxMode ? (
      <modules.ComponentTestModeContext.Provider value={modules.componentTestSandboxMode}>
        {editor}
      </modules.ComponentTestModeContext.Provider>
    ) : (
      editor
    ),
  );
}

const loadingPlaceholder = /Loading .+\.\.\./;

/**
 * Switches the form's root object (rootLessListKey `""`, which holds `testField` as an attribute)
 * from structured display to code editor display. The root switch is outside any
 * progressive-reveal placeholder.
 */
function switchRootToCodeEditor(container: HTMLElement) {
  const rootSwitch = container.querySelector(
    'input[id="displayAsStructuredElementSwitch-"]',
  ) as HTMLInputElement | null;
  expect(rootSwitch, "root displayAsStructuredElement switch").not.toBeNull();
  fireEvent.click(rootSwitch!);
}

const progressiveRenderConfigPath = "../../../../src/miroir-fwk/4_view/tools/progressiveRenderConfig";

beforeEach(() => {
  vi.stubEnv("VITE_TEST_MODE", "false");
  vi.doMock(progressiveRenderConfigPath, async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    isVitestTestMode: () => false,
  }));
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock(progressiveRenderConfigPath);
  vi.unstubAllEnvs();
  vi.resetModules();
});

// ################################################################################################
describe("ComponentTestModeContext outside vitest test mode", () => {
  it("inside the sandbox mode context, an object renders with no placeholder and the codeMirrorValue box", async () => {
    const modules = await loadModules();
    const { container } = renderObjectEditor(modules, true);

    expect(container.textContent ?? "").not.toMatch(loadingPlaceholder);
    expect(container.querySelector('input[name$="testField.firstAttribute"]')).not.toBeNull();

    switchRootToCodeEditor(container);

    expect(container.textContent ?? "").toContain("codeMirrorValue:");
    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.querySelector('[aria-label="Format JSON"]')).toBeNull();
  });

  it("without the context, an object renders progressive-reveal placeholders and the real CodeMirror chrome", async () => {
    const modules = await loadModules();
    const { container } = renderObjectEditor(modules, false);

    expect(container.textContent ?? "").toMatch(loadingPlaceholder);
    switchRootToCodeEditor(container);

    expect(container.textContent ?? "").not.toContain("codeMirrorValue:");
    expect(container.querySelector('[aria-label="Format JSON"]')).not.toBeNull();
  });
});
