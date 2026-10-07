import type { KeyMapEntry, MlElement } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
// #498, #503 (analysis #497, D6): which fields of the value editor get the Blocks / Form / JSON
// switch. A field is a block view root when the type check resolved it to a transformer and no
// enclosing field is a transformer or a composite action sequence, which shows it in its own
// blocks. The type check's key map tells:
// - a declared transformer field has a `rawSchema` referencing the transformer schema, or its
//   template form `miroirTemplate_<schema uuid>_<name>` (Query and Report `applyTransformer`);
// - a field declared as a union with a transformer branch (template holes such as `parentUuid`,
//   Report section definitions) is one when the value took the transformer branch:
//   `chosenUnionBranchRawSchema` is then an object schema with `transformerType`;
// - a field below a transformer or a sequence has its `ref:` segment in its `typePath`, except
//   below a union-wrapped transformer: the type check marks the chosen branch with a
//   `union choice(...)` segment, so the enclosing fields are looked up in the key map.
// #504: a composite action sequence is a root too, shown as read-only command blocks: a field
// declared as one of the three sequence schemas, or an `any` field the type check resolves to one
// (`ifThenElseMMLS`, as Endpoint `actionImplementation.definition`).
// ################################################################################################

/** Transformer schemas: their values are block view roots. */
const BLOCK_VIEW_ROOT_SCHEMAS = new Set(["coreTransformerForBuildPlusRuntime", "coreTransformerForBuildPlusRuntimeWithoutArray"]);

/** Sequence schemas: their values are block view roots too (#504). */
const SEQUENCE_SCHEMAS = new Set(["compositeActionSequence", "compositeActionSequenceTemplate", "compositeActionTemplate"]);

/** Schemas whose values show what they hold in their own blocks: no field below them is a root. */
const BLOCK_VIEW_ENCLOSING_SCHEMAS = new Set([...BLOCK_VIEW_ROOT_SCHEMAS, ...SEQUENCE_SCHEMAS]);

const TEMPLATE_PREFIX = /^miroirTemplate_[^_]+_/;

/** A schema name without its template prefix: `miroirTemplate_<uuid>_x` is the template form of `x`. */
function schemaName(relativePath: string): string {
  return relativePath.replace(TEMPLATE_PREFIX, "");
}

function referencedSchemaName(schema: MlElement | undefined): string | undefined {
  if (schema?.type !== "schemaReference") {
    return undefined;
  }
  const relativePath = schema.definition?.relativePath;
  return relativePath ? schemaName(relativePath) : undefined;
}

/** Whether the type check resolved the value of a union to a transformer branch. */
function chosenBranchIsTransformer(entry: KeyMapEntry): boolean {
  const chosen = entry.chosenUnionBranchRawSchema;
  if (BLOCK_VIEW_ROOT_SCHEMAS.has(referencedSchemaName(chosen) ?? "")) {
    return true;
  }
  return (
    chosen?.type === "object" &&
    typeof chosen.definition === "object" &&
    chosen.definition !== null &&
    "transformerType" in chosen.definition &&
    (entry.rawSchema as { definition: MlElement[] }).definition.some((branch) =>
      BLOCK_VIEW_ROOT_SCHEMAS.has(referencedSchemaName(branch) ?? ""),
    )
  );
}

/** Whether the type check resolved the value of a field to a transformer. */
function isTransformerField(entry: KeyMapEntry): boolean {
  return entry.rawSchema?.type === "union"
    ? chosenBranchIsTransformer(entry)
    : BLOCK_VIEW_ROOT_SCHEMAS.has(referencedSchemaName(entry.rawSchema) ?? "");
}

/** The schema an `any` field becomes through its `ifThenElseMMLS` tag, when the type check resolves it. */
function ifThenElseSchemaName(schema: MlElement | undefined): string | undefined {
  const relativePath = (schema?.tag?.value as { ifThenElseMMLS?: { mmlsReference?: { relativePath?: string } } } | undefined)
    ?.ifThenElseMMLS?.mmlsReference?.relativePath;
  return relativePath ? schemaName(relativePath) : undefined;
}

/** Whether a field holds a composite action sequence (#504). */
function isSequenceField(entry: KeyMapEntry): boolean {
  return [
    referencedSchemaName(entry.rawSchema),
    referencedSchemaName(entry.chosenUnionBranchRawSchema),
    ifThenElseSchemaName(entry.rawSchema),
  ].some((name) => name !== undefined && SEQUENCE_SCHEMAS.has(name));
}

function isBlockField(entry: KeyMapEntry): boolean {
  return isTransformerField(entry) || isSequenceField(entry);
}

/**
 * Whether a field of the value editor gets the view switch: see the module comment. `keyMap` is
 * the key map the entry comes from, keyed by value path joined with ".", for the enclosing fields.
 */
export function isBlockViewRoot(entry: KeyMapEntry | undefined, keyMap?: Record<string, KeyMapEntry>): boolean {
  if (!entry || !isBlockField(entry)) {
    return false;
  }
  const insideEnclosingReference = entry.typePath.some(
    (segment) =>
      typeof segment === "string" && segment.startsWith("ref:") && BLOCK_VIEW_ENCLOSING_SCHEMAS.has(schemaName(segment.slice(4))),
  );
  if (insideEnclosingReference) {
    return false;
  }
  for (let length = 0; length < entry.valuePath.length; length++) {
    const enclosing = keyMap?.[entry.valuePath.slice(0, length).join(".")];
    if (enclosing && isBlockField(enclosing)) {
      return false;
    }
  }
  return true;
}
