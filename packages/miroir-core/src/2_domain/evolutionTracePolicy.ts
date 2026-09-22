import type { ApplicationSection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

/** UUID of the Miroir selfApplication, used to identify the special tracking case. */
export const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";

/**
 * Persistence of ApplicationEvolutionTrace is opt-in. Default off so model
 * writes (including OpenAPI Endpoint sync/commit) do not try to maintain
 * traces until that work is ready.
 *
 * Enable with MIROIR_EVOLUTION_TRACE=1 (or VITE_MIROIR_EVOLUTION_TRACE=1).
 */
export function isEvolutionTraceEnabled(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): boolean {
  const raw = env.MIROIR_EVOLUTION_TRACE ?? env.VITE_MIROIR_EVOLUTION_TRACE;
  if (typeof raw !== "string") {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/**
 * Returns true when a write to (applicationUuid, section) should be recorded
 * as a model-evolution trace event. Persistence still requires
 * {@link isEvolutionTraceEnabled} (DomainController no-ops when disabled).
 *
 * Tracking policy:
 * - Any application, model section  → trace (model changes are shared across deployments)
 * - Non-Miroir application, data section → skip (data is deployment-local)
 * - Miroir application, data section → trace (Miroir data IS the application model layer)
 */
export function shouldTraceEvolutionEvent(
  applicationUuid: string,
  section: ApplicationSection,
): boolean {
  if (section === "model") return true;
  if (section === "data") return applicationUuid === MIROIR_APPLICATION_UUID;
  return false;
}
