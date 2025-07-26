import React, { useCallback, useMemo } from 'react';
import {
  DataEditor,
  GridCell,
  GridCellKind,
  GridColumn,
  Item,
  DataEditorProps,
  CellClickedEventArgs,
  EditableGridCell,
} from '@glideapps/glide-data-grid';
import "@glideapps/glide-data-grid/dist/index.css";

import { 
  EntityDefinition,
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory 
} from "miroir-core";

import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import {
  TableComponentProps,
  TableComponentRow,
  TableComponentTypeSchema,
} from "./MTableComponentInterface.js";
import { calculateAdaptiveColumnWidths } from '../adaptiveColumnWidths.js';
import glideToolsCellRenderer, { ToolsCell, ToolsCellData } from './GlideToolsCellRenderer.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "GlideDataGridComponent")
).then((logger: LoggerInterface) => {log = logger});

interface GlideDataGridComponentProps {
  tableComponentRows: { tableComponentRowUuidIndexSchema: TableComponentRow[] };
  props: TableComponentProps;
  onCellClicked?: (cell: Item, event: CellClickedEventArgs) => void;
  onCellEdited?: (cell: Item, newValue: EditableGridCell) => void;
  onRowEdit?: (row: TableComponentRow) => void;
  onRowDelete?: (row: TableComponentRow) => void;
  onRowDuplicate?: (row: TableComponentRow) => void;
}

