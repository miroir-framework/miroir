import {
  DomainState,
  LocalCacheInfo
} from "../2_domain/DomainControllerInterface";

import {
  LocalCacheAction,
  MetaModel,
  ModelActionReplayableAction,
  TransactionalInstanceAction,
  type RunBoxedQueryAction
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { Action2ReturnType } from "../2_domain/DomainElement";
import type { MiroirModelEnvironment } from "../1_core/Transformer";
import type { ApplicationDeploymentMap } from "../../1_core/Deployment";
import type { Uuid } from "../1_core/EntityDefinition";
import type { LocalCacheMonitorSnapshot } from "../../2_domain/localCacheMemoryMeasure.js";

// ################################################################################################
/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface LocalCacheInterface {
  // constructor
  // run(): void;

  // view of current data state & transaction
  getInnerStore(): any; // TODO: local store should not expose its implementation!!
  getState(): any; // TODO: local store should not directly expose its internal state!! Actual type is LocacCacheSliceState!
  currentInfo(): LocalCacheInfo;
  /**
   * Enable/disable in-session LocalCache monitoring (#211).
   * OFF: no walks; clears cached snapshot. ON: calibrates immediately.
   */
  setLocalCacheMonitorEnabled(enabled: boolean): void;
  /** Cached breakdown + attributed index while monitor is ON; otherwise null. */
  getLocalCacheMonitorSnapshot(): LocalCacheMonitorSnapshot | null;
  currentModel(
    application: Uuid,
    applicationDeploymentMap: ApplicationDeploymentMap,
    // deploymentUuid: string
  ): MetaModel;
  /**
   * Builds a {@link MiroirModelEnvironment} for non-React runners and DomainController.
   *
   * @deprecated In UI code, use React context `schemasPerDeployment` via
   * `useCurrentModelEnvironment` instead. Reserved for DomainController and test runners.
   */
  currentModelEnvironment(
    application: Uuid,
    applicationDeploymentMap: ApplicationDeploymentMap,
    // deploymentUuid: string
  ): MiroirModelEnvironment;
  currentTransaction(): (TransactionalInstanceAction | ModelActionReplayableAction)[]; // any so as not to constrain implementation of cache and transaction mechanisms.

  getDomainState(): DomainState;

  // ##############################################################################################
  handleLocalCacheAction(
    action: LocalCacheAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType;
  runBoxedExtractorOrQueryAction(
    action: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType;
}
