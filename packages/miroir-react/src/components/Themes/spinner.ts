/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

export type SpinnerOptions = {
  color?: string; // fallback border color
  topColor?: string; // border-top color for highlight
  sizeEm?: number; // size in em
  sizePx?: number; // size in px (overrides sizeEm)
  borderWidth?: number; // border width in px
  speed?: string; // animation duration string
  marginRight?: string;
};

export const getSpinnerStyles = (currentTheme: any, opts?: SpinnerOptions) => {
  const o = opts || {};
  const size = o.sizePx ? `${o.sizePx}px` : `${o.sizeEm ?? 0.9}em`;
  const borderWidth = o.borderWidth ?? (o.sizePx ? Math.max(3, Math.round((o.sizePx as number) / 16)) : 2);
  const color = o.color ?? currentTheme?.colors?.text ?? '#666';
  const topColor = o.topColor ?? color;
  const speed = o.speed ?? '0.8s';
  const marginRight = o.marginRight ?? currentTheme?.spacing?.xs ?? '8px';

  return css({
    '@keyframes miroir_spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    display: 'inline-block',
    width: size,
    height: size,
    border: `${borderWidth}px solid ${color}`,
    borderTopColor: topColor,
    borderRightColor: 'transparent',
    borderRadius: '50%',
    animation: `miroir_spin ${speed} cubic-bezier(.4,.0,.2,1) infinite`,
    marginRight: marginRight,
    verticalAlign: 'middle',
    boxSizing: 'border-box',
    filter: 'drop-shadow(0 0 0.5px rgba(0,0,0,0.06))',
  });
};

export default getSpinnerStyles;
