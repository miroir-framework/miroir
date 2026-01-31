import {
  CellClickedEventArgs,
  DataEditor,
  EditableGridCell,
  GridCell,
  GridCellKind,
  GridColumn,
  Item
} from '@glideapps/glide-data-grid';
import "@glideapps/glide-data-grid/dist/index.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import GlideDataGridFilterComponent from './GlideDataGridFilterComponent.js';

import {
  EntityDefinition,
  LoggerInterface,
  MiroirLoggerFactory
} from "miroir-core";

import { packageName } from '../../../../constants.js';
import { ColumnWidthSpec, ToolsColumnDefinition } from '../../adaptiveColumnWidths.js';
import { cleanLevel } from '../../constants.js';
import {
  TableComponentRow
} from "./EntityInstanceGridInterface.js";
import glideToolsCellRenderer, { ToolsCell, ToolsCellData } from './GlideToolsCellRenderer.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "GlideDataGridComponent"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ##############################################################################################
const maxHeight = 500;

// ##############################################################################################
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
  // calculatedColumnWidths?: ColumnWidthSpec[];
  containerWidth?: number; // Container width from parent EntityInstanceGrid
  containerHeight?: number; // Container width from parent EntityInstanceGrid
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
  // calculatedColumnWidths,
  containerWidth: propContainerWidth,
  containerHeight: propContainerHeight,
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
  const [internalContainerWidth, setInternalContainerWidth] = React.useState(1200);
  const [internalContainerHeight, setInternalContainerHeight] = React.useState(900);
  
  // Use provided containerWidth from parent or fall back to internal measurement
  const containerWidth = propContainerWidth || internalContainerWidth;
  const containerHeight = propContainerHeight || internalContainerHeight;
  
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

  // ##############################################################################################
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

  // ##############################################################################################
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

  // ##############################################################################################
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

  // ##############################################################################################
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

  // ##############################################################################################
  const updateColumnGroupLogic = useCallback((columnId: string, logic: FilterLogic) => {
    setFilterState(prev => ({
      ...prev,
      columnGroups: prev.columnGroups.map(group => 
        group.columnId === columnId ? { ...group, logic } : group
      )
    }));
  }, []);

  // ##############################################################################################
  const removeColumnGroup = useCallback((columnId: string) => {
    setFilterState(prev => ({
      ...prev,
      columnGroups: prev.columnGroups.filter(group => group.columnId !== columnId)
    }));
  }, []);

  // ##############################################################################################
  const clearAllFilters = useCallback(() => {
    setFilterState({ columnGroups: [], globalLogic: 'AND' });
    setSelectedColumnId(null);
  }, []);

  // ##############################################################################################
  // Auto-add first condition when column is selected
  useEffect(() => {
    if (selectedColumnId) {
      const existingGroup = filterState.columnGroups.find(group => group.columnId === selectedColumnId);
      if (!existingGroup || existingGroup.conditions.length === 0) {
        addFilterCondition(selectedColumnId);
      }
    }
  }, [selectedColumnId, addFilterCondition, filterState.columnGroups]);

  // Monitor container width changes (only if containerWidth not provided from parent)
  useEffect(() => {
    if (propContainerWidth && propContainerHeight) {
      // Skip internal width measurement if parent provides width OR we have pre-calculated widths
      return;
    }

    const updateDimensions = () => {
      if (containerRef.current) {
        if (!propContainerWidth) {
          setInternalContainerWidth(containerRef.current.clientWidth);
        }
        if (!propContainerHeight) {
          setInternalContainerHeight(containerRef.current.clientHeight);
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [propContainerWidth, propContainerHeight]);

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

  // ##############################################################################################
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

  // ##############################################################################################
  // Calculate height based on data
  const height = useMemo(() => {
    const rowCount = sortedAndFilteredTableRows.length;
    if (rowCount > 50) {
      return Math.min(window.innerHeight * 0.5, propContainerHeight??maxHeight); // 50vh but max 600px
    } else {
      // Calculate exact height to prevent extra empty rows
      const headerHeight = 36; // Grid header height
      const rowHeight = 34; // Height per row
      
      const calculatedHeight = rowCount * rowHeight + headerHeight;
      
      // Log the calculation for debugging
      log.info("GlideDataGrid height calculation", {
        rowCount,
        rowHeight,
        headerHeight,
        // filterToolbarHeight,
        filterGroupsCount: filterState.columnGroups.length,
        totalCalculatedHeight: calculatedHeight
      });
      
      // Apply reasonable bounds but prioritize exact calculation for small datasets
      return Math.min(calculatedHeight, propContainerHeight??maxHeight);
    }
  }, [sortedAndFilteredTableRows.length, filterState.columnGroups]);

  // ##############################################################################################
  // Convert columnDefs to Glide format
  const glideColumns: GridColumn[] = useMemo(() => {
    let widthSpecs: ColumnWidthSpec[];

    // if (calculatedColumnWidths && calculatedColumnWidths.length > 0) {
    //   // Use pre-calculated widths from EntityInstanceGrid
    //   widthSpecs = calculatedColumnWidths;
    // } else {
      // Defensive fallback: This should now rarely happen since EntityInstanceGrid always calculates widths
      console.warn("GlideDataGridComponent: No calculated column widths provided, using simple fallback");
      
      const equalDistributionColumnWidth = Math.floor((containerWidth - toolsColumnDefinition.width) / columnDefs.columnDefs.length);
      widthSpecs = [
        // Tools column
        {
          field: toolsColumnDefinition.field || "",
          headerName: toolsColumnDefinition.headerName,
          minWidth: toolsColumnDefinition.width,
          maxWidth: toolsColumnDefinition.width,
          calculatedWidth: toolsColumnDefinition.width,
          type: "tools" as const
        },
        // Data columns with equal distribution
        ...columnDefs.columnDefs.map((colDef: any) => {
          return {
            field: colDef.field || "",
            headerName: colDef.headerName || colDef.field,
            minWidth: 100,
            maxWidth: 300,
            // calculatedWidth: 150, // Simple fallback width
            calculatedWidth: equalDistributionColumnWidth,
            type: "text" as const,
          };})
      ];
    // }

    // Debug logging for width distribution
    // const finalTotalWidth = widthSpecs.reduce((sum, spec) => sum + spec.calculatedWidth, 0);
    // log.info("GlideDataGrid column width distribution", {
    //   containerWidth,
    //   finalTotalWidth,
    //   // usingPreCalculatedWidths: calculatedColumnWidths && calculatedColumnWidths.length > 0,
    //   columnWidths: widthSpecs.map((spec) => ({
    //     field: spec.field || "tools",
    //     type: spec.type,
    //     // width: Math.round(spec.calculatedWidth),
    //   })),
    // });

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
    toolsColumnDefinition,
    sortState,
    filterState,
    containerWidth,
  ]);

  // Memoized handlers for tools cell actions - these are stable references
  // that can be safely used in getCellContent without causing re-renders
  const handleToolsEdit = useCallback((row: TableComponentRow, event?: any) => {
    log.info("GlideDataGrid: Edit button clicked", { row, event });
    if (onRowEdit) {
      onRowEdit(row, event);
    }
  }, [onRowEdit]);

  const handleToolsDuplicate = useCallback((row: TableComponentRow, event?: any) => {
    log.info("GlideDataGrid: Duplicate button clicked", { row, event });
    if (onRowDuplicate) {
      onRowDuplicate(row, event);
    }
  }, [onRowDuplicate]);

  const handleToolsDelete = useCallback((row: TableComponentRow, event?: any) => {
    log.info("GlideDataGrid: Delete button clicked", { row, event });
    if (onRowDelete) {
      onRowDelete(row, event);
    }
  }, [onRowDelete]);

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
        // Use the memoized handlers instead of creating new functions each time
        const toolsCellData = {
          kind: "tools-cell",
          row: rowData,
          onEdit: handleToolsEdit,
          onDuplicate: handleToolsDuplicate,
          onDelete: handleToolsDelete,
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
    [
      sortedAndFilteredTableRows,
      glideColumns,
      columnDefs,
      handleToolsEdit,
      handleToolsDuplicate,
      handleToolsDelete,
      toolsColumnDefinition,
    ],
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

  // Memoize the fallback theme for DataEditor to prevent unnecessary re-renders
  const dataEditorTheme = useMemo(() => {
    if (glideTheme) return glideTheme;
    
    return {
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
      headerFontStyle: `${theme?.components?.header?.fontWeight || 600} ${
        theme?.components?.header?.fontSize || "13px"
      }`,
      baseFontStyle: theme?.typography?.fontSize || "13px",
      fontFamily:
        theme?.typography?.fontFamily ||
        "Inter, Roboto, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, noto, arial, sans-serif",
    };
  }, [glideTheme, theme]);

  return (
    <div
      className="glide-data-grid-container"
      // style={{
      //   ...styles,
      //   display: "flex",
      //   flexDirection: "column",
      //   flexGrow: 1,
      //   position: "relative",
      //   overflow: "hidden",
      //   boxSizing: "border-box",
      //   border: theme?.components?.table?.border || "1px solid #e0e0e0",
      //   borderRadius: theme?.components?.table?.borderRadius || "4px",
      //   fontFamily: theme?.typography?.fontFamily || "inherit",
      //   fontSize: theme?.typography?.fontSize || "14px",
      // }}
    >
      {/* const containerWidth = propContainerWidth || internalContainerWidth; */}
      {/* Filter Toolbar */}
      <GlideDataGridFilterComponent
        columnDefs={columnDefs}
        filterState={filterState}
        selectedColumnId={selectedColumnId}
        setSelectedColumnId={setSelectedColumnId}
        addFilterCondition={addFilterCondition}
        updateColumnGroupLogic={updateColumnGroupLogic}
        removeColumnGroup={removeColumnGroup}
        updateFilterCondition={updateFilterCondition}
        removeFilterCondition={removeFilterCondition}
        clearAllFilters={clearAllFilters}
        filterValueRef={filterValueRef}
        theme={theme}
      />

      {/* <div
        style={
          {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            // width: calculatedColumnWidths && calculatedColumnWidths.length > 0
            //   ? `${Math.max(Math.round(calculatedColumnWidths.reduce((sum, spec) => sum + spec.calculatedWidth, 0)), 300)}px`
            //   : '100%',
            // height: `${height - 2}px`, // Subtract 2px for borders
            // maxWidth: calculatedColumnWidths && calculatedColumnWidths.length > 0
            //   ? `${Math.max(Math.round(calculatedColumnWidths.reduce((sum, spec) => sum + spec.calculatedWidth, 0)), 300)}px`
            //   : '100%',
            // overflow: 'hidden',
            // position: 'relative',
          }
        }
      > */}
      <div
        ref={containerRef} // Container ref for width / height measurement
        className="glide-data-grid-grid-container"
        style={{
          ...styles,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          border: theme?.components?.table?.border || "1px solid #e0e0e0",
          borderRadius: theme?.components?.table?.borderRadius || "4px",
          fontFamily: theme?.typography?.fontFamily || "inherit",
          fontSize: theme?.typography?.fontSize || "14px",
        }}
        // class: "glide-data-grid-container",
        // display: "flex",
        // flexDirection: "column",
        // flexGrow: 1,
        // position: "relative",
        // overflow: "hidden",
        // boxSizing: "border-box",
      >
        <DataEditor
          columns={glideColumns}
          width="100%"
          // height="400px"
          // height="100%"
          // height={height || propContainerHeight || Math.max(Math.min(sortedAndFilteredTableRows.length, maxRows || 50) * 34 + 36, 100)} // DataEditor height = visible rows + header only
          height={height} // DataEditor height = visible rows + header only
          rows={sortedAndFilteredTableRows.length}
          getCellContent={getCellContent}
          onCellClicked={handleCellClicked}
          onCellEdited={handleCellEdited}
          onHeaderClicked={handleHeaderClick}
          customRenderers={[glideToolsCellRenderer]}
          isDraggable={false}
          rangeSelect="none"
          columnSelect="none"
          rowSelect="none"
          keybindings={{
            selectAll: false,
            selectRow: false,
            selectColumn: false,
          }}
          theme={dataEditorTheme}
        />
      </div>
    </div>
    // </div>
  );
};
