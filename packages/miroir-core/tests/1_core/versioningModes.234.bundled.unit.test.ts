/**
 * #234 Slice 4 — bundled Miroir profile excludes Version History.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../../src/1_core/constants.js";
import { versionHistoryEntityUuids } from "../../src/1_core/Model.js";
import { ConfigurationService } from "../../src/3_controllers/ConfigurationService.js";
import { PersistenceStoreControllerManager } from "../../src/4_services/PersistenceStoreControllerManager.js";
import type { BundledSectionData } from "miroir-store-bundled";
import { miroirBundledStoreSectionStartup } from "miroir-store-bundled";
import {
  entityEntityVersion,
  entitySelfApplicationVersion,
} from "miroir-test-app_deployment-miroir";
import {
  demoBundledData,
  demoMiroirConfig,
  MIROIR_DEPLOYMENT_UUID,
} from "../../../miroir-sandbox/src/bundledData.js";

function countVersionHistoryInstances(section: BundledSectionData): number {
  let count = 0;
  for (const parentUuid of versionHistoryEntityUuids) {
    count += section[parentUuid]?.length ?? 0;
  }
  return count;
}

describe("234 Slice 4 — bundled Miroir alignment", () => {
  let tempRoot: string;

  afterEach(async () => {
    ConfigurationService.configurationService.adminStoreFactoryRegister.clear();
    ConfigurationService.configurationService.StoreSectionFactoryRegister.clear();
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("4.1 — demoBundledData Miroir model and data omit Version History instances", () => {
    const bundled = demoBundledData[MIROIR_DEPLOYMENT_UUID];
    expect(countVersionHistoryInstances(bundled.model)).toBe(0);
    expect(countVersionHistoryInstances(bundled.data)).toBe(0);
  });

  it("4.1 — demoMiroirConfig Miroir StoreUnitConfiguration has no modelVersion key", () => {
    const miroirStoreConfig =
      demoMiroirConfig.client!.deploymentStorageConfig![MIROIR_DEPLOYMENT_UUID];
    expect(miroirStoreConfig).toBeDefined();
    expect(miroirStoreConfig.modelVersion).toBeUndefined();
    expect(Object.keys(miroirStoreConfig).sort()).toEqual(["admin", "data", "model"]);
  });

  it("4.2 — bundled bootstrap has no Version History in store sections", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "234-bundled-"));
    miroirBundledStoreSectionStartup(ConfigurationService.configurationService, demoBundledData);

    const manager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      tempRoot,
    );

    const storeConfig =
      demoMiroirConfig.client!.deploymentStorageConfig![MIROIR_DEPLOYMENT_UUID];
    expect(await manager.addPersistenceStoreController(MIROIR_DEPLOYMENT_UUID, storeConfig)).toBe(
      ACTION_OK,
    );

    const controller = manager.getPersistenceStoreController(MIROIR_DEPLOYMENT_UUID)!;
    await controller.open();

    const entityVersionRead = await controller.getInstances(
      "data",
      entityEntityVersion.uuid!,
    );
    expect(entityVersionRead instanceof Action2Error).toBe(false);
    const entityVersionInstances =
      (entityVersionRead.returnedDomainElement as any).elementValue?.instances ?? [];
    expect(entityVersionInstances).toHaveLength(0);

    const modelVersionRead = await controller.getInstances(
      "modelVersion",
      entitySelfApplicationVersion.uuid!,
    );
    expect(modelVersionRead instanceof Action2Error).toBe(true);
    if (modelVersionRead instanceof Action2Error) {
      expect(modelVersionRead.errorMessage).toMatch(/modelVersion/i);
    }
  });
});
