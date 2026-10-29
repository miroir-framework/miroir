import type {
  StoreSectionConfiguration,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../0_interfaces/1_core/EntityVersion";

/** The name of a throwaway testbed's stores (#575): a Postgres identifier, `_modelVersion` included. */
export function testbedStoreName(testbedDeploymentUuid: Uuid): string {
  return `testbed_${testbedDeploymentUuid.replace(/-/g, "")}`;
}

function parentDirectory(directory: string): string | undefined {
  const trimmed = directory.replace(/[/\\]+$/, "");
  const index = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return index > 0 ? trimmed.slice(0, index) : undefined;
}

function lastSegment(directory: string): string {
  const trimmed = directory.replace(/[/\\]+$/, "");
  return trimmed.slice(Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\")) + 1);
}

function testbedSection(
  section: StoreSectionConfiguration,
  storeName: string,
  suffix: string,
): StoreSectionConfiguration {
  switch (section.emulatedServerType) {
    case "filesystem": {
      // `.miroir/<env>/library/model` gives `.miroir/<env>/<storeName>/model`
      const applicationDirectory = parentDirectory(section.directory);
      const environmentDirectory = applicationDirectory ? parentDirectory(applicationDirectory) : undefined;
      return {
        emulatedServerType: "filesystem",
        directory: environmentDirectory
          ? `${environmentDirectory}/${storeName}/${lastSegment(section.directory)}`
          : `${section.directory.replace(/[/\\]+$/, "")}_${storeName}`,
      };
    }
    case "sql":
      return { ...section, schema: `${storeName}${suffix}` };
    case "mongodb":
      return { ...section, database: `${storeName}${suffix}` };
    case "indexedDb":
      return { emulatedServerType: "indexedDb", indexedDbName: `${storeName}${suffix}` };
    case "bundled":
      throw new Error("a testbed cannot be created beside a bundled store, which is read-only");
  }
}

/**
 * The stores of a throwaway testbed (#575), beside those of the deployment it copies: same store types,
 * named after the testbed. The Admin section is the live one, where the testbed's Deployment row goes.
 */
export function testbedStorageConfiguration(
  liveConfiguration: StoreUnitConfiguration,
  testbedDeploymentUuid: Uuid,
): StoreUnitConfiguration {
  const storeName = testbedStoreName(testbedDeploymentUuid);
  return {
    admin: liveConfiguration.admin,
    model: testbedSection(liveConfiguration.model, storeName, ""),
    data: testbedSection(liveConfiguration.data, storeName, ""),
    ...(liveConfiguration.modelVersion
      ? { modelVersion: testbedSection(liveConfiguration.modelVersion, storeName, "_modelVersion") }
      : {}),
  };
}
