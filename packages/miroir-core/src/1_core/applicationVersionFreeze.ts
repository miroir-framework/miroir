/**
 * #216 — Application Version freeze (Entities only, linear history, Option A diff).
 *
 * Phase 0 locks the Action type name. Snapshot / plan / tip / diff land in later phases.
 */

/** Model Endpoint actionType for user-triggered freeze (ADR D1-a). */
export const FREEZE_APPLICATION_VERSION_ACTION_TYPE = "freezeApplicationVersion" as const;

export type FreezeApplicationVersionActionType =
  typeof FREEZE_APPLICATION_VERSION_ACTION_TYPE;
