// ################################################################################################
// React-free manifest of the component test registry (#286).
//
// The consistency test imports only this file, so it must not import React, the registry, or any
// component. Until #292 M1, it lists the legacy `componentTestRef` cases that are not yet written
// as declarative steps.
// ################################################################################################

/**
 * The per-editor component test MiroirTest instances in the Miroir deployment `miroir_data`
 * folder (#292, analysis §5.6), keyed by editor name. Each instance is edited by hand.
 */
export const componentTestSuiteInstances: Record<string, { uuid: string; name: string }> = {
  JzodEnumEditor: { uuid: "761d4ed2-1a5c-4901-a9d9-897dbec0b27f", name: "JzodEnumEditor_ComponentTestSuite" },
  JzodArrayEditor: { uuid: "1b71d68b-7dc9-468c-a251-4fa7889f20f4", name: "JzodArrayEditor_ComponentTestSuite" },
  JzodLiteralEditor: { uuid: "3995a071-b8ae-48d3-a488-6d1fc828b725", name: "JzodLiteralEditor_ComponentTestSuite" },
  JzodObjectEditor: { uuid: "da353085-c62b-4aa6-bd54-8813d303dfe5", name: "JzodObjectEditor_ComponentTestSuite" },
  JzodSimpleTypeEditor: {
    uuid: "590693b6-2125-43fc-89d7-1330ae8318db",
    name: "JzodSimpleTypeEditor_ComponentTestSuite",
  },
  JzodUnionEditor: { uuid: "de517cd6-31a8-46d2-ac09-3a5162b630a7", name: "JzodUnionEditor_ComponentTestSuite" },
  JzodAnyEditor: { uuid: "ec601bcc-a27d-450d-9c37-bdd6a12a1575", name: "JzodAnyEditor_ComponentTestSuite" },
};

/**
 * Suite name to case labels, in execution order. One `reactComponentTest` leaf per case, in the
 * suite's instance of `componentTestSuiteInstances`.
 */
export const componentTestManifest: Record<string, readonly string[]> = {};

/** Leaf label: the suite name, a colon, and the case label, so labels are unique in the instance. */
export function componentTestLeafLabel(suite: string, caseLabel: string): string {
  return `${suite}: ${caseLabel}`;
}
