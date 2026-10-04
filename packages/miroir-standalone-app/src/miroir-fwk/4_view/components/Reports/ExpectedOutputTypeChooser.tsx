import React from "react";

import type { Entity, InputOutputPayloadType, InputOutputType } from "miroir-core";

import { ThemedFlexRow, ThemedSelectWithPortal, ThemedText } from "../Themes/index.js";

/** Main choices of the expected output type, before the entities (#449 D1, D4). */
const EXPECTED_OUTPUT_KINDS = [
  "any",
  "undefined",
  "bigint",
  "number",
  "string",
  "boolean",
  "object",
  "array",
  "record",
] as const;

/** Values of a type parameter, before the entities (#449 D2). */
const TYPE_PARAMETER_VALUES = ["any", "undefined", "bigint", "number", "string", "boolean", "object"] as const;

/** The main select's value: the kind of a parameterized type, else the type itself. */
function expectedOutputKind(type: InputOutputType): string {
  return typeof type === "object" ? type.type : type;
}

/** `array` / `record` of `parameter`; `any` gives the bare literal (#449 D9). */
function withTypeParameter(kind: "array" | "record", parameter: InputOutputPayloadType): InputOutputType {
  return parameter === "any" ? kind : { type: kind, payload: parameter };
}

function typeParameterOf(type: InputOutputType): InputOutputPayloadType {
  return typeof type === "object" && type.type !== "tuple" ? (type.payload ?? "any") : "any";
}

const EntityOptions: React.FC<{ entities?: Entity[] }> = ({ entities }) => (
  <>
    {[...(entities ?? [])]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entity) => (
        <option key={entity.uuid} value={entity.uuid}>
          {entity.name}
        </option>
      ))}
  </>
);

/**
 * #249 / #449: expected output type of the list transformer: a base type, an entity, or `array` /
 * `record` with a type parameter select.
 */
export const ExpectedOutputTypeChooser: React.FC<{
  value: InputOutputType;
  onChange: (value: InputOutputType) => void;
  entities?: Entity[];
}> = ({ value, onChange, entities }) => {
  const kind = expectedOutputKind(value);
  return (
    <ThemedFlexRow align="center" wrap gap="4px">
      <ThemedSelectWithPortal
        id="list-transformer-expected-output-type"
        data-testid="list-transformer-expected-output-type"
        value={kind}
        onChange={(event) => onChange(event.target.value as InputOutputType)}
        minWidth="160px"
      >
        {EXPECTED_OUTPUT_KINDS.map((outputKind) => (
          <option key={outputKind} value={outputKind}>
            {outputKind}
          </option>
        ))}
        <EntityOptions entities={entities} />
      </ThemedSelectWithPortal>
      {kind === "array" || kind === "record" ? (
        <>
          <ThemedText>of</ThemedText>
          <ThemedSelectWithPortal
            id="list-transformer-expected-output-payload"
            data-testid="list-transformer-expected-output-payload"
            value={typeParameterOf(value)}
            onChange={(event) =>
              onChange(withTypeParameter(kind, event.target.value as InputOutputPayloadType))
            }
            minWidth="100px"
          >
            {TYPE_PARAMETER_VALUES.map((parameter) => (
              <option key={parameter} value={parameter}>
                {parameter}
              </option>
            ))}
            <EntityOptions entities={entities} />
          </ThemedSelectWithPortal>
        </>
      ) : null}
    </ThemedFlexRow>
  );
};
