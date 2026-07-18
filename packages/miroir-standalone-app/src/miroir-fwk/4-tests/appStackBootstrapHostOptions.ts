import type {
  IntegrationTestBootstrapPhase,
  IntegrationTestHostMode,
  MiroirPlatformEnsureMode,
  MiroirTestExecutionEnvironment,
} from "miroir-core";

/**
 * Host-mode knobs shared by emulated app-stack bootstrap and realServer client bootstrap.
 * Kept in src so browser sessions do not need to import the full Node bootstrap module.
 */
export type AppStackBootstrapHostOptions = {
  hostMode?: IntegrationTestHostMode;
  hostExecutionEnvironment?: Partial<MiroirTestExecutionEnvironment>;
  skipBootstrapPhases?: readonly IntegrationTestBootstrapPhase[];
  platformEnsureMode?: MiroirPlatformEnsureMode;
};

export function bootstrapHostOptionsFrom(
  source: AppStackBootstrapHostOptions,
): AppStackBootstrapHostOptions {
  return {
    hostMode: source.hostMode,
    hostExecutionEnvironment: source.hostExecutionEnvironment,
    skipBootstrapPhases: source.skipBootstrapPhases,
    platformEnsureMode: source.platformEnsureMode,
  };
}
