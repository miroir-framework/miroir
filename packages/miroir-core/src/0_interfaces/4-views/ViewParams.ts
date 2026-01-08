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
    toolsPage: { type: "object", definition: {} }, // Add toolsPage to the schema
  },
};

export type GridType = "ag-grid" | "glide-data-grid";
export type AppTheme = "default" | "dark" | "compact" | "material";

// TransformerBuilderPage state interface for persistence
export interface ToolsPageState {
  transformerEditor?: {
    selectedEntityUuid?: string;
    currentInstanceIndex?: number;
    currentTransformerDefinition?: any;
    foldedObjectAttributeOrArrayItems?: { [k: string]: boolean };
    foldedEntityInstanceItems?: { [k: string]: boolean };
    foldedTransformationResultItems?: { [k: string]: boolean };
  };
}

// Interface for ViewParams as entity instance data (plain object)
export interface ViewParamsData {
  uuid: string;
  parentName: string;
  parentUuid: string;
  name: string;
  defaultLabel?: string;
  description?: string;
  sidebarisOpen: number;
  sidebarWidth: number;
  gridType: GridType;
  appTheme: AppTheme;
  toolsPage?: ToolsPageState;
  generalEditMode?: boolean;
}

export class ViewParams {
  private _sidebarIsOpen: boolean;
  private _sidebarWidth: number;
  private _gridType: GridType;
  private _appTheme: AppTheme;
  private _toolsPage: ToolsPageState;
  private _editMode: boolean;
  // private _showModelTools: boolean;

  constructor(
    initialSidebarIsOpen: boolean = true,
    initialSidebarWidth: number = 250, 
    initialGridType: GridType = 'ag-grid', 
    initialAppTheme: AppTheme = 'default',
    initialToolsPage: ToolsPageState = {},
    initialEditMode: boolean = false,
    // initialShowModelTools: boolean = false
  ) {
    this._sidebarIsOpen = initialSidebarIsOpen;
    this._sidebarWidth = initialSidebarWidth;
    this._gridType = initialGridType;
    this._appTheme = initialAppTheme;
    this._toolsPage = initialToolsPage;
    this._editMode = initialEditMode;
    // this._showModelTools = initialShowModelTools;
  }

  get sidebarIsOpen(): boolean {
    return this._sidebarIsOpen;
  }

  set sidebarIsOpen(isOpen: boolean) {
    this._sidebarIsOpen = isOpen;
  }

  updateSidebarIsOpen(isOpen: boolean): void {
    this._sidebarIsOpen = isOpen;
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

  get toolsPage(): ToolsPageState {
    return this._toolsPage;
  }

  updateToolsPage(updates: Partial<ToolsPageState>): void {
    this._toolsPage = { ...this._toolsPage, ...updates };
  }

  updateTransformerEditor(updates: Partial<ToolsPageState['transformerEditor']>): void {
    this._toolsPage = {
      ...this._toolsPage,
      transformerEditor: { ...this._toolsPage.transformerEditor, ...updates }
    };
  }

  get generalEditMode(): boolean {
    return this._editMode;
  }

  set generalEditMode(enabled: boolean) {
    this._editMode = enabled;
  }

  updateEditMode(enabled: boolean): void {
    this._editMode = enabled;
  }

  // get showModelTools(): boolean {
  //   return this._showModelTools;
  // }

  // set showModelTools(enabled: boolean) {
  //   this._showModelTools = enabled;
  // }

  // updateShowModelTools(enabled: boolean): void {
  //   this._showModelTools = enabled;
  // }
}
