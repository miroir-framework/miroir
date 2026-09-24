import type { ComponentTestRegistry } from "./componentTestEnvironment.js";
import { jzodArrayEditorComponentTests } from "./jzodElementEditor/JzodArrayEditor.js";

// ################################################################################################
// Component test registry (#286): suite name to component, suite props, and case bodies.
// Its suites and cases must equal `componentTestManifest.ts`, which the generator reads.
// ################################################################################################
export const componentTestRegistry: ComponentTestRegistry = {
  JzodArrayEditor: jzodArrayEditorComponentTests,
};
