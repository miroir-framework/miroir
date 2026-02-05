import {
  adminSelfApplication,
  defaultAdminViewParams,
  entityViewParams,
} from "miroir-deployment-admin";
import {
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerExtractorAndParams,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { getQueryRunnerParamsForReduxDeploymentsState } from "../2_domain/ReduxDeploymentsStateQuerySelectors";


export const defaultViewParamsFromAdminStorageFetchQueryParams: (
  deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>,
) => SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> = (
  deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>,
) =>
  getQueryRunnerParamsForReduxDeploymentsState(
    // currentModel?
    {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: adminSelfApplication.uuid,
      pageParams: {},
      queryParams: {},
      contextResults: {},
      extractors: {
        viewParams: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          label: "ViewParams by direct reference",
          applicationSection: "data",
          parentName: entityViewParams.name,
          parentUuid: entityViewParams.uuid,
          instanceUuid: defaultAdminViewParams.uuid,
        },
      },
    },
    deploymentEntityStateSelectorMap,
  );
