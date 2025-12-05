import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { CreateIcon, ContentCopyIcon, DeleteIcon } from './Themes/MaterialSymbolWrappers';

// Material Design icon components
const MATERIAL_ICON_COMPONENTS = {
  Create: CreateIcon,
  ContentCopy: ContentCopyIcon,
  Delete: DeleteIcon
} as const;

// Cache for extracted SVG paths
const MATERIAL_ICON_PATHS_CACHE = new Map<string, string>();

/**
 * Extracts SVG path data from a Material-UI icon component at runtime
 */
function extractIconPath(IconComponent: React.ComponentType): string | null {
  try {
    // Render the icon to HTML
    const element = React.createElement(IconComponent);
    const html = ReactDOMServer.renderToStaticMarkup(element);
    
    // Extract the path data using regex
    const pathMatch = html.match(/<path[^>]+d="([^"]+)"/);
    return pathMatch ? pathMatch[1] : null;
  } catch (error) {
    console.warn('Failed to extract icon path:', error);
    return null;
  }
}

/**
 * Gets the SVG path for a Material icon, extracting it at runtime if needed
 */
export function getMaterialIconPath(iconName: keyof typeof MATERIAL_ICON_COMPONENTS): string | null {
  // Check cache first
  if (MATERIAL_ICON_PATHS_CACHE.has(iconName)) {
    return MATERIAL_ICON_PATHS_CACHE.get(iconName)!;
  }
  
  // Extract path from component
  const IconComponent = MATERIAL_ICON_COMPONENTS[iconName];
  if (!IconComponent) {
    console.warn(`Material icon component "${iconName}" not found`);
    return null;
  }
  
  const path = extractIconPath(IconComponent);
  
  // Cache the result
  if (path) {
    MATERIAL_ICON_PATHS_CACHE.set(iconName, path);
  }
  
  return path;
}

export type MaterialIconName = keyof typeof MATERIAL_ICON_COMPONENTS;

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
  const fallbackChars: Record<MaterialIconName, string> = {
    Create: '✎',
    ContentCopy: '⧉', 
    Delete: '🗑'
  };
  
  ctx.fillText(fallbackChars[iconName], x, y);
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
