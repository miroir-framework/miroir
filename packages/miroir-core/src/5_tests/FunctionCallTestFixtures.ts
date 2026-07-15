import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { resolveFundamentalSchemaForDeployment } from "../1_core/jzod/schemaForDeployment";
import type { MlSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment, defaultMiroirMetaModel, defaultMiroirModelEnvironment } from "../1_core/Model";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  listQueryRunnerFixtureRefs,
  resolveQueryRunnerFixture,
  type QueryRunnerFixture,
} from "./QueryRunnerTestTools";

export type FunctionCallOnlyFixture = Record<string, unknown>;

export type FunctionCallFixture = QueryRunnerFixture | FunctionCallOnlyFixture;

const FUNCTION_CALL_ENVIRONMENTS: Record<string, () => MiroirModelEnvironment> = {
  defaultMiroirModelEnvironment: () => defaultMetaModelEnvironment,
  defaultMetaModelEnvironment: () => defaultMetaModelEnvironment,
};

const FUNCTION_CALL_META_MODEL_ENVIRONMENTS: Record<string, () => typeof defaultMiroirMetaModel> = {
  defaultMiroirMetaModel: () => defaultMiroirMetaModel,
};

const FUNCTION_CALL_ONLY_FIXTURES: Record<string, () => FunctionCallOnlyFixture> = {
  miroirFundamentalJzodSchema: () =>
    resolveFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel, "static"),
};

export function listFunctionCallFixtureRefs(): string[] {
  return [...listQueryRunnerFixtureRefs(), ...Object.keys(FUNCTION_CALL_ONLY_FIXTURES)];
}

export function resolveFunctionCallFixture(fixtureRef: string): FunctionCallFixture {
  const loader = FUNCTION_CALL_ONLY_FIXTURES[fixtureRef];
  if (loader) {
    return loader();
  }
  return resolveQueryRunnerFixture(fixtureRef);
}

export function resolveFunctionCallEnvironment(
  environmentRef: string | undefined,
): MiroirModelEnvironment | typeof defaultMiroirMetaModel | undefined {
  if (!environmentRef) {
    return undefined;
  }
  const metaModelLoader = FUNCTION_CALL_META_MODEL_ENVIRONMENTS[environmentRef];
  if (metaModelLoader) {
    return metaModelLoader();
  }
  const loader = FUNCTION_CALL_ENVIRONMENTS[environmentRef];
  if (!loader) {
    throw new Error(`Unknown functionCallTest environmentRef: ${environmentRef}`);
  }
  return loader();
}

export function listFunctionCallEnvironmentRefs(): string[] {
  return [
    ...Object.keys(FUNCTION_CALL_ENVIRONMENTS),
    ...Object.keys(FUNCTION_CALL_META_MODEL_ENVIRONMENTS),
  ];
}

export function resolveFixtureProperty(
  fixture: FunctionCallFixture,
  fixtureProperty: string | undefined,
): unknown {
  const key = fixtureProperty ?? "domainState";
  if (key in fixture) {
    return fixture[key as keyof FunctionCallFixture];
  }
  // Bare function-call-only fixtures (e.g. miroirFundamentalJzodSchema) are the injected value itself.
  if (key === "domainState" && !("domainState" in fixture)) {
    return fixture;
  }
  throw new Error(`Unknown fixture property: ${key}`);
}
