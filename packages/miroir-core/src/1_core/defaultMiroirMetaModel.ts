import { defaultMiroirMetaModel as defaultMiroirMetaModelRaw } from "miroir-test-app_deployment-miroir";
import type { MetaModel } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Deployment packages expose stub `.d.ts` (exports as `any`) to avoid circular
 * DTS with miroir-core. Cast once at this boundary for typed consumers inside core.
 * Via unknown: MetaModel field renames (#217 Phase 12) can temporarily disagree with
 * stale inferred shapes from prior dist builds during DTS generation.
 */
export const defaultMiroirMetaModel = defaultMiroirMetaModelRaw as unknown as MetaModel;
