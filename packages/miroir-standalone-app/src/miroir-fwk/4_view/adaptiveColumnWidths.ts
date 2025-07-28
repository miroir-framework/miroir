import { JzodElement } from "miroir-core";
import { TableComponentRow } from "./components/MTableComponentInterface.js";

export interface ColumnWidthSpec {
  field: string;
  headerName?: string;
  minWidth: number;
  maxWidth: number;
  calculatedWidth: number;
  type: 'tools' | 'uuid' | 'name' | 'foreignKey' | 'text' | 'number' | 'boolean' | 'date' | 'object';
}

export interface ToolsColumnDefinition {
  field: string;
  headerName: string;
  width: number;
}

// ################################################################################################
/**
 * Calculate adaptive column widths based on content, column type, and available space
 */
export function calculateAdaptiveColumnWidths(
  columnDefs: any[],
  rowData: TableComponentRow[],
  availableWidth: number = 1200,
  toolsColumnDef: ToolsColumnDefinition,
  jzodSchema?: Record<string, JzodElement>,
): ColumnWidthSpec[] {
  const CHAR_WIDTH = 8; // Average character width in pixels
  const MIN_COLUMN_WIDTH = 80;
  const MAX_COLUMN_WIDTH = 400;
  const PADDING = 16; // Column padding
  
  // Ensure we have a minimum reasonable available width
  const safeAvailableWidth = Math.max(availableWidth, 300);
  
  // // Use provided tools column definition or default
  // const defaultToolsColumnDef: ToolsColumnDefinition = {
  //   field: '',
  //   headerName: 'Actions',
  //   width: 120
  // };
  // const toolsColumn = toolsColumnDef || defaultToolsColumnDef;
  
  // Add tools column if not present
  const allColumns = [
    { field: toolsColumnDef.field, headerName: toolsColumnDef.headerName, type: "tools" as const },
    ...columnDefs.filter((cd) => cd.field && cd.field !== "tools" && cd.field !== ""),
  ];

  const columnSpecs: ColumnWidthSpec[] = allColumns.map(colDef => {
    const field = colDef.field || '';
    const headerName = colDef.headerName || field;
    const fieldSchema = jzodSchema?.[field];
    
    // Determine column type
    let type: ColumnWidthSpec['type'] = 'text';
    if (field === '' || field === 'tools') {
      type = 'tools';
    } else if (field === 'uuid') {
      type = 'uuid';
    } else if (field === 'name') {
      type = 'name';
    } else if (colDef.cellRendererParams?.isFK || fieldSchema?.tag?.value?.targetEntity) {
      type = 'foreignKey';
    } else if (fieldSchema) {
      switch (fieldSchema.type) {
        case 'number':
        case 'bigint':
          type = 'number';
          break;
        case 'boolean':
          type = 'boolean';
          break;
        case 'date':
          type = 'date';
          break;
        case 'object':
        case 'array':
          type = 'object';
          break;
        default:
          type = 'text';
      }
    }

    // Set base widths by type
    let minWidth = MIN_COLUMN_WIDTH;
    let maxWidth = MAX_COLUMN_WIDTH;
    let baseWidth = 120;

    switch (type) {
      case 'tools':
        return {
          field,
          headerName,
          minWidth: toolsColumnDef.width,
          maxWidth: toolsColumnDef.width,
          calculatedWidth: toolsColumnDef.width,
          type
        };
      case 'uuid':
        minWidth = 120;
        maxWidth = 180;
        baseWidth = 150;
        break;
      case 'name':
        minWidth = 100;
        maxWidth = 250;
        baseWidth = 150;
        break;
      case 'foreignKey':
        minWidth = 100;
        maxWidth = 200;
        baseWidth = 140;
        break;
      case 'boolean':
        minWidth = 80;
        maxWidth = 100;
        baseWidth = 80;
        break;
      case 'number':
        minWidth = 80;
        maxWidth = 120;
        baseWidth = 100;
        break;
      case 'date':
        minWidth = 120;
        maxWidth = 160;
        baseWidth = 140;
        break;
      case 'object':
        minWidth = 150;
        maxWidth = 300;
        baseWidth = 200;
        break;
      default: // text
        minWidth = 100;
        maxWidth = 300;
        baseWidth = 150;
    }

    // Calculate content-based width
    const headerWidth = headerName.length * CHAR_WIDTH + PADDING;
    let maxContentWidth = headerWidth;

    // Sample up to 50 rows to estimate content width
    const sampleSize = Math.min(rowData.length, 50);
    for (let i = 0; i < sampleSize; i++) {
      const row = rowData[i];
      let cellValue = '';
      
      if (type === 'foreignKey' && row.foreignKeyObjects) {
        // For foreign keys, use the display name
        const entityUuid = colDef.cellRendererParams?.entityUuid;
        const foreignKeyUuid = (row.rawValue as any)[field];
        const referencedInstance = entityUuid && foreignKeyUuid ? 
          row.foreignKeyObjects[entityUuid]?.[foreignKeyUuid] : null;
        cellValue = (referencedInstance as any)?.name || foreignKeyUuid || '';
      } else {
        // For regular columns
        cellValue = row.displayedValue[field] || (row.rawValue as any)[field] || '';
      }
      
      if (typeof cellValue === 'object') {
        cellValue = JSON.stringify(cellValue);
      } else {
        cellValue = String(cellValue);
      }
      
      const contentWidth = cellValue.length * CHAR_WIDTH + PADDING;
      maxContentWidth = Math.max(maxContentWidth, contentWidth);
    }

    // Calculate final width
    const contentBasedWidth = Math.max(baseWidth, maxContentWidth);
    const calculatedWidth = Math.min(Math.max(contentBasedWidth, minWidth), maxWidth);

    return {
      field,
      headerName,
      minWidth,
      maxWidth,
      calculatedWidth,
      type
    };
  });

  // Adjust widths to fit available space exactly
  const totalCalculatedWidth = columnSpecs.reduce((sum, spec) => sum + spec.calculatedWidth, 0);
  const availableSpace = safeAvailableWidth; // Use the safe available width

  // Only apply scaling if the difference is significant to avoid micro-adjustments
  const widthDifference = Math.abs(totalCalculatedWidth - availableSpace);
  const targetWidthRatio = availableSpace / totalCalculatedWidth;
  
  // Only scale if the ratio is reasonable and the difference is significant
  if (widthDifference > 20 && targetWidthRatio > 0.3 && targetWidthRatio < 3.0) {
    // Apply proportional scaling to all columns except tools column
    columnSpecs.forEach(spec => {
      if (spec.type !== 'tools') {
        const scaledWidth = spec.calculatedWidth * targetWidthRatio;
        // Ensure the scaled width stays within reasonable bounds
        spec.calculatedWidth = Math.max(Math.min(scaledWidth, spec.maxWidth), spec.minWidth);
      }
    });
  }

  // Final verification and adjustment to ensure reasonable width distribution
  const finalTotalWidth = columnSpecs.reduce((sum, spec) => sum + spec.calculatedWidth, 0);
  const finalDifference = availableSpace - finalTotalWidth;
  
  // Only apply final adjustment if the difference is significant
  if (Math.abs(finalDifference) > 5) {
    // Apply the remaining difference to the largest non-tools column
    const flexibleColumns = columnSpecs.filter(spec => spec.type !== 'tools');
    if (flexibleColumns.length > 0) {
      const largestColumn = flexibleColumns.reduce((largest, current) => 
        current.calculatedWidth > largest.calculatedWidth ? current : largest
      );
      const adjustedWidth = largestColumn.calculatedWidth + finalDifference;
      largestColumn.calculatedWidth = Math.max(Math.min(adjustedWidth, largestColumn.maxWidth), largestColumn.minWidth);
    }
  }

  // Ensure no column is smaller than an absolute minimum
  columnSpecs.forEach(spec => {
    spec.calculatedWidth = Math.max(spec.calculatedWidth, 50); // Absolute minimum for usability
  });

  return columnSpecs;
}
