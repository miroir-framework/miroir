import type { MlElement } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
// Issue #505 (analysis #497, G8, round 3 Q3) — the "when run" hat of a custom Runner: its name,
// its label and its form fields. The Runner's form values are given to its sequence under the
// Runner's name (RunnerView), so the sequence reads a field `f` as `[runnerName, f]`, with
// `getFromParameters` or, at runtime, `getFromContext`. A field the sequence reads cannot be
// removed; a rename rewrites its reads. Only a form given as an ML schema (`formMLSchemaType:
// "mlSchema"`) of type object has fields the hat can edit.
// ################################################################################################

type Path = (string | number)[];

export interface RunnerHatField {
  name: string;
  /** The `type` of the field's ML schema. */
  type: string;
  /** Whether the sequence reads the field. */
  read: boolean;
}

export interface RunnerHat {
  name: string;
  label: string;
  fields: RunnerHatField[];
}

/** The types a field added in the hat can have. */
export const RUNNER_FORM_FIELD_TYPES = ["string", "number", "boolean", "uuid"] as const;

const FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const READ_TYPES = new Set(["getFromParameters", "getFromContext"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function customRunnerDefinition(runner: unknown): Record<string, unknown> | undefined {
  const definition = isRecord(runner) ? runner.definition : undefined;
  return isRecord(definition) && definition.runnerType === "customRunner" ? definition : undefined;
}

/** The ML schemas of the form fields of `runner`, by name, when its form is an object ML schema. */
function formFieldSchemas(runner: unknown): Record<string, MlElement> | undefined {
  const formMLSchema = customRunnerDefinition(runner)?.formMLSchema;
  if (!isRecord(formMLSchema) || formMLSchema.formMLSchemaType !== "mlSchema") {
    return undefined;
  }
  const mlSchema = formMLSchema.mlSchema;
  return isRecord(mlSchema) && mlSchema.type === "object" && isRecord(mlSchema.definition)
    ? (mlSchema.definition as Record<string, MlElement>)
    : undefined;
}

/** The paths of the reads of `[runnerName, field, …]` in `value`, by field; quoted values are not read. */
function fieldReadPaths(value: unknown, runnerName: string, path: Path = []): { field: string; path: Path }[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => fieldReadPaths(item, runnerName, [...path, index]));
  }
  if (!isRecord(value)) {
    return [];
  }
  const own =
    READ_TYPES.has(String(value.transformerType)) &&
    Array.isArray(value.referencePath) &&
    value.referencePath[0] === runnerName &&
    typeof value.referencePath[1] === "string"
      ? [{ field: value.referencePath[1], path }]
      : [];
  const nested = Object.entries(value)
    .filter(([key]) => !(value.transformerType === "returnValue" && key === "value"))
    .flatMap(([key, entry]) => fieldReadPaths(entry, runnerName, [...path, key]));
  return [...own, ...nested];
}

/** The fields of `runner`'s form its sequence reads. */
export function runnerFormFieldReads(runner: unknown): string[] {
  const definition = customRunnerDefinition(runner);
  if (!definition || !isRecord(runner) || typeof runner.name !== "string") {
    return [];
  }
  return [...new Set(fieldReadPaths(definition.compositeActionSequence, runner.name).map((read) => read.field))];
}

/** The hat of a custom Runner: its name, label and form fields; `undefined` for any other value. */
export function runnerHat(runner: unknown): RunnerHat | undefined {
  if (!customRunnerDefinition(runner) || !isRecord(runner) || typeof runner.name !== "string") {
    return undefined;
  }
  const reads = new Set(runnerFormFieldReads(runner));
  return {
    name: runner.name,
    label: typeof runner.defaultLabel === "string" ? runner.defaultLabel : runner.name,
    fields: Object.entries(formFieldSchemas(runner) ?? {}).map(([name, schema]) => ({
      name,
      type: String(schema?.type ?? "any"),
      read: reads.has(name),
    })),
  };
}

/** `runner` with `fields` as the definition of its form's ML schema. */
function withFormFields(runner: Record<string, unknown>, fields: Record<string, MlElement>): Record<string, unknown> {
  const definition = customRunnerDefinition(runner) ?? {};
  const formMLSchema = isRecord(definition.formMLSchema) ? definition.formMLSchema : {};
  const mlSchema = isRecord(formMLSchema.mlSchema) ? formMLSchema.mlSchema : {};
  return {
    ...runner,
    definition: {
      ...definition,
      formMLSchema: { ...formMLSchema, formMLSchemaType: "mlSchema", mlSchema: { ...mlSchema, type: "object", definition: fields } },
    },
  };
}

function editableFields(runner: unknown): Record<string, MlElement> {
  if (!customRunnerDefinition(runner)) {
    throw new Error("the value is not a custom Runner");
  }
  const definition = customRunnerDefinition(runner);
  const formMLSchema = definition?.formMLSchema;
  if (isRecord(formMLSchema) && formMLSchema.formMLSchemaType !== "mlSchema") {
    throw new Error("the form of this Runner is computed by a transformer: edit it in the form view");
  }
  return formFieldSchemas(runner) ?? {};
}

function checkNewFieldName(fields: Record<string, MlElement>, name: string): void {
  if (!FIELD_NAME.test(name)) {
    throw new Error(`"${name}" is not a field name: use letters, digits and _, not starting with a digit`);
  }
  if (Object.hasOwn(fields, name)) {
    throw new Error(`the form already has a field ${name}`);
  }
}

