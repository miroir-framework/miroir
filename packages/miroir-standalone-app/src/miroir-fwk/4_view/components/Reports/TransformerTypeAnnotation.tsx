/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import type { TransformerTypeBadge, TransformerTypeBadgePart } from "../ValueObjectEditor/MlElementEditorInterface.js";

export type TransformerAnnotationPath = (string | number)[];

export type TransformerEnvironmentAnnotation = {
  path: TransformerAnnotationPath;
  label: string;
  contextNames?: string[];
  parameterNames?: string[];
  transformerType?: string;
};

export function annotationPathKey(path: TransformerAnnotationPath | undefined): string {
  if (!path || path.length === 0) {
    return "root";
  }
  return path.map(String).join(".");
}

export function findPathAnnotation<T extends { path: TransformerAnnotationPath }>(
  annotations: T[] | undefined,
  currentPath: TransformerAnnotationPath | undefined,
): T | undefined {
  const path = currentPath ?? [];
  return (annotations ?? []).find((annotation) => {
    if (annotation.path.length !== path.length) {
      return false;
    }
    return path.every((segment, index) => String(segment) === String(annotation.path[index]));
  });
}

/**
 * Parse the flat annotation label produced for mlSchema display:
 * `in: X → out: Y`
 */
export function parseMlSchemaAnnotationLabel(label: string): {
  inLabel: string;
  outLabel: string;
} {
  const match = label.match(/^in:\s*(.*?)\s*→\s*out:\s*(.*)$/);
  if (!match) {
    return { inLabel: label, outLabel: "unknown" };
  }
  return { inLabel: match[1], outLabel: match[2] };
}

export function shortTypeName(label: string): string {
  const brace = label.indexOf("{");
  return (brace >= 0 ? label.slice(0, brace) : label).trim();
}

function uniqueBindingNames(names: string[] | undefined): string[] {
  return [...new Set((names ?? []).filter((name) => name.length > 0 && name !== "(none)"))];
}

const typeNameStyles = css({
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontWeight: 600,
  fontSize: "0.92em",
  lineHeight: 1.2,
});

/** Quiet `User → User` on a title row. Attributes live in the hover title. */
export const TransformerTitleSignature: React.FC<{
  inLabel: string;
  outLabel: string;
  inadequate?: boolean;
  "data-testid"?: string;
  title?: string;
}> = ({
  inLabel,
  outLabel,
  inadequate = false,
  "data-testid": dataTestId,
  title,
}) => {
  const { currentTheme } = useMiroirTheme();
  const inName = shortTypeName(inLabel);
  const outName = shortTypeName(outLabel);

  return (
    <span
      data-testid={dataTestId}
      data-transformer-inadequate={inadequate ? "true" : "false"}
      title={title ?? `${inLabel} → ${outLabel}`}
      css={css({
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "6px",
        minWidth: 0,
        color: currentTheme.colors.text,
      })}
    >
      <span css={typeNameStyles}>{inName}</span>
      <span
        aria-hidden="true"
        css={css({
          color: currentTheme.colors.textSecondary || currentTheme.colors.text,
          opacity: 0.45,
        })}
      >
        →
      </span>
      <span css={typeNameStyles}>{outName}</span>
      {inadequate ? (
        <span
          css={css({
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#e65100",
            backgroundColor: "rgba(255, 152, 0, 0.16)",
            border: "1px solid #ff9800",
            borderRadius: currentTheme.borderRadius.sm,
            padding: "0 6px",
            lineHeight: "18px",
          })}
        >
          mismatch
        </span>
      ) : null}
    </span>
  );
};

