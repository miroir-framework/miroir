import { describe, expect, it, vi } from "vitest";

import type { Deployment, StoreUnitConfiguration } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { DomainControllerInterface } from "../../src/0_interfaces/2_domain/DomainControllerInterface";
import type { PersistenceStoreControllerManagerInterface } from "../../src/0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import type { ApplicationDeploymentMap } from "../../src/1_core/Deployment";
import {
  ensureMiroirPlatform,
  type EnsureMiroirPlatformParams,
} from "../../src/5_tests/MiroirPlatformPlayfield";

const MIROIR_DEPLOYMENT_UUID = "33333333-3333-3333-3333-333333333333";
const MIROIR_APP_UUID = "44444444-4444-4444-4444-444444444444";

function baseEnsureParams(
  overrides: Partial<EnsureMiroirPlatformParams> = {},
): EnsureMiroirPlatformParams {
  return {
    domainController: {
      handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    } as unknown as DomainControllerInterface,
    applicationDeploymentMap: {} as ApplicationDeploymentMap,
    adminDeployment: { uuid: "admin-uuid" } as Deployment,
    miroirDeploymentStorageConfiguration: {} as StoreUnitConfiguration,
    miroirDeploymentUuid: MIROIR_DEPLOYMENT_UUID,
    miroirSelfApplicationUuid: MIROIR_APP_UUID,
    mode: "createIfAbsent",
    deployStrategy: "compositeAction",
    ...overrides,
  };
}

describe("MiroirPlatformPlayfield (Gap A A1)", () => {
  describe("ensureMiroirPlatform", () => {
    it("createIfAbsent with no existing deployment calls composite deploy once", async () => {
      const handleCompositeAction = vi.fn().mockResolvedValue({ status: "ok" });
      const params = baseEnsureParams({
        domainController: { handleCompositeAction } as unknown as DomainControllerInterface,
      });

      const result = await ensureMiroirPlatform(params);

      expect(handleCompositeAction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ created: true });
    });

    it("createIfAbsent with persistenceStoreControllerHelper strategy calls deployViaPscHelper once", async () => {
      const handleCompositeAction = vi.fn();
      const deployViaPscHelper = vi.fn().mockResolvedValue(undefined);
      const params = baseEnsureParams({
        deployStrategy: "persistenceStoreControllerHelper",
        deployViaPscHelper,
        domainController: { handleCompositeAction } as unknown as DomainControllerInterface,
      });

      const result = await ensureMiroirPlatform(params);

      expect(deployViaPscHelper).toHaveBeenCalledTimes(1);
      expect(handleCompositeAction).not.toHaveBeenCalled();
      expect(result).toEqual({ created: true });
    });

    it("createIfAbsent when deployment already exists is a no-op", async () => {
      const handleCompositeAction = vi.fn();
      const deployViaPscHelper = vi.fn();
      const persistenceStoreControllerManager = {
        getPersistenceStoreController: vi.fn().mockReturnValue({}),
      } as unknown as PersistenceStoreControllerManagerInterface;

      const result = await ensureMiroirPlatform(
        baseEnsureParams({
          domainController: { handleCompositeAction } as unknown as DomainControllerInterface,
          deployViaPscHelper,
          persistenceStoreControllerManager,
        }),
      );

      expect(handleCompositeAction).not.toHaveBeenCalled();
      expect(deployViaPscHelper).not.toHaveBeenCalled();
      expect(result).toEqual({ created: false });
    });

    it("requireExisting throws when deployment is absent", async () => {
      await expect(
        ensureMiroirPlatform(baseEnsureParams({ mode: "requireExisting" })),
      ).rejects.toThrow(/required but absent/);
    });

    it("requireExisting when deployment exists is a no-op", async () => {
      const handleCompositeAction = vi.fn();
      const persistenceStoreControllerManager = {
        getPersistenceStoreController: vi.fn().mockReturnValue({}),
      } as unknown as PersistenceStoreControllerManagerInterface;

      const result = await ensureMiroirPlatform(
        baseEnsureParams({
          mode: "requireExisting",
          domainController: { handleCompositeAction } as unknown as DomainControllerInterface,
          persistenceStoreControllerManager,
        }),
      );

      expect(handleCompositeAction).not.toHaveBeenCalled();
      expect(result).toEqual({ created: false });
    });

    it("skip mode is a no-op", async () => {
      const handleCompositeAction = vi.fn();
      const result = await ensureMiroirPlatform(
        baseEnsureParams({
          mode: "skip",
          domainController: { handleCompositeAction } as unknown as DomainControllerInterface,
        }),
      );

      expect(handleCompositeAction).not.toHaveBeenCalled();
      expect(result).toEqual({ created: false });
    });
  });
});