/** `runner` with a new form field `name` of ML type `type`, after the others. */
export function addRunnerFormField(runner: unknown, name: string, type: string = "string"): Record<string, unknown> {
  const fields = editableFields(runner);
  checkNewFieldName(fields, name);
  return withFormFields(runner as Record<string, unknown>, { ...fields, [name]: { type } as MlElement });
}

/** Copy of `value` with `update` applied at `path`. */
function updateAt(value: unknown, path: Path, update: (current: unknown) => unknown): unknown {
  if (path.length === 0) {
    return update(value);
  }
  const [head, ...rest] = path;
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[Number(head)] = updateAt(value[Number(head)], rest, update);
    return copy;
  }
  const base = isRecord(value) ? value : {};
  return { ...base, [head]: updateAt(base[head], rest, update) };
}

/** `runner` with its form field `from` named `to`, in place, and every read of it in the sequence rewritten. */
export function renameRunnerFormField(runner: unknown, from: string, to: string): Record<string, unknown> {
  const fields = editableFields(runner);
  if (!Object.hasOwn(fields, from)) {
    throw new Error(`the form has no field ${from}`);
  }
  if (from === to) {
    return runner as Record<string, unknown>;
  }
  checkNewFieldName(fields, to);
  const renamed = withFormFields(
    runner as Record<string, unknown>,
    Object.fromEntries(Object.entries(fields).map(([name, schema]) => [name === from ? to : name, schema])),
  );
  const definition = customRunnerDefinition(renamed) as Record<string, unknown>;
  const runnerName = String((runner as Record<string, unknown>).name);
  const sequence = fieldReadPaths(definition.compositeActionSequence, runnerName)
    .filter((read) => read.field === from)
    .reduce(
      (current, read) =>
        updateAt(current, [...read.path, "referencePath"], (referencePath) =>
          (referencePath as unknown[]).map((segment, index) => (index === 1 ? to : segment)),
        ),
      definition.compositeActionSequence,
    );
  return { ...renamed, definition: { ...definition, compositeActionSequence: sequence } };
}

/** `runner` without its form field `name`; refused while the sequence reads it. */
export function removeRunnerFormField(runner: unknown, name: string): Record<string, unknown> {
  const fields = editableFields(runner);
  if (!Object.hasOwn(fields, name)) {
    throw new Error(`the form has no field ${name}`);
  }
  if (runnerFormFieldReads(runner).includes(name)) {
    throw new Error(`the sequence reads ${name}: remove its reads first`);
  }
  const { [name]: _removed, ...kept } = fields;
  return withFormFields(runner as Record<string, unknown>, kept);
}

/**
 * A new custom Runner of `application` (#505): an empty form and `sequence`, labelled with its
 * name when no label is given.
 */
export function newCustomRunner(params: {
  uuid: string;
  application: string;
  name: string;
  defaultLabel?: string;
  sequence: unknown;
  fields?: Record<string, MlElement>;
}): Record<string, unknown> {
  return {
    uuid: params.uuid,
    parentName: "Runner",
    parentUuid: "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd",
    application: params.application,
    name: params.name,
    defaultLabel: params.defaultLabel && params.defaultLabel.length > 0 ? params.defaultLabel : params.name,
    definition: {
      runnerType: "customRunner",
      formMLSchema: { formMLSchemaType: "mlSchema", mlSchema: { type: "object", definition: params.fields ?? {} } },
      compositeActionSequence: params.sequence,
    },
  };
}

/**
 * `runner` named `name`, its sequence's reads of the form rewritten: the form values are given
 * under the Runner's name, so a read of `[old name, …]` becomes `[name, …]`.
 */
export function renameRunner(runner: unknown, name: string): Record<string, unknown> {
  const definition = customRunnerDefinition(runner);
  if (!definition || !isRecord(runner) || typeof runner.name !== "string") {
    throw new Error("the value is not a custom Runner");
  }
  if (!FIELD_NAME.test(name)) {
    throw new Error(`"${name}" is not a Runner name: use letters, digits and _, not starting with a digit`);
  }
  const reads = formReadPaths(definition.compositeActionSequence, runner.name);
  const sequence = reads.reduce(
    (current, path) =>
      updateAt(current, [...path, "referencePath"], (referencePath) =>
        (referencePath as unknown[]).map((segment, index) => (index === 0 ? name : segment)),
      ),
    definition.compositeActionSequence,
  );
  return { ...runner, name, definition: { ...definition, compositeActionSequence: sequence } };
}

/** The paths of the reads of the whole form `[runnerName, …]` in `value`, quoted values aside. */
function formReadPaths(value: unknown, runnerName: string, path: Path = []): Path[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => formReadPaths(item, runnerName, [...path, index]));
  }
  if (!isRecord(value)) {
    return [];
  }
  const own =
    READ_TYPES.has(String(value.transformerType)) && Array.isArray(value.referencePath) && value.referencePath[0] === runnerName
      ? [path]
      : [];
  const nested = Object.entries(value)
    .filter(([key]) => !(value.transformerType === "returnValue" && key === "value"))
    .flatMap(([key, entry]) => formReadPaths(entry, runnerName, [...path, key]));
  return [...own, ...nested];
}
