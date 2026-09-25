/**
 * Issue #286 Slice 3: `extractValuesFromRenderedElements` (src) searches only its root and the
 * given portal element, not the whole document (analysis G5).
 *
 * Uses the src function directly: the tests-side re-export in `JzodElementEditorTestTools.tsx`
 * keeps the whole-document search for its importers.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- extractValuesScoped.286.phase3
 * ```
 */
import { afterEach, describe, expect, it } from "vitest";

import { extractValuesFromRenderedElements } from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestTools";

const attachedElements: HTMLElement[] = [];

function attach(html: string, testId: string): HTMLElement {
  const element = document.createElement("div");
  element.setAttribute("data-testid", testId);
  element.innerHTML = html;
  document.body.appendChild(element);
  attachedElements.push(element);
  return element;
}

afterEach(() => {
  attachedElements.splice(0).forEach((element) => element.remove());
});

/**
 * The option list markup of `ThemedSelectWithPortal` (FormComponents.tsx), as its `createPortal`
 * mounts it: one `div` per option with `role="option"`, `data-dropdown-option="true"`, and an
 * `aria-label` made of the select name, `-option-`, and the option value.
 */
function themedSelectOptionList(name: string, options: string[]): string {
  return `<div>${options
    .map(
      (option) =>
        `<div aria-label="${name}-option-${option}" data-dropdown-option="true" role="option">${option}</div>`,
    )
    .join("")}</div>`;
}

// ################################################################################################
describe("extractValuesFromRenderedElements searches its root and the portal element only", () => {
  it("a named input outside the root is ignored", () => {
    attach(`<input type="text" name="testField.outside" value="outsideValue" />`, "outside");
    const root = attach(`<input type="text" name="testField.inside" value="insideValue" />`, "root");

    const values = extractValuesFromRenderedElements(expect, undefined, root, "testField");

    expect(values).toEqual({ inside: "insideValue" });
  });

  it("a ThemedSelectWithPortal option list mounted in the given portal element is read, one outside it is not", () => {
    const name = "testSection.testField";
    const root = attach(
      `<div>
        <input type="text" role="combobox" name="${name}" value="value2" aria-expanded="true" aria-haspopup="listbox" />
        <div data-testid="themed-select-state-${name}" data-test-is-open="true" data-test-selected-value="value2" style="display: none;" aria-hidden="true"></div>
      </div>`,
      "root",
    );
    const portalElement = attach(themedSelectOptionList(name, ["value1", "value2", "value3"]), "portal");
    // A second option list for the same name, outside the root and the portal element.
    attach(themedSelectOptionList(name, ["elsewhere1", "elsewhere2"]), "elsewhere");

    const values = extractValuesFromRenderedElements(
      expect,
      undefined,
      root,
      "testSection",
      "after click",
      true,
      portalElement,
    );

    expect(values).toEqual({
      testField: "value2",
      "testSection.options": ["value1", "value2", "value3"],
    });
  });
});
