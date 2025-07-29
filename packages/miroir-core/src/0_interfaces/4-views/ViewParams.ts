import { JzodElement, JzodEnum } from "../1_core/preprocessor-generated/miroirFundamentalType";

export const gridType: JzodEnum = {
  type: "enum",
  definition: ["ag-grid", "glide-data-grid"],
}

export const appTheme: JzodEnum = {
  type: "enum",
  definition: ["default", "dark", "compact", "material"],
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
    appTheme: { type: "enum", definition: ["default", "dark", "compact", "material"] },
  },
};

export type GridType = "ag-grid" | "glide-data-grid";
export type AppTheme = "default" | "dark" | "compact" | "material";

// Interface for ViewParams as entity instance data (plain object)
export interface ViewParamsData {
  uuid: string;
  parentName: string;
  parentUuid: string;
  name: string;
  defaultLabel?: string;
  description?: string;
  sidebarWidth: number;
  gridType: GridType;
  appTheme: AppTheme;
}

export class ViewParams {
  private _sidebarWidth: number;
  private _gridType: GridType;
  private _appTheme: AppTheme;

  constructor(
    initialSidebarWidth: number = 250, 
    initialGridType: GridType = 'ag-grid', 
    initialAppTheme: AppTheme = 'default'
  ) {
    this._sidebarWidth = initialSidebarWidth;
    this._gridType = initialGridType;
    this._appTheme = initialAppTheme;
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

  get appTheme(): AppTheme {
    return this._appTheme;
  }

  setAppTheme(theme: AppTheme): void {
    this._appTheme = theme;
  }
}
