type SchemaResolutionMode = "static" | "extended" | "auto";

export type MiroirSchemaMode = "frozen" | "runtime";

/**
 * Test policy for implicit schema resolution (`auto` / `getMiroirFundamentalSchemaForDeployment`).
 * - `frozen` → `'auto'` resolves to static build artifact (no carry-on)
 * - `runtime` → legacy 198 auto behaviour
 * Unset env defaults to `runtime` for backward compatibility.
 */
export function getMiroirSchemaMode(): MiroirSchemaMode {
  const env = process.env.MIROIR_SCHEMA_MODE;
  if (env === "frozen") {
    return "frozen";
  }
  if (env === "runtime") {
    return "runtime";
  }
  return "runtime";
}

export function resolveEffectiveSchemaMode(mode: SchemaResolutionMode): SchemaResolutionMode {
  if (mode !== "auto") {
    return mode;
  }
  return getMiroirSchemaMode() === "frozen" ? "static" : "auto";
}
