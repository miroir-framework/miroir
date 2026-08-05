import type { LoggerInterface } from 'miroir-core';
import type { MiroirTheme } from './MiroirTheme';

type MiroirIconColor =
  | string
  | {
      colorType: 'themeColor';
      currentThemeColorPath: string;
    }
  | undefined;

export function resolveMiroirIconColor(
  color: MiroirIconColor,
  currentTheme: MiroirTheme,
  log: LoggerInterface,
): string | undefined {
  if (!color) {
    return undefined;
  }

  if (typeof color === 'string') {
    return color;
  }

  if (color.colorType === 'themeColor') {
    const pathParts = color.currentThemeColorPath.split('.');
    let colorValue: unknown = currentTheme;

    for (const part of pathParts) {
      if (colorValue && typeof colorValue === 'object' && part in colorValue) {
        colorValue = (colorValue as Record<string, unknown>)[part];
      } else {
        log.warn(`Theme color path not found: ${color.currentThemeColorPath}`);
        return undefined;
      }
    }

    return typeof colorValue === 'string' ? colorValue : undefined;
  }

  return undefined;
}
