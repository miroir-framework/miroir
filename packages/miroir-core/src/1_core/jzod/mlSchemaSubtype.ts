import equal from "fast-deep-equal";

import type {
  JzodElement,
  JzodObject,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Issue #250 — mlSchema (JzodElement AST) structural subtyping under the Liskov
 * Substitution Principle: every value accepted by `potentialSubtype` is also
 * accepted by `potentialSupertype`, so the former may be used wherever the latter
 * is expected.
 *
 * Value-acceptance semantics follow `jzodTypeCheck`. In particular, objects are
 * **strict** by default: a value may not carry attributes outside the schema
 * definition unless the schema is `nonStrict`. Width subtyping therefore only
 * applies against `nonStrict` supertypes.
 *
 * - Presentation metadata (`tag`, `description`) is ignored.
 * - `validations` / `coerce` are compared conservatively: a subtype may add
 *   validations to an unvalidated supertype; a `coerce` subtype requires a
 *   `coerce` supertype; otherwise constraint sets must be deep-equal.
 * - `schemaReference` uses structural identity (after presentation stripping),
 *   which covers `definition` (paths / `eager` / `partial`) **and** `context`.
 *   There is no reference resolution in this cut.
 * - `extend` cannot be flattened without a model environment: an object bearing
 *   an `extend` clause is only a subtype of a deep-equal schema (identity
 *   fast-path); anything else is conservatively rejected.
 *
 * No recursion-depth guard is needed: schemas are finite JSON trees and the
 * recursion is structural on the input. Cyclic schemas can only be expressed
 * through `schemaReference` / `lazy`, which are never recursed into.
 */
export function isMlSchemaSubtype(
  potentialSubtype: JzodElement,
  potentialSupertype: JzodElement,
): boolean {
  return isSubtype(potentialSubtype, potentialSupertype);
}

type CoreSchema = JzodElement;

const ANY_SCHEMA: JzodElement = { type: "any" } as JzodElement;

function isSubtype(a: JzodElement, b: JzodElement): boolean {
  const aBranches = normalizeToBranches(a);
  const bBranches = normalizeToBranches(b);

  // A <: B iff every alternative of A is a subtype of some alternative of B
  return aBranches.every((aBranch) =>
    bBranches.some((bBranch) => isCoreSubtype(aBranch, bBranch)),
  );
}

/**
 * Expand optional / nullable / union into a flat list of core (non-optional,
 * non-nullable, non-union) alternatives. Value set = union of branch value sets.
 */
function normalizeToBranches(schema: JzodElement): CoreSchema[] {
  const optional = schema.optional === true;
  const nullable = schema.nullable === true;

  let cores: CoreSchema[];
  if (schema.type === "union") {
    cores = schema.definition.flatMap((branch) => normalizeToBranches(branch));
  } else {
    cores = [stripOptionalNullable(schema)];
  }

  const result = [...cores];
  if (optional) {
    result.push({ type: "undefined" } as CoreSchema);
  }
  if (nullable) {
    result.push({ type: "null" } as CoreSchema);
  }
  return result;
}

function stripOptionalNullable(schema: JzodElement): CoreSchema {
  if (schema.optional === undefined && schema.nullable === undefined) {
    return schema;
  }
  const { optional: _o, nullable: _n, ...rest } = schema as JzodElement & {
    optional?: boolean;
    nullable?: boolean;
  };
  return rest as CoreSchema;
}

/** Remove only the `optional` flag: absence of an attribute is fine for records. */
function stripOptionalFlag(schema: JzodElement): JzodElement {
  if (schema.optional === undefined) {
    return schema;
  }
  const { optional: _o, ...rest } = schema as JzodElement & { optional?: boolean };
  return rest as JzodElement;
}

function stripPresentation(schema: CoreSchema): CoreSchema {
  if (!("tag" in schema) && !("description" in schema)) {
    return schema;
  }
  const { tag: _t, description: _d, ...rest } = schema as CoreSchema & {
    tag?: unknown;
    description?: unknown;
  };
  return rest as CoreSchema;
}

function isCoreSubtype(a: CoreSchema, b: CoreSchema): boolean {
  const aCore = stripPresentation(a);
  const bCore = stripPresentation(b);

  // Identity fast-path: also covers identical schemaReferences (definition +
  // context), identical `extend` clauses, identical validations, etc.
  if (equal(aCore, bCore)) {
    return true;
  }

  // Bottom / top
  if (aCore.type === "never") {
    return true;
  }
  if (bCore.type === "any" || bCore.type === "unknown") {
    return true;
  }
  if (aCore.type === "any" || aCore.type === "unknown") {
    // top types are only subtypes of themselves or each other — already handled
    // by the identity and top checks above
    return false;
  }

  // Intersection as subtype source: A∩B ⊆ X if A ⊆ X or B ⊆ X (sound, incomplete)
  if (aCore.type === "intersection") {
    return (
      isSubtype(aCore.definition.left, bCore) ||
      isSubtype(aCore.definition.right, bCore)
    );
  }
  // Intersection as target: X ⊆ A∩B iff X ⊆ A and X ⊆ B
  if (bCore.type === "intersection") {
    return (
      isSubtype(aCore, bCore.definition.left) &&
      isSubtype(aCore, bCore.definition.right)
    );
  }

  // Literals (Jzod literal definitions are strings)
  if (aCore.type === "literal") {
    if (bCore.type === "literal") {
      return aCore.definition === bCore.definition;
    }
    if (bCore.type === "string") {
      return hasNoValidations(bCore);
    }
    if (bCore.type === "enum") {
      return bCore.definition.includes(aCore.definition);
    }
    return false;
  }

  // Enums
  if (aCore.type === "enum") {
    if (bCore.type === "enum") {
      return aCore.definition.every((value) => bCore.definition.includes(value));
    }
    if (bCore.type === "string") {
      return hasNoValidations(bCore);
    }
    return false;
  }

  // uuid is a string at the JSON-value level
  if (aCore.type === "uuid" && bCore.type === "string") {
    return primitiveConstraintsOk(aCore, bCore);
  }

  // Primitives / plain attributes: exact type match, then conservative
  // comparison of `coerce` / `validations`
  if (isPlainOrPrimitiveType(aCore.type) && isPlainOrPrimitiveType(bCore.type)) {
    if (aCore.type !== bCore.type) {
      return false;
    }
    return primitiveConstraintsOk(aCore, bCore);
  }

  // Arrays — covariant element type
  if (aCore.type === "array" && bCore.type === "array") {
    return isSubtype(aCore.definition, bCore.definition);
  }

  // Sets — covariant element type
  if (aCore.type === "set" && bCore.type === "set") {
    return isSubtype(aCore.definition, bCore.definition);
  }

  // Records — covariant value type
  if (aCore.type === "record" && bCore.type === "record") {
    return isSubtype(aCore.definition, bCore.definition);
  }

  // Object <: Record when every property value type <: record value type
  if (aCore.type === "object" && bCore.type === "record") {
    return objectSubtypeOfRecord(aCore, bCore.definition);
  }

  // Maps — covariant key and value
  if (aCore.type === "map" && bCore.type === "map") {
    return (
      isSubtype(aCore.definition[0], bCore.definition[0]) &&
      isSubtype(aCore.definition[1], bCore.definition[1])
    );
  }

  // Tuples — fixed length, covariant positions; tuple <: array if each <: element
  if (aCore.type === "tuple") {
    if (bCore.type === "tuple") {
      if (aCore.definition.length !== bCore.definition.length) {
        return false;
      }
      return aCore.definition.every((el, i) =>
        isSubtype(el, bCore.definition[i]),
      );
    }
    if (bCore.type === "array") {
      return aCore.definition.every((el) => isSubtype(el, bCore.definition));
    }
    return false;
  }

  // Objects — strict by default, following jzodTypeCheck
  if (aCore.type === "object" && bCore.type === "object") {
    return isObjectSubtype(aCore, bCore);
  }

  // schemaReference — no resolution in this cut: identity is the only sound
  // rule, and it was already handled by the equality fast-path above (which
  // covers `definition` — paths, eager, partial — and `context`).
  if (aCore.type === "schemaReference" || bCore.type === "schemaReference") {
    return false;
  }

  // Promise — covariant payload
  if (aCore.type === "promise" && bCore.type === "promise") {
    return isSubtype(aCore.definition, bCore.definition);
  }

  // function / lazy / remaining type mismatches — structural identity was
  // already checked above
  return false;
}

function isPlainOrPrimitiveType(type: string): boolean {
  return (
    type === "string" ||
    type === "number" ||
    type === "bigint" ||
    type === "boolean" ||
    type === "date" ||
    type === "uuid" ||
    type === "null" ||
    type === "undefined" ||
    type === "void" ||
    type === "any" ||
    type === "unknown" ||
    type === "never"
  );
}

type WithConstraints = {
  coerce?: boolean | undefined;
  validations?: unknown[] | undefined;
};

function hasNoValidations(schema: CoreSchema): boolean {
  const validations = (schema as WithConstraints).validations;
  return validations === undefined || validations.length === 0;
}

/**
 * Conservative comparison of `coerce` / `validations` for same-type primitives:
 * - `coerce` widens the accepted input set: a coercing subtype requires a
 *   coercing supertype;
 * - `validations` restrict the accepted value set: an unvalidated supertype
 *   accepts any validated subtype; otherwise the constraint sets must match
 *   exactly (comparing validation semantics is out of scope for this cut).
 */
function primitiveConstraintsOk(a: CoreSchema, b: CoreSchema): boolean {
  const aCoerce = (a as WithConstraints).coerce === true;
  const bCoerce = (b as WithConstraints).coerce === true;
  if (aCoerce && !bCoerce) {
    return false;
  }
  const aValidations = (a as WithConstraints).validations ?? [];
  const bValidations = (b as WithConstraints).validations ?? [];
  if (bValidations.length === 0) {
    return true;
  }
  return equal(aValidations, bValidations);
}

function objectSubtypeOfRecord(
  objectSchema: JzodObject,
  recordValueSchema: JzodElement,
): boolean {
  // cannot flatten `extend` without a model environment
  if (objectSchema.extend !== undefined) {
    return false;
  }
  const aPartial = objectSchema.partial === true;
  const props = objectSchema.definition ?? {};
  const propsOk = Object.values(props).every((prop) =>
    isSubtype(stripOptionalFlag(aPartial ? { ...prop, optional: true } : prop), recordValueSchema),
  );
  if (!propsOk) {
    return false;
  }
  // a nonStrict object admits arbitrary extra attributes with `any` value
  if (objectSchema.nonStrict === true) {
    return isSubtype(ANY_SCHEMA, recordValueSchema);
  }
  return true;
}

/**
 * Object subtyping, following `jzodTypeCheck` acceptance semantics: objects are
 * strict by default (a value may not carry attributes outside the schema
 * definition) unless the schema is `nonStrict`.
 */
function isObjectSubtype(a: JzodObject, b: JzodObject): boolean {
  // Without a model environment we cannot flatten `extend`: beyond full identity
  // (already handled by the equality fast-path), conservatively reject.
  if (a.extend !== undefined || b.extend !== undefined) {
    return false;
  }

  const aDef = a.definition ?? {};
  const bDef = b.definition ?? {};
  const aPartial = a.partial === true;
  const bPartial = b.partial === true;
  const aNonStrict = a.nonStrict === true;
  const bNonStrict = b.nonStrict === true;

  // Extra attributes: values of A may only carry attributes that B accepts.
  if (!bNonStrict) {
    // A admits arbitrary extra attributes; B rejects any of them
    if (aNonStrict) {
      return false;
    }
    // strict target: no width subtyping (jzodTypeCheck rejects unknown attributes)
    for (const key of Object.keys(aDef)) {
      if (!Object.prototype.hasOwnProperty.call(bDef, key)) {
        return false;
      }
    }
  }

  for (const [key, bProp] of Object.entries(bDef)) {
    const bEffective: JzodElement = bPartial ? { ...bProp, optional: true } : bProp;
    const aProp = aDef[key];
    if (aProp === undefined) {
      if (aNonStrict) {
        // A admits `key` with an `any` value: it must fit B's attribute
        if (!isSubtype(ANY_SCHEMA, bEffective)) {
          return false;
        }
        continue;
      }
      // `key` never occurs in values of A: fine only if B tolerates its absence
      if (bPartial || bProp.optional === true) {
        continue;
      }
      return false;
    }
    const aEffective: JzodElement = aPartial ? { ...aProp, optional: true } : aProp;
    if (!isSubtype(aEffective, bEffective)) {
      return false;
    }
  }

  return true;
}
