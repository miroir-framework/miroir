/**
 * MermaidClassDiagram – a themed React component that renders a Mermaid
 * class diagram from Miroir EntityDefinitions.
 *
 * Uses the `mermaid` library for SVG rendering and integrates with the
 * Miroir theme system via `useMiroirTheme()` from `miroir-react`.
 */

import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import mermaid from "mermaid";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from "@mui/material";
import { SvgToolbelt } from "svg-toolbelt";
import "svg-toolbelt/dist/svg-toolbelt.css";
import { MiroirLoggerFactory, type EntityDefinition, type LoggerInterface } from "miroir-core";
import {
  entityDefinitionsToMermaidClassDiagram,
  type ClassDiagramOptions,
} from "../2_domain/entityDefinitionsToMermaidClassDiagram.js";
import {
  entityDefinitionsToMermaidErDiagram,
  type ErDiagramOptions,
} from "../2_domain/entityDefinitionsToMermaidErDiagram.js";
import { DebugHelper, useMiroirTheme } from "miroir-react";
import { cleanLevel, packageName } from "../constants.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MermaidClassDiagram"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ############################################################################
// Constants
// ############################################################################

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.15;

/**
 * Compute an initial zoom so that diagrams with ≤10 classes start at 1.0
 * and larger diagrams scale down proportionally (floor: 0.3).
 */
function computeInitialZoom(entityCount: number): number {
  if (entityCount <= 10) return 1.0;
  return Math.max(ZOOM_MIN, 10 / entityCount);
}

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
  /**
   * Called when a class node is clicked in the diagram.
   * Receives the entity-definition UUID (the `uuid` field of the EntityDefinition,
   * not the `entityUuid`).
   * Requires `classClickLinks` to be set in `options` (e.g. via
   * `buildEntityDefinitionClickLinks`).
   */
  onClassClick?: (entityDefinitionUuid: string) => void;
}

// ############################################################################
// Component
// ############################################################################

let mermaidInitialized = false;

