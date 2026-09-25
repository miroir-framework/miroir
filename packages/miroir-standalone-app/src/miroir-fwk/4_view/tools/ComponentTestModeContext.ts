import { createContext, useContext } from "react";

// ################################################################################################
// Component test mode (#286, analysis §5.4).
//
// The editors fork on test mode in two places: `useViewportReveal` (progressive reveal) and
// `JzodElementEditor` (`isUnderTest`, which renders a `<pre>` box instead of CodeMirror). Under
// vitest both forks read `VITE_TEST_MODE`. In the app, the component test sandbox sets this
// context so that the component under test renders the same DOM as under vitest, without
// changing the rest of the app.
// ################################################################################################

export interface ComponentTestMode {
  /** Reveal progressively rendered sections at once, as under vitest. */
  progressiveRenderDisabled: boolean;
  /** Render the `<pre>codeMirrorValue:` box instead of a real CodeMirror, as under vitest. */
  codeMirrorPlaceholder: boolean;
}

export const defaultComponentTestMode: ComponentTestMode = {
  progressiveRenderDisabled: false,
  codeMirrorPlaceholder: false,
};

/** The mode set by the component test sandbox providers. */
export const componentTestSandboxMode: ComponentTestMode = {
  progressiveRenderDisabled: true,
  codeMirrorPlaceholder: true,
};

export const ComponentTestModeContext = createContext<ComponentTestMode>(defaultComponentTestMode);

export function useComponentTestMode(): ComponentTestMode {
  return useContext(ComponentTestModeContext);
}
