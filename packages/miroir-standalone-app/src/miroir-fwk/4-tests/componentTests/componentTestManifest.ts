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
  JzodArrayEditor: ["renders all array values, in the right order"],
};

/** Leaf label: the suite name, a colon, and the case label, so labels are unique in the instance. */
export function componentTestLeafLabel(suite: string, caseLabel: string): string {
  return `${suite}: ${caseLabel}`;
}
