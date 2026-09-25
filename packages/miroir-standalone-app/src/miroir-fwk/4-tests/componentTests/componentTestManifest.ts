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
export const componentTestManifest: Record<string, readonly string[]> = {
  JzodUnionEditor: [
    "union between simple types renders input with proper value",
    "union between simple type and object for value of simple type renders input with proper value",
    "union between simple type and object for value object renders input with proper value",
    "union between 2 object types with a discriminator for value object renders input following the proper value type",
    "non-discriminated union can switch type from number to string via union type selector",
    "non-discriminated union can switch type from number to object via union type selector",
    "union type star button is visible but selector is initially hidden",
    "union type star button toggle shows then hides selector",
    "union type selector for object value places star and selector above the value",
  ],
  JzodAnyEditor: [
    "any type star button is visible for a string value",
    "any type star button toggle shows then hides selector",
    "any type can switch from number to string via selector",
    "any type star button for object value places star and selector in header",
    "any type with object value shows text input for string attribute",
    "any type with object value shows text input for number attribute",
    "any type can switch from number to object via selector",
    "any type can switch from object to string via selector",
    "any type can switch from object to array via selector",
    "any type can switch from array to string via selector",
    "any-typed array can be added an item",
    "any-typed array can have an item removed",
    "any-typed array can have an item duplicated",
    "any-typed object can be added an attribute (it is a record)",
    "any-typed array can have an attribute removed (it is a record)",
  ],
};

/** Leaf label: the suite name, a colon, and the case label, so labels are unique in the instance. */
export function componentTestLeafLabel(suite: string, caseLabel: string): string {
  return `${suite}: ${caseLabel}`;
}
