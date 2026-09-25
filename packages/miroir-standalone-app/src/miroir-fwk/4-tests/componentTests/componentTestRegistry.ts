import type { ComponentTestRegistry } from "./componentTestEnvironment.js";
import { jzodArrayEditorComponentTests } from "./jzodElementEditor/JzodArrayEditor.js";
import { jzodEnumEditorComponentTests } from "./jzodElementEditor/JzodEnumEditor.js";
import { jzodLiteralEditorComponentTests } from "./jzodElementEditor/JzodLiteralEditor.js";
import { jzodObjectEditorComponentTests } from "./jzodElementEditor/JzodObjectEditor.js";

// ################################################################################################
// Component test registry (#286): suite name to component, suite props, and case bodies.
// Its suites and cases must equal `componentTestManifest.ts`, which the generator reads.
// ################################################################################################
export const componentTestRegistry: ComponentTestRegistry = {
  JzodArrayEditor: jzodArrayEditorComponentTests,
  JzodEnumEditor: jzodEnumEditorComponentTests,
  JzodLiteralEditor: jzodLiteralEditorComponentTests,
  JzodObjectEditor: jzodObjectEditorComponentTests,
};
