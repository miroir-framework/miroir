/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { transformerBlockTree, type BlockNode, type BlockPath, type TransformerBlock } from "miroir-core";
import React, { useMemo } from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";

// ################################################################################################
// #498: the read-only block view of a transformer value (analysis #497). The tree comes from the
// miroir-core block model; each block is memoized on its node, which the model rebuilds only when
// the value changes. Blocks carry the id of the form card at the same path, so the outline
// navigation finds them in both views.
// ################################################################################################

export interface BlockEditorViewProps {
  value: unknown;
  /** Path of the value from the form section root; block ids start with it. */
  rootLessListKey: string;
}

function blockId(rootLessListKey: string, path: BlockPath): string {
  return [rootLessListKey, ...path.map(String)].filter((segment) => segment !== "").join(".");
}

interface BlockStyle {
  text: string;
  textSecondary: string;
  border: string;
  mouth: string;
  field: string;
  block: string;
  onBlock: string;
  literal: string;
}

function useBlockStyle(): BlockStyle {
  const { currentTheme } = useMiroirTheme();
  return useMemo(
    () => {
      const colors = currentTheme.colors;
      const text = colors.text ?? "#1f2328";
      const surface = colors.surface ?? "#ffffff";
      return {
        text,
        textSecondary: colors.textSecondary ?? text,
        border: colors.border ?? "#d0d7de",
        mouth: colors.surfaceVariant ?? surface,
        field: colors.background ?? "#ffffff",
        block: colors.primary ?? "#4c97ff",
        onBlock: "#ffffff",
        literal: surface,
      };
    },
    [currentTheme],
  );
}

const Field = React.memo(function Field(props: { value: unknown; style: BlockStyle }) {
  return (
    <span
      css={css({
        fontFamily: "monospace",
        fontSize: "12px",
        background: props.style.field,
        color: props.style.text,
        border: `1px solid ${props.style.border}`,
        borderRadius: "6px",
        padding: "0 6px",
        maxWidth: "40ch",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      })}
    >
      {JSON.stringify(props.value)}
    </span>
  );
});

const TransformerBlockView = React.memo(function TransformerBlockView(props: {
  node: TransformerBlock;
  rootLessListKey: string;
  style: BlockStyle;
}) {
  const { node, style } = props;
  return (
    <div
      id={blockId(props.rootLessListKey, node.path)}
      data-testid={`block:${blockId(props.rootLessListKey, node.path)}`}
      data-transformer-type={node.transformerType}
      data-category={node.category}
      role="group"
      aria-label={node.transformerType}
      css={css({
        display: "inline-flex",
        flexDirection: "column",
        maxWidth: "100%",
        background: style.block,
        color: style.onBlock,
        border: "1.5px solid rgba(0,0,0,.22)",
        borderRadius: "8px",
        paddingBottom: node.rows.length > 0 ? "6px" : 0,
        verticalAlign: "top",
      })}
    >
      <div css={css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 7px", padding: "4px 10px" })}>
        <span css={css({ fontWeight: 700, whiteSpace: "nowrap" })}>{node.transformerType}</span>
        {node.label !== undefined && <span css={css({ opacity: 0.85, fontSize: "12px" })}>{node.label}</span>}
        {node.parameters.map((parameter) => (
          <span key={parameter.name} css={css({ display: "inline-flex", gap: "4px", alignItems: "center" })}>
            <span css={css({ opacity: 0.85, fontSize: "12px" })}>{parameter.name}</span>
            <Field value={parameter.value} style={style} />
          </span>
        ))}
      </div>
      {node.rows.length > 0 && (
        <div
          css={css({
            marginLeft: "16px",
            background: style.mouth,
            color: style.text,
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
              data-testid={`block-row:${blockId(props.rootLessListKey, row.path)}`}
              data-row-kind={row.kind}
              css={css({ display: "flex", gap: "8px", alignItems: "flex-start", minWidth: 0 })}
            >
              <span
                css={css({
                  color: row.kind === "undeclared" ? "#c62828" : style.textSecondary,
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
                  <BlockNodeView node={row.node} rootLessListKey={props.rootLessListKey} style={style} />
                ) : (
                  <span
                    data-testid={`block-empty:${blockId(props.rootLessListKey, row.path)}`}
                    css={css({ display: "inline-block", width: "48px", height: "20px", border: `1px dashed ${style.border}`, borderRadius: "6px" })}
                  />
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
  rootLessListKey: string;
  style: BlockStyle;
}) {
  const { node, style } = props;
  const entries =
    node.kind === "object"
      ? node.entries.map((entry) => ({ key: entry.key, node: entry.node }))
      : node.items.map((item, index) => ({ key: String(index), node: item }));
  return (
    <div
      id={blockId(props.rootLessListKey, node.path)}
      data-testid={`block:${blockId(props.rootLessListKey, node.path)}`}
      role="group"
      aria-label={node.kind}
      css={css({
        display: "inline-flex",
        flexDirection: "column",
        background: style.literal,
        color: style.text,
        border: `1.5px solid ${style.border}`,
        borderRadius: "8px",
        padding: "2px 8px 6px",
        gap: "4px",
      })}
    >
      <span css={css({ fontSize: "12px", color: style.textSecondary })}>
        {node.kind === "object" ? "object" : "list"}
      </span>
      {entries.map((entry) => (
        <div key={entry.key} css={css({ display: "flex", gap: "8px", alignItems: "flex-start" })}>
          <span css={css({ fontSize: "12px", color: style.textSecondary, paddingTop: "3px" })}>{entry.key}</span>
          <BlockNodeView node={entry.node} rootLessListKey={props.rootLessListKey} style={style} />
        </div>
      ))}
    </div>
  );
});

const BlockNodeView = React.memo(function BlockNodeView(props: {
  node: BlockNode;
  rootLessListKey: string;
  style: BlockStyle;
}): JSX.Element {
  const { node, style } = props;
  switch (node.kind) {
    case "transformer":
      return <TransformerBlockView node={node} rootLessListKey={props.rootLessListKey} style={style} />;
    case "object":
    case "list":
      return <StructureBlockView node={node} rootLessListKey={props.rootLessListKey} style={style} />;
    case "literal":
      return (
        <span data-testid={`block:${blockId(props.rootLessListKey, node.path)}`}>
          <Field value={node.value} style={style} />
        </span>
      );
    case "mlSchema":
      return (
        <span
          data-testid={`block:${blockId(props.rootLessListKey, node.path)}`}
          title={JSON.stringify(node.value, null, 2)}
          css={css({
            fontSize: "12px",
            background: style.literal,
            border: `1px solid ${style.border}`,
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
          data-testid={`block:${blockId(props.rootLessListKey, node.path)}`}
          css={css({ margin: 0, fontSize: "12px", border: `1px solid ${style.border}`, borderRadius: "6px", padding: "4px" })}
        >
          {JSON.stringify(node.value, null, 2)}
        </pre>
      );
  }
});

export const BlockEditorView = React.memo(function BlockEditorView(props: BlockEditorViewProps) {
  const tree = useMemo(() => transformerBlockTree(props.value), [props.value]);
  const style = useBlockStyle();
  return (
    <div
      data-testid={`block-editor:${props.rootLessListKey}`}
      css={css({ overflowX: "auto", padding: "8px 4px", color: style.text })}
    >
      <BlockNodeView node={tree.root} rootLessListKey={props.rootLessListKey} style={style} />
    </div>
  );
});
