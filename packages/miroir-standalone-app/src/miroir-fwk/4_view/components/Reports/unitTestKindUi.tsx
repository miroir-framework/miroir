import React from "react";

export type UnitTestKind =
  | "functionCallTest"
  | "queryTest"
  | "transformerTest"
  | "unitTestSuite";

const KIND_STYLES: Record<
  UnitTestKind,
  { label: string; backgroundColor: string; color: string }
> = {
  functionCallTest: {
    label: "Function call",
    backgroundColor: "#e3f2fd",
    color: "#1565c0",
  },
  queryTest: {
    label: "Query runner",
    backgroundColor: "#f3e5f5",
    color: "#6a1b9a",
  },
  transformerTest: {
    label: "Transformer",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
  unitTestSuite: {
    label: "Suite",
    backgroundColor: "#fff3e0",
    color: "#e65100",
  },
};

export function getUnitTestKind(value: unknown): UnitTestKind | undefined {
  if (value == null || typeof value !== "object") {
    return undefined;
  }
  const kind = (value as { unitTestType?: string }).unitTestType;
  if (
    kind === "functionCallTest" ||
    kind === "queryTest" ||
    kind === "transformerTest" ||
    kind === "unitTestSuite"
  ) {
    return kind;
  }
  return undefined;
}

export function unitTestAnchorId(label: string): string {
  return `unit-test-anchor-${encodeURIComponent(label)}`;
}

export function extractUnitTestLabelFromTestPath(testPath: string[] | undefined): string | undefined {
  if (!testPath || testPath.length === 0) {
    return undefined;
  }
  return testPath[testPath.length - 1];
}

export const UnitTestKindBadge: React.FC<{ kind: UnitTestKind; style?: React.CSSProperties }> = ({
  kind,
  style,
}) => {
  const palette = KIND_STYLES[kind];
  return (
    <span
      title={`Unit test kind: ${palette.label}`}
      style={{
        display: "inline-block",
        marginLeft: "8px",
        padding: "2px 8px",
        borderRadius: "10px",
        fontSize: "11px",
        fontWeight: 600,
        lineHeight: 1.4,
        backgroundColor: palette.backgroundColor,
        color: palette.color,
        verticalAlign: "middle",
        ...style,
      }}
    >
      {palette.label}
    </span>
  );
};

export const HIGHLIGHTED_UNIT_TEST_STYLE: React.CSSProperties = {
  outline: "2px solid #ff9800",
  outlineOffset: "2px",
  borderRadius: "6px",
  backgroundColor: "rgba(255, 152, 0, 0.08)",
};
