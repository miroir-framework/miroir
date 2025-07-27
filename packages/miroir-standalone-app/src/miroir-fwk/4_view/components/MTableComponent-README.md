# MTableComponent Unified Styling System

The `MTableComponent` provides a comprehensive theming system that works uniformly across both AG-Grid and Glide Data Grid implementations. This ensures visual consistency regardless of which grid implementation is used.

## Features

- **Unified Theme Interface**: Single `TableTheme` interface defines all styling properties
- **Cross-Grid Compatibility**: Automatically generates appropriate styles for both AG-Grid and Glide Data Grid
- **Pre-built Themes**: Dark, compact, and material design variants included
- **Deep Customization**: Override any aspect of the theme while maintaining consistency
- **Type Safety**: Full TypeScript support with intelligent auto-completion

## Basic Usage

### Default Theme
```tsx
<MTableComponent {...props} />
```

### Using Pre-built Themes
```tsx
import { MTableComponent, darkTableTheme, compactTableTheme, materialTableTheme } from './MTableComponent';

// Dark theme
<MTableComponent {...props} theme={darkTableTheme} />

// Compact theme
<MTableComponent {...props} theme={compactTableTheme} />

// Material design theme
<MTableComponent {...props} theme={materialTableTheme} />
```

### Custom Theme Overrides
```tsx
<MTableComponent 
  {...props} 
  theme={{
    colors: { 
      primary: '#ff0000',
      background: '#f9f9f9' 
    },
    typography: { 
      fontSize: '16px' 
    }
  }} 
/>
```

### Creating Custom Themes
```tsx
import { createTableTheme } from './MTableComponent';

const customTheme = createTableTheme({
  colors: { 
    primary: '#purple',
    accent: '#orange'
  },
  components: { 
    header: { 
      background: '#lightgray',
      fontWeight: 700
    },
    cell: {
      fontSize: '15px',
      padding: '10px 16px'
    }
  }
});

<MTableComponent {...props} theme={customTheme} />
```

## Theme Structure

### Colors
- `primary`, `secondary`: Main brand colors
- `background`, `surface`: Background colors
- `text`, `textSecondary`, `textLight`: Text colors
- `border`: Border colors
- `hover`, `selected`: Interactive state colors
- `filter`, `filterBackground`: Filter-specific colors
- `error`, `warning`, `success`: Status colors
- `accent`, `accentLight`: Accent colors

### Typography
- `fontSize`, `fontFamily`: Base text styling
- `fontWeight`: Normal, medium, bold weights
- `headerFontSize`, `headerFontWeight`: Header-specific typography

### Components
Each component (table, header, cell, row, toolbar, filter, sort) has its own styling properties:

#### Table
- `borderRadius`, `border`, `backgroundColor`
- `minHeight`, `maxHeight`

#### Header
- `background`, `textColor`, `hoverBackground`
- `height`, `fontSize`, `fontWeight`, `borderBottom`

#### Cell
- `backgroundColor`, `textColor`
- `height`, `padding`, `fontSize`
- `borderRight`, `borderBottom`

#### Row
- `hoverBackground`, `selectedBackground`
- `evenBackground`, `oddBackground`
- `borderBottom`

#### Filter & Sort
- Icon colors, button styling, input styling
- Active/inactive states

## Advanced Features

### Accessing Helper Functions
```tsx
import { getAgGridStyles, getGlideTheme } from './MTableComponent';

// Get AG-Grid CSS styles
const agGridCSS = getAgGridStyles(myTheme);

// Get Glide Data Grid theme object
const glideTheme = getGlideTheme(myTheme);
```

### Type Safety
```tsx
import type { TableTheme } from './MTableComponent';

const myTheme: TableTheme = createTableTheme({
  // Full type checking and auto-completion
});
```

## Grid Type Selection

The component automatically selects the appropriate grid implementation based on `viewParams.gridType`:
- `"ag-grid"`: Uses AG-Grid with generated CSS styles
- `"glide"`: Uses Glide Data Grid with converted theme object

Both implementations receive the same theme data, ensuring visual consistency.

## Best Practices

1. **Use Pre-built Themes**: Start with `darkTableTheme`, `compactTableTheme`, or `materialTableTheme`
2. **Minimal Overrides**: Only override specific properties you need to change
3. **Consistent Colors**: Use the theme's color palette throughout your application
4. **Test Both Grids**: Verify your theme works well with both AG-Grid and Glide implementations
5. **Performance**: Theme objects are memoized, so pass stable theme objects when possible

## Migration Guide

If you're migrating from manual styling:

1. **Remove CSS Overrides**: Replace custom CSS with theme properties
2. **Consolidate Colors**: Use the unified color palette
3. **Update Props**: Pass `theme` prop instead of `styles` where possible
4. **Test Thoroughly**: Verify appearance in both grid modes

The unified styling system provides better maintainability, consistency, and developer experience compared to manual CSS overrides.
