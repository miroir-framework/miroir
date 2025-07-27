import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
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
  Popover, 
  Box, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button,
  IconButton,
  Typography 
} from '@mui/material';
import { FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';

import { 
  EntityDefinition,
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory 
} from "miroir-core";

import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import {
  TableComponentRow,
  TableComponentTypeSchema,
} from "./MTableComponentInterface.js";
import { calculateAdaptiveColumnWidths, ColumnWidthSpec, ToolsColumnDefinition } from '../adaptiveColumnWidths.js';
import glideToolsCellRenderer, { ToolsCell, ToolsCellData } from './GlideToolsCellRenderer.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "GlideDataGridComponent")
).then((logger: LoggerInterface) => {log = logger});

// Sorting and filtering types
type SortDirection = 'asc' | 'desc' | null;
interface SortState {
  columnId: string;
  direction: SortDirection;
}

type FilterType = 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEqual';
interface FilterState {
  columnId: string | null;
  type: FilterType;
  value: string;
}

interface GlideDataGridComponentProps {
  tableComponentRows: { tableComponentRowUuidIndexSchema: TableComponentRow[] };
  columnDefs: { columnDefs: any[] };
  styles?: any;
  type: string;
  currentEntityDefinition?: EntityDefinition;
  calculatedColumnWidths?: ColumnWidthSpec[];
  toolsColumnDefinition: ToolsColumnDefinition;
  onCellClicked?: (cell: Item, event: CellClickedEventArgs) => void;
  onCellEdited?: (cell: Item, newValue: EditableGridCell) => void;
  onRowEdit?: (row: TableComponentRow, event?: any) => void;
  onRowDelete?: (row: TableComponentRow, event?: any) => void;
  onRowDuplicate?: (row: TableComponentRow, event?: any) => void;
}

