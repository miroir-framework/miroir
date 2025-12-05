/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext';

export interface SymbolWithLetterProps {
  /** Material Symbol name (e.g., 'search', 'settings', 'bug_report') */
  symbol: string;
  /** Letter to superimpose (e.g., 'T', 'Q', 'A') */
  letter: string;
  /** Size of the base icon - uses CSS string format (e.g., '24px', '1.5rem') */
  size?: string;
  /** Color of the Material Symbol background icon (defaults to inherit) */
  symbolColor?: string;
  /** Color of the superimposed letter (defaults to theme primary color) */
  letterColor?: string;
  /** Font family for the letter (defaults to theme font) */
  letterFont?: string;
  /** Font size for the letter as percentage of icon size (0-1, defaults to 0.5) */
  letterSize?: number;
  /** Font weight for the letter (defaults to theme bold weight) */
  letterWeight?: number | string;
  /** Position offset for the letter from top-right (in percentage, defaults to 0) */
  letterOffset?: { x?: number; y?: number };
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Aria label for accessibility */
  'aria-label'?: string;
  /** Role attribute for accessibility */
  role?: string;
}

/**
 * SymbolWithLetter Component
 * 
 * Renders a Material Symbol with a superimposed letter in the top-right corner.
 * Perfect for creating custom icons like search with "T" (for Transformer), 
 * wrench with "Q" (for Query), etc.
 * 
 * Fully integrated with Miroir theme system for consistent sizing, colors, and styling.
 * 
 * @example
 * <SymbolWithLetter 
 *   symbol="search" 
 *   letter="T" 
 *   size="1.5rem"
 * />
 */
export const SymbolWithLetter: React.FC<SymbolWithLetterProps> = ({
  symbol,
  letter,
  size,
  symbolColor,
  letterColor,
  letterFont,
  letterSize = 0.5,
  letterWeight,
  letterOffset = { x: 0, y: 0 },
  className,
  style,
  'aria-label': ariaLabel,
  role = 'img',
}) => {
  const { currentTheme } = useMiroirTheme();

  // Use theme defaults
  const finalSize = size || currentTheme.typography.fontSize.xl || '1.5rem';
  const finalSymbolColor = symbolColor || 'inherit';
  const finalLetterColor = letterColor || currentTheme.colors.primary || '#1976d2';
  const finalLetterFont = letterFont || currentTheme.typography.fontFamily || 'Arial, sans-serif';
  const finalLetterWeight = letterWeight || currentTheme.typography.fontWeight?.bold || 'bold';

  // Calculate letter size based on percentage of icon size
  const calculateLetterSize = (): string => {
    // Parse size to get numeric value
    const sizeValue = parseFloat(finalSize);
    const sizeUnit = finalSize.replace(/[0-9.]/g, '') || 'px';
    return `${sizeValue * letterSize}${sizeUnit}`;
  };

  const finalLetterSize = calculateLetterSize();

  // Container styles - ensures proper positioning context
  const containerStyles = css({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: finalSize,
    height: finalSize,
    lineHeight: 1,
    verticalAlign: 'middle',
    userSelect: 'none',
  });

  // Symbol styles - matches ThemedIcon symbol styling
  const symbolStyles = css({
    fontSize: finalSize,
    color: finalSymbolColor,
    lineHeight: 1,
    userSelect: 'none',
    display: 'inline-block',
  });

  // Letter styles - positioned absolutely in top-right with theme colors
  const letterStyles = css({
    position: 'absolute',
    top: `${letterOffset.y || 0}%`,
    right: `${letterOffset.x || 0}%`,
    fontSize: finalLetterSize,
    fontFamily: finalLetterFont,
    fontWeight: finalLetterWeight,
    color: finalLetterColor,
    lineHeight: 1,
    userSelect: 'none',
    pointerEvents: 'none',
    // White outline for contrast
    textShadow: `
      -1px -1px 0 ${currentTheme.colors.background || '#fff'},
       1px -1px 0 ${currentTheme.colors.background || '#fff'},
      -1px  1px 0 ${currentTheme.colors.background || '#fff'},
       1px  1px 0 ${currentTheme.colors.background || '#fff'},
       0px -1px 0 ${currentTheme.colors.background || '#fff'},
       0px  1px 0 ${currentTheme.colors.background || '#fff'},
      -1px  0px 0 ${currentTheme.colors.background || '#fff'},
       1px  0px 0 ${currentTheme.colors.background || '#fff'}
    `,
  });

  return (
    <span
      css={containerStyles}
      className={className}
      style={style}
      aria-label={ariaLabel || `${symbol} icon with ${letter}`}
      role={role}
    >
      <span className="material-symbols-outlined" css={symbolStyles}>
        {symbol}
      </span>
      <span css={letterStyles}>
        {letter}
      </span>
    </span>
  );
};

export default SymbolWithLetter;
