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
  JzodLiteralEditor: [
    "renders Literal input with label when label prop is provided",
    "renders Literal input without label when label prop is not provided",
    "setting new value",
  ],
  JzodObjectEditor: [
    "object renders as json-like input fields with proper value",
    "object with bigint attribute renders as json-like input fields with proper value",
    "object can be updated through displayed input fields",
    "object with optional attributes can receive a value for an optional attribute by clicking on the add button for the attribute",
    "object with 2 optional attributes can have the only attribute value deleted by clicking on the delete button",
    "object with 3 optional attributes can have the value for the second attribute deleted by clicking on the delete button",
    "record renders as json-like input fields with proper value",
    "record can receive a new record attribute with the proper default value when clicking on the add button",
    "record can rename a record attribute keeping the existing value when clicking on the attribute input field",
    "record with 1 entry can have the entry deleted when clicking on the delete button",
    "record with 3 items can have the second record item deleted when clicking on the second delete button",
    "record with 1 object entry can have the entry duplicated when clicking the duplicate button",
    "record with 2 object entries can have the first entry duplicated without colliding with an existing _copy key",
    "createObject definition record entry name can be renamed",
  ],
  JzodSimpleTypeEditor: [
    "string renders input with proper value",
    "string allows to modify input value with consistent update",
    "string allows to modify input value with consistent update then submit form",
    "number renders input with proper value",
    "number allows to modify input value with consistent update",
    "uuid renders input with proper value",
    "uuid allows to modify input value with consistent update",
    "boolean renders checkbox with proper value true",
    "boolean renders checkbox with proper value false",
    "boolean allows to modify checkbox value with consistent update",
    "bigint renders input with proper bigint value",
    "bigint allows to modify input value with consistent update",
  ],
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
