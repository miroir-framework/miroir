import type { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import { miroirFundamentalJzodSchema } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import type {
  Action,
  JzodLiteral,
  MetaModel,
  MlSchema,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

type JzodElement = { type?: string; definition?: any; [key: string]: unknown };

function hasAppSpecificEndpoints(model: MetaModel): boolean {
  if (model.applicationUuid === selfApplicationMiroir.uuid) {
    return false;
  }
  return model.endpoints.some((endpoint) => endpoint.application === model.applicationUuid);
}

function getAppSpecificEndpoints(model: MetaModel) {
  return model.endpoints.filter((endpoint) => endpoint.application === model.applicationUuid);
}

function actionTypeKeyFromLiteral(actionType: JzodLiteral | undefined): string | undefined {
  if (actionType?.type === "literal") {
    return actionType.definition;
  }
  return undefined;
}

function actionTypeKeyFromDomainActionBranch(branch: JzodElement): string | undefined {
  if (branch.type === "schemaReference") {
    return branch.definition?.relativePath;
  }
  const objectDefinition = branch.definition as Action["actionParameters"] | undefined;
  return actionTypeKeyFromLiteral(objectDefinition?.actionType);
}

function buildAppActionBranches(
  appEndpoints: MetaModel["endpoints"],
  existingDomainActionBranches: JzodElement[],
): JzodElement[] {
  const existingActionTypes = new Set(
    existingDomainActionBranches
      .map(actionTypeKeyFromDomainActionBranch)
      .filter((key): key is string => key !== undefined),
  );

  const branches: JzodElement[] = [];
  for (const endpoint of appEndpoints) {
    for (const action of endpoint.definition?.actions ?? []) {
      const actionParameters = action.actionParameters;
      const actionTypeKey = actionTypeKeyFromLiteral(actionParameters.actionType);
      if (actionTypeKey && existingActionTypes.has(actionTypeKey)) {
        console.warn(
          `[getSchemaForDeployment] Skipping duplicate domainAction branch for actionType "${actionTypeKey}" (endpoint ${endpoint.uuid})`,
        );
        continue;
      }
      if (actionTypeKey) {
        existingActionTypes.add(actionTypeKey);
      }
      branches.push({
        type: "object",
        definition: actionParameters,
      });
    }
  }
  return branches;
}

function buildExtendedSchema(model: MetaModel): MlSchema {
  const baseSchema = miroirFundamentalJzodSchema as MlSchema & { definition: any };
  const appEndpoints = getAppSpecificEndpoints(model);
  const staticDomainAction = baseSchema.definition.context.domainAction as JzodElement;
  const appActionBranches = buildAppActionBranches(
    appEndpoints,
    staticDomainAction.definition ?? [],
  );
  const extendedDomainAction = {
    ...staticDomainAction,
    definition: [...(staticDomainAction.definition ?? []), ...appActionBranches],
  };

  return {
    ...baseSchema,
    definition: {
      ...baseSchema.definition,
      context: {
        ...baseSchema.definition.context,
        domainAction: extendedDomainAction,
      },
    },
  } as MlSchema;
}

/**
 * Returns the jzod schema for a deployment + model.
 * Phase 2.1+: distinct schema object when the model has app-owned endpoints.
 * Phase 2.2+: extends domainAction with app endpoint action shapes.
 */
export function getSchemaForDeployment(
  _deploymentUuid: Uuid,
  model: MetaModel,
): MlSchema {
  if (!hasAppSpecificEndpoints(model)) {
    return miroirFundamentalJzodSchema as MlSchema;
  }

  return buildExtendedSchema(model);
}
