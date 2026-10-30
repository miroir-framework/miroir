/**
 * ReportDisplay for a lazy route (#612): `import("miroir-react")` from the app would load ReportDisplay
 * with the page, because the page already loads miroir-react (D13). Render it inside a `Suspense`.
 */
import { lazy } from "react";

export const LazyReportDisplay = lazy(async () => ({
  default: (await import("./ReportDisplay.js")).ReportDisplay,
}));
