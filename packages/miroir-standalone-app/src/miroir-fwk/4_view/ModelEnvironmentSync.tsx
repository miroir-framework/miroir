import { useLayoutEffect, useMemo } from "react";

import {
  computeSchemaRevision,
  type ApplicationDeploymentMap,
  type MetaModel,
  type Uuid,
} from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { useCurrentModel } from "./ReduxHooks.js";

import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
export type ModelEnvironmentSyncProps = {
  applicationDeploymentMap: ApplicationDeploymentMap;
  /** Applications whose deployment schemas this owner keeps warm (typically Miroir meta + current app). */
  applicationsToSync: Uuid[];
};

/**
 * Single owner of UI schema resolution per deployment (Feature 199 Proposal 3).
 * Mount once at the app shell (earlier sibling of page content) so layout effects
 * populate `schemasPerDeployment` before consumer paint.
 */
export function ModelEnvironmentSync(props: ModelEnvironmentSyncProps) {
  const uniqueApplications = useMemo(() => {
    const seen = new Set<Uuid>();
    const result: Uuid[] = [];
    for (const application of props.applicationsToSync) {
      if (!application || seen.has(application)) {
        continue;
      }
      seen.add(application);
      result.push(application);
    }
    return result;
  }, [props.applicationsToSync]);

  return (
    <>
      {uniqueApplications.map((application) => (
        <ModelEnvironmentSyncOne
          key={application}
          application={application}
          applicationDeploymentMap={props.applicationDeploymentMap}
        />
      ))}
    </>
  );
}

function ModelEnvironmentSyncOne(props: {
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
}) {
  const context = useMiroirContextService();
  const deploymentUuid = props.applicationDeploymentMap[props.application];
  const miroirDeploymentUuid = props.applicationDeploymentMap[selfApplicationMiroir.uuid];
  const miroirMetaModel: MetaModel = useCurrentModel(
    selfApplicationMiroir.uuid,
    props.applicationDeploymentMap,
  );
  const currentModel: MetaModel = useCurrentModel(
    props.application,
    props.applicationDeploymentMap,
  );

  const metaSchemaRevision = useMemo(
    () =>
      miroirDeploymentUuid && miroirMetaModel
        ? computeSchemaRevision(
            miroirDeploymentUuid,
            miroirMetaModel,
            selfApplicationMiroir.uuid,
          )
        : "",
    [miroirDeploymentUuid, miroirMetaModel],
  );

  const appSchemaRevision = useMemo(
    () =>
      deploymentUuid && currentModel
        ? computeSchemaRevision(deploymentUuid, currentModel, props.application)
        : "",
    [deploymentUuid, currentModel, props.application],
  );

  useLayoutEffect(() => {
    if (!currentModel || !deploymentUuid) {
      return;
    }
    context.applyDeploymentSchemaRevision({
      deploymentUuid,
      applicationUuid: props.application,
      currentModel,
      metaSchemaRevision,
      appSchemaRevision,
    });
  }, [
    props.application,
    appSchemaRevision,
    metaSchemaRevision,
    deploymentUuid,
    currentModel,
    context.applyDeploymentSchemaRevision,
  ]);

  return null;
}
