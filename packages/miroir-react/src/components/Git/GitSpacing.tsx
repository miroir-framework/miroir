/**
 * #691: the standalone app's MUI theme sets `spacing: 0`, so `gap: 1` or `p: 1` in an `sx` is 0 there and
 * the header, the buttons and the history line of the Git page run into each other. The Git page uses
 * MUI's default spacing (8px a unit) inside this provider; the rest of the theme is the app's.
 */
import { createTheme, ThemeProvider, type Theme } from "@mui/material";
import React from "react";

const withGitSpacing = (outer: Theme): Theme => ({ ...outer, spacing: createTheme({ spacing: 8 }).spacing });

export function GitSpacing(props: { children: React.ReactNode }): React.JSX.Element {
  return <ThemeProvider theme={withGitSpacing}>{props.children}</ThemeProvider>;
}
