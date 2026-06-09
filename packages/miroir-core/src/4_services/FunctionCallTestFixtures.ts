import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { defaultMetaModelEnvironment } from "../1_core/Model";
import {
  listQueryRunnerFixtureRefs,
  resolveQueryRunnerFixture,
  type QueryRunnerFixture,
} from "./QueryRunnerTestTools";

export type FunctionCallOnlyFixture = Record<string, unknown>;

export type FunctionCallFixture = QueryRunnerFixture | FunctionCallOnlyFixture;

const FUNCTION_CALL_ENVIRONMENTS: Record<string, () => MiroirModelEnvironment> = {
  defaultMiroirModelEnvironment: () => defaultMetaModelEnvironment,
};

const FUNCTION_CALL_ONLY_FIXTURES: Record<string, () => FunctionCallOnlyFixture> = {};

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
): MiroirModelEnvironment | undefined {
  if (!environmentRef) {
    return undefined;
  }
  const loader = FUNCTION_CALL_ENVIRONMENTS[environmentRef];
  if (!loader) {
    throw new Error(`Unknown functionCallTest environmentRef: ${environmentRef}`);
  }
  return loader();
}

export function listFunctionCallEnvironmentRefs(): string[] {
  return Object.keys(FUNCTION_CALL_ENVIRONMENTS);
}

export function resolveFixtureProperty(
  fixture: FunctionCallFixture,
  fixtureProperty: string | undefined,
): unknown {
  const key = fixtureProperty ?? "domainState";
  if (key in fixture) {
    return fixture[key as keyof FunctionCallFixture];
  }
  throw new Error(`Unknown fixture property: ${key}`);
}
