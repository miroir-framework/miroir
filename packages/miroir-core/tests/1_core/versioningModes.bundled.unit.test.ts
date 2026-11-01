/**
 * Bundled Miroir profile excludes Version History.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../../src/1_core/constants.js";
import { devDataEntityUuids, versionHistoryEntityUuids } from "../../src/1_core/Model.js";
import { ConfigurationService } from "../../src/3_controllers/ConfigurationService.js";
import { PersistenceStoreControllerManager } from "../../src/4_services/PersistenceStoreControllerManager.js";
import type { BundledSectionData } from "miroir-store-bundled";
import {
  BUNDLED_DEV_DATA_UNSUPPORTED_MESSAGE,
  BundledUnsupportedOptionalSectionStore,
  miroirBundledStoreSectionStartup,
} from "miroir-store-bundled";
import {
  entityEntityVersion,
  entitySelfApplicationVersion,
} from "miroir-app-miroir";
import {
  demoBundledData,
  demoMiroirConfig,
  MIROIR_DEPLOYMENT_UUID,
} from "../../../miroir-sandbox/src/bundledData.js";

const BUNDLE_SIZE_MEASUREMENT = "90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b";

function countVersionHistoryInstances(section: BundledSectionData): number {
  let count = 0;
  for (const parentUuid of versionHistoryEntityUuids) {
    count += section[parentUuid]?.length ?? 0;
  }
  return count;
}

describe("bundled Miroir profile excludes Version History", () => {
  let tempRoot: string;

  afterEach(async () => {
    ConfigurationService.configurationService.adminStoreFactoryRegister.clear();
    ConfigurationService.configurationService.StoreSectionFactoryRegister.clear();
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("demoBundledData Miroir model and data omit Version History instances", () => {
    const bundled = demoBundledData[MIROIR_DEPLOYMENT_UUID];
    expect(countVersionHistoryInstances(bundled.model)).toBe(0);
    expect(countVersionHistoryInstances(bundled.data)).toBe(0);
  });

  it("demoMiroirConfig Miroir StoreUnitConfiguration has no modelVersion key", () => {
    const miroirStoreConfig =
      demoMiroirConfig.client!.deploymentStorageConfig![MIROIR_DEPLOYMENT_UUID];
    expect(miroirStoreConfig).toBeDefined();
    expect(miroirStoreConfig.modelVersion).toBeUndefined();
    expect(Object.keys(miroirStoreConfig).sort()).toEqual(["admin", "data", "model"]);
  });

  it("bundled bootstrap has no Version History in store sections", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "versioning-modes-bundled-"));
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
    // Unversioned / bundled deployments have no modelVersion section: reads return an empty
    // collection rather than an error (PersistenceStoreController.getInstances, #232 / #234).
    expect(modelVersionRead instanceof Action2Error).toBe(false);
    expect(
      (modelVersionRead.returnedDomainElement as any).elementValue?.instances ?? [],
    ).toHaveLength(0);
  });

  it("refuses a devData write on a bundled deployment, and reads nothing (#647)", async () => {
    const devDataStore = new BundledUnsupportedOptionalSectionStore(MIROIR_DEPLOYMENT_UUID, "devData");
    const written = await devDataStore.upsertInstance(BUNDLE_SIZE_MEASUREMENT, {
      uuid: "7d0b6f4e-6f8e-4d3e-9d55-647000000401",
      parentUuid: BUNDLE_SIZE_MEASUREMENT,
    } as any);
    expect(written instanceof Action2Error).toBe(true);
    expect((written as Action2Error).errorMessage).toBe(BUNDLED_DEV_DATA_UNSUPPORTED_MESSAGE);

    tempRoot = await mkdtemp(join(tmpdir(), "versioning-modes-bundled-"));
    miroirBundledStoreSectionStartup(ConfigurationService.configurationService, demoBundledData);
    const manager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      tempRoot,
    );
    const storeConfig = demoMiroirConfig.client!.deploymentStorageConfig![MIROIR_DEPLOYMENT_UUID];
    expect(await manager.addPersistenceStoreController(MIROIR_DEPLOYMENT_UUID, storeConfig)).toBe(ACTION_OK);
    const controller = manager.getPersistenceStoreController(MIROIR_DEPLOYMENT_UUID)!;
    await controller.open();
    const devDataRead = await controller.getInstances("devData", BUNDLE_SIZE_MEASUREMENT);
    expect(devDataRead instanceof Action2Error).toBe(false);
    expect((devDataRead.returnedDomainElement as any).elementValue?.instances ?? []).toHaveLength(0);
    for (const parentUuid of devDataEntityUuids) {
      expect(demoBundledData[MIROIR_DEPLOYMENT_UUID].data[parentUuid], parentUuid).toBeUndefined();
    }
  });
});
