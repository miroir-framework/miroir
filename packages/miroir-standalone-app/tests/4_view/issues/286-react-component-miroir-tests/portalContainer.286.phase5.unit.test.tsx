/**
 * Issue #286 Slice 5: `PortalContainerContext` (analysis §5.4, G6).
 *
 * - `ThemedSelectWithPortal` renders its option list in the context's element, and a click
 *   outside that element closes the list.
 * - Without the context, it renders its option list in `document.body`, as before.
 * - A `ThemedMUISelect` inside `PortalContainerProvider` (the sandbox theme, which sets
 *   `defaultProps.container` on the MUI popups) renders its menu in the portal element.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- portalContainer.286.phase5
 * ```
 */
import { ThemeProvider } from "@emotion/react";
import { createTheme, MenuItem } from "@mui/material";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { defaultStoredMiroirTheme } from "miroir-test-app_deployment-miroir";

import { MiroirThemeProvider } from "../../../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { ThemedSelectWithPortal } from "../../../../src/miroir-fwk/4_view/components/Themes/FormComponents.js";
import { ThemedMUISelect } from "../../../../src/miroir-fwk/4_view/components/Themes/MUIComponents.js";
import {
  PortalContainerContext,
  PortalContainerProvider,
} from "../../../../src/miroir-fwk/4_view/tools/PortalContainerContext.js";

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "Test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

const options = [
  { value: "value1", label: "value1" },
  { value: "value2", label: "value2" },
  { value: "value3", label: "value3" },
];

const Select: React.FC = () => {
  const [value, setValue] = useState("value2");
  return (
    <ThemedSelectWithPortal
      name="portalTestField"
      filterable={true}
      options={options}
      value={value}
      onChange={(event: any) => setValue(event.target.value)}
    />
  );
};

const attachedElements: HTMLElement[] = [];

function attachPortalElement(): HTMLElement {
  const element = document.createElement("div");
  element.setAttribute("data-testid", "test-portal-element");
  document.body.appendChild(element);
  attachedElements.push(element);
  return element;
}

afterEach(() => {
  attachedElements.splice(0).forEach((element) => element.remove());
});

function isOpen(): string | null {
  return screen.getByTestId("themed-select-state-portalTestField").getAttribute("data-test-is-open");
}

describe("portalContainer.286.phase5", () => {
  it("ThemedSelectWithPortal renders its options in the PortalContainerContext element, and an outside click closes them", async () => {
    const portalElement = attachPortalElement();
    const { container } = render(
      <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
        <PortalContainerContext.Provider value={portalElement}>
          <Select />
        </PortalContainerContext.Provider>
      </MiroirThemeProvider>,
    );

    fireEvent.click(screen.getByRole("combobox"));
    await waitFor(() => expect(isOpen()).toBe("true"));

    const optionsInPortal = Array.from(portalElement.querySelectorAll('[role="option"]')).map(
      (option) => option.textContent,
    );
    expect(optionsInPortal).toEqual(["value1", "value2", "value3"]);
    const optionsOutsidePortal = Array.from(document.querySelectorAll('[role="option"]')).filter(
      (option) => !portalElement.contains(option),
    );
    expect(optionsOutsidePortal).toHaveLength(0);

    // A click outside the portal element and outside the select closes the list.
    const outside = attachPortalElement();
    expect(container.contains(outside)).toBe(false);
    fireEvent.mouseDown(outside);
    await waitFor(() => expect(isOpen()).toBe("false"));
    expect(portalElement.querySelectorAll('[role="option"]')).toHaveLength(0);
  });

  it("without the context, ThemedSelectWithPortal renders its options in document.body", async () => {
    render(
      <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
        <Select />
      </MiroirThemeProvider>,
    );

    fireEvent.click(screen.getByRole("combobox"));
    await waitFor(() => expect(isOpen()).toBe("true"));

    const renderedOptions = Array.from(document.body.querySelectorAll('[role="option"]'));
    expect(renderedOptions.map((option) => option.textContent)).toEqual(["value1", "value2", "value3"]);
    // The option list is a direct portal child of document.body, as before #286.
    const dropdown = renderedOptions[0].parentElement;
    expect(dropdown?.parentElement).toBe(document.body);
  });

  it("a ThemedMUISelect inside PortalContainerProvider renders its menu in the portal element", async () => {
    const portalElement = attachPortalElement();
    render(
      <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
        <ThemeProvider theme={createTheme()}>
          <PortalContainerProvider portalElement={portalElement}>
            <ThemedMUISelect open={true} value="a" onChange={() => undefined} label="MUI select">
              <MenuItem value="a">Option A</MenuItem>
              <MenuItem value="b">Option B</MenuItem>
            </ThemedMUISelect>
          </PortalContainerProvider>
        </ThemeProvider>
      </MiroirThemeProvider>,
    );

    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());
    const listbox = screen.getByRole("listbox");
    expect(portalElement.contains(listbox)).toBe(true);
    expect(
      Array.from(portalElement.querySelectorAll('[role="option"]')).map((option) => option.textContent),
    ).toEqual(["Option A", "Option B"]);
  });
});