/** Quiet `ctx` / `params` name list on a title row. */
export const TransformerNamedBindings: React.FC<{
  kind: "context" | "parameters";
  names?: string[];
  title?: string;
  "data-testid"?: string;
}> = ({
  kind,
  names,
  title,
  "data-testid": dataTestId,
}) => {
  const { currentTheme } = useMiroirTheme();
  const visibleNames = uniqueBindingNames(names);
  if (visibleNames.length === 0) {
    return null;
  }

  return (
    <span
      data-testid={dataTestId}
      title={title ?? visibleNames.join(", ")}
      css={css({
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        minWidth: 0,
        color: currentTheme.colors.textSecondary || currentTheme.colors.text,
        fontFamily: currentTheme.typography.fontFamily,
        fontSize: "11px",
        letterSpacing: "0.04em",
        lineHeight: 1.2,
      })}
    >
      <span css={css({ fontWeight: 700, opacity: 0.7, flexShrink: 0 })}>
        {kind === "parameters" ? "params" : "ctx"}
      </span>
      <span
        css={css({
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontWeight: 500,
          letterSpacing: 0,
          fontSize: currentTheme.typography.fontSize.sm,
          color: currentTheme.colors.text,
        })}
      >
        {visibleNames.join(", ")}
      </span>
    </span>
  );
};

const typeStatusColors = {
  match: "#2e7d32",
  mismatch: "#c62828",
} as const;

/**
 * #470: one part of a type badge, its label then its type. The chip never wraps; a type longer
 * than the line is cut with an ellipsis, and the chip's tooltip has the full type.
 */
const TransformerTypePartChip: React.FC<{ part: TransformerTypeBadgePart; pathKey: string }> = ({ part, pathKey }) => {
  const { currentTheme } = useMiroirTheme();
  const secondary = currentTheme.colors.textSecondary || currentTheme.colors.text;
  return (
    <span
      data-testid={`transformer-type-part-${pathKey}-${part.kind}`}
      data-transformer-type-part={part.kind}
      data-transformer-type-part-status={part.mismatch ? "mismatch" : "neutral"}
      title={`${part.kind} ${part.title}`}
      css={css({
        display: "inline-flex",
        alignItems: "baseline",
        gap: "4px",
        minWidth: 0,
        maxWidth: "100%",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        padding: "0 6px",
        lineHeight: "18px",
        borderRadius: currentTheme.borderRadius.sm,
        border: `1px solid ${part.mismatch ? "#ef5350" : "rgba(128, 128, 128, 0.35)"}`,
        backgroundColor: part.mismatch ? "rgba(198, 40, 40, 0.10)" : "rgba(128, 128, 128, 0.08)",
        color: part.mismatch ? typeStatusColors.mismatch : currentTheme.colors.text,
      })}
    >
      <span
        css={css({
          flexShrink: 0,
          fontFamily: currentTheme.typography.fontFamily,
          fontSize: "10px",
          color: part.mismatch ? typeStatusColors.mismatch : secondary,
        })}
      >
        {part.kind}
      </span>
      <span
        css={css({
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontWeight: 500,
          fontSize: "12px",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
        })}
      >
        {part.label}
      </span>
    </span>
  );
};

/**
 * #453: the type badge of a transformer node or literal value. #470: on its own line under the
 * node's title row, one chip per part; lines break between chips, never inside one. A dot gives
 * the node's status (green when the input it reads fits its declared input, red on a mismatch,
 * grey when there is nothing to compare); only the parts of a mismatch are red.
 */
