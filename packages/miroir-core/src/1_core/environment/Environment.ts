import type {
  MiroirEnvironment,
  MiroirEnvironmentApplication,
  MiroirEnvironmentSectionMode,
  MiroirEnvironmentStoreType,
  StoreSectionConfiguration,
  StoreUnitConfiguration,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
// Environments (#321): an environment definition says which applications are installed and where
// each store section lives. Paths are relative to the repository root, which is the
// filesystemDeploymentRootDirectory of every environment.
// ################################################################################################

export const ENVIRONMENT_STATE_ROOT = ".miroir";

export type EnvironmentDeployment = {
  applicationKey: string;
  package: string;
  deployment: string;
  selfApplication: string;
  configuration: StoreUnitConfiguration;
};

export type EnvironmentDeploymentsResult =
  | { status: "ok"; deployments: EnvironmentDeployment[] }
  | { status: "error"; errors: string[] };

type SectionName = "model" | "data" | "modelVersion";

function sectionsOf(application: MiroirEnvironmentApplication): SectionName[] {
  return application.sections?.modelVersion ? ["model", "data", "modelVersion"] : ["model", "data"];
}

function sectionDirectory(
  environmentName: string,
  applicationKey: string,
  application: MiroirEnvironmentApplication,
  mode: MiroirEnvironmentSectionMode,
  section: SectionName | "admin",
): string {
  if (mode === "live") {
    const assets = `packages/${application.package}/assets`;
    return section === "admin" ? assets : `${assets}/${application.assetPrefix ?? applicationKey}_${section}`;
  }
  const state = `${ENVIRONMENT_STATE_ROOT}/${environmentName}/${applicationKey}`;
  return section === "admin" ? state : `${state}/${section}`;
}

function sectionConfiguration(
  environmentName: string,
  applicationKey: string,
  application: MiroirEnvironmentApplication,
  mode: MiroirEnvironmentSectionMode,
  store: MiroirEnvironmentStoreType,
  section: SectionName | "admin",
): StoreSectionConfiguration | string {
  const where = `application "${applicationKey}", section "${section}"`;
  if (store !== "filesystem") {
    return `${where}: store "${store}" is not supported yet (filesystem only)`;
  }
  return {
    emulatedServerType: "filesystem",
    directory: sectionDirectory(environmentName, applicationKey, application, mode, section),
  };
}

/**
 * The Deployment configurations of every application installed in an environment.
 * `live` sections point at the application package's assets (edits become git diffs);
 * `copy` sections live in the environment state directory `.miroir/<environmentName>/`.
 */
export function deriveEnvironmentDeployments(
  environment: MiroirEnvironment,
  environmentName: string,
): EnvironmentDeploymentsResult {
  const errors: string[] = [];
  const deployments: EnvironmentDeployment[] = [];

  for (const [applicationKey, application] of Object.entries(environment.applications ?? {})) {
    if (!application) {
      continue;
    }
    const configuration: Record<string, StoreSectionConfiguration> = {};
    for (const section of ["admin", ...sectionsOf(application)] as const) {
      const override = section === "admin" ? undefined : application.sections?.[section];
      const mode = override?.mode ?? application.mode;
      const store = override?.store ?? application.store;
      if (mode === "live" && store !== "filesystem") {
        errors.push(`application "${applicationKey}", section "${section}": mode "live" needs store "filesystem", got "${store}"`);
        continue;
      }
      const result = sectionConfiguration(environmentName, applicationKey, application, mode, store, section);
      if (typeof result === "string") {
        errors.push(result);
        continue;
      }
      configuration[section] = result;
    }
    deployments.push({
      applicationKey,
      package: application.package,
      deployment: application.deployment,
      selfApplication: application.selfApplication,
      configuration: configuration as StoreUnitConfiguration,
    });
  }

  return errors.length > 0 ? { status: "error", errors } : { status: "ok", deployments };
}
