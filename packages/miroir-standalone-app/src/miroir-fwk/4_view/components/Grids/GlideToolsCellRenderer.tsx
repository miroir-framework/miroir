import { CustomCell, CustomRenderer, GridCellKind } from '@glideapps/glide-data-grid';
import { TableComponentRow } from './EntityInstanceGridInterface.js';
import { renderMaterialIconToCanvas, type MaterialIconName } from '../MaterialIconCanvasRenderer.js';
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

type ToolsCellAction = {
  icon: MaterialIconName;
  action: (row: TableComponentRow, event?: any) => void;
};

/** The actions a tools cell offers, left to right; an undefined handler is not drawn. */
export function toolsCellActions(data: ToolsCellData): ToolsCellAction[] {
  const candidates: [MaterialIconName, ToolsCellData["onEdit"]][] = [
    ["OpenInNew", data.onOpen],
    ["Create", data.onEdit],
    ["ContentCopy", data.onDuplicate],
    ["Delete", data.onDelete],
  ];
  return candidates.flatMap(([icon, action]) => (action ? [{ icon, action }] : []));
}

const iconSpacing = 25;

const glideToolsCellRenderer: CustomRenderer<ToolsCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is ToolsCell => (c.data as any)?.kind === 'tools-cell',
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const actions = toolsCellActions(cell.data);

    ctx.fillStyle = theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    const totalWidth = iconSpacing * Math.max(actions.length - 1, 0);
    const startX = rect.x + (rect.width - totalWidth) / 2;
    const centerY = rect.y + rect.height / 2;
    const iconSize = 16;
    const iconColor = theme.textDark || '#313139';

    actions.forEach(({ icon }, iconIndex) => {
      renderMaterialIconToCanvas(ctx, icon, {
        x: startX + iconSpacing * iconIndex,
        y: centerY,
        size: iconSize,
        color: iconColor
      });
    });

    return true;
  },
  measure: () => 180,
  onDelete: () => undefined,
  onClick: (args) => {
    const { cell, posX } = args;
    const { row } = cell.data;
    const actions = toolsCellActions(cell.data);

    const totalWidth = iconSpacing * Math.max(actions.length - 1, 0);
    const rect = args.bounds;
    const cellStartX = (rect.width - totalWidth) / 2;
    const relativeX = posX - cellStartX;

    for (let index = 0; index < actions.length; index += 1) {
      const center = iconSpacing * index;
      if (relativeX >= center - 15 && relativeX <= center + 15) {
        actions[index].action(row, args);
        break;
      }
    }

    return undefined;
  },
};

export default glideToolsCellRenderer;
