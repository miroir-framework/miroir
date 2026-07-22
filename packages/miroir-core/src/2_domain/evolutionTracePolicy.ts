import type { ApplicationSection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

/** UUID of the Miroir selfApplication, used to identify the special tracking case. */
export const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";

/**
 * Returns true when a write to (applicationUuid, section) should be recorded
 * as a model-evolution trace event.
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
