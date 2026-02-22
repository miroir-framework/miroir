# Theme Color Defaults: Findings & Implementation

## Problem

The Miroir theme system required every color to be explicitly specified in every sub-section (`components.appBar`, `components.sidebar`, `components.button.primary`, `table.colors`, `table.components.header`, etc.), even when those colors were logically derivable from the root `colors` section. This led to:

- **Redundancy**: Each theme variant (default, dark, compact, material) repeated ~60+ color values
- **Inconsistency risk**: Changing a root color required manually updating all sub-sections
- **High burden**: Creating a new theme required specifying ~100+ color properties

## Solution Architecture

### Type System Changes

Two parallel type hierarchies were introduced:

| Type | Purpose | Where used |
|------|---------|------------|
| `MiroirTheme` | Theme **definition** with optional component colors | Theme constants, `createMiroirTheme()` |
| `ResolvedMiroirTheme` | Fully resolved, all colors guaranteed | React context, consumer components |
| `TableTheme` | Table theme **definition** with optional colors | Table theme constants, `createTableTheme()` |
| `ResolvedTableTheme` | Fully resolved table theme | `TableStyleGenerators`, grid components |

### Resolution Flow

```
MiroirTheme (optional colors)
        │
        ▼
  resolveThemeColors()          ← ThemeColorDefaults.ts
        │
        ▼
ResolvedMiroirTheme (all required)
        │
        ├── components.* (all colors filled)
        └── table: ResolvedTableTheme (all colors filled)
```

Resolution happens in `MiroirThemeContext.tsx` via `useMemo`, so consumers always receive a fully-resolved theme.

### Table Theme Resolution

`createTableTheme()` auto-derives component colors from the merged table colors section:

```
TableTheme.colors (merged with defaults)
        │
        ▼
  createTableTheme() derives component colors
        │
        ▼
ResolvedTableTheme (all component colors filled from table.colors)
```

This means table variants only need to specify their `colors` section — component colors (header background, cell text color, etc.) are automatically derived.

## Complete Color Mapping

### Components → Root Colors

| Component | Property | Fallback | Semantic Reason |
|-----------|----------|----------|-----------------|
| **appBar** | `background` | `colors.primaryDark` | App bar uses dark primary brand |
| | `textColor` | `colors.backgroundPaper` | White/light text on dark bar |
| **sidebar** | `background` | `colors.backgroundPaper` | Sidebar paper surface |
| | `backgroundHover` | `colors.hover` | Standard hover |
| | `textColor` | `colors.text` | Standard text |
| | `textColorActive` | `colors.accent` | Active = accent |
| **drawer** | `background` | `colors.backgroundPaper` | Drawer paper surface |
| | `backdrop` | `colors.overlay` | Standard overlay |
| **input** | `background` | `colors.backgroundPaper` | Input on paper |
| | `backgroundHover` | `colors.surface` | Slightly raised on hover |
| | `backgroundFocused` | `colors.backgroundPaper` | Back to paper when focused |
| | `borderColor` | `colors.border` | Standard border |
| | `borderColorHover` | `colors.textSecondary` | Darker border on hover |
| | `borderColorFocused` | `colors.accent` | Accent highlight on focus |
| | `textColor` | `colors.text` | Standard text |
| | `placeholderColor` | `colors.textLight` | Light placeholder |
| **button.primary** | `background` | `colors.accent` | Primary action = accent |
| | `backgroundHover` | `colors.active` | Pressed deeper accent |
| | `backgroundActive` | `colors.active` | Active state |
| | `textColor` | `colors.backgroundPaper` | Light text on accent |
| | `borderColor` | `colors.accent` | Matches background |
| **button.secondary** | `background` | `colors.secondary` | Secondary brand |
| | `backgroundHover` | `colors.secondaryDark` | Darker on hover |
| | `backgroundActive` | `colors.secondaryDark` | Darker when active |
| | `textColor` | `colors.backgroundPaper` | Light text |
| | `borderColor` | `colors.secondary` | Matches background |
| **button.outlined** | `background` | `'transparent'` | No fill |
| | `backgroundHover` | `colors.accentLight` | Subtle accent hover |
| | `backgroundActive` | `colors.accentLight` | Subtle accent active |
| | `textColor` | `colors.accent` | Accent text |
| | `borderColor` | `colors.accent` | Accent border |
| **card** | `background` | `colors.backgroundPaper` | Card surface |
| | `borderColor` | `colors.border` | Standard border |
| **dialog** | `background` | `colors.backgroundPaper` | Dialog surface |
| | `backdrop` | `colors.overlay` | Standard overlay |
| **tooltip** | `background` | `colors.overlay` | Dark tooltip bg |
| | `textColor` | `colors.backgroundPaper` | Light text on dark |
| **icon** | `colorPrimary` | `colors.accent` | Primary icon = accent |
| | `colorSecondary` | `colors.textSecondary` | Secondary icon |
| | `colorDisabled` | `colors.textDisabled` | Disabled icon |

### Table Colors → Root Colors

| Table Color | Fallback | Semantic Reason |
|-------------|----------|-----------------|
| `primary` | `colors.accent` | Table primary = accent |
| `secondary` | `colors.secondary` | Same secondary |
| `background` | `colors.background` | Same background |
| `surface` | `colors.surface` | Same surface |
| `border` | `colors.border` | Same border |
| `text` | `colors.text` | Same text |
| `textSecondary` | `colors.textSecondary` | Same secondary text |
| `textLight` | `colors.textLight` | Same light text |
| `hover` | `colors.hover` | Same hover |
| `selected` | `colors.selected` | Same selected |
| `filter` | `colors.warning` | Filter = warning (orange) |
| `filterBackground` | `colors.warningLight` | Filter bg = warning light |
| `error` | `colors.error` | Same error |
| `warning` | `colors.warning` | Same warning |
| `success` | `colors.success` | Same success |
| `accent` | `colors.accent` | Same accent |
| `accentLight` | `colors.accentLight` | Same accent light |

