/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import {
  transformerBlockTree,
  type BlockEditorBuildMarking,
  type BlockNode,
  type BlockPath,
  type TransformerBlock,
} from "miroir-core";
import React, { useCallback, useMemo, useState } from "react";

import { blockCategoryColor, useMiroirTheme, type BlockEditorColors } from "../../contexts/MiroirThemeContext.js";
import { useBlockEditorBuildMarking } from "./BlockEditorDisplay.js";
import {
  BlockEditingContext,
  BlockInsertTargets,
  BlockNodeActions,
  pathKey,
  useBlockEditing,
  useBlockEditingValue,
  type TrayUpdate,
} from "./BlockEditing.js";
import { BlockPalette } from "./BlockPalette.js";

// ################################################################################################
// #498: the read-only block view of a transformer value (analysis #497). The tree comes from the
// miroir-core block model; each block is memoized on its node, which the model rebuilds only when
// the value changes. Blocks carry the id of the form card at the same path, so the outline
// navigation finds them in both views.
//
// Build transformers, including those with no `interpolation`, are marked as the ViewParams say
// (dashed outline or "build" marker); runtime transformers are not (analysis D1).
//
// A block keeps its own collapsed state, so folding one renders only that block. "Collapse all"
// and "Expand all" remount the tree with every block starting in that state.
//
// #500: with a writer, the view edits the value (BlockEditing.tsx); without one it is read-only.
// Editing shows the palette, an empty row for every absent optional slot, and insert targets in
// empty slots and at the end of list and record slots. The tray, below the program, shows the
// blocks moved out read-only, each with Place and Discard.
// ################################################################################################

export interface BlockEditorViewProps {
  value: unknown;
  /** Path of the value from the form section root; block ids start with it. */
  rootLessListKey: string;
  /** Writes a new value: the view edits the value. */
  onCommit?: (newValue: unknown) => void;
  /** An undo history covers the value: edits act at once (#499). */
  undoable?: boolean;
  /** The blocks moved out of the value, kept by the caller across remounts. */
  tray?: unknown[];
  /** Changes the tray: the view has one. */
  onTrayChange?: (update: TrayUpdate) => void;
}

type InitialCollapse = "default" | "collapsed" | "expanded";

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
/** Literal objects and lists longer than this start collapsed (mockup, analysis #497). */
const LONG_LITERAL = 3;

function blockId(rootLessListKey: string, path: BlockPath): string {
  return [rootLessListKey, ...path.map(String)].filter((segment) => segment !== "").join(".");
}

interface BlockColors {
  text: string;
  textSecondary: string;
  border: string;
  mouth: string;
  field: string;
  /** Block colors by category, from the theme's `components.blockEditor`. */
  blockEditor: BlockEditorColors | undefined;
  onBlock: string;
  literal: string;
}

interface BlockSettings extends BlockColors {
  rootLessListKey: string;
  initialCollapse: InitialCollapse;
  buildMarking: BlockEditorBuildMarking;
}

function useBlockColors(): BlockColors {
  const { currentTheme } = useMiroirTheme();
  return useMemo(() => {
    const colors = currentTheme.colors;
    const text = colors.text ?? "#1f2328";
    const surface = colors.surface ?? "#ffffff";
    return {
      text,
      textSecondary: colors.textSecondary ?? text,
      border: colors.border ?? "#d0d7de",
      mouth: colors.surfaceVariant ?? surface,
      field: colors.background ?? "#ffffff",
      blockEditor: currentTheme.components?.blockEditor,
      onBlock: "#ffffff",
      literal: surface,
    };
  }, [currentTheme]);
}

function containsTransformerBlock(node: BlockNode): boolean {
  switch (node.kind) {
    case "transformer":
    case "json":
      return true;
    case "object":
      return node.entries.some((entry) => containsTransformerBlock(entry.node));
    case "list":
      return node.items.some(containsTransformerBlock);
    default:
      return false;
  }
}

