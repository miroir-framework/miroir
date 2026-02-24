import React, { useState } from "react";
import { useMiroirContextService } from "../../MiroirContextReactProvider.js";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { ThemedOnScreenDebug } from "../Themes/index.js";

// ################################################################################################
export type DebugElement = {
  label: string;
  data: any;
  initiallyUnfolded?: boolean;
  useCodeBlock?: boolean;
  copyButton?: boolean;
};
export type DebugElements = DebugElement[];

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
// Collapsible debug section for a component.
// Renders nothing when showDebugInfo is off -- zero visual footprint.
// Section open/close state is persisted in sessionStorage.
// Each element delegates its own fold/unfold to ThemedOnScreenDebug (via ThemedOnScreenHelper).
export const DebugHelper: React.FC<{
  componentName: string;
  elements: DebugElements;
}> = ({ componentName, elements }) => {
  const context = useMiroirContextService();
  const { currentTheme } = useMiroirTheme();
  const [isOpen, setIsOpen] = useState(() =>
    loadBool(storeKey(componentName, "__open"), false)
  );

  if (!context.showDebugInfo || elements.length === 0) return null;

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      saveBool(storeKey(componentName, "__open"), next);
      return next;
    });
  };

  return (
    <div
      style={{
        border: `1px solid ${currentTheme.colors.warning ?? "#f59e0b"}`,
        borderRadius: currentTheme.borderRadius.sm,
        margin: "4px 0",
        padding: "4px 8px",
        backgroundColor: currentTheme.colors.warningLight ?? "#fffbeb",
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
          color: currentTheme.colors.textSecondary ?? "#484746",
          userSelect: "none",
        }}
      >
        <span>{isOpen ? "▾" : "▸"}</span>
        <span>🔍 {componentName}</span>
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
          {elements.map((element, index) => (
            <ThemedOnScreenDebug
              key={`${element.label}_${index}`}
              label={element.label}
              data={element.data}
              initiallyUnfolded={element.initiallyUnfolded ?? false}
              useCodeBlock={element.useCodeBlock ?? true}
              copyButton={element.copyButton ?? true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
