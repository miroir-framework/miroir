/**
 * The grids load with the first list section that renders, not with the report route (#337): the
 * home page is a report without list sections, and ag-grid and glide-data-grid are the largest
 * libraries of that route. Render them inside a `Suspense`.
 */
import { lazy } from "react";

export const EntityInstanceGrid = lazy(async () => ({
  default: (await import("./EntityInstanceGrid.js")).EntityInstanceGrid,
}));

export const ValueObjectGrid = lazy(async () => ({
  default: (await import("./ValueObjectGrid.js")).ValueObjectGrid,
}));

/**
 * glide-data-grid is the alternative grid (`gridType: "glide-data-grid"`, ag-grid is the default):
 * it loads only when a list asks for it (#370). Render it inside a `Suspense`.
 */
export const GlideDataGridComponent = lazy(async () => ({
  default: (await import("./GlideDataGridComponent.js")).GlideDataGridComponent,
}));
