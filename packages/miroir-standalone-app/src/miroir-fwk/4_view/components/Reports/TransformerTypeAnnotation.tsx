/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import type { InputOutputType } from "miroir-core";
import React from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import type { TransformerTypeBadge } from "../ValueObjectEditor/MlElementEditorInterface.js";

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

const ENTITY_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Human-readable label of an `inputOutput` type: an entity uuid gives the entity name when known,
 * arrays and objects their payload, `array<Book>`. With `shortenUnknownUuids` (#453 D18), an
 * unknown entity uuid gives its first 8 characters.
 */
export function formatInputOutputTypeLabel(
  type: InputOutputType,
  entities?: { uuid: string; name?: string }[],
  options?: { shortenUnknownUuids?: boolean },
): string {
  if (typeof type === "object") {
    const payloadLabel =
      type.payload === undefined || type.payload === "any"
        ? "any"
        : formatInputOutputTypeLabel(type.payload as InputOutputType, entities, options);
    return `${type.type}<${payloadLabel}>`;
  }
  const entityName = entities?.find((entity) => entity.uuid === type)?.name;
  if (entityName) {
    return entityName;
  }
  return options?.shortenUnknownUuids && ENTITY_UUID_REGEX.test(type) ? type.slice(0, 8) : type;
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

/** #453: text of a type badge, the given input first and the output last. */
export function transformerTypeBadgeText(badge: TransformerTypeBadge): string {
  if (badge.givenLabel === undefined) {
    return `value ${badge.outputLabel}`;
  }
  return [
    `in ${badge.givenLabel}`,
    ...(badge.consumedLabel !== undefined ? [`applyTo ${badge.consumedLabel}`] : []),
    ...(badge.declaredLabel ? [`declared ${badge.declaredLabel.input} → ${badge.declaredLabel.output}`] : []),
    `out ${badge.outputLabel}`,
  ].join(" · ");
}

/**
 * #453: the type badge of a transformer node or literal value. Green when the input the node reads
 * fits its declared input, red on a mismatch, grey when there is nothing to compare.
 */
export const TransformerTypeBadgeChip: React.FC<{ badge: TransformerTypeBadge }> = ({ badge }) => {
  const { currentTheme } = useMiroirTheme();
  const colors = {
    match: { color: "#2e7d32", background: "rgba(46, 125, 50, 0.10)", border: "#66bb6a" },
    mismatch: { color: "#c62828", background: "rgba(198, 40, 40, 0.10)", border: "#ef5350" },
    unknown: {
      color: currentTheme.colors.textSecondary || currentTheme.colors.text,
      background: "rgba(128, 128, 128, 0.10)",
      border: "rgba(128, 128, 128, 0.45)",
    },
  }[badge.status];
  return (
    <span
      data-testid={`transformer-type-badge-${annotationPathKey(badge.path)}`}
      data-transformer-type-status={badge.status}
      data-transformer-type-given={badge.givenLabel}
      data-transformer-type-consumed={badge.consumedLabel}
      data-transformer-type-declared={
        badge.declaredLabel ? `${badge.declaredLabel.input} → ${badge.declaredLabel.output}` : undefined
      }
      data-transformer-type-output={badge.outputLabel}
      title={badge.title}
      css={css({
        ...typeNameStyles,
        fontWeight: 500,
        fontSize: "11px",
        color: colors.color,
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: currentTheme.borderRadius.sm,
        padding: "0 6px",
        lineHeight: "18px",
        whiteSpace: "nowrap",
      })}
    >
      {transformerTypeBadgeText(badge)}
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
  /** #453: type badges of the TransformerEditor, shown when the path has one. */
  transformerTypeBadges?: TransformerTypeBadge[];
  inadequate?: boolean;
  inadequateTitle?: string;
}> = ({
  path,
  skipRoot = false,
  showMlSchemaTypes,
  mlSchemaTypeAnnotations,
  environmentAnnotations,
  transformerTypeBadges,
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
  const typeBadge = findPathAnnotation(transformerTypeBadges, path);
  if (!typeAnnotation && !environmentAnnotation && !typeBadge) {
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
      {typeBadge ? <TransformerTypeBadgeChip badge={typeBadge} /> : null}
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