### Table Components → Table Colors

| Table Component | Property | Fallback |
|-----------------|----------|----------|
| **table** | `backgroundColor` | `table.colors.background` |
| | `border` | `1px solid ${table.colors.border}` |
| **header** | `background` | `table.colors.surface` |
| | `textColor` | `table.colors.text` |
| | `hoverBackground` | `table.colors.hover` |
| | `borderBottom` | `1px solid ${table.colors.border}` |
| **cell** | `backgroundColor` | `table.colors.background` |
| | `textColor` | `table.colors.text` |
| | `borderRight` | `1px solid ${table.colors.border}` |
| | `borderBottom` | `1px solid ${table.colors.border}` |
| **row** | `hoverBackground` | `table.colors.hover` |
| | `selectedBackground` | `table.colors.selected` |
| | `borderBottom` | `1px solid ${table.colors.border}` |
| | `evenBackground` | `table.colors.background` |
| | `oddBackground` | `table.colors.surface` |
| **toolbar** | `background` | `table.colors.surface` |
| | `textColor` | `table.colors.text` |
| | `borderBottom` | `1px solid ${table.colors.border}` |
| **filter** | `iconColor` | `table.colors.textSecondary` |
| | `activeIconColor` | `table.colors.filter` |
| | `clearButtonColor` | `table.colors.filter` |
| | `clearButtonBackground` | `table.colors.filterBackground` |
| | `clearButtonBorder` | `1px solid ${table.colors.filter}` |
| | `toolbarBackground` | `table.colors.surface` |
| | `inputBackground` | `table.colors.background` |
| | `inputBorder` | `1px solid ${table.colors.border}` |
| **sort** | `iconColor` | `table.colors.textSecondary` |
| | `activeIconColor` | `table.colors.accent` |

## Theme Simplification Results

### Before vs After (approximate color props specified)

| Theme | Before | After | Reduction |
|-------|--------|-------|-----------|
| `defaultMiroirTheme` | ~55 component colors | ~6 | ~89% |
| `darkMiroirTheme` | ~55 component colors | ~8 | ~85% |
| `compactMiroirTheme` | inherited all from default | 0 (layout only) | N/A |
| `materialMiroirTheme` | ~30 component colors | ~10 | ~67% |
| `darkTableTheme` | ~25 component colors | 1 (oddBackground) | ~96% |
| `materialTableTheme` | ~12 component colors | 2 (backgroundColor, hoverBackground) | ~83% |

### What's left explicit (and why)

Only colors that genuinely diverge from the fallback mapping need to remain:

- **`defaultMiroirTheme`**: `button.primary.backgroundActive` (#0d47a1 ≠ active #1565c0), `button.secondary.backgroundActive` (#ad1457 ≠ secondaryDark), `button.outlined.backgroundHover/Active` (0.04/0.08 opacity ≠ accentLight 0.1), `tooltip.background` (rgba(97,97,97,0.9) ≠ overlay)
- **`darkMiroirTheme`**: `sidebar.borderRight` (custom border), `button.primary.backgroundActive` (#0d47a1), `button.secondary.backgroundActive` (#9a0036), `tooltip.background` (rgba(66,66,66,0.95)), plus layout overrides
- **`materialMiroirTheme`**: `appBar.background` (#2196f3, uses primary not accent), icon/button colors that use `#2196f3` instead of accent `#1976d2`

## How to Define a Minimal Theme

```typescript
// A minimal dark theme only needs root colors + explicit divergences
const myDarkTheme: MiroirTheme = {
  ...defaultMiroirTheme,
  id: 'my-dark',
  name: 'My Dark Theme',
  description: 'Custom dark theme',
  colors: {
    ...defaultMiroirTheme.colors,
    primary: '#bb86fc',
    primaryDark: '#3700b3',
    background: '#121212',
    backgroundPaper: '#1e1e1e',
    surface: '#2d2d2d',
    text: '#e0e0e0',
    accent: '#bb86fc',
    // ... other root colors
  },
  // components: {} ← omit entirely! Colors auto-derived from root colors
  components: {},
  table: createTableTheme({
    colors: {
      background: '#121212',
      surface: '#1e1e1e',
      text: '#e0e0e0',
      border: '#333',
      // ... only table-level colors needed
    },
    // components: {} ← omit! Auto-derived from table colors
  }),
};
```

## Files Modified

| File | Changes |
|------|---------|
| [ThemeColorDefaults.ts](packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/ThemeColorDefaults.ts) | **NEW** — Resolver functions + complete mapping documentation |
| [MiroirTheme.ts](packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/MiroirTheme.ts) | Interface optionality, `ResolvedMiroirTheme`, simplified all 4 themes |
| [TableTheme.ts](packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/TableTheme.ts) | Interface optionality, `ResolvedTableTheme`, redesigned `createTableTheme()`, simplified dark/material table themes |
| [MiroirThemeContext.tsx](packages/miroir-standalone-app/src/miroir-fwk/4_view/contexts/MiroirThemeContext.tsx) | Wired resolver, context type → `ResolvedMiroirTheme` |
| [ThemeUtils.ts](packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/ThemeUtils.ts) | Consumer type → `ResolvedMiroirTheme` |
| [TableStyleGenerators.ts](packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/TableStyleGenerators.ts) | Consumer type → `ResolvedTableTheme` |
| [index.ts](packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/index.ts) | Added resolver exports |
