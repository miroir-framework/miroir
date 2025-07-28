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
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";

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

type FilterType = 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEqual' | 'notContains' | 'notStartsWith' | 'notEndsWith';
type FilterLogic = 'AND' | 'OR';

interface FilterCondition {
  id: string;
  columnId: string;
  type: FilterType;
  value: string;
}

interface ColumnFilterGroup {
  columnId: string;
  conditions: FilterCondition[];
  logic: FilterLogic; // AND/OR logic for conditions within this column
}

interface FilterState {
  columnGroups: ColumnFilterGroup[];
  globalLogic: FilterLogic; // AND/OR logic between different columns
}

interface GlideDataGridComponentProps {
  tableComponentRows: { tableComponentRowUuidIndexSchema: TableComponentRow[] };
  columnDefs: { columnDefs: any[] };
  styles?: any;
  type: string;
  currentEntityDefinition?: EntityDefinition;
  calculatedColumnWidths?: ColumnWidthSpec[];
  toolsColumnDefinition: ToolsColumnDefinition;
  maxRows?: number; // Maximum number of rows to show (controls table height)
  theme?: any; // Table theme for unified styling
  glideTheme?: any; // Glide-specific theme object
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
  maxRows,
  theme,
  glideTheme,
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
  const [filterState, setFilterState] = useState<FilterState>({ 
    columnGroups: [],
    globalLogic: 'AND' 
  });
  
  // Currently selected column for adding new filters
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  
  // Ref for the filter value input to enable focus
  const filterValueRef = useRef<HTMLInputElement>(null);