function startsCollapsed(node: BlockNode, initialCollapse: InitialCollapse): boolean {
  if (initialCollapse !== "default") {
    return initialCollapse === "collapsed";
  }
  const size = node.kind === "object" ? node.entries.length : node.kind === "list" ? node.items.length : 0;
  return size > LONG_LITERAL && !containsTransformerBlock(node);
}

function hiddenSummary(node: BlockNode, count: number): string {
  const [one, many] =
    node.kind === "object" ? ["entry", "entries"] : node.kind === "list" ? ["item", "items"] : ["slot", "slots"];
  return `${count} ${count === 1 ? one : many} hidden`;
}

/** The fold state of a block, the toggle of its header and the summary shown when folded. */
function useCollapse(node: BlockNode, settings: BlockSettings, rowCount: number) {
  const [collapsed, setCollapsed] = useState(() => rowCount > 0 && startsCollapsed(node, settings.initialCollapse));
  const toggle = useCallback(() => setCollapsed((current) => !current), []);
  const id = blockId(settings.rootLessListKey, node.path);
  const toggleButton =
    rowCount > 0 ? (
      <button
        type="button"
        data-testid={`block-collapse:${id}`}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand block" : "Collapse block"}
        onClick={toggle}
        css={css({
          font: "inherit",
          fontSize: "11px",
          lineHeight: 1,
          padding: "1px 3px",
          border: "none",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
        })}
      >
        {collapsed ? "▸" : "▾"}
      </button>
    ) : null;
  const summary = collapsed ? (
    <span css={css({ opacity: 0.85, fontSize: "11px", fontStyle: "italic" })}>{hiddenSummary(node, rowCount)}</span>
  ) : null;
  return { collapsed, toggleButton, summary };
}

const Field = React.memo(function Field(props: { value: unknown; settings: BlockSettings }) {
  const text = JSON.stringify(props.value);
  return (
    <span
      title={text}
      css={css({
        fontFamily: "monospace",
        fontSize: "12px",
        background: props.settings.field,
        color: props.settings.text,
        border: `1px solid ${props.settings.border}`,
        borderRadius: "6px",
        padding: "0 6px",
        maxWidth: "40ch",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      })}
    >
      {text}
    </span>
  );
});

/** An empty slot: its insert targets when editing, else a dashed box. */
function EmptySlot(props: { path: BlockPath; settings: BlockSettings }) {
  const editing = useBlockEditing();
  const id = blockId(props.settings.rootLessListKey, props.path);
  const targets = editing?.insertPositions.has(pathKey(props.path));
  return (
    <span
      data-testid={`block-empty:${id}`}
      css={css(
        targets
          ? { display: "inline-flex", gap: "4px" }
          : {
              display: "inline-block",
              width: "48px",
              height: "20px",
              border: `1px dashed ${props.settings.border}`,
              borderRadius: "6px",
            },
      )}
    >
      {targets && <BlockInsertTargets container={props.path} idOf={(path) => blockId(props.settings.rootLessListKey, path)} color={props.settings.border} />}
    </span>
  );
}

