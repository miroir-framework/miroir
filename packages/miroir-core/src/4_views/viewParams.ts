import { adminConfigurationDeploymentAdmin } from "..";
import {
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { getQueryRunnerParamsForReduxDeploymentsState } from "../2_domain/ReduxDeploymentsStateQuerySelectors";

import defaultAdminViewParams from "../../src/assets/admin_data/b9765b7c-b614-4126-a0e2-634463f99937/441cb6fd-2728-4a16-b170-ebceec1ce6c2.json";
import entityViewParams from "../../src/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/b9765b7c-b614-4126-a0e2-634463f99937.json";

export const defaultViewParamsFromAdminStorageFetchQueryParams: (deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>) =>SyncQueryRunnerParams<ReduxDeploymentsState> =
  // useMemo(
  //   () =>
  (deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>) =>
      getQueryRunnerParamsForReduxDeploymentsState(
        // currentModel?
         {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                viewParams: {
                  // extractorOrCombinerType: "extractorByEntityReturningObject",
                  extractorOrCombinerType: "extractorForObjectByDirectReference",
                  applicationSection: "data",
                  parentName: entityViewParams.name,
                  parentUuid: entityViewParams.uuid,
                  instanceUuid: defaultAdminViewParams.uuid,
                },
              },
            }
          // : dummyDomainManyQueryWithDeploymentUuid,
          ,
        deploymentEntityStateSelectorMap
      )
    // [deploymentEntityStateSelectorMap]
  // );
;
// const defaultViewParamsFromAdminStorageFetchQueryResults: Record<string, EntityInstancesUuidIndex> =
//   useReduxDeploymentsStateQuerySelectorForCleanedResult(
//     deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
//       ReduxDeploymentsState,
//       Domain2QueryReturnType<DomainElementSuccess>
//     >,
//     defaultViewParamsFromAdminStorageFetchQueryParams
//   );