export const MermaidClassDiagram: React.FC<MermaidClassDiagramProps> = ({
  entityDefinitions,
  options = {},
  height = "auto",
  onClassClick,
}) => {
  const miroirTheme = useMiroirTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const toolbeltRef = useRef<SvgToolbelt | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [diagramText, setDiagramText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"TB" | "LR">(
    (options.direction === "TB" || options.direction === "LR") ? options.direction : "TB"
  );
  const [showInfra, setShowInfra] = useState<boolean>(options.showInfrastructureAttributes ?? false);
  const [diagramMode, setDiagramMode] = useState<"class" | "er">("class");
  const renderIdRef = useRef(0);

  // Stable refs so the svgContent useEffect always has the latest values without
  // needing to re-attach DOM listeners on every render.
  const onClassClickRef = useRef(onClassClick);
  const classClickLinksRef = useRef(options?.classClickLinks);
  onClassClickRef.current = onClassClick;
  classClickLinksRef.current = options?.classClickLinks;

  // Derive theme-aware colors for Mermaid
  const isDark = miroirTheme.currentTheme.colors.background
    ? isColorDark(miroirTheme.currentTheme.colors.background)
    : false;

  const themeColors = useMemo(() => ({
    background: miroirTheme.currentTheme.colors.background || "#ffffff",
    text: miroirTheme.currentTheme.colors.text || "#333333",
    primary: miroirTheme.currentTheme.colors.primary || "#7c67bc",
    surface: miroirTheme.currentTheme.colors.surface || "#f5f5f5",
    border: miroirTheme.currentTheme.colors.border || "#cccccc",
  }), [miroirTheme.currentTheme.colors]);

  // Build diagram options merged with overrides
  const diagramOptions: ClassDiagramOptions = useMemo(() => ({
    ...options,
    direction,
    showInfrastructureAttributes: showInfra,
    showTitle: options.showTitle ?? true,
    title: options.title ?? "Application Model",
  }), [options, direction, showInfra]);

  const renderDiagram = useCallback(async () => {
    if (entityDefinitions.length === 0) {
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

      // NOTE: mermaid.render() attaches `click … call` listeners to a temporary DOM node
      // and those listeners are NOT serialised into the SVG string.  We therefore do NOT
      // use window.miroirDiagramClassClick here; instead we attach click listeners after
      // the SVG is inserted into the real DOM (see the svgContent useEffect below).
      let generatedDiagramText: string;
      if (diagramMode === "er") {
        const erOptions: ErDiagramOptions = {
          showInfrastructureAttributes: diagramOptions.showInfrastructureAttributes,
          showTitle: diagramOptions.showTitle,
          title: diagramOptions.title,
          classClickLinks: diagramOptions.classClickLinks,
        };
        generatedDiagramText = entityDefinitionsToMermaidErDiagram(entityDefinitions, erOptions);
      } else {
        generatedDiagramText = entityDefinitionsToMermaidClassDiagram(
          entityDefinitions,
          diagramOptions,
        );
      }
      setDiagramText(generatedDiagramText);
      renderIdRef.current += 1;
      const id = `miroir-class-diagram-${renderIdRef.current}`;

      const { svg } = await mermaid.render(id, generatedDiagramText);
      setSvgContent(svg);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to render diagram");
      setSvgContent("");
    }
  }, [entityDefinitions, diagramOptions, isDark, themeColors, diagramMode]);

  // Key capturing all inputs that should trigger a re-render.
  const diagramKey = JSON.stringify({
    defs: entityDefinitions.map((ed) => ed.uuid),
    direction,
    showInfra,
    theme: isDark,
    diagramMode,
    hasClickLinks: !!options?.classClickLinks && Object.keys(options.classClickLinks).length > 0,
  });

  // Trigger rendering after the DOM is committed (ref is attached).
  // useEffect is strictly necessary here because renderDiagram needs containerRef.current.
  useEffect(() => {
    mermaidInitialized = false;
    renderDiagram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramKey]);

  // Initialise (or reinitialise) svg-toolbelt once the SVG is in the DOM.
  // useEffect is strictly necessary here because SvgToolbelt needs the SVG DOM node.
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent) return;

    const el = svgContainerRef.current;

    // Inject SVG string directly into the DOM – avoids dangerouslySetInnerHTML in JSX
    // and keeps all DOM manipulation (injection + toolbelt init + click listeners) in
    // one place.
    el.innerHTML = svgContent;

    // Destroy any previous instance before creating a new one.
    toolbeltRef.current?.destroy();
    toolbeltRef.current = null;

    const enhancer = new SvgToolbelt(el, {
      minScale: ZOOM_MIN,
      maxScale: ZOOM_MAX,
      zoomStep: ZOOM_STEP,
      showControls: true,
      controlsPosition: "top-right",
      enableTouch: true,
      enableKeyboard: true,
    });
    enhancer.init();

    // Apply the computed initial scale.
    enhancer.scale = computeInitialZoom(entityDefinitions.length);
    enhancer.applyTransform();

    toolbeltRef.current = enhancer;

    // Custom wheel handler (capture phase → fires before svg-toolbelt's bubble-phase zoom):
    //   plain scroll      → pan vertically
    //   shift + scroll    → pan horizontally
    //   ctrl  + scroll    → zoom (delegated to svg-toolbelt)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Let svg-toolbelt's ZoomFeature handle zoom; don't intercept.
        return;
      }
      // Prevent both the page from scrolling and svg-toolbelt from zooming.
      e.preventDefault();
      e.stopImmediatePropagation();

      // deltaY is non-zero for most wheel events; prefer it over deltaX so that
      // shift+scroll works consistently even when the OS reports deltaX.
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;

      if (e.shiftKey) {
        enhancer.translateX -= delta;
      } else {
        enhancer.translateY -= delta;
      }
      enhancer.constrainPan();
      enhancer.applyTransform();
    };

    el.addEventListener("wheel", handleWheel, { capture: true, passive: false });

    // Attach click handlers to every node Mermaid marked as clickable.
    // Mermaid sets class="node … clickable" and id="classId-{ClassName}-{N}" on those nodes.
    // We parse the class name from the id, look up the entity-definition UUID from
    // classClickLinks, and dispatch to onClassClick.
    const clickLinks = classClickLinksRef.current;
    if (clickLinks && Object.keys(clickLinks).length > 0) {
      const clickableNodes = el.querySelectorAll<SVGGElement>(".node.clickable");
      clickableNodes.forEach((node) => {
        const nodeId = node.getAttribute("id"); // e.g. "classId-Author-9"
        const match = nodeId?.match(/^classId-(.+)-\d+$/);
        if (!match) return;
        const className = match[1];
        const uuid = clickLinks[className];
        if (!uuid) return;
        node.style.cursor = "pointer";
        node.addEventListener("click", () => {
          log.info("Class node clicked", { className, uuid });
          onClassClickRef.current?.(uuid);
        });
      });
    }

    return () => {
      el.removeEventListener("wheel", handleWheel, { capture: true });
      enhancer.destroy();
      toolbeltRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgContent]);

  const handleDirectionChange = (_: unknown, newDir: "TB" | "LR" | null) => {
    if (newDir) setDirection(newDir);
  };

  const handleInfraToggle = () => {
    setShowInfra((prev) => !prev);
  };

  const handleModeChange = (_: unknown, newMode: "class" | "er" | null) => {
    if (newMode) setDiagramMode(newMode);
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
      <DebugHelper
        componentName="MermaidClassDiagram"
        elements={[
          { label: "MermaidClassDiagram entityDefinitions", data: entityDefinitions },
          { label: "MermaidClassDiagram diagramText", data: diagramText },
          { label: "MermaidClassDiagram diagramKey", data: diagramKey },
          { label: "MermaidClassDiagram options", data: diagramOptions },
          // { label: "MermaidClassDiagram themeColors", data: themeColors },
          { label: "MermaidClassDiagram svgContent", data: svgContent },
          { label: "MermaidClassDiagram error", data: error },
        ]}
      />

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
        {/* Direction toggle – only relevant for class diagrams */}
        <Typography variant="body2" sx={{ color: themeColors.text, fontWeight: 500 }}>
          Direction:
        </Typography>
        <ToggleButtonGroup
          value={direction}
          exclusive
          onChange={handleDirectionChange}
          size="small"
          sx={{ padding: "8px" }}
        >
          <ToggleButton
            value="TB"
            disabled={diagramMode === "er"}
            sx={{ fontSize: "0.75rem", py: 0.25, px: 1, padding: "8px" }}
          >
            Top→Bottom
          </ToggleButton>
          <ToggleButton
            value="LR"
            disabled={diagramMode === "er"}
            sx={{ fontSize: "0.75rem", py: 0.25, px: 1, padding: "8px" }}
          >
            Left→Right
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Diagram mode toggle: Class diagram vs ER diagram */}
        <Typography variant="body2" sx={{ color: themeColors.text, fontWeight: 500 }}>
          Diagram:
        </Typography>
        <ToggleButtonGroup
          value={diagramMode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{ padding: "8px" }}
        >
          <ToggleButton value="class" sx={{ fontSize: "0.75rem", py: 0.25, px: 1, padding: "8px" }}>
            Class
          </ToggleButton>
          <ToggleButton value="er" sx={{ fontSize: "0.75rem", py: 0.25, px: 1, padding: "8px" }}>
            ER
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Infrastructure attributes toggle */}
        <Tooltip
          title={
            showInfra
              ? "Hide infrastructure attributes"
              : "Show infrastructure attributes (uuid, parentUuid, etc.)"
          }
        >
          <ToggleButton
            value="infra"
            selected={showInfra}
            onChange={handleInfraToggle}
            size="small"
            sx={{ fontSize: "0.75rem", py: 0.25, px: 1, padding: "8px" }}
          >
            {showInfra ? "Hide Infra" : "Show Infra"}
          </ToggleButton>
        </Tooltip>

        <Typography variant="body2" sx={{ color: themeColors.text, fontWeight: 500, padding: "8px" }}>
          CTRL + Scroll to zoom, Shift + Scroll to pan horizontally, Scroll to pan vertically
        </Typography>
      </Box>

      {/* Diagram area — svg-toolbelt manages zoom/pan directly on the SVG transform */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: "hidden",
          backgroundColor: themeColors.background,
          border: `1px solid ${themeColors.border}`,
          borderRadius: "0 0 4px 4px",
          minHeight: "300px",
          position: "relative",
        }}
      >
        {error && (
          <Typography color="error" variant="body2">
            Diagram rendering error: {error}
          </Typography>
        )}
        {!error && entityDefinitions.length === 0 && (
          <Typography variant="body2" sx={{ color: themeColors.text, opacity: 0.6 }}>
            No entity definitions available for the current application model.
          </Typography>
        )}
        {!error && entityDefinitions.length > 0 && !svgContent && (
          <Typography variant="body2" sx={{ color: themeColors.text, opacity: 0.6 }}>
            Rendering diagram...
          </Typography>
        )}
        {/* svgContainerRef is always mounted so the ref is stable across re-renders.
            SVG content is injected via el.innerHTML in the useEffect below.
            display:none hides it until the SVG is ready. */}
        <Box
          ref={svgContainerRef}
          sx={{
            width: "100%",
            height: "100%",
            minHeight: "300px",
            display: (!error && svgContent) ? "block" : "none",
          }}
        />
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
  const hex = color.replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
  return false;
}

export default MermaidClassDiagram;
