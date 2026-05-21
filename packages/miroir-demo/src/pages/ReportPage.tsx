import { Box, Typography } from "@mui/material";
import React from "react";
import { useSearchParams } from "react-router-dom";

/**
 * ReportPage – displays a Miroir Report by deploymentUuid + reportUuid.
 *
 * Query params used:
 *   ?page=report
 *   &deploymentUuid=<uuid>
 *   &reportUuid=<uuid>
 *   &applicationSection=data|model      (optional, default: data)
 *
 * TODO: Replace stub with full implementation once page components
 *       are extracted from miroir-standalone-app into a shared package.
 */
export function ReportPage(): React.JSX.Element {
  const [searchParams] = useSearchParams();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Report
      </Typography>
      <pre style={{ fontSize: 12, color: "#666" }}>
        {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
      </pre>
      <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
        TODO: Render the report identified by the query parameters above.
      </Typography>
    </Box>
  );
}