  // Focus the filter value input when a column is selected or condition is added
  useEffect(() => {
    const hasConditions = filterState.columnGroups.some(group => group.conditions.length > 0);
    if (selectedColumnId && filterValueRef.current && hasConditions) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        filterValueRef.current?.focus();
      }, 100);
    }
  }, [selectedColumnId, filterState.columnGroups.length]);

  // Helper functions for managing filter conditions
  const generateFilterId = () => Math.random().toString(36).substr(2, 9);

  const addFilterCondition = useCallback((columnId: string) => {
    const newCondition: FilterCondition = {
      id: generateFilterId(),
      columnId,
      type: 'contains',
      value: ''
    };

    setFilterState(prev => {
      const existingGroupIndex = prev.columnGroups.findIndex(group => group.columnId === columnId);
      
      if (existingGroupIndex >= 0) {
        // Add to existing column group
        const updatedGroups = [...prev.columnGroups];
        updatedGroups[existingGroupIndex] = {
          ...updatedGroups[existingGroupIndex],
          conditions: [...updatedGroups[existingGroupIndex].conditions, newCondition]
        };
        return { ...prev, columnGroups: updatedGroups };
      } else {
        // Create new column group
        const newGroup: ColumnFilterGroup = {
          columnId,
          conditions: [newCondition],
          logic: 'AND'
        };
        return { ...prev, columnGroups: [...prev.columnGroups, newGroup] };
      }
    });
  }, []);

  const updateFilterCondition = useCallback((conditionId: string, updates: Partial<FilterCondition>) => {
    setFilterState(prev => ({
      ...prev,
      columnGroups: prev.columnGroups.map(group => ({
        ...group,
        conditions: group.conditions.map(condition => 
          condition.id === conditionId ? { ...condition, ...updates } : condition
        )
      }))
    }));
  }, []);

  const removeFilterCondition = useCallback((conditionId: string) => {
    setFilterState(prev => ({
      ...prev,
      columnGroups: prev.columnGroups
        .map(group => ({
          ...group,
          conditions: group.conditions.filter(condition => condition.id !== conditionId)
        }))
        .filter(group => group.conditions.length > 0) // Remove empty groups
    }));
  }, []);

  const updateColumnGroupLogic = useCallback((columnId: string, logic: FilterLogic) => {
    setFilterState(prev => ({
      ...prev,
      columnGroups: prev.columnGroups.map(group => 
        group.columnId === columnId ? { ...group, logic } : group
      )
    }));
  }, []);

  const removeColumnGroup = useCallback((columnId: string) => {
    setFilterState(prev => ({
      ...prev,
      columnGroups: prev.columnGroups.filter(group => group.columnId !== columnId)
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterState({ columnGroups: [], globalLogic: 'AND' });
    setSelectedColumnId(null);
  }, []);

  // Auto-add first condition when column is selected
  useEffect(() => {
    if (selectedColumnId) {
      const existingGroup = filterState.columnGroups.find(group => group.columnId === selectedColumnId);
      if (!existingGroup || existingGroup.conditions.length === 0) {
        addFilterCondition(selectedColumnId);
      }
    }
  }, [selectedColumnId, addFilterCondition, filterState.columnGroups]);

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
    if (filterState.columnGroups.length > 0) {
      filteredRows = filteredRows.filter((row) => {
        // Evaluate each column group
        const columnGroupResults = filterState.columnGroups.map(group => {
          const cellValue = getFilterValue(row, group.columnId);
          const cellStr = cellValue.toLowerCase();

          // Evaluate each condition within this column group
          const conditionResults = group.conditions.map(condition => {
            if (!condition.value.trim()) return true; // Empty conditions are ignored
            
            const searchValue = condition.value.toLowerCase();
            
            switch (condition.type) {
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
              case 'notContains':
                return !cellStr.includes(searchValue);
              case 'notStartsWith':
                return !cellStr.startsWith(searchValue);
              case 'notEndsWith':
                return !cellStr.endsWith(searchValue);
              default:
                return true;
            }
          });

          // Apply AND/OR logic within this column group
          if (group.logic === 'AND') {
            return conditionResults.every(result => result);
          } else {
            return conditionResults.some(result => result);
          }
        });

        // Apply global AND/OR logic between column groups
        if (filterState.globalLogic === 'AND') {
          return columnGroupResults.every(result => result);
        } else {
          return columnGroupResults.some(result => result);
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
      // Calculate exact height to prevent extra empty rows
      const headerHeight = 36; // Grid header height
      const rowHeight = 34; // Height per row
      
      // Calculate filter toolbar height more precisely
      const filterPadding = 16; // 2 * 8px (padding: 1 in MUI theme)
      const filterBorderBottom = 1; // Border bottom
      const mainControlsRowHeight = 40; // Height of select controls (size="small")
      const mainControlsMarginBottom = 8; // mb: 1 in MUI theme
      
      // Calculate dynamic height based on number of active filter groups
      const columnGroupsHeight = filterState.columnGroups.length > 0 
        ? filterState.columnGroups.reduce((total, group) => {
            const groupBaseHeight = 60; // Base height for column group container
            const conditionsHeight = group.conditions.length * 50; // Each condition row
            return total + groupBaseHeight + conditionsHeight;
          }, 0)
        : 24; // "Select a column above to start filtering" text height
      
      const filterToolbarHeight = filterPadding + filterBorderBottom + mainControlsRowHeight + 
                                  mainControlsMarginBottom + columnGroupsHeight;
      
      const calculatedHeight = rowCount * rowHeight + headerHeight + filterToolbarHeight;
      
      // Log the calculation for debugging
      log.info("GlideDataGrid height calculation", {
        rowCount,
        rowHeight,
        headerHeight,
        filterToolbarHeight,
        filterGroupsCount: filterState.columnGroups.length,
        totalCalculatedHeight: calculatedHeight
      });
      
      // Apply reasonable bounds but prioritize exact calculation for small datasets
      return Math.min(calculatedHeight, 600);
    }
  }, [sortedAndFilteredTableRows.length, filterState.columnGroups]);

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
        const columnGroup = filterState.columnGroups.find(group => group.columnId === colDef.field);
        if (columnGroup && columnGroup.conditions.length > 0) {
          const activeConditions = columnGroup.conditions.filter(c => c.value.trim());
          if (activeConditions.length > 0) {
            title = title + ` 🔍${activeConditions.length > 1 ? `(${activeConditions.length})` : ''}`;
          }
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
        maxWidth: '100%',
        border: theme?.components?.table?.border || '1px solid #e0e0e0',
        borderRadius: theme?.components?.table?.borderRadius || '4px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: theme?.typography?.fontFamily || 'inherit',
        fontSize: theme?.typography?.fontSize || '14px',
      }}
    >
      {/* Filter Toolbar */}
      <Box sx={{ 
        padding: 1, 
        borderBottom: `1px solid ${theme?.colors?.border || '#e0e0e0'}`,
        backgroundColor: theme?.components?.toolbar?.background || '#f8f8f8',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Main Controls Row */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          alignItems: 'center', 
          mb: 1,
          flexWrap: 'wrap', // Allow wrapping on small screens
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Add Filter Column</InputLabel>
            <Select
              value={selectedColumnId || ''}
              label="Add Filter Column"
              onChange={(e) => {
                const newColumnId = e.target.value || null;
                setSelectedColumnId(newColumnId);
              }}
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
          
          {filterState.columnGroups.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Between Columns</InputLabel>
              <Select
                value={filterState.globalLogic}
                label="Between Columns"
                onChange={(e) => setFilterState(prev => ({ 
                  ...prev, 
                  globalLogic: e.target.value as FilterLogic 
                }))}
              >
                <MenuItem value="AND">AND</MenuItem>
                <MenuItem value="OR">OR</MenuItem>
              </Select>
            </FormControl>
          )}
          
          {filterState.columnGroups.length > 0 && (
            <IconButton
              size="small"
              onClick={clearAllFilters}
              title="Clear All Filters"
            >
              <ClearIcon />
            </IconButton>
          )}
        </Box>

        {/* Column Filter Groups */}
        {filterState.columnGroups.length === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select a column above to start filtering
            </Typography>
          </Box>
        )}
        
        {filterState.columnGroups.map((group, groupIndex) => (
          <Box key={group.columnId} sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            padding: 1, 
            mb: 1,
            backgroundColor: theme?.colors?.background || '#ffffff',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}>
            {/* Column Group Header */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center', 
              mb: 1,
              flexWrap: 'wrap', // Allow wrapping on small screens
              width: '100%',
              maxWidth: '100%',
            }}>
              {groupIndex > 0 && (
                <Typography variant="body2" sx={{ 
                  minWidth: 60, 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  backgroundColor: 'primary.light',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5
                }}>
                  {filterState.globalLogic}
                </Typography>
              )}
              
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                {columnDefs.columnDefs.find((col: any) => col.field === group.columnId)?.headerName || group.columnId}
              </Typography>
              
              {group.conditions.length > 1 && (
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>Logic</InputLabel>
                  <Select
                    value={group.logic}
                    label="Logic"
                    onChange={(e) => updateColumnGroupLogic(group.columnId, e.target.value as FilterLogic)}
                  >
                    <MenuItem value="AND">AND</MenuItem>
                    <MenuItem value="OR">OR</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <IconButton
                size="small"
                onClick={() => addFilterCondition(group.columnId)}
                title="Add Condition"
                color="primary"
              >
                <AddIcon />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={() => removeColumnGroup(group.columnId)}
                title="Remove Column Filter"
              >
                <ClearIcon />
              </IconButton>
            </Box>

            {/* Filter Conditions for this column */}
            {group.conditions.map((condition, conditionIndex) => (
              <Box key={condition.id} sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center', 
                mb: 1, 
                ml: groupIndex > 0 ? 8 : 0,
                flexWrap: 'wrap', // Allow wrapping on small screens
                width: '100%',
                maxWidth: '100%',
              }}>
                {conditionIndex > 0 && (
                  <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center', fontWeight: 'bold' }}>
                    {group.logic}
                  </Typography>
                )}
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={condition.type}
                    label="Type"
                    onChange={(e) => updateFilterCondition(condition.id, { type: e.target.value as FilterType })}
                  >
                    <MenuItem value="contains">Contains</MenuItem>
                    <MenuItem value="notContains">Not Contains</MenuItem>
                    <MenuItem value="startsWith">Starts With</MenuItem>
                    <MenuItem value="notStartsWith">Not Starts With</MenuItem>
                    <MenuItem value="endsWith">Ends With</MenuItem>
                    <MenuItem value="notEndsWith">Not Ends With</MenuItem>
                    <MenuItem value="equals">Equals</MenuItem>
                    <MenuItem value="notEqual">Not Equal</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  inputRef={
                    group.columnId === selectedColumnId && 
                    conditionIndex === group.conditions.length - 1 ? 
                    filterValueRef : undefined
                  }
                  size="small"
                  label="Filter Value"
                  value={condition.value}
                  onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                  sx={{ minWidth: 120, maxWidth: 200, flex: 1 }} // More responsive sizing
                />
                
                <IconButton
                  size="small"
                  onClick={() => removeFilterCondition(condition.id)}
                  title="Remove Condition"
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
      
      <div style={{ 
        width: '100%', 
        height: `${height - 2}px`, // Subtract 2px for borders
        maxWidth: '100%', 
        overflow: 'hidden',
        position: 'relative',
      }}>
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
          width={Math.max(containerWidth - 2, 300)} // Ensure minimum width but respect container
          height={Math.max(Math.min(sortedAndFilteredTableRows.length, maxRows || 50) * 34 + 36, 100)} // DataEditor height = visible rows + header only
          keybindings={{
            selectAll: false,
            selectRow: false,
            selectColumn: false,
          }}
        theme={glideTheme || {
          accentColor: theme?.colors?.primary || "#1976d2",
          accentFg: "#ffffff",
          accentLight: "rgba(25, 118, 210, 0.1)",
          textDark: theme?.colors?.text || "#1a1a1a",
          textMedium: theme?.colors?.textSecondary || "#333333",
          textLight: theme?.colors?.textSecondary || "#666666",
          textBubble: theme?.colors?.text || "#1a1a1a",
          bgIconHeader: "#444444",
          fgIconHeader: "#ffffff",
          textHeader: theme?.colors?.text || "#1a1a1a",
          textHeaderSelected: "#000000",
          bgCell: theme?.colors?.background || "#ffffff",
          bgCellMedium: theme?.colors?.surface || "#f8f8f8",
          bgHeader: theme?.components?.header?.background || "#f0f0f0",
          bgHeaderHasFocus: theme?.colors?.hover || "#e0e0e0",
          bgHeaderHovered: theme?.colors?.hover || "#e8e8e8",
          bgBubble: theme?.colors?.background || "#ffffff",
          bgBubbleSelected: theme?.colors?.background || "#ffffff",
          bgSearchResult: "#fff9c4",
          borderColor: theme?.colors?.border || "rgba(0, 0, 0, 0.2)",
          drilldownBorder: "rgba(0, 0, 0, 0)",
          linkColor: theme?.colors?.primary || "#1976d2",
          headerFontStyle: `${theme?.components?.header?.fontWeight || 600} ${theme?.components?.header?.fontSize || '13px'}`,
          baseFontStyle: theme?.typography?.fontSize || "13px",
          fontFamily: theme?.typography?.fontFamily || "Inter, Roboto, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, noto, arial, sans-serif",
        }}
      />
      </div>
    </div>
  );
};
