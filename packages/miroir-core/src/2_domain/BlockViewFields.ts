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
// - a field below a transformer or a sequence has its `ref:` segment in its `typePath`.
// Sequences are block view roots from #504 on; until then they and what they hold get no switch.
// ################################################################################################

/** Schemas whose values the block view shows as their root. */
const BLOCK_VIEW_ROOT_SCHEMAS = new Set(["coreTransformerForBuildPlusRuntime", "coreTransformerForBuildPlusRuntimeWithoutArray"]);

/** Schemas whose values show what they hold in their own blocks: no field below them is a root. */
const BLOCK_VIEW_ENCLOSING_SCHEMAS = new Set([
  ...BLOCK_VIEW_ROOT_SCHEMAS,
  "compositeActionSequence",
  "compositeActionSequenceTemplate",
  "compositeActionTemplate",
]);

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

/** Whether a field of the value editor gets the view switch: see the module comment. */
export function isBlockViewRoot(entry: KeyMapEntry | undefined): boolean {
  if (!entry) {
    return false;
  }
  const isTransformer =
    entry.rawSchema?.type === "union"
      ? chosenBranchIsTransformer(entry)
      : BLOCK_VIEW_ROOT_SCHEMAS.has(referencedSchemaName(entry.rawSchema) ?? "");
  if (!isTransformer) {
    return false;
  }
  return !entry.typePath.some(
    (segment) =>
      typeof segment === "string" && segment.startsWith("ref:") && BLOCK_VIEW_ENCLOSING_SCHEMAS.has(schemaName(segment.slice(4))),
  );
}