export const TransformerTypeBadgeLine: React.FC<{ badge: TransformerTypeBadge }> = ({ badge }) => {
  const { currentTheme } = useMiroirTheme();
  const pathKey = annotationPathKey(badge.path);
  const secondary = currentTheme.colors.textSecondary || currentTheme.colors.text;
  const isNode = badge.givenLabel !== undefined;
  // a span, so that the line can also sit inside a label (primitive literals)
  return (
    <span
      data-testid={`transformer-type-badge-${pathKey}`}
      data-transformer-type-status={badge.status}
      data-transformer-type-given={badge.givenLabel}
      data-transformer-type-consumed={badge.consumedLabel}
      data-transformer-type-declared={
        badge.declaredLabel ? `${badge.declaredLabel.input} → ${badge.declaredLabel.output}` : undefined
      }
      data-transformer-type-output={badge.outputLabel}
      title={badge.title}
      css={css({
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "4px",
        minWidth: 0,
        maxWidth: "100%",
        margin: "2px 0 4px",
      })}
    >
      {isNode ? (
        <span
          aria-label={`types ${badge.status}`}
          data-testid={`transformer-type-status-${pathKey}`}
          css={css({
            flexShrink: 0,
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor:
              badge.status === "unknown" ? "rgba(128, 128, 128, 0.55)" : typeStatusColors[badge.status],
          })}
        />
      ) : null}
      {badge.parts.map((part) => (
        <TransformerTypePartChip key={part.kind} part={part} pathKey={pathKey} />
      ))}
      {badge.declaredMatchesActual && badge.declaredLabel ? (
        <span
          data-testid={`transformer-type-declared-match-${pathKey}`}
          title={`declared ${badge.declaredLabel.input} → ${badge.declaredLabel.output}`}
          css={css({
            fontFamily: currentTheme.typography.fontFamily,
            fontSize: "10px",
            whiteSpace: "nowrap",
            color: secondary,
          })}
        >
          ✓ declared
        </span>
      ) : null}
    </span>
  );
};

/** Title-row types + bindings for one editor path. Root is skipped when the panel already shows it. */
export const TransformerTitleRowAnnotations: React.FC<{
  path: TransformerAnnotationPath;
  skipRoot?: boolean;
  showMlSchemaTypes?: boolean;
  mlSchemaTypeAnnotations?: { path: TransformerAnnotationPath; label: string }[];
  environmentAnnotations?: TransformerEnvironmentAnnotation[];
  inadequate?: boolean;
  inadequateTitle?: string;
}> = ({
  path,
  skipRoot = false,
  showMlSchemaTypes,
  mlSchemaTypeAnnotations,
  environmentAnnotations,
  inadequate = false,
  inadequateTitle,
}) => {
  if (skipRoot && path.length === 0) {
    return null;
  }

  const pathKey = annotationPathKey(path);
  const typeAnnotation = showMlSchemaTypes
    ? findPathAnnotation(mlSchemaTypeAnnotations, path)
    : undefined;
  const environmentAnnotation = findPathAnnotation(environmentAnnotations, path);
  if (!typeAnnotation && !environmentAnnotation) {
    return null;
  }

  const parsed = typeAnnotation
    ? parseMlSchemaAnnotationLabel(typeAnnotation.label)
    : undefined;

  return (
    <>
      {parsed ? (
        <TransformerTitleSignature
          inLabel={parsed.inLabel}
          outLabel={parsed.outLabel}
          inadequate={inadequate}
          title={inadequateTitle ?? `${parsed.inLabel} → ${parsed.outLabel}`}
          data-testid={`list-transformer-mlschema-node-${pathKey}`}
        />
      ) : null}
      {environmentAnnotation ? (
        <TransformerNamedBindings
          kind="context"
          names={environmentAnnotation.contextNames}
          title={environmentAnnotation.label}
          data-testid={`list-transformer-environment-node-${pathKey}`}
        />
      ) : null}
    </>
  );
};

/**
 * #470: the type badge line of one editor path, shown under the node's title row so that the row
 * keeps its label and buttons in place. Root is skipped when the panel already shows it.
 */
export const TransformerTypeBadgeRow: React.FC<{
  path: TransformerAnnotationPath;
  transformerTypeBadges?: TransformerTypeBadge[];
}> = ({ path, transformerTypeBadges }) => {
  if (path.length === 0) {
    return null;
  }
  const typeBadge = findPathAnnotation(transformerTypeBadges, path);
  return typeBadge ? <TransformerTypeBadgeLine badge={typeBadge} /> : null;
};
