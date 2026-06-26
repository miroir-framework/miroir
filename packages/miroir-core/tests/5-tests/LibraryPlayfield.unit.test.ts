import { describe, expect, it, vi } from "vitest";

import type { Deployment, StoreUnitConfiguration } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { DomainControllerInterface } from "../../src/0_interfaces/2_domain/DomainControllerInterface";
import type { PersistenceStoreControllerManagerInterface } from "../../src/0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import type { ApplicationDeploymentMap } from "../../src/1_core/Deployment";
import { defaultMiroirMetaModel } from "../../src/1_core/Model";
import {
  ensureLibraryPlayfield,
  resetLibraryPlayfield,
  type EnsureLibraryPlayfieldParams,
} from "../../src/5_tests/LibraryPlayfield";

const LIBRARY_DEPLOYMENT_UUID = "11111111-1111-1111-1111-111111111111";
const LIBRARY_APP_UUID = "22222222-2222-2222-2222-222222222222";
const MIROIR_DEPLOYMENT_UUID = "33333333-3333-3333-3333-333333333333";
const MIROIR_APP_UUID = "44444444-4444-4444-4444-444444444444";

function baseEnsureParams(
  overrides: Partial<EnsureLibraryPlayfieldParams> = {},
): EnsureLibraryPlayfieldParams {
  return {
    domainController: {
      handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    } as unknown as DomainControllerInterface,
    applicationDeploymentMap: {} as ApplicationDeploymentMap,
    adminDeployment: { uuid: "admin-uuid" } as Deployment,
    libraryDeploymentStorageConfiguration: {} as StoreUnitConfiguration,
    libraryDeploymentUuid: LIBRARY_DEPLOYMENT_UUID,
    librarySelfApplicationUuid: LIBRARY_APP_UUID,
    mode: "createIfAbsent",
    ...overrides,
  };
}

describe("LibraryPlayfield (Gap B L1/L2)", () => {
  describe("ensureLibraryPlayfield", () => {
    it("createIfAbsent with no existing deployment calls handleCompositeAction once", async () => {
      const handleCompositeAction = vi.fn().mockResolvedValue({ status: "ok" });
      const params = baseEnsureParams({
        domainController: { handleCompositeAction } as unknown as DomainControllerInterface,
      });

      const result = await ensureLibraryPlayfield(params);

      expect(handleCompositeAction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ created: true });
    });

    it("createIfAbsent when deployment already exists is a no-op", async () => {
      const handleCompositeAction = vi.fn();
      const persistenceStoreControllerManager = {
        getPersistenceStoreController: vi.fn().mockReturnValue({}),
      } as unknown as PersistenceStoreControllerManagerInterface;

      const result = await ensureLibraryPlayfield(
        baseEnsureParams({
          domainController: { handleCompositeAction } as unknown as DomainControllerInterface,
          persistenceStoreControllerManager,
        }),
      );

      expect(handleCompositeAction).not.toHaveBeenCalled();
      expect(result).toEqual({ created: false });
    });

    it("requireExisting throws when deployment is absent", async () => {
      await expect(
        ensureLibraryPlayfield(baseEnsureParams({ mode: "requireExisting" })),
      ).rejects.toThrow(/required but absent/);
    });

    it("skip mode is a no-op", async () => {
      const handleCompositeAction = vi.fn();
      const result = await ensureLibraryPlayfield(
        baseEnsureParams({
          mode: "skip",
          domainController: { handleCompositeAction } as unknown as DomainControllerInterface,
        }),
      );

      expect(handleCompositeAction).not.toHaveBeenCalled();
      expect(result).toEqual({ created: false });
    });
  });

  describe("resetLibraryPlayfield", () => {
    it("with libraryEntitiesAndInstances resets then seeds library", async () => {
      const handleAction = vi.fn().mockResolvedValue(undefined);
      const handleCompositeAction = vi.fn().mockResolvedValue({ status: "ok" });
      const domainController = {
        handleAction,
        handleCompositeAction,
      } as unknown as DomainControllerInterface;

      await resetLibraryPlayfield({
        domainController,
        applicationDeploymentMap: {} as ApplicationDeploymentMap,
        libraryDeploymentUuid: LIBRARY_DEPLOYMENT_UUID,
        librarySelfApplicationUuid: LIBRARY_APP_UUID,
        libraryEntitiesAndInstances: [],
        librarySeedInitParams: { dataStoreType: "app" } as never,
        librarySeedMetaModel: defaultMiroirMetaModel,
      });

      expect(handleAction).toHaveBeenCalled();
      expect(handleCompositeAction).toHaveBeenCalledTimes(1);
    });

    it("resetMiroirPlatform resets miroir deployment only", async () => {
      const handleAction = vi.fn().mockResolvedValue(undefined);
      const handleCompositeAction = vi.fn();
      const domainController = {
        handleAction,
        handleCompositeAction,
      } as unknown as DomainControllerInterface;

      await resetLibraryPlayfield({
        domainController,
        applicationDeploymentMap: {} as ApplicationDeploymentMap,
        libraryDeploymentUuid: LIBRARY_DEPLOYMENT_UUID,
        librarySelfApplicationUuid: LIBRARY_APP_UUID,
        resetMiroirPlatform: true,
        miroirDeploymentUuid: MIROIR_DEPLOYMENT_UUID,
        miroirSelfApplicationUuid: MIROIR_APP_UUID,
      });

      expect(handleAction).toHaveBeenCalled();
      expect(handleCompositeAction).not.toHaveBeenCalled();
    });

    it("without seed resets library deployment only", async () => {
      const handleAction = vi.fn().mockResolvedValue(undefined);
      const handleCompositeAction = vi.fn();
      const domainController = {
        handleAction,
        handleCompositeAction,
      } as unknown as DomainControllerInterface;

      await resetLibraryPlayfield({
        domainController,
        applicationDeploymentMap: {} as ApplicationDeploymentMap,
        libraryDeploymentUuid: LIBRARY_DEPLOYMENT_UUID,
        librarySelfApplicationUuid: LIBRARY_APP_UUID,
      });

      expect(handleAction).toHaveBeenCalled();
      expect(handleCompositeAction).not.toHaveBeenCalled();
    });
  });
});
