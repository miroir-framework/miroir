import type { ComponentTestRegistry } from "./componentTestEnvironment.js";

// ################################################################################################
// Component test registry (#286): suite name to component, suite props, and case bodies.
// Its suites and cases must equal `componentTestManifest.ts` (checked by the consistency test).
// Since #292 Slice 5 every editor suite is declarative, so it is empty until M1 deletes it.
// ################################################################################################
export const componentTestRegistry: ComponentTestRegistry = {};
