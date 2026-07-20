import { defaultMiroirMetaModel as defaultMiroirMetaModelRaw } from "miroir-test-app_deployment-miroir";
import type { MetaModel } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Deployment packages expose stub `.d.ts` (exports as `any`) to avoid circular
 * DTS with miroir-core. Cast once at this boundary for typed consumers inside core.
 */
export const defaultMiroirMetaModel = defaultMiroirMetaModelRaw as MetaModel;