export const GlideDataGridComponent: React.FC<GlideDataGridComponentProps> = ({
  tableComponentRows,
  props,
  onCellClicked,
  onCellEdited,
  onRowEdit,
  onRowDelete,
  onRowDuplicate,
}) => {
  // Convert columnDefs to Glide format
  const glideColumns: GridColumn[] = useMemo(() => {
    // Calculate adaptive widths based on data and available space
    const availableWidth = 1200; // Default, could be made dynamic based on container width
    const jzodSchema = props.type === TableComponentTypeSchema.enum.EntityInstance && 
      props.currentEntityDefinition?.jzodSchema?.definition ? 
      props.currentEntityDefinition.jzodSchema.definition : undefined;

    const widthSpecs = calculateAdaptiveColumnWidths(
      props.columnDefs.columnDefs,
      tableComponentRows.tableComponentRowUuidIndexSchema,
      availableWidth,
      jzodSchema
    );

    const columns: GridColumn[] = [];
    
    // Add tools column with calculated width
    const toolsSpec = widthSpecs.find(spec => spec.type === 'tools');
    columns.push({
      title: "Actions",
      id: "tools",
      width: toolsSpec?.calculatedWidth || 180,
    });
    
    // Add data columns with calculated widths
    props.columnDefs.columnDefs.forEach((colDef: any) => {
      if (colDef.field && colDef.field !== 'tools') {
        const widthSpec = widthSpecs.find(spec => spec.field === colDef.field);
        columns.push({
          title: colDef.headerName || colDef.field,
          id: colDef.field,
          width: widthSpec?.calculatedWidth || 150,
        });
      }
    });
    
    return columns;
  }, [props.columnDefs, tableComponentRows, props.type, props]);

  // Get cell content
  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const rowData = tableComponentRows.tableComponentRowUuidIndexSchema[row];
      const colData = glideColumns[col];
      
      if (!rowData || !colData) {
        return {
          kind: GridCellKind.Text,
          data: "",
          displayData: "",
          allowOverlay: false,
        };
      }

      // Special handling for tools column
      if (colData.id === "tools") {
        return {
          kind: GridCellKind.Custom,
          data: {
            kind: "tools-cell",
            row: rowData,
            onEdit: (row: TableComponentRow, event?: any) => {
              log.info("GlideDataGrid: Edit button clicked", { row, event });
              if (onRowEdit) {
                onRowEdit(row, event);
              }
            },
            onDuplicate: (row: TableComponentRow, event?: any) => {
              log.info("GlideDataGrid: Duplicate button clicked", { row, event });
              if (onRowDuplicate) {
                onRowDuplicate(row, event);
              }
            },
            onDelete: (row: TableComponentRow, event?: any) => {
              log.info("GlideDataGrid: Delete button clicked", { row, event });
              if (onRowDelete) {
                onRowDelete(row, event);
              }
            },
          } as ToolsCellData,
          copyData: "Actions",
          allowOverlay: false, // Disable overlay since we handle clicks directly
        } as ToolsCell;
      }

      const attributeName = colData.id || "";
      
      // Check if this is a foreign key column by looking at the column definition
      const columnDef = props.columnDefs.columnDefs.find((cd: any) => cd.field === attributeName);
      const isFK = columnDef?.cellRendererParams?.isFK;
      const entityUuid = columnDef?.cellRendererParams?.entityUuid;
      
      if (isFK && entityUuid) {
        // This is a foreign key column - display the referenced object's name
        const foreignKeyUuid = (rowData.rawValue as any)[attributeName];
        
        if (!foreignKeyUuid) {
          return {
            kind: GridCellKind.Text,
            data: "",
            displayData: "",
            allowOverlay: true,
          };
        }
        
        // Check if foreign key objects are available
        if (!rowData.foreignKeyObjects || !rowData.foreignKeyObjects[entityUuid]) {
          const errorMessage = `Foreign key object not found for entity ${entityUuid}`;
          log.warn(errorMessage, {
            attributeName,
            entityUuid,
            foreignKeyUuid,
            availableEntities: Object.keys(rowData.foreignKeyObjects || {})
          });
          
          return {
            kind: GridCellKind.Text,
            data: `${foreignKeyUuid} (not found)`,
            displayData: `${foreignKeyUuid} (not found)`,
            allowOverlay: true,
          };
        }
        
        const referencedInstance = rowData.foreignKeyObjects[entityUuid][foreignKeyUuid];
        
        if (!referencedInstance) {
          return {
            kind: GridCellKind.Text,
            data: `${foreignKeyUuid} (not known)`,
            displayData: `${foreignKeyUuid} (not known)`,
            allowOverlay: true,
          };
        }
        
        // Display the name of the referenced instance
        const displayName = (referencedInstance as any).name || foreignKeyUuid;
        
        return {
          kind: GridCellKind.Text,
          data: displayName,
          displayData: displayName,
          allowOverlay: true,
        };
      } else {
        // Regular column - use displayedValue or rawValue
        const cellValue = rowData.displayedValue[attributeName] || (rowData.rawValue as any)[attributeName];
        const displayValue = cellValue != null ? String(cellValue) : "";

        return {
          kind: GridCellKind.Text,
          data: displayValue,
          displayData: displayValue,
          allowOverlay: true,
        };
      }
    },
    [tableComponentRows, glideColumns, props.columnDefs, onRowEdit, onRowDuplicate, onRowDelete]
  );

  // Handle cell clicks
  const handleCellClicked = useCallback(
    (cell: Item, event: CellClickedEventArgs) => {
      const [col, row] = cell;
      const rowData = tableComponentRows.tableComponentRowUuidIndexSchema[row];
      const colData = glideColumns[col];
      
      // Handle tools column clicks - these should be handled by the custom cell renderer
      if (colData.id === "tools") {
        // Don't log or interfere - let the custom renderer handle it
        return;
      }

      log.info("GlideDataGrid cell clicked", { cell, event, rowData, colData });

      // For other columns, call the provided click handler
      if (onCellClicked) {
        // Pass the cell and event as-is to the parent handler
        // The parent handler (onGlideGridCellClicked) expects [col, row] format
        onCellClicked(cell, event);
      }
    },
    [tableComponentRows, glideColumns, onCellClicked]
  );

  // Handle cell edits
  const handleCellEdited = useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      log.info("GlideDataGrid cell edited", { cell, newValue });
      
      if (onCellEdited) {
        onCellEdited(cell, newValue);
      }
    },
    [onCellEdited]
  );

  // Calculate height based on data
  const height = useMemo(() => {
    const rowCount = tableComponentRows.tableComponentRowUuidIndexSchema.length;
    if (rowCount > 50) {
      return Math.min(window.innerHeight * 0.5, 600); // 50vh but max 600px
    } else {
      return Math.min(rowCount * 34 + 36, 400); // Auto height with max
    }
  }, [tableComponentRows.tableComponentRowUuidIndexSchema.length]);

  return (
    <div
      style={{
        ...props.styles,
        height: `${height}px`,
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
      }}
    >
      <DataEditor
        columns={glideColumns}
        rows={tableComponentRows.tableComponentRowUuidIndexSchema.length}
        getCellContent={getCellContent}
        onCellClicked={handleCellClicked}
        onCellEdited={handleCellEdited}
        customRenderers={[glideToolsCellRenderer]}
        smoothScrollX={true}
        smoothScrollY={true}
        isDraggable={false}
        rangeSelect="none"
        columnSelect="none"
        rowSelect="none"
        keybindings={{
          selectAll: false,
          selectRow: false,
          selectColumn: false,
        }}
        theme={{
          accentColor: "#1976d2",
          accentFg: "#ffffff",
          accentLight: "rgba(25, 118, 210, 0.1)",
          textDark: "#313139",
          textMedium: "#737383",
          textLight: "#b2b2c0",
          textBubble: "#313139",
          bgIconHeader: "#737383",
          fgIconHeader: "#ffffff",
          textHeader: "#313139",
          textHeaderSelected: "#000000",
          bgCell: "#ffffff",
          bgCellMedium: "#fafafb",
          bgHeader: "#f7f7f8",
          bgHeaderHasFocus: "#e6e6e6",
          bgHeaderHovered: "#f0f0f0",
          bgBubble: "#ffffff",
          bgBubbleSelected: "#ffffff",
          bgSearchResult: "#fff9c4",
          borderColor: "rgba(115, 116, 131, 0.16)",
          drilldownBorder: "rgba(0, 0, 0, 0)",
          linkColor: "#1976d2",
          headerFontStyle: "600 13px",
          baseFontStyle: "13px",
          fontFamily: "Inter, Roboto, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, noto, arial, sans-serif",
        }}
      />
    </div>
  );
};
