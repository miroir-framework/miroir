import type { ComponentTestRegistry } from "./componentTestEnvironment.js";
import { jzodAnyEditorComponentTests } from "./jzodElementEditor/JzodAnyEditor.js";
import { jzodArrayEditorComponentTests } from "./jzodElementEditor/JzodArrayEditor.js";
import { jzodObjectEditorComponentTests } from "./jzodElementEditor/JzodObjectEditor.js";
import { jzodUnionEditorComponentTests } from "./jzodElementEditor/JzodUnionEditor.js";

// ################################################################################################
// Component test registry (#286): suite name to component, suite props, and case bodies.
// Its suites and cases must equal `componentTestManifest.ts` (checked by the consistency test).
// ################################################################################################
export const componentTestRegistry: ComponentTestRegistry = {
  JzodArrayEditor: jzodArrayEditorComponentTests,
  JzodObjectEditor: jzodObjectEditorComponentTests,
  JzodUnionEditor: jzodUnionEditorComponentTests,
  JzodAnyEditor: jzodAnyEditorComponentTests,
};