const TransformerBlockView = React.memo(function TransformerBlockView(props: {
  node: TransformerBlock;
  settings: BlockSettings;
}) {
  const { node, settings } = props;
  const id = blockId(settings.rootLessListKey, node.path);
  const { collapsed, toggleButton, summary } = useCollapse(node, settings, node.rows.length);
  const color = blockCategoryColor(settings.blockEditor, node.category);
  // an absent interpolation is evaluated as build (TransformersForRuntime)
  const interpolation = node.interpolation ?? "build";
  const marking = interpolation === "build" ? settings.buildMarking : "none";
  return (
    <div
      id={id}
      data-testid={`block:${id}`}
      data-block-kind="transformer"
      data-transformer-type={node.transformerType}
      data-category={node.category}
      data-block-color={color}
      data-interpolation={interpolation}
      data-build-marking={marking}
      role="group"
      aria-label={node.transformerType}
      css={css({
        display: "inline-flex",
        flexDirection: "column",
        maxWidth: "100%",
        background: color,
        color: settings.onBlock,
        border: "1.5px solid rgba(0,0,0,.22)",
        borderRadius: "8px",
        paddingBottom: node.rows.length > 0 && !collapsed ? "6px" : 0,
        verticalAlign: "top",
        ...(marking === "dashedOutline" ? { outline: `2px dashed ${settings.text}`, outlineOffset: "1px" } : {}),
      })}
    >
      <div css={css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 7px", padding: "4px 10px" })}>
        {toggleButton}
        <span css={css({ fontWeight: 700, whiteSpace: "nowrap" })}>{node.transformerType}</span>
        <BlockNodeActions path={node.path} blockId={id} />
        {marking === "marker" && (
          <span
            data-testid={`block-build-marker:${id}`}
            title="Evaluated at build time"
            css={css({
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: 500,
              background: settings.text,
              color: settings.field,
              borderRadius: "4px",
              padding: "0 4px",
              lineHeight: 1.5,
            })}
          >
            build
          </span>
        )}
        {node.label !== undefined && <span css={css({ opacity: 0.85, fontSize: "12px" })}>{node.label}</span>}
        {node.parameters.map((parameter) => (
          <span
            key={parameter.name}
            data-testid={`block-parameter:${blockId(settings.rootLessListKey, [...node.path, parameter.name])}`}
            data-value={JSON.stringify(parameter.value)}
            css={css({ display: "inline-flex", gap: "4px", alignItems: "center" })}
          >
            <span css={css({ opacity: 0.85, fontSize: "12px" })}>{parameter.name}</span>
            <Field value={parameter.value} settings={settings} />
          </span>
        ))}
        {summary}
      </div>
      {node.rows.length > 0 && !collapsed && (
        <div
          css={css({
            marginLeft: "16px",
            background: settings.mouth,
            color: settings.text,
            borderRadius: "6px 0 0 6px",
            padding: "6px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            minWidth: "120px",
          })}
        >
          {node.rows.map((row) => (
            <div
              key={row.name}
              data-testid={`block-row:${blockId(settings.rootLessListKey, row.path)}`}
              data-row-kind={row.kind}
              css={css({ display: "flex", gap: "8px", alignItems: "flex-start", minWidth: 0 })}
            >
              <span
                css={css({
                  color: row.kind === "undeclared" ? "#c62828" : settings.textSecondary,
                  fontSize: "12px",
                  paddingTop: "5px",
                  whiteSpace: "nowrap",
                })}
                title={row.kind === "undeclared" ? `${node.transformerType} does not declare ${row.name}` : undefined}
              >
                {row.kind === "undeclared" ? `⚠ ${row.name}` : row.name}
              </span>
              <span css={css({ minWidth: 0 })}>
                {row.node ? (
                  <BlockNodeView node={row.node} settings={settings} />
                ) : (
                  <EmptySlot path={row.path} settings={settings} />
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const StructureBlockView = React.memo(function StructureBlockView(props: {
  node: Extract<BlockNode, { kind: "object" | "list" }>;
  settings: BlockSettings;
}) {
  const { node, settings } = props;
  const id = blockId(settings.rootLessListKey, node.path);
  const entries =
    node.kind === "object"
      ? node.entries.map((entry) => ({ key: entry.key, node: entry.node }))
      : node.items.map((item, index) => ({ key: String(index), node: item }));
  const { collapsed, toggleButton, summary } = useCollapse(node, settings, entries.length);
  return (
    <div
      id={id}
      data-testid={`block:${id}`}
      data-block-kind={node.kind}
      role="group"
      aria-label={node.kind}
      css={css({
        display: "inline-flex",
        flexDirection: "column",
        background: settings.literal,
        color: settings.text,
        border: `1.5px solid ${settings.border}`,
        borderRadius: "8px",
        padding: "2px 8px 6px",
        gap: "4px",
      })}
    >
      <span css={css({ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: settings.textSecondary })}>
        {toggleButton}
        {node.kind}
        {summary}
      </span>
      {!collapsed &&
        entries.map((entry) => (
          <div key={entry.key} css={css({ display: "flex", gap: "8px", alignItems: "flex-start" })}>
            <span css={css({ fontSize: "12px", color: settings.textSecondary, paddingTop: "3px" })}>{entry.key}</span>
            <BlockNodeView node={entry.node} settings={settings} />
          </div>
        ))}
      {!collapsed && (
        <span css={css({ display: "flex", gap: "4px" })}>
          <BlockInsertTargets container={node.path} idOf={(path) => blockId(settings.rootLessListKey, path)} color={settings.border} />
        </span>
      )}
    </div>
  );
});

const BlockNodeView = React.memo(function BlockNodeView(props: {
  node: BlockNode;
  settings: BlockSettings;
}): JSX.Element {
  const { node, settings } = props;
  const id = blockId(settings.rootLessListKey, node.path);
  switch (node.kind) {
    case "transformer":
      return <TransformerBlockView node={node} settings={settings} />;
    case "object":
    case "list":
      return <StructureBlockView node={node} settings={settings} />;
    case "literal":
      return (
        <span
          data-testid={`block:${id}`}
          data-block-kind={node.quoted ? "quoted" : "literal"}
          title={node.quoted ? "Returned as is, not evaluated" : undefined}
        >
          <Field value={node.value} settings={settings} />
        </span>
      );
    case "mlSchema":
      return (
        <span
          data-testid={`block:${id}`}
          data-block-kind="mlSchema"
          title={JSON.stringify(node.value, null, 2)}
          css={css({
            fontSize: "12px",
            background: settings.literal,
            border: `1px solid ${settings.border}`,
            borderRadius: "999px",
            padding: "1px 8px",
          })}
        >
          ML schema
        </span>
      );
    case "json":
      return (
        <pre
          data-testid={`block:${id}`}
          data-block-kind="json"
          css={css({ margin: 0, fontSize: "12px", border: `1px solid ${settings.border}`, borderRadius: "6px", padding: "4px" })}
        >
          {JSON.stringify(node.value, null, 2)}
        </pre>
      );
  }
});

/** The tray: each block moved out, read-only, with Place (arms it) and Discard. */
function BlockTray(props: { settings: BlockSettings; colors: BlockColors }) {
  const editing = useBlockEditing();
  const tray = editing?.tray;
  const trees = useMemo(() => (tray ?? []).map((block) => transformerBlockTree(block).root), [tray]);
  if (!editing || !tray || tray.length === 0) {
    return null;
  }
  return (
    <section
      data-testid="block-tray"
      aria-label="Tray"
      css={css({ borderTop: `1px dashed ${props.colors.border}`, marginTop: "6px", padding: "6px 4px" })}
    >
      <div css={css({ fontSize: "12px", color: props.colors.textSecondary, marginBottom: "4px" })}>
        Tray: blocks moved out of the transformer, not saved
      </div>
      <div css={css({ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-start" })}>
        {trees.map((root, index) => {
          const placing = editing.armed?.kind === "tray" && editing.armed.index === index;
          return (
            <div
              key={index}
              data-testid={`block-tray-item:${index}`}
              css={css({ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" })}
            >
              {/* read-only: a tray block has no menu nor insert target */}
              <BlockEditingContext.Provider value={undefined}>
                <BlockNodeView
                  node={root}
                  settings={{ ...props.settings, rootLessListKey: `${props.settings.rootLessListKey}~tray.${index}` }}
                />
              </BlockEditingContext.Provider>
              <span css={css({ display: "flex", gap: "4px" })}>
                <ToolButton
                  testId={`block-tray-place:${index}`}
                  label={placing ? "Click an insert target or Replace with to put this block" : "Place this block"}
                  colors={props.colors}
                  pressed={placing}
                  onClick={() => editing.arm(placing ? undefined : { kind: "tray", index })}
                >
                  Place
                </ToolButton>
                <ToolButton
                  testId={`block-tray-discard:${index}`}
                  label="Discard this block"
                  colors={props.colors}
                  onClick={() => editing.discardTrayBlock(index)}
                >
                  Discard
                </ToolButton>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ToolButton(props: {
  testId: string;
  label: string;
  colors: BlockColors;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={props.testId}
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      aria-pressed={props.pressed}
      onClick={props.onClick}
      css={css({
        font: "inherit",
        fontSize: "12px",
        padding: "1px 8px",
        cursor: "pointer",
        border: props.pressed ? `2px solid ${props.colors.text}` : `1px solid ${props.colors.border}`,
        borderRadius: "4px",
        color: props.colors.text,
        backgroundColor: props.colors.literal,
      })}
    >
      {props.children}
    </button>
  );
}

export const BlockEditorView = React.memo(function BlockEditorView(props: BlockEditorViewProps) {
  const editable = props.onCommit !== undefined;
  const tree = useMemo(() => transformerBlockTree(props.value, { emptyOptionalSlots: editable }), [props.value, editable]);
  const editing = useBlockEditingValue(
    props.value,
    props.onCommit,
    props.undoable ?? false,
    props.tray,
    props.onTrayChange,
  );
  const colors = useBlockColors();
  const buildMarking = useBlockEditorBuildMarking();
  const [fold, setFold] = useState<{ initialCollapse: InitialCollapse; generation: number }>({
    initialCollapse: "default",
    generation: 0,
  });
  const [zoom, setZoom] = useState(1);
  const settings: BlockSettings = useMemo(
    () => ({ ...colors, rootLessListKey: props.rootLessListKey, initialCollapse: fold.initialCollapse, buildMarking }),
    [colors, props.rootLessListKey, fold.initialCollapse, buildMarking],
  );
  const foldAll = useCallback(
    (initialCollapse: InitialCollapse) =>
      setFold((current) => ({ initialCollapse, generation: current.generation + 1 })),
    [],
  );
  const changeZoom = useCallback(
    (delta: number) =>
      setZoom((current) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((current + delta) * 10) / 10))),
    [],
  );
  return (
    <BlockEditingContext.Provider value={editing}>
      <div data-testid={`block-editor:${props.rootLessListKey}`} css={css({ color: colors.text })}>
        <div css={css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px", margin: "2px 0 4px" })}>
          <ToolButton testId="block-expand-all" label="Expand all blocks" colors={colors} onClick={() => foldAll("expanded")}>
            Expand all
          </ToolButton>
          <ToolButton testId="block-collapse-all" label="Collapse all blocks" colors={colors} onClick={() => foldAll("collapsed")}>
            Collapse all
          </ToolButton>
          <ToolButton
            testId="block-zoom-out"
            label="Zoom out"
            colors={colors}
            disabled={zoom <= ZOOM_MIN}
            onClick={() => changeZoom(-ZOOM_STEP)}
          >
            −
          </ToolButton>
          <span data-testid="block-zoom-level" css={css({ fontSize: "12px", minWidth: "4.5ch", textAlign: "center" })}>
            {`${Math.round(zoom * 100)} %`}
          </span>
          <ToolButton
            testId="block-zoom-in"
            label="Zoom in"
            colors={colors}
            disabled={zoom >= ZOOM_MAX}
            onClick={() => changeZoom(ZOOM_STEP)}
          >
            +
          </ToolButton>
        </div>
        <div css={css({ display: "flex", gap: "8px", alignItems: "flex-start" })}>
          <BlockPalette
            blockEditor={colors.blockEditor}
            text={colors.text}
            textSecondary={colors.textSecondary}
            border={colors.border}
          />
          <div css={css({ overflowX: "auto", padding: "8px 4px", minWidth: 0, flexGrow: 1 })}>
            <div css={css({ zoom })}>
              <BlockNodeView key={fold.generation} node={tree.root} settings={settings} />
            </div>
            <BlockTray settings={settings} colors={colors} />
          </div>
        </div>
      </div>
    </BlockEditingContext.Provider>
  );
});
