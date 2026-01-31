/**
 * Material Icon Canvas Renderer
 * 
 * Renders Material Design icons directly to canvas using pre-defined SVG paths.
 * These paths are from the official Material Design Icons library (24x24 viewBox).
 */

// Pre-defined SVG paths for Material Design icons (from official Material Design Icons)
// These are the exact paths from @mui/icons-material
const MATERIAL_ICON_PATHS: Record<string, string> = {
  // Create/Edit icon (pencil)
  Create: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  // ContentCopy icon (two rectangles)
  ContentCopy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  // Delete icon (trash can)
  Delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
} as const;

export type MaterialIconName = keyof typeof MATERIAL_ICON_PATHS;

/**
 * Gets the SVG path for a Material icon
 */
export function getMaterialIconPath(iconName: MaterialIconName): string | null {
  return MATERIAL_ICON_PATHS[iconName] || null;
}

export interface MaterialIconCanvasOptions {
  size?: number;
  color?: string;
  x?: number;
  y?: number;
}

/**
 * Renders a Material Design icon to a canvas context using SVG paths
 * @param ctx - Canvas 2D rendering context
 * @param iconName - Name of the Material Design icon
 * @param options - Rendering options (size, color, position)
 */
export function renderMaterialIconToCanvas(
  ctx: CanvasRenderingContext2D,
  iconName: MaterialIconName,
  options: MaterialIconCanvasOptions = {}
): void {
  const {
    size = 16,
    color = '#000000',
    x = 0,
    y = 0
  } = options;

  const pathData = getMaterialIconPath(iconName);
  
  if (!pathData) {
    console.warn(`Material icon "${String(iconName)}" not found`);
    return;
  }

  // Use Path2D for exact SVG rendering if supported
  if (typeof Path2D !== 'undefined') {
    const path = new Path2D(pathData);
    
    ctx.save();
    ctx.translate(x, y);
    
    // Scale from 24x24 viewBox to desired size
    const scale = size / 24;
    ctx.scale(scale, scale);
    
    // Center the icon (Material Design icons are in 24x24 viewBox)
    ctx.translate(-12, -12);
    
    ctx.fillStyle = color;
    ctx.fill(path);
    
    ctx.restore();
  } else {
    // Fallback for browsers without Path2D support
    renderFallbackIcon(ctx, iconName, { size, color, x, y });
  }
}

/**
 * Fallback rendering for browsers without Path2D support
 */
function renderFallbackIcon(
  ctx: CanvasRenderingContext2D,
  iconName: MaterialIconName,
  options: Required<MaterialIconCanvasOptions>
): void {
  const { size, color, x, y } = options;
  
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Simple fallback characters
  const fallbackChars: Record<string, string> = {
    Create: '✎',
    ContentCopy: '⧉', 
    Delete: '🗑'
  };
  
  ctx.fillText(fallbackChars[iconName] || '?', x, y);
  ctx.restore();
}

/**
 * Helper function to get the SVG path for a Material icon
 * This can be used if you need the raw path data
 * @deprecated Use getMaterialIconPath instead for runtime extraction
 */
export function getLegacyMaterialIconPath(iconName: MaterialIconName): string | null {
  return getMaterialIconPath(iconName);
}
