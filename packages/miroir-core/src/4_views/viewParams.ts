import { adminConfigurationDeploymentAdmin } from "..";
import {
  EntityInstancesUuidIndex,
  DomainElementSuccess,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  SyncQueryRunnerParams,
  SyncQueryRunner,
  SyncBoxedExtractorOrQueryRunnerMap,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { getQueryRunnerParamsForDeploymentEntityState } from "../2_domain/DeploymentEntityStateQuerySelectors";
import { dummyDomainManyQueryWithDeploymentUuid } from "../2_domain/DomainStateQuerySelectors";

import entityViewParams from "../../src/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/b9765b7c-b614-4126-a0e2-634463f99937.json";
import defaultAdminViewParams from "../../src/assets/admin_data/b9765b7c-b614-4126-a0e2-634463f99937/441cb6fd-2728-4a16-b170-ebceec1ce6c2.json";

export const defaultViewParamsFromAdminStorageFetchQueryParams: (deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>) =>SyncQueryRunnerParams<DeploymentEntityState> =
  // useMemo(
  //   () =>
  (deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>) =>
      getQueryRunnerParamsForDeploymentEntityState(
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
//   useDeploymentEntityStateQuerySelectorForCleanedResult(
//     deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
//       DeploymentEntityState,
//       Domain2QueryReturnType<DomainElementSuccess>
//     >,
//     defaultViewParamsFromAdminStorageFetchQueryParams
//   );
