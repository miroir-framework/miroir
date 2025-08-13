import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as Diff from "diff";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import {
  ThemedCodeBlock,
  ThemedPaper,
  ThemedBox,
  ThemedStyledButton,
  ThemedTitle,
} from "../Themes/ThemedComponents.js";
import { formatValue, SideBySideDiff } from './SideBySideDiff.js';

// ################################################################################################
// Test Cell Components with Hover functionality and Side-by-Side Diff Display
// ################################################################################################
export interface TestCellWithDetailsProps {
  value: string;
  testData: any;
  testName: string;
  type: 'testName' | 'status' | 'result';
}


export const TestCellWithDetails: React.FC<TestCellWithDetailsProps> = ({ 
  value, 
  testData, 
  testName, 
  type 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
    
    if (!isExpanded) {
      content += '\n\n💡 Click for side-by-side diff view';
    }
    
    return content;
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

  const cellStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.sm,
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    display: 'inline-block',
    backgroundColor: showTooltip 
      ? currentTheme.colors.primary + '20' 
      : isExpanded 
        ? currentTheme.colors.warning + '20' 
        : 'transparent',
    border: isExpanded 
      ? `2px solid ${currentTheme.colors.warning}` 
      : `1px solid transparent`,
    boxShadow: isExpanded ? currentTheme.elevation.medium : 'none',
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
    pointerEvents: isExpanded ? 'auto' : 'none',
    opacity: showTooltip ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    lineHeight: '1.5',
    border: `1px solid ${currentTheme.colors.primary}`,
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formatDetailedTooltipContent());
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    setShowTooltip(false); // Hide tooltip when expanding
  };

  const handleCloseExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  // Render expanded modal content with side-by-side diffs
  const renderExpandedContent = () => {
    if (!testData.fullAssertionsResults) {
      return <div>No detailed assertion data available</div>;
    }

    const assertions = Object.entries(testData.fullAssertionsResults);
    if (assertions.length === 0) {
      return <div>No assertions found</div>;
    }

    return (
      <div>
        {/* Test summary */}
        <div style={{ 
          marginBottom: currentTheme.spacing.lg, 
          padding: currentTheme.spacing.md,
          backgroundColor: currentTheme.colors.background,
          borderRadius: currentTheme.borderRadius.sm,
          border: `1px solid ${currentTheme.colors.border}`
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: currentTheme.spacing.sm }}>
            Test Summary
          </div>
          <div>Test: {testName}</div>
          <div>Result: {testData.testResult} {testData.status}</div>
          <div>Total Assertions: {testData.assertionCount}</div>
        </div>

        {/* Assertions with side-by-side diffs for failures */}
        {assertions.map(([assertionName, assertion]: [string, any]) => {
          if (assertion.assertionResult === "ok") {
            return (
              <div key={assertionName} style={{ 
                marginBottom: currentTheme.spacing.md,
                padding: currentTheme.spacing.sm,
                backgroundColor: '#f0f8f0',
                borderRadius: currentTheme.borderRadius.sm,
                border: '1px solid #c8e6c9'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#2e7d32',
                  fontSize: '14px'
                }}>
                  ✅ {assertionName}: PASS
                </div>
              </div>
            );
          } else {
            return (
              <SideBySideDiff
                key={assertionName}
                assertionName={assertionName}
                expected={assertion.assertionExpectedValue}
                actual={assertion.assertionActualValue}
              />
            );
          }
        })}
      </div>
    );
  };

  // Create tooltip portal
  const tooltipPortal = showTooltip && !isExpanded ? createPortal(
    <div style={tooltipStyle}>
      {formatDetailedTooltipContent()}
    </div>,
    document.body
  ) : null;

  // Create modal portal with enhanced content
  const modalPortal = isExpanded ? createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={handleCloseExpanded}
    >
      <ThemedPaper
        elevation={3}
        style={{
          position: 'relative',
          maxWidth: '95vw',
          maxHeight: '90vh',
          minWidth: '800px',
          minHeight: '500px',
          overflow: 'auto',
          margin: currentTheme.spacing.lg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ThemedBox 
          padding={currentTheme.spacing.lg}
          style={{ position: 'relative' }}
        >
          <ThemedStyledButton
            style={{
              position: 'absolute',
              top: '8px',
              right: '40px',
              backgroundColor: currentTheme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: currentTheme.borderRadius.sm,
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onClick={handleCopyToClipboard}
          >
            📋 Copy
          </ThemedStyledButton>
          
          <ThemedStyledButton
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: currentTheme.colors.textSecondary,
            }}
            onClick={() => setIsExpanded(false)}
            ariaLabel="Close"
          >
            ×
          </ThemedStyledButton>
          
          <ThemedTitle style={{ marginTop: 0, marginBottom: currentTheme.spacing.md }}>
            Test Details: {testName}
          </ThemedTitle>
          
          <div style={{
            maxHeight: 'calc(90vh - 150px)',
            overflow: 'auto',
            padding: currentTheme.spacing.sm
          }}>
            {renderExpandedContent()}
          </div>
        </ThemedBox>
      </ThemedPaper>
    </div>,
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
      {modalPortal}
    </>
  );
};
