// Theme system
export type { TableTheme, ResolvedTableTheme } from "./components/Themes/TableTheme.js";
export { defaultTableTheme } from "./components/Themes/TableTheme.js";

export type { MiroirTheme, ResolvedMiroirTheme, DeepPartial } from "./components/Themes/MiroirTheme.js";
export {
  defaultMiroirTheme,
  darkMiroirTheme,
  compactMiroirTheme,
  materialMiroirTheme,
} from "./components/Themes/MiroirTheme.js";

export { resolveThemeColors, resolveTableThemeColors } from "./components/Themes/ThemeColorDefaults.js";

// Theme context and hooks
export {
  MiroirThemeProvider,
  MiroirThemeContext,
  useMiroirTheme,
  useMiroirColors,
  useMiroirSpacing,
  useMiroirTypography,
  useMiroirComponents,
  useMiroirTableTheme,
  useMiroirNestingColor,
  useMiroirNestingBorderColor,
} from "./contexts/MiroirThemeContext.js";

export type {
  MiroirThemeOption,
  MiroirThemeContextType,
  MiroirThemeProviderProps,
} from "./contexts/MiroirThemeContext.js";
