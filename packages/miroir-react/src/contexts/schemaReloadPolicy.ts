import {
  classifySchemaChange,
  resolveFundamentalSchemaForDeployment,
  type MetaModel,
  type MlSchema,
  type Uuid,
} from "miroir-core";

export type DeploymentSchemaRevisions = {
  meta: string;
  app: string;
};

export type ApplySchemaRevisionInput = {
  deploymentUuid: Uuid;
  applicationUuid: Uuid;
  metaSchemaRevision: string;
  appSchemaRevision: string;
  previousRevisions?: DeploymentSchemaRevisions;
};

export type ApplySchemaRevisionResult = {
  schemaReloadRequired: boolean;
  invalidateCachedSchema: boolean;
  revisions: DeploymentSchemaRevisions;
  shouldResolveSchema: boolean;
  resolutionMode: "initial" | "overlay" | "none";
};

export function evaluateSchemaRevisionChange(
  input: ApplySchemaRevisionInput,
): ApplySchemaRevisionResult {
  const { previousRevisions, metaSchemaRevision, appSchemaRevision } = input;
  const revisions = { meta: metaSchemaRevision, app: appSchemaRevision };

  if (!previousRevisions) {
    return {
      shouldResolveSchema: true,
      schemaReloadRequired: false,
      invalidateCachedSchema: false,
      revisions,
      resolutionMode: "initial",
    };
  }

  const metaChange = classifySchemaChange(
    previousRevisions.meta,
    metaSchemaRevision,
    "meta",
  );
  if (metaChange === "meta-full-carry-on") {
    return {
      shouldResolveSchema: false,
      schemaReloadRequired: true,
      invalidateCachedSchema: false,
      revisions,
      resolutionMode: "none",
    };
  }

  const appChange = classifySchemaChange(
    previousRevisions.app,
    appSchemaRevision,
    "app",
  );
  if (appChange === "app-overlay") {
    return {
      shouldResolveSchema: true,
      schemaReloadRequired: false,
      invalidateCachedSchema: true,
      revisions,
      resolutionMode: "overlay",
    };
  }

  return {
    shouldResolveSchema: false,
    schemaReloadRequired: false,
    invalidateCachedSchema: false,
    revisions,
    resolutionMode: "none",
  };
}

export function resolveSchemaForDeploymentPolicy(
  deploymentUuid: Uuid,
  currentModel: MetaModel,
  resolutionMode: ApplySchemaRevisionResult["resolutionMode"],
): MlSchema {
  if (resolutionMode === "overlay") {
    return resolveFundamentalSchemaForDeployment(deploymentUuid, currentModel, "extended");
  }
  return resolveFundamentalSchemaForDeployment(deploymentUuid, currentModel, "auto");
}
