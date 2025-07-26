import React from 'react';
import { CustomCell, CustomRenderer, GridCellKind, getMiddleCenterBias } from '@glideapps/glide-data-grid';
import { TableActionButtons, TableActionButtonsProps } from './TableActionButtons.js';
import { TableComponentRow } from './MTableComponentInterface.js';

export interface ToolsCellData {
  kind: 'tools-cell';
  row: TableComponentRow;
  onEdit?: (row: TableComponentRow, event?: any) => void;
  onDuplicate?: (row: TableComponentRow, event?: any) => void;
  onDelete?: (row: TableComponentRow, event?: any) => void;
}

export type ToolsCell = CustomCell<ToolsCellData>;

const renderer: CustomRenderer<ToolsCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is ToolsCell => (c.data as any)?.kind === 'tools-cell',
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { row } = cell.data;

    // Draw background
    ctx.fillStyle = theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Draw action icons
    ctx.fillStyle = theme.textMedium;
    ctx.font = '16px Material Icons';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const iconSize = 16;
    const iconSpacing = 25;
    const totalWidth = iconSpacing * 2; // 3 icons with spacing
    const startX = rect.x + (rect.width - totalWidth) / 2;
    const centerY = rect.y + rect.height / 2;
    
    // Draw edit icon (create)
    ctx.fillText('✏️', startX, centerY);
    
    // Draw duplicate icon (content_copy)
    ctx.fillText('📄', startX + iconSpacing, centerY);
    
    // Draw delete icon (delete)
    ctx.fillText('🗑️', startX + iconSpacing * 2, centerY);

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
    const startX = rect.x + (rect.width - totalWidth) / 2;
    const relativeX = posX - startX;
    
    if (relativeX >= -12 && relativeX <= 12) {
      // Edit icon clicked - call with same signature as AG-Grid
      if (onEdit) {
        onEdit(row, args); // Pass the event args as second parameter
      }
    } else if (relativeX >= iconSpacing - 12 && relativeX <= iconSpacing + 12) {
      // Duplicate icon clicked - call with same signature as AG-Grid
      if (onDuplicate) {
        onDuplicate(row, args); // Pass the event args as second parameter
      }
    } else if (relativeX >= iconSpacing * 2 - 12 && relativeX <= iconSpacing * 2 + 12) {
      // Delete icon clicked - call with same signature as AG-Grid
      if (onDelete) {
        onDelete(row, args); // Pass the event args as second parameter
      }
    }
    
    return undefined; // No cell change
  },
};

export default renderer;
