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
};

/** Leaf label: the suite name, a colon, and the case label, so labels are unique in the instance. */
export function componentTestLeafLabel(suite: string, caseLabel: string): string {
  return `${suite}: ${caseLabel}`;
}
