import { JzodElement, JzodEnum } from "../1_core/preprocessor-generated/miroirFundamentalType";

export const gridType: JzodEnum = {
  type: "enum",
  definition: ["ag-grid", "glide-data-grid"],
}

export const viewParams: JzodElement = {
  type: "object",
  // tag: {
  //   value: {
  //   }
  // },
  // description: "Parameters for the view, including sidebar width and grid type"
  definition: {
    sidebarWidth: { type: "number" },
    gridType: { type: "enum", definition: ["ag-grid", "glide-data-grid"] },
  },
};

export type GridType = "ag-grid" | "glide-data-grid";

export class ViewParams {
  private _sidebarWidth: number;
  private _gridType: GridType;

  constructor(initialSidebarWidth: number = 250, initialGridType: GridType = 'ag-grid') {
    this._sidebarWidth = initialSidebarWidth;
    this._gridType = initialGridType;
  }

  get sidebarWidth(): number {
    return this._sidebarWidth;
  }

  set sidebarWidth(width: number) {
    this._sidebarWidth = width;
  }

  updateSidebarWidth(width: number): void {
    this._sidebarWidth = width;
  }

  get gridType(): GridType {
    return this._gridType;
  }

  setGridType(type: GridType): void {
    this._gridType = type;
  }
}
