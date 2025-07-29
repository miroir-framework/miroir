import React from 'react';
import { CustomCell, CustomRenderer, GridCellKind, getMiddleCenterBias } from '@glideapps/glide-data-grid';
import { TableComponentRow } from './MTableComponentInterface.js';
import { renderMaterialIconToCanvas } from '../MaterialIconCanvasRenderer.js';

export interface ToolsCellData {
  kind: 'tools-cell';
  row: TableComponentRow;
  onEdit?: (row: TableComponentRow, event?: any) => void;
  onDuplicate?: (row: TableComponentRow, event?: any) => void;
  onDelete?: (row: TableComponentRow, event?: any) => void;
}

export type ToolsCell = CustomCell<ToolsCellData>;

const glideToolsCellRenderer: CustomRenderer<ToolsCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is ToolsCell => (c.data as any)?.kind === 'tools-cell',
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { row } = cell.data;

    // Draw background
    ctx.fillStyle = theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    const iconSpacing = 25;
    const totalWidth = iconSpacing * 2;
    const startX = rect.x + (rect.width - totalWidth) / 2;
    const centerY = rect.y + rect.height / 2;
    const iconSize = 16;

    // Use darker color for better contrast
    const iconColor = theme.textDark || '#313139';

    // Draw the three Material Design icons using the utility function
    renderMaterialIconToCanvas(ctx, 'Create', {
      x: startX,
      y: centerY,
      size: iconSize,
      color: iconColor
    });

    renderMaterialIconToCanvas(ctx, 'ContentCopy', {
      x: startX + iconSpacing,
      y: centerY,
      size: iconSize,
      color: iconColor
    });

    renderMaterialIconToCanvas(ctx, 'Delete', {
      x: startX + iconSpacing * 2,
      y: centerY,
      size: iconSize,
      color: iconColor
    });

    return true;
  },
  measure: () => 180, // Default width for tools column
  onDelete: () => undefined,
  onClick: (args) => {
    const { cell, posX } = args;
    const { row, onEdit, onDuplicate, onDelete } = cell.data;
    
    // Calculate which icon was clicked based on position
    const iconSpacing = 25;
    const totalWidth = iconSpacing * 2;
    const rect = args.bounds;
    
    // posX is already relative to the cell, so we need to calculate icon positions relative to cell start
    const cellStartX = (rect.width - totalWidth) / 2;
    const relativeX = posX - cellStartX;
    
    if (relativeX >= -15 && relativeX <= 15) {
      // Edit icon clicked
      if (onEdit) {
        onEdit(row, args);
      }
    } else if (relativeX >= iconSpacing - 15 && relativeX <= iconSpacing + 15) {
      // Duplicate icon clicked
      if (onDuplicate) {
        onDuplicate(row, args);
      }
    } else if (relativeX >= iconSpacing * 2 - 15 && relativeX <= iconSpacing * 2 + 15) {
      // Delete icon clicked
      if (onDelete) {
        onDelete(row, args);
      }
    }
    
    return undefined; // No cell change
  },
};

export default glideToolsCellRenderer;