export const GlideDataGridComponent: React.FC<GlideDataGridComponentProps> = ({
  tableComponentRows,
  columnDefs,
  styles,
  type,
  currentEntityDefinition,
  calculatedColumnWidths,
  toolsColumnDefinition,
  onCellClicked,
  onCellEdited,
  onRowEdit,
  onRowDelete,
  onRowDuplicate,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(1200);
  
  // Sorting state
  const [sortState, setSortState] = useState<SortState>({ columnId: '', direction: null });
  
  // Filtering state
  const [filterState, setFilterState] = useState<FilterState>({ columnId: null, type: 'contains', value: '' });
  
  // Ref for the filter value input to enable focus
  const filterValueRef = useRef<HTMLInputElement>(null);

  // Focus the filter value input when a column is selected
  useEffect(() => {
    if (filterState.columnId && filterValueRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        filterValueRef.current?.focus();
      }, 100);
    }
  }, [filterState.columnId]);

  // Monitor container width changes
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Handle header clicks for sorting
  const handleHeaderClick = useCallback((columnIndex: number) => {
    // We need to access the columns directly from the columnDefs since glideColumns isn't available yet
    if (columnIndex === 0) return; // Skip tools column (index 0)
    
    // Find the corresponding column definition
    const dataColumnIndex = columnIndex - 1; // Subtract 1 because tools column is at index 0
    const colDef = columnDefs.columnDefs[dataColumnIndex];
    if (!colDef) return;
    
    const columnId = colDef.field;
    if (!columnId) return;
    
    // Handle sorting
    if (colDef.sortable === false) return; // Skip if sorting is disabled
    
    setSortState(prevState => {
      if (prevState.columnId === columnId) {
        // Same column - cycle through: null -> asc -> desc -> null
        const nextDirection: SortDirection = 
          prevState.direction === null ? 'asc' :
          prevState.direction === 'asc' ? 'desc' : null;
        return { columnId, direction: nextDirection };
      } else {
        // Different column - start with ascending
        return { columnId, direction: 'asc' };
      }
    });
  }, [columnDefs]);

  // Helper function to get the filter value for a column, handling foreign keys correctly
  const getFilterValue = useCallback((row: any, columnField: string): string => {
    const columnDef = columnDefs.columnDefs.find((colDef: any) => colDef.field === columnField);
    
    if (!columnDef || !row) return '';
    
    // Check if this is a foreign key column
    const isFK = columnDef?.cellRendererParams?.isFK;
    const entityUuid = columnDef?.cellRendererParams?.entityUuid;
    
    if (isFK && entityUuid && row.foreignKeyObjects?.[entityUuid]) {
      // For foreign key columns, return the name of the referenced entity
      const foreignKeyUuid = row.rawValue?.[columnField];
      if (foreignKeyUuid && row.foreignKeyObjects[entityUuid][foreignKeyUuid]) {
        return row.foreignKeyObjects[entityUuid][foreignKeyUuid].name || '';
      }
      return ''; // No foreign key object found
    }
    
    // For regular columns, use displayedValue or rawValue
    return (row.displayedValue?.[columnField] || row.rawValue?.[columnField] || '').toString();
  }, [columnDefs]);

  // Apply filtering and sorting to the data
  const sortedAndFilteredTableRows = useMemo(() => {
    let filteredRows = tableComponentRows.tableComponentRowUuidIndexSchema;

    // Apply filtering if active
    if (filterState.columnId && filterState.value.trim()) {
      filteredRows = filteredRows.filter((row) => {
        const cellValue = getFilterValue(row, filterState.columnId!);
        const searchValue = filterState.value.toLowerCase();
        const cellStr = cellValue.toLowerCase();

        switch (filterState.type) {
          case 'contains':
            return cellStr.includes(searchValue);
          case 'startsWith':
            return cellStr.startsWith(searchValue);
          case 'endsWith':
            return cellStr.endsWith(searchValue);
          case 'equals':
            return cellStr === searchValue;
          case 'notEqual':
            return cellStr !== searchValue;
          default:
            return true;
        }
      });
    }

    // Apply sorting if active
    if (!sortState.direction || !sortState.columnId) {
      return filteredRows;
    }

    const sorted = [...filteredRows].sort((a, b) => {
      const aValue = getFilterValue(a, sortState.columnId);
      const bValue = getFilterValue(b, sortState.columnId);
      
      // Convert to strings for comparison
      const aStr = aValue.toLowerCase();
      const bStr = bValue.toLowerCase();
      
      let comparison = 0;
      if (aStr < bStr) comparison = -1;
      else if (aStr > bStr) comparison = 1;
      
      return sortState.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [tableComponentRows, sortState, filterState, getFilterValue]);

  // Calculate height based on data
  const height = useMemo(() => {
    const rowCount = sortedAndFilteredTableRows.length;
    if (rowCount > 50) {
      return Math.min(window.innerHeight * 0.5, 600); // 50vh but max 600px
    } else {
      return Math.min(rowCount * 34 + 36, 400); // Auto height with max
    }
  }, [sortedAndFilteredTableRows.length]);

  // Convert columnDefs to Glide format
  const glideColumns: GridColumn[] = useMemo(() => {
    let widthSpecs: ColumnWidthSpec[];

    if (calculatedColumnWidths && calculatedColumnWidths.length > 0) {
      // Use pre-calculated widths from MTableComponent
      widthSpecs = calculatedColumnWidths;
    } else {
      // Fallback: calculate widths if not provided (shouldn't happen in normal flow)
      const rowCount = tableComponentRows.tableComponentRowUuidIndexSchema.length;
      const maxRowsWithoutScroll = Math.floor((height - 36) / 34); // 36px header, 34px per row
      const needsVerticalScrollbar = rowCount > maxRowsWithoutScroll;

      const scrollbarWidth = needsVerticalScrollbar ? 17 : 0;
      const borderWidth = 2; // Container border
      const availableWidth = containerWidth - scrollbarWidth - borderWidth;

      const jzodSchema =
        type === TableComponentTypeSchema.enum.EntityInstance &&
        currentEntityDefinition?.jzodSchema?.definition
          ? currentEntityDefinition.jzodSchema.definition
          : undefined;

      widthSpecs = calculateAdaptiveColumnWidths(
        columnDefs.columnDefs,
        tableComponentRows.tableComponentRowUuidIndexSchema,
        availableWidth,
        toolsColumnDefinition,
        jzodSchema,
      );
    }

    // Debug logging for width distribution
    const finalTotalWidth = widthSpecs.reduce((sum, spec) => sum + spec.calculatedWidth, 0);
    log.info("GlideDataGrid column width distribution", {
      containerWidth,
      finalTotalWidth,
      usingPreCalculatedWidths: calculatedColumnWidths && calculatedColumnWidths.length > 0,
      columnWidths: widthSpecs.map((spec) => ({
        field: spec.field || "tools",
        type: spec.type,
        width: Math.round(spec.calculatedWidth),
      })),
    });

    const columns: GridColumn[] = [];

    // Add tools column with calculated width using shared definition
    const toolsSpec = widthSpecs.find((spec) => spec.type === "tools");
    columns.push({
      title: toolsColumnDefinition.headerName,
      id: toolsColumnDefinition.field || "tools",
      width: Math.round(toolsSpec?.calculatedWidth || toolsColumnDefinition.width),
    });

    // Add data columns with calculated widths and sorting indicators
    columnDefs.columnDefs.forEach((colDef: any) => {
      if (colDef.field) {
        const widthSpec = widthSpecs.find((spec) => spec.field === colDef.field);
        
        // Add sorting and filtering indicators to title
        let title = colDef.headerName || colDef.field;
        
        // Add sorting indicator
        if (sortState.columnId === colDef.field && sortState.direction) {
          const arrow = sortState.direction === 'asc' ? ' ↑' : ' ↓';
          title = title + arrow;
        }
        
        // Add filter indicator
        if (filterState.columnId === colDef.field && filterState.value.trim()) {
          title = title + ' 🔍';
        }
        
        columns.push({
          title,
          id: colDef.field,
          width: Math.round(widthSpec?.calculatedWidth || 150),
        });
      }
    });

    return columns;
  }, [
    columnDefs,
    tableComponentRows,
    type,
    currentEntityDefinition,
    calculatedColumnWidths,
    containerWidth,
    height,
    toolsColumnDefinition,
    sortState,
    filterState,
  ]);

  // Get cell content
  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const rowData = sortedAndFilteredTableRows[row];
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
      if (colData.id === (toolsColumnDefinition.field || "tools")) {
        const toolsCellData = {
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
        } as ToolsCellData;

        return {
          kind: GridCellKind.Custom,
          data: toolsCellData,
          copyData: "Actions",
          allowOverlay: false, // Disable overlay since we handle clicks directly
        } as ToolsCell;
      }

      const attributeName = colData.id || "";

      // Check if this is a foreign key column by looking at the column definition
      const columnDef = columnDefs.columnDefs.find((cd: any) => cd.field === attributeName);
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
            availableEntities: Object.keys(rowData.foreignKeyObjects || {}),
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
        const cellValue =
          rowData.displayedValue[attributeName] || (rowData.rawValue as any)[attributeName];
        const displayValue = cellValue != null ? String(cellValue) : "";

        return {
          kind: GridCellKind.Text,
          data: displayValue,
          displayData: displayValue,
          allowOverlay: true,
        };
      }
    },
    [sortedAndFilteredTableRows, glideColumns, columnDefs, onRowEdit, onRowDuplicate, onRowDelete, toolsColumnDefinition]
  );

  // Handle cell clicks
  const handleCellClicked = useCallback(
    (cell: Item, event: CellClickedEventArgs) => {
      const [col, row] = cell;
      const rowData = sortedAndFilteredTableRows[row];
      const colData = glideColumns[col];
      
      // Handle tools column clicks - these should be handled by the custom cell renderer
      if (colData.id === (toolsColumnDefinition.field || "tools")) {
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
    [sortedAndFilteredTableRows, glideColumns, onCellClicked, toolsColumnDefinition]
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

  return (
    <div
      ref={containerRef}
      style={{
        ...styles,
        height: `${height}px`,
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
      }}
    >
      {/* Filter Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        alignItems: 'center', 
        padding: 1, 
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f8f8',
        minHeight: 40
      }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter Column</InputLabel>
          <Select
            value={filterState.columnId || ''}
            label="Filter Column"
            onChange={(e) => setFilterState(prev => ({ 
              ...prev, 
              columnId: e.target.value || null 
            }))}
          >
            <MenuItem value="">None</MenuItem>
            {columnDefs.columnDefs
              .filter((colDef: any) => colDef.filter !== false)
              .map((colDef: any) => (
                <MenuItem key={colDef.field} value={colDef.field}>
                  {colDef.headerName || colDef.field}
                </MenuItem>
              ))
            }
          </Select>
        </FormControl>
        
        {filterState.columnId && (
          <>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterState.type}
                label="Type"
                onChange={(e) => setFilterState(prev => ({ 
                  ...prev, 
                  type: e.target.value as FilterType 
                }))}
              >
                <MenuItem value="contains">Contains</MenuItem>
                <MenuItem value="startsWith">Starts With</MenuItem>
                <MenuItem value="endsWith">Ends With</MenuItem>
                <MenuItem value="equals">Equals</MenuItem>
                <MenuItem value="notEqual">Not Equal</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              inputRef={filterValueRef}
              size="small"
              label="Filter Value"
              value={filterState.value}
              onChange={(e) => setFilterState(prev => ({ 
                ...prev, 
                value: e.target.value 
              }))}
              sx={{ minWidth: 150 }}
            />
            
            <IconButton
              size="small"
              onClick={() => setFilterState({ columnId: null, type: 'contains', value: '' })}
              title="Clear Filter"
            >
              <ClearIcon />
            </IconButton>
          </>
        )}
      </Box>
      
      <DataEditor
        columns={glideColumns}
        rows={sortedAndFilteredTableRows.length}
        getCellContent={getCellContent}
        onCellClicked={handleCellClicked}
        onCellEdited={handleCellEdited}
        onHeaderClicked={handleHeaderClick}
        customRenderers={[glideToolsCellRenderer]}
        smoothScrollX={true}
        smoothScrollY={true}
        isDraggable={false}
        rangeSelect="none"
        columnSelect="none"
        rowSelect="none"
        width={containerWidth}
        keybindings={{
          selectAll: false,
          selectRow: false,
          selectColumn: false,
        }}
        theme={{
          accentColor: "#1976d2",
          accentFg: "#ffffff",
          accentLight: "rgba(25, 118, 210, 0.1)",
          textDark: "#1a1a1a",        // Much darker text
          textMedium: "#333333",      // Darker medium text
          textLight: "#666666",       // Darker light text
          textBubble: "#1a1a1a",      // Darker bubble text
          bgIconHeader: "#444444",    // Darker icon header background
          fgIconHeader: "#ffffff",
          textHeader: "#1a1a1a",      // Darker header text
          textHeaderSelected: "#000000",
          bgCell: "#ffffff",
          bgCellMedium: "#f8f8f8",    // Slightly darker cell background
          bgHeader: "#f0f0f0",        // Slightly darker header background
          bgHeaderHasFocus: "#e0e0e0", // Darker focused header
          bgHeaderHovered: "#e8e8e8",  // Darker hovered header
          bgBubble: "#ffffff",
          bgBubbleSelected: "#ffffff",
          bgSearchResult: "#fff9c4",
          borderColor: "rgba(0, 0, 0, 0.2)",     // Darker borders
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
