import { CustomCell, CustomRenderer, GridCellKind } from '@glideapps/glide-data-grid';
import { TableComponentRow } from './EntityInstanceGridInterface.js';
import { renderMaterialIconToCanvas } from '../MaterialIconCanvasRenderer.js';
import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "GlideToolsCellRenderer");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface ToolsCellData {
  kind: 'tools-cell';
  row: TableComponentRow;
  onEdit?: (row: TableComponentRow, event?: any) => void;
  onDuplicate?: (row: TableComponentRow, event?: any) => void;
  onDelete?: (row: TableComponentRow, event?: any) => void;
  onOpen?: (row: TableComponentRow, event?: any) => void;
}

export type ToolsCell = CustomCell<ToolsCellData>;

const glideToolsCellRenderer: CustomRenderer<ToolsCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is ToolsCell => (c.data as any)?.kind === 'tools-cell',
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { onOpen } = cell.data;

    ctx.fillStyle = theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    const iconSpacing = 25;
    const iconCount = onOpen ? 4 : 3;
    const totalWidth = iconSpacing * (iconCount - 1);
    const startX = rect.x + (rect.width - totalWidth) / 2;
    const centerY = rect.y + rect.height / 2;
    const iconSize = 16;
    const iconColor = theme.textDark || '#313139';

    let iconIndex = 0;
    if (onOpen) {
      renderMaterialIconToCanvas(ctx, 'OpenInNew', {
        x: startX + iconSpacing * iconIndex,
        y: centerY,
        size: iconSize,
        color: iconColor
      });
      iconIndex += 1;
    }

    renderMaterialIconToCanvas(ctx, 'Create', {
      x: startX + iconSpacing * iconIndex,
      y: centerY,
      size: iconSize,
      color: iconColor
    });
    renderMaterialIconToCanvas(ctx, 'ContentCopy', {
      x: startX + iconSpacing * (iconIndex + 1),
      y: centerY,
      size: iconSize,
      color: iconColor
    });
    renderMaterialIconToCanvas(ctx, 'Delete', {
      x: startX + iconSpacing * (iconIndex + 2),
      y: centerY,
      size: iconSize,
      color: iconColor
    });

    return true;
  },
  measure: () => 180,
  onDelete: () => undefined,
  onClick: (args) => {
    const { cell, posX } = args;
    const { row, onEdit, onDuplicate, onDelete, onOpen } = cell.data;

    const iconSpacing = 25;
    const iconCount = onOpen ? 4 : 3;
    const totalWidth = iconSpacing * (iconCount - 1);
    const rect = args.bounds;
    const cellStartX = (rect.width - totalWidth) / 2;
    const relativeX = posX - cellStartX;

    const actions = onOpen
      ? [onOpen, onEdit, onDuplicate, onDelete]
      : [onEdit, onDuplicate, onDelete];

    for (let index = 0; index < actions.length; index += 1) {
      const center = iconSpacing * index;
      if (relativeX >= center - 15 && relativeX <= center + 15) {
        actions[index]?.(row, args);
        break;
      }
    }

    return undefined;
  },
};

export default glideToolsCellRenderer;
