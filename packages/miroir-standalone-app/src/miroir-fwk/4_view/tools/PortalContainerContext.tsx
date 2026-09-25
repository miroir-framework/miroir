import DefaultPropsProvider from "@mui/material/DefaultPropsProvider";
import React, { createContext, useContext, useMemo, type ReactNode } from "react";

// ################################################################################################
// Portal container (#286, analysis §5.4).
//
// `ThemedSelectWithPortal` portals its option list to `document.body` by default. The component
// test sandbox sets this context to its portal element, a child of the sandbox element, so that
// the option lists of the component under test stay inside the sandbox, where the test queries
// and the value reader look for them. MUI popups (`ThemedMUISelect`) get the same target as their
// default `container` prop (`PortalContainerProvider`).
// ################################################################################################

/** The portal target, or `undefined` for the default `document.body`. */
export const PortalContainerContext = createContext<HTMLElement | undefined>(undefined);

/** The element portals should render into: the context value, or `document.body` by default. */
export function usePortalContainer(): HTMLElement {
  const portalContainer = useContext(PortalContainerContext);
  return portalContainer ?? document.body;
}

/** The MUI components whose popups portal to their `container` prop. */
export const portalContainerMuiComponentNames = ["MuiPopover", "MuiPopper", "MuiModal", "MuiMenu"] as const;

/**
 * The theme `components` entries that set `defaultProps.container` to `container` on the MUI
 * popups, in the shape of `theme.components`.
 */
export function portalContainerMuiComponents(
  container: HTMLElement,
): Record<(typeof portalContainerMuiComponentNames)[number], { defaultProps: { container: HTMLElement } }> {
  return Object.fromEntries(
    portalContainerMuiComponentNames.map((componentName) => [componentName, { defaultProps: { container } }]),
  ) as Record<(typeof portalContainerMuiComponentNames)[number], { defaultProps: { container: HTMLElement } }>;
}

/**
 * Sets `PortalContainerContext` to `portalElement`, and gives the MUI popups (`MuiPopover`,
 * `MuiPopper`, `MuiModal`, `MuiMenu`) the default prop `container: portalElement`.
 *
 * MUI 5.17 reads theme default props through `useDefaultProps`, whose context is set by the MUI
 * `ThemeProvider` (`DefaultPropsProvider` with `theme.components`), not by the emotion
 * `ThemeProvider` that the component test wrapper uses. This provider therefore sets
 * `DefaultPropsProvider` itself, with the popup entries only, and leaves the emotion theme as
 * it is. The sandbox renders in its own React root, so no outer `DefaultPropsProvider` is lost.
 */
export const PortalContainerProvider: React.FC<{ portalElement: HTMLElement; children?: ReactNode }> = ({
  portalElement,
  children,
}) => {
  const muiComponents = useMemo(() => portalContainerMuiComponents(portalElement), [portalElement]);
  return (
    <PortalContainerContext.Provider value={portalElement}>
      <DefaultPropsProvider value={muiComponents as any}>{children}</DefaultPropsProvider>
    </PortalContainerContext.Provider>
  );
};
