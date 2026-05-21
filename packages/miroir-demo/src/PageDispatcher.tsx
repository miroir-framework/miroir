import React from "react";
import { useSearchParams } from "react-router-dom";
import { HomePage } from "./pages/HomePage.js";
import { ReportPage } from "./pages/ReportPage.js";

/**
 * PageDispatcher
 *
 * Single-page entry point for the demo.  Route selection is driven by the
 * `?page=<name>` query parameter so the app works with a hash router
 * (GitHub Pages compatible, no server-side routing required).
 *
 * Recognised page values:
 *   home    → HomePage   (default when `page` is absent)
 *   report  → ReportPage (?deploymentUuid=…&reportUuid=…&applicationSection=…)
 */
export function PageDispatcher(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "home";

  switch (page) {
    case "home":
      return <HomePage />;
    case "report":
      return <ReportPage />;
    default:
      return (
        <div style={{ padding: 32 }}>
          <p>Unknown page: <code>{page}</code></p>
          <a href="#">Go home</a>
        </div>
      );
  }
}
