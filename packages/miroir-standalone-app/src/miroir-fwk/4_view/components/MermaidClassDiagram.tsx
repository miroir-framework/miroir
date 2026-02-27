/**
 * MermaidClassDiagram – a themed React component that renders a Mermaid
 * class diagram from Miroir EntityDefinitions.
 *
 * Uses the `mermaid` library for SVG rendering and integrates with the
 * Miroir theme system via `useMiroirTheme()`.
 */

import React, { useRef, useCallback, useState } from "react";
import mermaid from "mermaid";
import { Box, Typography, IconButton, Tooltip, ToggleButtonGroup, ToggleButton } from "@mui/material";
import type { EntityDefinition } from "miroir-core";
import {
  entityDefinitionsToMermaidClassDiagram,
  type ClassDiagramOptions,
} from "miroir-diagram-class";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";

// ############################################################################
// Types
// ############################################################################

export interface MermaidClassDiagramProps {
  /** The entity definitions to render as a class diagram. */
  entityDefinitions: EntityDefinition[];
  /** Optional overrides for diagram generation options. */
  options?: Partial<ClassDiagramOptions>;
  /** Optional CSS height. Defaults to "auto". */
  height?: string;
}

// ############################################################################
// Component
// ############################################################################

let mermaidInitialized = false;

export const MermaidClassDiagram: React.FC<MermaidClassDiagramProps> = ({
  entityDefinitions,
  options = {},
  height = "auto",
}) => {
  const miroirTheme = useMiroirTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"TB" | "LR">(
    (options.direction === "TB" || options.direction === "LR") ? options.direction : "TB"
  );
  const [showInfra, setShowInfra] = useState<boolean>(options.showInfrastructureAttributes ?? false);
  const renderIdRef = useRef(0);

  // Derive theme-aware colors for Mermaid
  const isDark = miroirTheme.currentTheme.colors.background
    ? isColorDark(miroirTheme.currentTheme.colors.background)
    : false;

  const themeColors = {
    background: miroirTheme.currentTheme.colors.background || "#ffffff",
    text: miroirTheme.currentTheme.colors.text || "#333333",
    primary: miroirTheme.currentTheme.colors.primary || "#7c67bc",
    surface: miroirTheme.currentTheme.colors.surface || "#f5f5f5",
    border: miroirTheme.currentTheme.colors.border || "#cccccc",
  };

  // Build diagram options merged with overrides
  const diagramOptions: ClassDiagramOptions = {
    ...options,
    // Override direction and showInfra with local interactive state
    direction,
    showInfrastructureAttributes: showInfra,
    showTitle: options.showTitle ?? true,
    title: options.title ?? "Application Model",
  };

  const renderDiagram = useCallback(async () => {
    if (!containerRef.current || entityDefinitions.length === 0) {
      setSvgContent("");
      return;
    }

    try {
      // Initialize mermaid with theme-aware config
      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          themeVariables: {
            primaryColor: themeColors.primary,
            primaryTextColor: themeColors.text,
            primaryBorderColor: themeColors.border,
            lineColor: themeColors.text,
            secondaryColor: themeColors.surface,
            tertiaryColor: themeColors.background,
          },
          securityLevel: "loose",
        });
        mermaidInitialized = true;
      }

      const diagramText = entityDefinitionsToMermaidClassDiagram(
        entityDefinitions,
        diagramOptions,
      );

      renderIdRef.current += 1;
      const id = `miroir-class-diagram-${renderIdRef.current}`;

      const { svg } = await mermaid.render(id, diagramText);
      setSvgContent(svg);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to render diagram");
      setSvgContent("");
    }
  }, [entityDefinitions, diagramOptions, isDark, themeColors]);

  // Render when inputs change. We use a ref-based approach to avoid useEffect.
  // Instead, we trigger rendering via a key-based mechanism.
  const diagramKey = JSON.stringify({
    defs: entityDefinitions.map((ed) => ed.uuid),
    direction,
    showInfra,
    theme: isDark,
  });

  const lastKeyRef = useRef<string>("");
  if (diagramKey !== lastKeyRef.current) {
    lastKeyRef.current = diagramKey;
    // Re-initialize mermaid when theme changes
    mermaidInitialized = false;
    renderDiagram();
  }

  const handleDirectionChange = (_: unknown, newDir: "TB" | "LR" | null) => {
    if (newDir) setDirection(newDir);
  };

  const handleInfraToggle = () => {
    setShowInfra((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: "100%",
        height,
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "4px 8px",
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.surface,
          borderRadius: "4px 4px 0 0",
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: themeColors.text, fontWeight: 500 }}
        >
          Direction:
        </Typography>
        <ToggleButtonGroup
          value={direction}
          exclusive
          onChange={handleDirectionChange}
          size="small"
        >
          <ToggleButton value="TB" sx={{ fontSize: "0.75rem", py: 0.25, px: 1 }}>
            Top→Bottom
          </ToggleButton>
          <ToggleButton value="LR" sx={{ fontSize: "0.75rem", py: 0.25, px: 1 }}>
            Left→Right
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title={showInfra ? "Hide infrastructure attributes" : "Show infrastructure attributes (uuid, parentUuid, etc.)"}>
          <ToggleButton
            value="infra"
            selected={showInfra}
            onChange={handleInfraToggle}
            size="small"
            sx={{ fontSize: "0.75rem", py: 0.25, px: 1 }}
          >
            {showInfra ? "Hide Infra" : "Show Infra"}
          </ToggleButton>
        </Tooltip>
      </Box>

      {/* Diagram area */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: "auto",
          backgroundColor: themeColors.background,
          border: `1px solid ${themeColors.border}`,
          borderRadius: "0 0 4px 4px",
          padding: 2,
          minHeight: "300px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          "& svg": {
            maxWidth: "100%",
            height: "auto",
          },
        }}
      >
        {error ? (
          <Typography color="error" variant="body2">
            Diagram rendering error: {error}
          </Typography>
        ) : entityDefinitions.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: themeColors.text, opacity: 0.6 }}
          >
            No entity definitions available for the current application model.
          </Typography>
        ) : svgContent ? (
          <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        ) : (
          <Typography
            variant="body2"
            sx={{ color: themeColors.text, opacity: 0.6 }}
          >
            Rendering diagram...
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ############################################################################
// Helpers
// ############################################################################

/**
 * Rough heuristic to determine if a CSS colour string is dark.
 */
function isColorDark(color: string): boolean {
  // Handle hex colours
  const hex = color.replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
  return false;
}

export default MermaidClassDiagram;
