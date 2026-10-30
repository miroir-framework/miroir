/**
 * The grid components a list section renders (#612). The default is the lazy grids; a test that
 * renders a list section without ag-grid provides stubs here, since a `vi.mock` of a module path
 * does not reach the imports inside miroir-react.
 */
import { createContext, useContext, type ComponentType, type ReactNode } from "react";

import type { TableComponentProps } from "./EntityInstanceGridInterface.js";
import { EntityInstanceGrid } from "./LazyGrids.js";

export interface GridComponents {
  EntityInstanceGrid: ComponentType<TableComponentProps>;
}

const GridComponentsContext = createContext<GridComponents>({ EntityInstanceGrid });

export function GridComponentsProvider(props: { components: GridComponents; children?: ReactNode }) {
  return (
    <GridComponentsContext.Provider value={props.components}>{props.children}</GridComponentsContext.Provider>
  );
}

export function useGridComponents(): GridComponents {
  return useContext(GridComponentsContext);
}
