/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";

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
