import { Box, Typography } from "@mui/material";
import React from "react";
import { useSearchParams } from "react-router-dom";

/**
 * HomePage – landing page for the Miroir Sandbox.
 *
 * TODO: Replace stub with full implementation once page components
 *       are extracted from miroir-standalone-app into a shared package.
 */
export function HomePage(): React.JSX.Element {
  const [searchParams] = useSearchParams();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        !!!!!!! Miroir Framework – Demo THIS PAGE IS NOT USED!!!!
      </Typography>
      <Typography variant="body1">
        Welcome to the Miroir Framework static demo.
      </Typography>
      <pre style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
        {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
      </pre>
    </Box>
  );
}
