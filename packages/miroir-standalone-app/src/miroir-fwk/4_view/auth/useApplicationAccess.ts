import { useMemo } from "react";

import {
  ALWAYS_ALLOW_APPLICATION_TARGETS,
  DESIGNER_APPLICATION_UUID,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_MIROIR_RIGHT_UUID,
  LIBRARY_APPLICATION_UUID,
  accessGrantsFromInstances,
  defaultSelfApplicationDeploymentMap,
  hasAccess,
  visibleUserApplications,
} from "miroir-core";
import {
  selectInstanceArrayForDeploymentSectionEntity,
  useMiroirContextService,
  useSelector,
  type ReduxStateWithUndoRedo,
} from "miroir-react";
import { adminSelfApplication } from "miroir-test-app_deployment-admin";

import { useAuthSession } from "./authSession.js";

export const USER_SELECTABLE_APPLICATION_UUIDS = [
  LIBRARY_APPLICATION_UUID,
  DESIGNER_APPLICATION_UUID,
];

const APPLICATIONS_SELECTOR_PARAMS = {
  queryType: "localCacheEntityInstancesExtractor" as const,
  definition: {
    application: adminSelfApplication.uuid,
    applicationSection: "data" as const,
    entityUuid: ENTITY_ADMIN_APPLICATION_UUID,
  },
};

const RIGHTS_SELECTOR_PARAMS = {
  queryType: "localCacheEntityInstancesExtractor" as const,
  definition: {
    application: adminSelfApplication.uuid,
    applicationSection: "data" as const,
    entityUuid: ENTITY_MIROIR_RIGHT_UUID,
  },
};

export function useApplicationAccess() {
  const { enabled, principal } = useAuthSession();
  const context = useMiroirContextService();
  const applicationDeploymentMap =
    context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  const applications =
    useSelector((state: ReduxStateWithUndoRedo) =>
      selectInstanceArrayForDeploymentSectionEntity(
        state,
        applicationDeploymentMap,
        APPLICATIONS_SELECTOR_PARAMS,
      ),
    ) ?? [];
  const rights =
    useSelector((state: ReduxStateWithUndoRedo) =>
      selectInstanceArrayForDeploymentSectionEntity(
        state,
        applicationDeploymentMap,
        RIGHTS_SELECTOR_PARAMS,
      ),
    ) ?? [];
  const ready = applications.length > 0;
  const grants = useMemo(() => accessGrantsFromInstances(rights), [rights]);
  const filterEnabled = enabled && ready;
  const visible = useMemo(
    () =>
      visibleUserApplications({
        enabled: filterEnabled,
        principal,
        grants,
        candidates: USER_SELECTABLE_APPLICATION_UUIDS,
      }),
    [filterEnabled, principal, grants],
  );

  return {
    enabled,
    principal,
    grants,
    ready,
    filterEnabled,
    visible,
    candidates: USER_SELECTABLE_APPLICATION_UUIDS,
    canAccessApplication(applicationUuid: string | undefined): boolean {
      if (!applicationUuid || !filterEnabled) {
        return true;
      }
      return hasAccess({
        principal,
        target: { targetType: "application", targetUuid: applicationUuid },
        grants,
        alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
      });
    },
  };
}
