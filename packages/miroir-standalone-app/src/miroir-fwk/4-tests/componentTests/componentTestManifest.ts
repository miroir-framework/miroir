// ################################################################################################
// React-free manifest of the component test registry (#286).
//
// The generator (`scripts/generate-component-miroir-tests.ts`) and the consistency test import
// only this file, so it must not import React, the registry, or any component.
// ################################################################################################

/** MiroirTest instance written by the generator in the Miroir deployment `miroir_data` folder. */
export const componentTestSuiteInstanceUuid = "761d4ed2-1a5c-4901-a9d9-897dbec0b27f";
export const componentTestSuiteInstanceName = "JzodElementEditor_ComponentTestSuite";

/**
 * Suite name to case labels, in execution order. One MiroirTest sub-suite per suite and one
 * `reactComponentTest` leaf per case.
 */
export const componentTestManifest: Record<string, readonly string[]> = {
  JzodArrayEditor: [
    "renders array input with label when label prop is provided",
    "renders all array values, in the right order",
    "form state is changed when selection changes",
    "changing order of array items when button ROOT.testField.1.up is clicked",
    "changing order of array items when button ROOT.testField.2.up is clicked",
    "changing order of array items when button ROOT.testField.0.down is clicked",
    "changing order of heteronomous object array items from union when button ROOT.testField.0.down is clicked",
    "renders all array values of a plain 2-items tuple with a string and a number, in the right order",
    "renders all array values of a tuple inside an array, in the right order",
    "add an element to a string array when button ROOT.testField.add is clicked",
    "add an element to an object array when button ROOT.testField.add is clicked",
    "duplicate an element in a string array when duplicate button for item 1 is clicked",
  ],
  JzodEnumEditor: [
    "renders select with correct value",
    "renders all enum options",
    "form state is changed when selection changes",
  ],
};

/** Leaf label: the suite name, a colon, and the case label, so labels are unique in the instance. */
export function componentTestLeafLabel(suite: string, caseLabel: string): string {
  return `${suite}: ${caseLabel}`;
}
