import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import {
  ThemedBox,
  ThemedPaper,
  ThemedStyledButton,
  ThemedTitle
} from "../Themes/index"
import { formatValue, SideBySideDiff } from './SideBySideDiff.js';

// ################################################################################################
// Test Cell Components with Hover functionality and Side-by-Side Diff Display
// 
// IMPORTANT: Modal behavior controls
// - Modal should only close when:
//   1. The close button (×) is clicked
//   2. A click outside the modal content area (on the backdrop) occurs
//   3. The ESC key is pressed
// - Component uses React.memo to prevent unnecessary re-renders that could cause
//   spontaneous modal closure due to state resets
// ################################################################################################
export interface TestCellWithDetailsProps {
  value: string;
  testData: any;
  testName: string;
  type: 'testName' | 'status' | 'result';
}


export const TestCellWithDetails: React.FC<TestCellWithDetailsProps> = React.memo(({ 
  value, 
  testData, 
  testName, 
  type 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [feedbackFading, setFeedbackFading] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const { currentTheme } = useMiroirTheme();

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);
  
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
  const updateTooltipPosition = useCallback(() => {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setTooltipPosition({
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop - 10, // 10px above the cell
      });
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    updateTooltipPosition();
    setShowTooltip(true);
  }, [updateTooltipPosition]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    setShowTooltip(false); // Hide tooltip when expanding
  }, [isExpanded]);

  const handleCloseExpanded = useCallback((e: React.MouseEvent) => {
    // Only close if clicking on the backdrop (not inside the modal content)
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      setIsExpanded(false);
    }
  }, []);

  const handleCloseButton = useCallback(() => {
    setIsExpanded(false);
  }, []);

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

  const showCopyFeedback = useCallback((message: string) => {
    setCopyFeedback(message);
    setFeedbackFading(false);
    // Start fade-out after 2.5 seconds
    setTimeout(() => setFeedbackFading(true), 2500);
    // Remove message after fade completes
    setTimeout(() => setCopyFeedback(null), 3000);
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(formatDetailedTooltipContent());
    showCopyFeedback('All details copied to clipboard!');
  }, [formatDetailedTooltipContent, showCopyFeedback]);

  // Helper function to extract all expected results
  const getExpectedResults = () => {
    if (!testData.fullAssertionsResults) return "No assertion data available";
    
    const assertions = Object.entries(testData.fullAssertionsResults);
    const failedAssertions = assertions.filter(([_, assertion]: [string, any]) => 
      assertion.assertionResult !== "ok"
    );
    
    if (failedAssertions.length === 0) {
      return "All assertions passed - no expected results to display";
    }
    
    let content = `Expected Results for Test: ${testName}\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    failedAssertions.forEach(([assertionName, assertion]: [string, any]) => {
      content += `Assertion: ${assertionName}\n`;
      content += `${'-'.repeat(30)}\n`;
      content += `${JSON.stringify(assertion.assertionExpectedValue, null, 2)}\n\n`;
    });
    
    return content;
  };

  // Helper function to extract all actual results
  const getActualResults = () => {
    if (!testData.fullAssertionsResults) return "No assertion data available";
    
    const assertions = Object.entries(testData.fullAssertionsResults);
    const failedAssertions = assertions.filter(([_, assertion]: [string, any]) => 
      assertion.assertionResult !== "ok"
    );
    
    if (failedAssertions.length === 0) {
      return "All assertions passed - no actual results to display";
    }
    
    let content = `Actual Results for Test: ${testName}\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    failedAssertions.forEach(([assertionName, assertion]: [string, any]) => {
      content += `Assertion: ${assertionName}\n`;
      content += `${'-'.repeat(30)}\n`;
      content += `${JSON.stringify(assertion.assertionActualValue, null, 2)}\n\n`;
    });
    
    return content;
  };

  const handleCopyExpectedResults = useCallback(() => {
    navigator.clipboard.writeText(getExpectedResults());
    showCopyFeedback('Expected results copied to clipboard!');
  }, [testName, testData, showCopyFeedback]);

  const handleCopyActualResults = useCallback(() => {
    navigator.clipboard.writeText(getActualResults());
    showCopyFeedback('Actual results copied to clipboard!');
  }, [testName, testData, showCopyFeedback]);

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
        {/* <div style={{ 
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
        </div> */}

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
          width: '98vw',
          height: '95vh',
          maxWidth: '98vw',
          maxHeight: '95vh',
          minWidth: '1000px',
          minHeight: '600px',
          overflow: 'hidden', // Changed to hidden to prevent external scrollbars
          margin: '1vh 1vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ThemedBox 
          padding={currentTheme.spacing.lg}
          style={{ 
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header with title and copy buttons on same line */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: currentTheme.spacing.md,
            flexWrap: 'wrap',
            gap: currentTheme.spacing.sm,
            minHeight: '40px'
          }}>
            <ThemedTitle style={{ 
              margin: 0,
              flexGrow: 1,
              minWidth: '200px',
              wordWrap: 'break-word',
              lineHeight: '1.2'
            }}>
              Test Details: {testName}
            </ThemedTitle>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}>
              <ThemedStyledButton
                style={{
                  backgroundColor: currentTheme.colors.success || '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: currentTheme.borderRadius.sm,
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  minWidth: '80px',
                }}
                onClick={handleCopyExpectedResults}
                title="Copy Expected Results"
              >
                📋 Expected
              </ThemedStyledButton>

              <ThemedStyledButton
                style={{
                  backgroundColor: currentTheme.colors.error || '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: currentTheme.borderRadius.sm,
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  minWidth: '70px',
                }}
                onClick={handleCopyActualResults}
                title="Copy Actual Results"
              >
                📋 Actual
              </ThemedStyledButton>
              
              <ThemedStyledButton
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: currentTheme.borderRadius.sm,
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  minWidth: '50px',
                }}
                onClick={handleCopyToClipboard}
                title="Copy All Details"
              >
                📋 All
              </ThemedStyledButton>
              
              <ThemedStyledButton
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: currentTheme.colors.textSecondary,
                  padding: '4px 8px',
                }}
                onClick={handleCloseButton}
                aria-label="Close"
              >
                ×
              </ThemedStyledButton>
            </div>
          </div>

          {/* Copy feedback message with fade animation */}
          {copyFeedback && (
            <div style={{
              backgroundColor: currentTheme.colors.success + '20' || '#4caf5020',
              color: currentTheme.colors.success || '#4caf50',
              padding: '8px 12px',
              borderRadius: currentTheme.borderRadius.sm,
              marginBottom: currentTheme.spacing.md,
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              border: `1px solid ${currentTheme.colors.success || '#4caf50'}`,
              opacity: feedbackFading ? 0 : 1,
              transition: 'opacity 0.5s ease-out',
            }}>
              ✓ {copyFeedback}
            </div>
          )}
          
          {/* Auto-resizing content area */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: currentTheme.spacing.sm,
            minHeight: 0 // Allow flex child to shrink
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
});
