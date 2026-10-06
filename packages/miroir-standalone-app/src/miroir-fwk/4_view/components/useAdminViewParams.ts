import { useCallback, useMemo } from "react";

import {
  defaultSelfApplicationDeploymentMap,
  defaultViewParamsFromAdminStorageFetchQueryParams,
  type Domain2QueryReturnType,
  type DomainElementSuccess,
  type EntityInstancesUuidIndex,
  type ReduxDeploymentsState,
  type SyncQueryRunner,
  type ViewParamsData,
} from "miroir-core";
import { deployment_Admin } from "miroir-app-admin";
import { getMemoizedReduxDeploymentsStateSelectorMap, useDomainControllerService } from "miroir-react";

import { useReduxDeploymentsStateQuerySelectorForCleanedResult } from "../ReduxHooks.js";
import { ViewParamsUpdateQueue } from "./ViewParamsUpdateQueue.js";

/**
 * The ViewParams instance of the Admin deployment in the store, and the save of some of its
 * attributes (#435, #453). Before the Admin store is loaded, or in a store without it (a component
 * test case), `viewParamsData` is undefined and the save does nothing.
 */
export function useAdminViewParams(): {
  viewParamsData: ViewParamsData | undefined;
  saveViewParams: (updates: Partial<ViewParamsData>) => void;
} {
  const domainController = useDomainControllerService();
  const selectorMap = useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);
  const queryParams = useMemo(() => defaultViewParamsFromAdminStorageFetchQueryParams(selectorMap), [selectorMap]);
  const queryResults: Record<string, EntityInstancesUuidIndex> = useReduxDeploymentsStateQuerySelectorForCleanedResult(
    selectorMap.runQuery as SyncQueryRunner<ReduxDeploymentsState, Domain2QueryReturnType<DomainElementSuccess>>,
    queryParams,
    defaultSelfApplicationDeploymentMap, // ViewParams are in the admin deployment
  );
  const viewParamsData = queryResults?.["viewParams"] as unknown as ViewParamsData | undefined;
  const saveViewParams = useCallback(
    (updates: Partial<ViewParamsData>) => {
      if (!viewParamsData?.uuid) {
        return;
      }
      ViewParamsUpdateQueue.getInstance(
        { delayMs: 5000, deploymentUuid: deployment_Admin.uuid, viewParamsInstanceUuid: viewParamsData.uuid },
        domainController,
      ).queueUpdate({ currentValue: viewParamsData, updates }, true);
    },
    [viewParamsData, domainController],
  );
  return { viewParamsData, saveViewParams };
}
