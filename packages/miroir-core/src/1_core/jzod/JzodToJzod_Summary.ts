import type { JzodElement, MlSchema } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ── Classification of JzodElement fields for JzodElementEditor use ──────────
//
// Tag fields (tag.value.*):
//   ESSENTIAL (kept): defaultLabel, description, foreignKeyParams, formValidation
//   NON-ESSENTIAL (stripped): id, editorButton, initializeTo, isBlob, canBeTemplate,
//     isTemplate, ifThenElseMMLS, display  — all view/meta concerns
//
// Type-level fields:
//   ESSENTIAL: type, optional, nullable, description, definition for all container/leaf types,
//     nonStrict/partial for objects, discriminator for unions, validations for string/number/date
//   NON-ESSENTIAL: JzodReference.context (bulk internal), JzodPlainAttribute.coerce (technical),
//     JzodUnion.optInDiscriminator (technical matching detail),
//     JzodFunction/JzodLazy/JzodPromise (not editable)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strips all non-essential tag fields from a tag.value object.
 * Keeps only fields directly useful for understanding the data structure
 * during value editing: defaultLabel, description, foreignKeyParams, formValidation.
 */
function stripTagValue(tagValue: Record<string, any>): Record<string, any> | undefined {
  const result: Record<string, any> = {};
  if (tagValue.defaultLabel !== undefined) result.defaultLabel = tagValue.defaultLabel;
  if (tagValue.description !== undefined) result.description = tagValue.description;
  if (tagValue.foreignKeyParams !== undefined) result.foreignKeyParams = tagValue.foreignKeyParams;
  if (tagValue.formValidation !== undefined) result.formValidation = tagValue.formValidation;
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Builds the base summary fields common to all JzodElement types.
 * Includes: type, optional, nullable, description, and stripped tag.
 */
function buildBase(el: any): any {
  const base: any = { type: el.type };
  if (el.optional !== undefined) base.optional = el.optional;
  if (el.nullable !== undefined) base.nullable = el.nullable;
  if (el.description !== undefined) base.description = el.description;
  if (el.tag?.value) {
    const stripped = stripTagValue(el.tag.value);
    if (stripped) base.tag = { value: stripped };
  }
  return base;
}

/**
 * Returns the minimal (type-only) representation for a child JzodElement
 * when the depth budget is exhausted (depth <= 0).
 *
 * Leaf types with intrinsic value (literal, enum) keep their definition
 * since without it the type tells nothing useful. References keep their path.
 * All other container types return just { type }.
 */
function minimalSummary(el: JzodElement): any {
  const e = el as any;
  switch (e.type) {
    case "literal":
      return { type: "literal", definition: e.definition };
    case "enum":
      return { type: "enum", definition: e.definition };
    case "schemaReference":
      return { type: "schemaReference", definition: e.definition };
    default:
      return { type: e.type };
  }
}

/**
 * Produces a summary of a JzodElement schema containing only information
 * directly useful for human understanding during value editing in JzodElementEditor.
 *
 * - Strips all view-related and meta tag fields (see classification above).
 * - Recursively summarizes container type children up to `depth` levels.
 * - At depth=0, container children are shown as type-only stubs.
 * - Leaf types (literal, enum, string/number/date with validations) are always fully shown.
 * - schemaReference.context is always dropped (bulk, internal resolution data).
 *
 * @param jzodSchema - The JzodElement to summarize.
 * @param miroirFundamentalJzodSchema - Schema registry (reserved for future reference resolution).
 * @param depth - Recursion budget: 0 = current element + type-only child stubs;
 *                1 (default) = current element + children at depth=0; N = N levels deep.
 */
export function jzodToJzod_Summary(
  jzodSchema: JzodElement,
  miroirFundamentalJzodSchema: MlSchema,
  depth: number = 1,
): any {
  const el = jzodSchema as any;
  const base = buildBase(el);

  switch (el.type) {
    // ── Leaf types with intrinsic values ──────────────────────────────────────
    case "literal":
      return { ...base, definition: el.definition };

    case "enum":
      return { ...base, definition: el.definition };

    // ── Plain scalar types ────────────────────────────────────────────────────
    // Includes JzodPlainAttribute ("any","bigint","boolean","never","uuid","undefined","unknown","void")
    // and JzodAttributePlain{String,Number,Date}WithValidations ("string","number","date").
    // coerce is intentionally omitted (technical parsing detail).
    case "any":
    case "bigint":
    case "boolean":
    case "never":
    case "number":
    case "string":
    case "uuid":
    case "undefined":
    case "unknown":
    case "void":
    case "date": {
      const result: any = { ...base };
      if (el.validations !== undefined) result.validations = el.validations;
      return result;
    }

    // ── Object ────────────────────────────────────────────────────────────────
    case "object": {
      if (!el.definition) return base;
      const allDef: Record<string, any> = {};
      for (const [k, v] of Object.entries(el.definition as Record<string, JzodElement>)) {
        allDef[k] = depth <= 0
          ? minimalSummary(v)
          : jzodToJzod_Summary(v, miroirFundamentalJzodSchema, depth - 1);
      }
      // Literal-valued keys are discriminating — sort them first so short previews always show them.
      const literalKeys = Object.keys(allDef).filter(k => allDef[k]?.type === "literal");
      const otherKeys   = Object.keys(allDef).filter(k => allDef[k]?.type !== "literal");
      const def = Object.fromEntries([...literalKeys, ...otherKeys].map(k => [k, allDef[k]]));
      const result: any = { ...base, definition: def };
      if (el.nonStrict !== undefined) result.nonStrict = el.nonStrict;
      if (el.partial !== undefined) result.partial = el.partial;
      // extend preserved as-is (full recursion would add complexity for limited gain)
      if (el.extend !== undefined) result.extend = el.extend;
      return result;
    }

    // ── Single-child container types ──────────────────────────────────────────
    case "array":
    case "record":
    case "set":
    case "promise": {
      if (!el.definition) return base;
      const childSummary = depth <= 0
        ? minimalSummary(el.definition as JzodElement)
        : jzodToJzod_Summary(el.definition as JzodElement, miroirFundamentalJzodSchema, depth - 1);
      return { ...base, definition: childSummary };
    }

    // ── Multi-child container types ────────────────────────────────────────────
    case "tuple": {
      if (!el.definition) return base;
      const items = (el.definition as JzodElement[]).map((item) =>
        depth <= 0
          ? minimalSummary(item)
          : jzodToJzod_Summary(item, miroirFundamentalJzodSchema, depth - 1)
      );
      return { ...base, definition: items };
    }

    case "union": {
      if (!el.definition) return base;
      const branches = (el.definition as JzodElement[]).map((item) =>
        depth <= 0
          ? minimalSummary(item)
          : jzodToJzod_Summary(item, miroirFundamentalJzodSchema, depth - 1)
      );
      const result: any = { ...base, definition: branches };
      // discriminator tells the user HOW to choose a branch — keep it
      if (el.discriminator !== undefined) result.discriminator = el.discriminator;
      if (el.discriminatorNew !== undefined) result.discriminatorNew = el.discriminatorNew;
      // optInDiscriminator is a technical matching detail — omit
      return result;
    }

    // ── Schema reference ──────────────────────────────────────────────────────
    case "schemaReference":
      // Keep the reference pointer (relativePath/absolutePath).
      // Drop context: it is bulk internal resolution data, not user-visible.
      return { ...base, definition: el.definition };

    // ── Intersection ──────────────────────────────────────────────────────────
    case "intersection": {
      if (!el.definition) return base;
      const leftSummary = depth <= 0
        ? minimalSummary(el.definition.left as JzodElement)
        : jzodToJzod_Summary(el.definition.left as JzodElement, miroirFundamentalJzodSchema, depth - 1);
      const rightSummary = depth <= 0
        ? minimalSummary(el.definition.right as JzodElement)
        : jzodToJzod_Summary(el.definition.right as JzodElement, miroirFundamentalJzodSchema, depth - 1);
      return { ...base, definition: { left: leftSummary, right: rightSummary } };
    }

    // ── Map ───────────────────────────────────────────────────────────────────
    case "map": {
      if (!el.definition) return base;
      const [keyEl, valEl] = el.definition as [JzodElement, JzodElement];
      const keySummary = depth <= 0
        ? minimalSummary(keyEl)
        : jzodToJzod_Summary(keyEl, miroirFundamentalJzodSchema, depth - 1);
      const valSummary = depth <= 0
        ? minimalSummary(valEl)
        : jzodToJzod_Summary(valEl, miroirFundamentalJzodSchema, depth - 1);
      return { ...base, definition: [keySummary, valSummary] };
    }

    // ── Non-editable types ────────────────────────────────────────────────────
    // function, lazy, promise: not directly editable in JzodElementEditor.
    case "function":
    case "lazy":
      return base;

    default:
      return base;
  }
}