import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { entityEntity, selfApplicationMiroir } from "miroir-app-miroir";

import { TransformerEditor } from "../../src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.js";
import { ReportPageContextProvider } from "../../src/miroir-fwk/4_view/components/Reports/ReportPageContext.js";
import {
  ListTransformerIntegShell,
  libraryApplicationDeploymentMap,
} from "./helpers/listTransformerIntegRig.js";

const ROOT_TRANSFORMER_TYPE_INPUT = "transformerEditor_transformer_selector.transformer.transformerType";

function renderTransformerEditor() {
  return render(
    <ListTransformerIntegShell>
      <ReportPageContextProvider>
        <TransformerEditor
          application={selfApplicationMiroir.uuid}
          applicationDeploymentMap={libraryApplicationDeploymentMap}
          deploymentUuid={libraryApplicationDeploymentMap[selfApplicationMiroir.uuid]}
          entityUuid={entityEntity.uuid}
        />
      </ReportPageContextProvider>
    </ListTransformerIntegShell>,
  );
}

/** Option labels of the root transformerType select, once opened. */
async function getRootTransformerTypeOptions(): Promise<string[]> {
  const input = await waitFor(
    () => {
      const match = document.querySelector(
        `input[name="${ROOT_TRANSFORMER_TYPE_INPUT}"]`,
      ) as HTMLInputElement | null;
      if (!match) {
        throw new Error("root transformerType input not found yet");
      }
      return match;
    },
    { timeout: 10000, interval: 100 },
  );
  await act(async () => {
    fireEvent.focus(input);
  });
  const options = await waitFor(
    () => {
      const found = Array.from(document.querySelectorAll('[data-dropdown-option="true"]'));
      if (found.length === 0) {
        throw new Error("options not rendered yet");
      }
      return found.map((option) => option.textContent?.trim() ?? "");
    },
    { timeout: 5000, interval: 100 },
  );
  await act(async () => {
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.blur(input);
  });
  return options;
}

// The Miroir application is the one whose model the shell's local cache always holds.
// #383 — the TransformerEditor restricts its transformerType selects by the input of their
// position, from its input selector ("here" sample object by default), with an off switch.
describe("TransformerEditor transformer choice by input type (#383)", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("hides array-input transformers for the default object input", async () => {
    renderTransformerEditor();

    const options = await getRootTransformerTypeOptions();

    expect(options).toContain("getObjectValues");
    expect(options).not.toContain("aggregate");
  });

  it("shows the full list when the restriction is off, and keeps the choice across a reload", async () => {
    const { unmount } = renderTransformerEditor();
    const restrictSwitch = await waitFor(() => screen.getByTestId("transformer-editor-restrict-switch"));
    expect(restrictSwitch).toBeChecked();

    await act(async () => {
      fireEvent.click(restrictSwitch);
    });

    expect(await getRootTransformerTypeOptions()).toContain("aggregate");
    expect(
      JSON.parse(sessionStorage.getItem("toolsPageState") ?? "{}").transformerEditor
        ?.restrictTransformersToInputType,
    ).toBe(false);

    unmount();
    renderTransformerEditor();
    expect(await waitFor(() => screen.getByTestId("transformer-editor-restrict-switch"))).not.toBeChecked();
    expect(await getRootTransformerTypeOptions()).toContain("aggregate");
  });
});
