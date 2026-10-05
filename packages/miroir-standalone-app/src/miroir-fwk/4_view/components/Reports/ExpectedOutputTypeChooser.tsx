import React from "react";

import type { Entity, InputOutputPayloadType, InputOutputType } from "miroir-core";

import { ThemedButton, ThemedFlexRow, ThemedSelectWithPortal, ThemedText } from "../Themes/index.js";

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
  "tuple",
] as const;

/** Values of a type parameter or a tuple element, before the entities (#449 D2). */
const TYPE_PARAMETER_VALUES = ["any", "undefined", "bigint", "number", "string", "boolean", "object"] as const;

/** A new tuple has two elements of any type (#449 D9). */
const DEFAULT_TUPLE: InputOutputType = { type: "tuple", payload: ["any", "any"] };

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

/** Select of a type parameter or a tuple element: the D2 values, then the entities. */
const TypeParameterSelect: React.FC<{
  value: InputOutputPayloadType;
  onChange: (value: InputOutputPayloadType) => void;
  entities?: Entity[];
  "data-testid": string;
}> = ({ value, onChange, entities, "data-testid": dataTestId }) => (
  <ThemedSelectWithPortal
    id={dataTestId}
    data-testid={dataTestId}
    value={value}
    onChange={(event) => onChange(event.target.value as InputOutputPayloadType)}
    minWidth="100px"
  >
    {TYPE_PARAMETER_VALUES.map((parameter) => (
      <option key={parameter} value={parameter}>
        {parameter}
      </option>
    ))}
    <EntityOptions entities={entities} />
  </ThemedSelectWithPortal>
);

/**
 * #249 / #449: expected output type of the list transformer: a base type, an entity, `array` /
 * `record` with a type parameter select, or `tuple` with one select per element.
 */
export const ExpectedOutputTypeChooser: React.FC<{
  value: InputOutputType;
  onChange: (value: InputOutputType) => void;
  entities?: Entity[];
}> = ({ value, onChange, entities }) => {
  const kind = expectedOutputKind(value);
  const tupleElements = typeof value === "object" && value.type === "tuple" ? value.payload : undefined;
  const setTupleElements = (elements: InputOutputPayloadType[]) => onChange({ type: "tuple", payload: elements });

  return (
    <ThemedFlexRow align="center" wrap gap="4px">
      <ThemedSelectWithPortal
        id="list-transformer-expected-output-type"
        data-testid="list-transformer-expected-output-type"
        value={kind}
        onChange={(event) =>
          onChange(event.target.value === "tuple" ? DEFAULT_TUPLE : (event.target.value as InputOutputType))
        }
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
          <TypeParameterSelect
            data-testid="list-transformer-expected-output-payload"
            value={typeParameterOf(value)}
            onChange={(parameter) => onChange(withTypeParameter(kind, parameter))}
            entities={entities}
          />
        </>
      ) : null}
      {tupleElements ? (
        <>
          {tupleElements.map((element, index) => (
            <TypeParameterSelect
              key={index}
              data-testid={`list-transformer-expected-output-tuple-${index}`}
              value={element}
              onChange={(parameter) =>
                setTupleElements(tupleElements.map((current, i) => (i === index ? parameter : current)))
              }
              entities={entities}
            />
          ))}
          <ThemedButton
            variant="secondary"
            data-testid="list-transformer-expected-output-tuple-add"
            onClick={() => setTupleElements([...tupleElements, "any"])}
          >
            +
          </ThemedButton>
          <ThemedButton
            variant="secondary"
            data-testid="list-transformer-expected-output-tuple-remove"
            disabled={tupleElements.length <= 1}
            onClick={() => setTupleElements(tupleElements.slice(0, -1))}
          >
            −
          </ThemedButton>
        </>
      ) : null}
    </ThemedFlexRow>
  );
};
