import React, { useState } from "react";
import { ThemedOnScreenDebug, ThemedOnScreenHelper } from "./ThemedHelper";
import { useMiroirContextService } from "../../contexts/MiroirContextReactProvider";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext";

// ################################################################################################
export type JsonElementToDisplay = {
  label: string;
  data: any;
  initiallyUnfolded?: boolean;
  useCodeBlock?: boolean;
  copyButton?: boolean;
};
export type DebugElements = JsonElementToDisplay[];

// ################################################################################################
const storeKey = (componentName: string, suffix: string) =>
  `debugHelper__${componentName}__${suffix}`;

const loadBool = (key: string, defaultValue: boolean): boolean => {
  try {
    const s = sessionStorage.getItem(key);
    return s !== null ? (JSON.parse(s) as boolean) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveBool = (key: string, value: boolean): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// ################################################################################################
// Collapsible section for displaying structured JSON data.
// When debug=true: only shown when showDebugInfo is on, rendered with warning colors and a 🔍 icon.
// When debug=false: always displayed, with neutral styling.
// Section open/close state is persisted in sessionStorage.
export const JsonDisplayHelper: React.FC<{
  componentName: string;
  elements: DebugElements;
  debug?: boolean;
}> = ({ componentName, elements, debug = false }) => {
  const context = useMiroirContextService();
  const { currentTheme } = useMiroirTheme();
  const [isOpen, setIsOpen] = useState(() =>
    loadBool(storeKey(componentName, "__open"), false)
  );

  if (debug && (!context.showDebugInfo || elements.length === 0)) return null;
  if (!debug && elements.length === 0) return null;

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      saveBool(storeKey(componentName, "__open"), next);
      return next;
    });
  };

  const borderColor = debug
    ? (currentTheme.colors.warning ?? "#f59e0b")
    : (currentTheme.colors.border ?? "#d1d5db");
  const bgColor = debug
    ? (currentTheme.colors.warningLight ?? "#fffbeb")
    : (currentTheme.colors.surface ?? "#ffffff");
  const headerColor = debug
    ? (currentTheme.colors.textSecondary ?? "#484746")
    : (currentTheme.colors.text ?? "#111827");

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: currentTheme.borderRadius.sm,
        margin: "4px 0",
        padding: "4px 8px",
        backgroundColor: bgColor,
        fontFamily: "monospace",
      }}
    >
      <div
        onClick={toggle}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "12px",
          fontWeight: "bold",
          color: headerColor,
          userSelect: "none",
        }}
      >
        <span>{isOpen ? "▾" : "▸"}</span>
        <span>{debug ? "🔍 " : ""}{componentName}</span>
        <span
          style={{
            color: currentTheme.colors.textSecondary,
            fontWeight: "normal",
            fontSize: "11px",
          }}
        >
          ({elements.length} item{elements.length !== 1 ? "s" : ""})
        </span>
      </div>
      {isOpen && (
        <div style={{ marginTop: 4 }}>
          {elements.map((element, index) =>
            debug ? (
              <ThemedOnScreenDebug
                key={`${element.label}_${index}`}
                label={element.label}
                data={element.data}
                initiallyUnfolded={element.initiallyUnfolded ?? false}
                useCodeBlock={element.useCodeBlock ?? true}
                copyButton={element.copyButton ?? true}
              />
            ) : (
              <ThemedOnScreenHelper
                key={`${element.label}_${index}`}
                label={element.label}
                data={element.data}
                initiallyUnfolded={element.initiallyUnfolded ?? false}
                useCodeBlock={element.useCodeBlock ?? true}
                copyButton={element.copyButton ?? true}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

// Backward-compatible alias
export const DebugHelper = JsonDisplayHelper;
