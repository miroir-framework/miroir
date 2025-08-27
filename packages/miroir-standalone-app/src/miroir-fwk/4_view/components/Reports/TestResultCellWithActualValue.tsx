import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { formatValue } from './SideBySideDiff.js';
import { DraggableContainer } from '../DraggableContainer.js';

// ################################################################################################
// Test Result Cell Component specifically for the Result column
// Shows hover tooltip with summary, but click opens a DraggableContainer with actual result
// ################################################################################################
export interface TestResultCellWithActualValueProps {
  value: string;
  testData: any;
  testName: string;
}

export const TestResultCellWithActualValue: React.FC<TestResultCellWithActualValueProps> = ({ 
  value, 
  testData, 
  testName 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showActualResultContainer, setShowActualResultContainer] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const cellRef = useRef<HTMLDivElement>(null);
  const { currentTheme } = useMiroirTheme();
  
  const formatDetailedTooltipContent = () => {
    if (!testData.fullAssertionsResults) return "No detailed assertion data available";
    
    const assertions = Object.entries(testData.fullAssertionsResults);
    if (assertions.length === 0) return "No assertions found";
    
    // Header with test info
    let content = `Test: ${testName}\n`;
    content += `Result: ${testData.testResult} ${testData.status}\n`;
    content += `Assertions: ${testData.assertionCount}\n`;
    content += `─`.repeat(40) + '\n\n';
    
    // Format all assertions with basic details for tooltip
    const assertionDetails = assertions.map(([assertionName, assertion]: [string, any]) => {
      const result = assertion.assertionResult === "ok" ? "✅ PASS" : "❌ FAIL";
      let details = `${assertionName}: ${result}`;
      
      if (assertion.assertionResult !== "ok") {
        details += `\n  Expected: ${formatValue(assertion.assertionExpectedValue)}`;
        details += `\n  Actual: ${formatValue(assertion.assertionActualValue)}`;
      }
      
      return details;
    }).join('\n\n');
    
    content += assertionDetails;
    content += '\n\n💡 Click to view actual result in draggable window';
    
    return content;
  };

  // Get the actual result from failed assertions
  const getActualResult = () => {
    if (!testData.fullAssertionsResults) return "No assertion data available";
    
    const assertions = Object.entries(testData.fullAssertionsResults);
    const failedAssertions = assertions.filter(([_, assertion]: [string, any]) => 
      assertion.assertionResult !== "ok"
    );
    
    if (failedAssertions.length === 0) {
      return "Test passed - no actual result to display";
    }
    
    // For now, show the first failed assertion's actual value
    // In a more complex scenario, you might want to show all failed assertions
    const [assertionName, assertion] = failedAssertions[0] as [string, any];
    
    return {
      assertionName,
      actualValue: assertion.assertionActualValue,
      expectedValue: assertion.assertionExpectedValue
    };
  };

  // Calculate tooltip position when showing
  const updateTooltipPosition = () => {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setTooltipPosition({
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop - 10, // 10px above the cell
      });
    }
  };

  const handleMouseEnter = () => {
    updateTooltipPosition();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(false);
    setShowActualResultContainer(true);
  };

  const handleCloseActualResult = () => {
    setShowActualResultContainer(false);
  };

  const cellStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.sm,
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    display: 'inline-block',
    backgroundColor: showTooltip 
      ? currentTheme.colors.primary + '20' 
      : showActualResultContainer 
        ? currentTheme.colors.warning + '20' 
        : 'transparent',
    border: showActualResultContainer 
      ? `2px solid ${currentTheme.colors.warning}` 
      : `1px solid transparent`,
    boxShadow: showActualResultContainer ? currentTheme.elevation.medium : 'none',
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${tooltipPosition.x}px`,
    top: `${tooltipPosition.y}px`,
    transform: 'translateX(-50%) translateY(-100%)',
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    padding: currentTheme.spacing.md,
    borderRadius: currentTheme.borderRadius.md,
    fontSize: '11px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    whiteSpace: 'pre-wrap',
    zIndex: 10000,
    minWidth: '400px',
    maxWidth: '800px',
    width: 'auto',
    height: 'auto',
    maxHeight: '70vh',
    overflow: 'auto',
    boxShadow: currentTheme.elevation.high,
    pointerEvents: 'none',
    opacity: showTooltip ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    lineHeight: '1.5',
    border: `1px solid ${currentTheme.colors.primary}`,
  };

  // Create tooltip portal
  const tooltipPortal = showTooltip && !showActualResultContainer ? createPortal(
    <div style={tooltipStyle}>
      {formatDetailedTooltipContent()}
    </div>,
    document.body
  ) : null;

  // Render the actual result content for the draggable container
  const renderActualResultContent = () => {
    const actualResult = getActualResult();
    
    if (typeof actualResult === 'string') {
      return (
        <div style={{ 
          padding: currentTheme.spacing.md,
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          {actualResult}
        </div>
      );
    }
    
    return (
      <div style={{ padding: currentTheme.spacing.md }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: currentTheme.spacing.sm,
          color: currentTheme.colors.primary
        }}>
          Actual Result for: {actualResult.assertionName}
        </div>
        
        <div style={{ 
          backgroundColor: currentTheme.colors.background,
          border: `1px solid ${currentTheme.colors.border}`,
          borderRadius: currentTheme.borderRadius.sm,
          padding: currentTheme.spacing.md,
          marginBottom: currentTheme.spacing.md
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: currentTheme.spacing.xs,
            color: currentTheme.colors.error || '#d32f2f'
          }}>
            Actual:
          </div>
          <pre style={{ 
            margin: 0,
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(actualResult.actualValue, null, 2)}
          </pre>
        </div>

        <div style={{ 
          backgroundColor: currentTheme.colors.background,
          border: `1px solid ${currentTheme.colors.border}`,
          borderRadius: currentTheme.borderRadius.sm,
          padding: currentTheme.spacing.md
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: currentTheme.spacing.xs,
            color: currentTheme.colors.success || '#2e7d32'
          }}>
            Expected:
          </div>
          <pre style={{ 
            margin: 0,
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(actualResult.expectedValue, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  // Create draggable container portal
  const draggableContainerPortal = showActualResultContainer ? createPortal(
    <DraggableContainer
      title={`Test Result: ${testName}`}
      onClose={handleCloseActualResult}
      defaultPosition={{ x: 100, y: 100 }}
      storageKey={`testResult_${testName}_position`}
    >
      {renderActualResultContent()}
    </DraggableContainer>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={cellRef}
        style={cellStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {value}
      </div>
      
      {tooltipPortal}
      {draggableContainerPortal}
    </>
  );
};
