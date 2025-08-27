import * as Diff from "diff";
import React from 'react';

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";

// Helper function for formatting values in tooltips and diffs
export const formatValue = (value: any): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "bigint") return `${value}n`;
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return `[${typeof value}: unable to serialize]`;
  }
};

// Themed component for side-by-side diff display with syntax highlighting
export const SideBySideDiff: React.FC<{ expected: any; actual: any; assertionName: string }> = ({ 
  expected, 
  actual, 
  assertionName 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const expectedFormatted = formatValue(expected);
  const actualFormatted = formatValue(actual);
  
  // Generate character-level diff
  const diff = Diff.diffChars(expectedFormatted, actualFormatted);
  
  // Helper function to render diff parts with highlighting
  const renderDiffContent = (side: 'expected' | 'actual') => {
    return diff.map((part, index) => {
      const isAdded = part.added;
      const isRemoved = part.removed;
      const isUnchanged = !isAdded && !isRemoved;
      
      // Skip parts that don't belong to this side
      if (side === 'expected' && isAdded) return null;
      if (side === 'actual' && isRemoved) return null;
      
      let backgroundColor = 'transparent';
      let textColor = currentTheme.colors.text;
      
      if (isUnchanged) {
        backgroundColor = 'transparent';
      } else if (side === 'expected' && isRemoved) {
        backgroundColor = currentTheme.colors.error + '20' || '#ffebee';
        textColor = currentTheme.colors.error || '#c62828';
      } else if (side === 'actual' && isAdded) {
        backgroundColor = currentTheme.colors.success + '20' || '#e8f5e8';
        textColor = currentTheme.colors.success || '#2e7d32';
      }
      
      return (
        <span
          key={index}
          style={{
            backgroundColor,
            color: textColor,
            textDecoration: (side === 'expected' && isRemoved) ? 'line-through' : 'none',
            fontWeight: (!isUnchanged) ? 'bold' : 'normal',
          }}
        >
          {part.value}
        </span>
      );
    }).filter(Boolean);
  };
  
  const containerStyles: React.CSSProperties = {
    marginBottom: currentTheme.spacing.lg,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: currentTheme.colors.surface,
  };
  
  const headerStyles: React.CSSProperties = {
    fontWeight: 'bold',
    marginBottom: currentTheme.spacing.sm,
    padding: currentTheme.spacing.md,
    color: currentTheme.colors.error || '#d32f2f',
    fontSize: '14px',
    backgroundColor: currentTheme.colors.errorLight || '#ffebee',
    borderBottom: `1px solid ${currentTheme.colors.border}`,
  };
  
  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0, // No gap for seamless diff display
  };
  
  const columnHeaderStyles = (type: 'expected' | 'actual'): React.CSSProperties => ({
    padding: currentTheme.spacing.sm,
    fontWeight: 'bold',
    fontSize: '12px',
    borderBottom: `1px solid ${currentTheme.colors.border}`,
    backgroundColor: type === 'expected' 
      ? currentTheme.colors.errorLight || '#ffebee'
      : currentTheme.colors.successLight || '#e8f5e8',
    color: type === 'expected'
      ? currentTheme.colors.error || '#c62828'
      : currentTheme.colors.success || '#2e7d32',
  });
  
  const contentStyles: React.CSSProperties = {
    padding: currentTheme.spacing.sm,
    fontSize: '11px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
    maxHeight: '300px',
    overflow: 'auto',
    backgroundColor: currentTheme.colors.background,
  };
  
  const columnStyles = (type: 'expected' | 'actual'): React.CSSProperties => ({
    borderRight: type === 'expected' ? `1px solid ${currentTheme.colors.border}` : 'none',
    backgroundColor: type === 'expected' 
      ? currentTheme.colors.errorSurface || '#fff5f5'
      : currentTheme.colors.successSurface || '#f9fff9',
  });
  
  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        ❌ {assertionName}: FAIL
      </div>
      
      <div style={gridStyles}>
        {/* Expected column */}
        <div style={columnStyles('expected')}>
          <div style={columnHeaderStyles('expected')}>
            Expected
          </div>
          <div style={contentStyles}>
            {renderDiffContent('expected')}
          </div>
        </div>
        
        {/* Actual column */}
        <div style={columnStyles('actual')}>
          <div style={columnHeaderStyles('actual')}>
            Actual
          </div>
          <div style={contentStyles}>
            {renderDiffContent('actual')}
          </div>
        </div>
      </div>
    </div>
  );
};
