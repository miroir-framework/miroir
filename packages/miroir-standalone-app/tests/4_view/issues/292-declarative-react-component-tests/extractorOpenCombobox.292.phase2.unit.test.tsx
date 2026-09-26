/**
 * Issue #292 Slice 2: `extractValuesFromRenderedElements` reads the committed value of an open
 * `ThemedSelectWithPortal` combobox (analysis §3.5, §5.5, D4).
 *
 * While the option list is open, the combobox input shows the filter text, not the selected
 * value. The extractor then reads the value from the select's state tracker
 * (`data-test-selected-value`) when the tracker says the list is open. A closed combobox is read
 * as before (its input shows the selected option's label).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- extractorOpenCombobox.292.phase2
 * ```
 */
import React, { useState } from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/dom";

import { defaultStoredMiroirTheme } from "miroir-test-app_deployment-miroir";

import {
  componentTestFireEvent,
  mountComponent,
  type MountedComponent,
} from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestEnvironment";
import { extractValuesFromRenderedElements } from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestTools";
import { ThemedSelectWithPortal } from "../../../../src/miroir-fwk/4_view/components/Themes/FormComponents.js";
import { MiroirThemeProvider } from "../../../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { PortalContainerProvider } from "../../../../src/miroir-fwk/4_view/tools/PortalContainerContext.js";

const attachedElements: HTMLElement[] = [];
const mounted: MountedComponent[] = [];

function attach(html: string, testId: string): HTMLElement {
  const element = document.createElement("div");
  element.setAttribute("data-testid", testId);
  element.innerHTML = html;
  document.body.appendChild(element);
  attachedElements.push(element);
  return element;
}

beforeAll(() => {
  // act-free mount, as in the component test entry
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
});

afterEach(() => {
  mounted.splice(0).forEach((component) => component.unmount());
  attachedElements.splice(0).forEach((element) => element.remove());
});

/** The markup of a filterable `ThemedSelectWithPortal`: combobox input and hidden state tracker. */
function themedSelectMarkup(params: { name: string; inputValue: string; isOpen: boolean; selectedValue: string }) {
  return `<div>
    <input type="text" role="combobox" name="${params.name}" value="${params.inputValue}" aria-expanded="${params.isOpen}" aria-haspopup="listbox" />
    <div data-testid="themed-select-state-${params.name}" data-test-is-open="${params.isOpen}" data-test-filter-text="" data-test-selected-value="${params.selectedValue}" style="display: none;" aria-hidden="true"></div>
  </div>`;
}

// ################################################################################################
describe("extractValuesFromRenderedElements, open combobox", () => {
  it("an open combobox whose input shows an empty filter text is read from its state tracker", () => {
    const root = attach(
      themedSelectMarkup({ name: "TESTSECTION.testField", inputValue: "", isOpen: true, selectedValue: "value2" }),
      "root",
    );

    const values = extractValuesFromRenderedElements(expect, undefined, root, "TESTSECTION", "initial");

    expect(values).toEqual({ testField: "value2" });
  });

  it("an open combobox whose name contains a quote and a backslash is read from its state tracker (PR #293 review)", () => {
    const name = 'TESTSECTION.a"b\\c';
    const root = attach("", "root");
    const input = document.createElement("input");
    input.setAttribute("role", "combobox");
    input.name = name;
    input.value = "";
    const stateTracker = document.createElement("div");
    stateTracker.setAttribute("data-testid", `themed-select-state-${name}`);
    stateTracker.setAttribute("data-test-is-open", "true");
    stateTracker.setAttribute("data-test-selected-value", "value2");
    root.append(input, stateTracker);

    const values = extractValuesFromRenderedElements(expect, undefined, root, "TESTSECTION", "initial");

    expect(values).toEqual({ 'a"b\\c': "value2" });
  });

  it("a closed combobox is read from its input, as before", () => {
    const root = attach(
      themedSelectMarkup({ name: "TESTSECTION.testField", inputValue: "value2", isOpen: false, selectedValue: "value2" }),
      "root",
    );

    const values = extractValuesFromRenderedElements(expect, undefined, root, "TESTSECTION", "initial");

    expect(values).toEqual({ testField: "value2" });
  });

  it("a real ThemedSelectWithPortal, opened, gives the selected value and the option list", async () => {
    const root = document.createElement("div");
    const portalElement = document.createElement("div");
    document.body.appendChild(root);
    document.body.appendChild(portalElement);
    attachedElements.push(root, portalElement);

    const options = ["value1", "value2", "value3"].map((value) => ({ value, label: value }));
    const Select: React.FC = () => {
      const [value, setValue] = useState("value2");
      return (
        <ThemedSelectWithPortal
          name="TESTSECTION.testField"
          filterable={true}
          options={options}
          value={value}
          onChange={(event: any) => setValue(event.target.value)}
        />
      );
    };
    mounted.push(
      mountComponent(
        <MiroirThemeProvider
          currentThemeOptions={[
            { id: "default", name: "Default Theme", description: "Test theme", theme: defaultStoredMiroirTheme.definition },
          ]}
        >
          <PortalContainerProvider portalElement={portalElement}>
            <Select />
          </PortalContainerProvider>
        </MiroirThemeProvider>,
        root,
      ),
    );

    const combobox = root.querySelector('input[role="combobox"]') as HTMLInputElement;
    const stateTracker = root.querySelector('[data-testid="themed-select-state-TESTSECTION.testField"]') as HTMLElement;
    componentTestFireEvent.click(combobox);
    await waitFor(() => expect(stateTracker.getAttribute("data-test-is-open")).toBe("true"));
    // the input shows the (empty) filter text while the list is open
    expect(combobox.value).toBe("");

    const values = extractValuesFromRenderedElements(
      expect,
      undefined,
      root,
      "TESTSECTION",
      "after click",
      true,
      portalElement,
    );

    expect(values).toEqual({
      testField: "value2",
      "TESTSECTION.options": ["value1", "value2", "value3"],
    });
  });
});
