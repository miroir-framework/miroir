/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext';

export interface SvgWithLetterProps {
  svgMarkup: string;
  letter: string;
  size?: string;
  svgColor?: string;
  letterColor?: string;
  letterFont?: string;
  letterSize?: number;
  letterWeight?: number | string;
  letterOffset?: { x?: number; y?: number };
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  role?: string;
}

export const SvgWithLetter: React.FC<SvgWithLetterProps> = ({
  svgMarkup,
  letter,
  size,
  svgColor,
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

  const finalSize = size || currentTheme.typography.fontSize.xl || '1.5rem';
  const finalSvgColor = svgColor || 'inherit';
  const finalLetterColor = letterColor || currentTheme.colors.primary || '#1976d2';
  const finalLetterFont = letterFont || currentTheme.typography.fontFamily || 'Arial, sans-serif';
  const finalLetterWeight = letterWeight || currentTheme.typography.fontWeight?.bold || 'bold';

  const sizeValue = parseFloat(finalSize);
  const sizeUnit = finalSize.replace(/[0-9.]/g, '') || 'px';
  const finalLetterSize = `${sizeValue * letterSize}${sizeUnit}`;

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
    color: finalSvgColor,
    '& svg': {
      width: '100%',
      height: '100%',
      display: 'block',
      fill: 'currentColor',
    },
  });

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
      aria-label={ariaLabel || `Custom svg icon with ${letter}`}
      role={role}
    >
      <span
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      <span css={letterStyles}>{letter}</span>
    </span>
  );
};

export default SvgWithLetter;
