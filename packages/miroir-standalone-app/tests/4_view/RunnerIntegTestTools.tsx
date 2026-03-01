/**
 * RunnerIntegTestTools.tsx
 *
 * Reusable integration-test helpers for Runner components (Runner_CreateEntity, etc.).
 *
 * Provides:
 *  - A "local-cache-only" React wrapper that boots an in-memory LocalCache with the
 *    Miroir meta-model, the Library application model and data, **and** admin-level
 *    entities (AdminApplication, Deployment) so that Runner actions that query admin
 *    data will resolve.
 *  - Utility functions for rendering Runner components inside that wrapper.
 *  - Re-exports of common test-tools (extractValuesFromRenderedElements, formValuesToJSON,
 *    waitAfterUserInteraction, etc.) so that Runner tests have a single import point.
 */
import { ThemeProvider } from "@emotion/react";
import { createTheme, StyledEngineProvider } from "@mui/material";
import { render } from "@testing-library/react";
import { expect, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  EntityInstance,
  LocalCacheInterface,
} from "miroir-core";
import {
  Action2ReturnType,
  ConfigurationService,
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entitySelfApplicationVersion,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
  selfApplicationMiroir,
} from "miroir-core";
import {
  LocalCache,
  LocalCacheProvider,
  MiroirContextReactProvider,
  PersistenceReduxSaga,
} from "miroir-react";

import {
  entityAuthor,
  entityBook,
  entityCountry,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionCountry,
  entityDefinitionPublisher,
  entityPublisher,
  libraryApplicationInstances,
  menuDefaultLibrary,
  reportAuthorDetails,
  reportAuthorList,
  reportBookDetails,
  reportBookList,
  reportCountryList,
  reportPublisherList,
  selfApplicationDeploymentLibrary,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import {
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
  entityApplicationForAdmin,
  entityDefinitionAdminApplication,
  entityDefinitionDeployment,
  entityDeployment,
  adminApplication_Admin,
  adminApplication_Miroir,
  menuDefaultAdmin,
} from "miroir-test-app_deployment-admin";

import { DocumentOutlineContextProvider } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/InstanceEditorOutlineContext";
import { ReportPageContextProvider } from "../../src/miroir-fwk/4_view/components/Reports/ReportPageContext";
import {
  extractValuesFromRenderedElements,
  formValuesToJSON,
  testThemeParams,
  waitAfterUserInteraction,
  waitForProgressiveRendering,
} from "./JzodElementEditorTestTools";

// Re-export common test helpers so Runner tests can import from a single module
export {
  extractValuesFromRenderedElements,
  formValuesToJSON,
  waitAfterUserInteraction,
  waitForProgressiveRendering,
};

// ################################################################################################
// Application deployment map that includes both default Miroir deployments and Library
// ################################################################################################
export const runnerTestApplicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: selfApplicationDeploymentLibrary.uuid,
};

// ################################################################################################
// Mocked domain controller – used by the RunnerView wrapper.
// For pure GUI tests (form rendering / validation) the mock is sufficient.
// For execution tests replace or spy on `handleCompositeActionTemplate`.
// ################################################################################################
export const createMockDomainController = () => {
  const mock: Partial<DomainControllerInterface> = {
    handleAction: vi.fn().mockResolvedValue({ status: "ok" }),
    handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    handleCompositeActionTemplate: vi.fn().mockResolvedValue({ status: "ok" }),
    handleTestCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    handleTestCompositeActionSuite: vi.fn().mockResolvedValue({ status: "ok" }),
    handleTestCompositeActionTemplateSuite: vi.fn().mockResolvedValue({ status: "ok" }),
    currentModelEnvironment: vi.fn().mockReturnValue(undefined),
    getLocalCache: vi.fn(),
  };
  return mock as DomainControllerInterface;
};

// ################################################################################################
/**
 * Build a React wrapper component that provides everything a Runner component needs:
 *   - A LocalCache pre-loaded with Miroir meta-model, Library model + data, and
 *     admin-level entities/data (AdminApplication, Deployment) so that selectors
 *     and foreign-key lookups resolve.
 *   - MiroirContextReactProvider (provides domainController, miroirContext).
 *   - DocumentOutlineContextProvider + ReportPageContextProvider (required by editors).
 *
 * This mirrors the approach in JzodElementEditorTestTools.getWrapperLoadingLocalCache
 * but adds admin deployment data and exposes the localCache + domainController for test
 * assertions.
 *
 * @returns An object with { Wrapper, localCache, domainController } so tests can render
 *          components and also inspect/assert on the mock controller.
 */
export function createRunnerTestEnvironment(options?: {
  domainController?: DomainControllerInterface;
  applicationDeploymentMap?: ApplicationDeploymentMap;
}) {
  const applicationDeploymentMap = options?.applicationDeploymentMap ?? runnerTestApplicationDeploymentMap;
  const domainController = options?.domainController ?? createMockDomainController();

  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  const miroirContext = new MiroirContext(
    miroirActivityTracker,
    miroirEventService,
    undefined as any, // no MiroirConfigClient needed for local-cache-only tests
  );

  const theme = createTheme(testThemeParams);

  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

  const persistenceSaga = new PersistenceReduxSaga({
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
    ),
    remotePersistenceStoreRestClient: undefined as any,
  });

  const localCache: LocalCacheInterface = new LocalCache(persistenceSaga);

  // ---- Load Miroir meta-model ----
  const resultMiroirMetaModel: Action2ReturnType = localCache.handleLocalCacheAction(
    {
      actionType: "loadNewInstancesInLocalCache",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationMiroir.uuid,
        objects: [
          {
            parentName: entityEntity.name,
            parentUuid: entityEntity.uuid,
            applicationSection: "model",
            instances: defaultMiroirMetaModel.entities,
          },
          {
            parentName: entityEntityDefinition.name,
            parentUuid: entityEntityDefinition.uuid,
            applicationSection: "model",
            instances: defaultMiroirMetaModel.entityDefinitions,
          },
          {
            parentName: entityJzodSchema.name,
            parentUuid: entityJzodSchema.uuid,
            applicationSection: "data",
            instances: defaultMiroirMetaModel.jzodSchemas,
          },
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "data",
            instances: defaultMiroirMetaModel.menus,
          },
          {
            parentName: entitySelfApplicationVersion.name,
            parentUuid: entitySelfApplicationVersion.uuid,
            applicationSection: "data",
            instances: defaultMiroirMetaModel.applicationVersions,
          },
          {
            parentName: entityReport.name,
            parentUuid: entityReport.uuid,
            applicationSection: "data",
            instances: defaultMiroirMetaModel.reports,
          },
        ],
      },
    },
    applicationDeploymentMap,
  );
  if (resultMiroirMetaModel.status !== "ok") {
    throw new Error(`Error loading Miroir Meta Model: ${JSON.stringify(resultMiroirMetaModel, null, 2)}`);
  }

  localCache.handleLocalCacheAction(
    {
      actionType: "rollback",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: selfApplicationMiroir.uuid },
    },
    applicationDeploymentMap,
  );

  // ---- Load Library application model ----
  const resultLibraryModel: Action2ReturnType = localCache.handleLocalCacheAction(
    {
      actionType: "loadNewInstancesInLocalCache",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationLibrary.uuid,
        objects: [
          {
            parentName: entityEntity.name,
            parentUuid: entityEntity.uuid,
            applicationSection: "model",
            instances: [
              entityAuthor as EntityInstance,
              entityBook as EntityInstance,
              entityCountry as EntityInstance,
              entityPublisher as EntityInstance,
            ],
          },
          {
            parentName: entityEntityDefinition.name,
            parentUuid: entityEntityDefinition.uuid,
            applicationSection: "model",
            instances: [
              entityDefinitionBook as EntityInstance,
              entityDefinitionAuthor as EntityInstance,
              entityDefinitionCountry as EntityInstance,
              entityDefinitionPublisher as EntityInstance,
            ],
          },
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "model",
            instances: [menuDefaultLibrary],
          },
          {
            parentName: entityReport.name,
            parentUuid: entityReport.uuid,
            applicationSection: "model",
            instances: [
              reportAuthorList as EntityInstance,
              reportAuthorDetails as EntityInstance,
              reportBookList as EntityInstance,
              reportBookDetails as EntityInstance,
              reportCountryList as EntityInstance,
              reportPublisherList as EntityInstance,
            ],
          },
          ...libraryApplicationInstances,
        ],
      },
    },
    applicationDeploymentMap,
  );
  if (resultLibraryModel.status !== "ok") {
    throw new Error(`Error loading Library Application Model: ${JSON.stringify(resultLibraryModel, null, 2)}`);
  }

  localCache.handleLocalCacheAction(
    {
      actionType: "rollback",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: selfApplicationLibrary.uuid },
    },
    applicationDeploymentMap,
  );

  // ---- Load Library data instances ----
  const resultLibraryData: Action2ReturnType = localCache.handleLocalCacheAction(
    {
      actionType: "loadNewInstancesInLocalCache",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationLibrary.uuid,
        objects: libraryApplicationInstances,
      },
    },
    applicationDeploymentMap,
  );
  if (resultLibraryData.status !== "ok") {
    throw new Error(`Error loading Library Application Instances: ${JSON.stringify(resultLibraryData, null, 2)}`);
  }

  localCache.handleLocalCacheAction(
    {
      actionType: "rollback",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: selfApplicationLibrary.uuid },
    },
    applicationDeploymentMap,
  );

  // ---- Load admin-level entities and data (AdminApplication, Deployment) ----
  // Runner_CreateEntity queries admin deployment to filter by AdminApplication.
  const resultAdminModel: Action2ReturnType = localCache.handleLocalCacheAction(
    {
      actionType: "loadNewInstancesInLocalCache",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: adminSelfApplication.uuid,
        objects: [
          {
            parentName: entityEntity.name,
            parentUuid: entityEntity.uuid,
            applicationSection: "model",
            instances: [
              entityApplicationForAdmin as EntityInstance,
              entityDeployment as EntityInstance,
            ],
          },
          {
            parentName: entityEntityDefinition.name,
            parentUuid: entityEntityDefinition.uuid,
            applicationSection: "model",
            instances: [
              entityDefinitionAdminApplication as EntityInstance,
              entityDefinitionDeployment as EntityInstance,
            ],
          },
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "model",
            instances: [menuDefaultAdmin],
          },
          // data: admin applications
          {
            parentName: entityApplicationForAdmin.name,
            parentUuid: entityApplicationForAdmin.uuid,
            applicationSection: "data",
            instances: [
              adminApplication_Admin as EntityInstance,
              adminApplication_Miroir as EntityInstance,
            ],
          },
          // data: deployments
          {
            parentName: entityDeployment.name,
            parentUuid: entityDeployment.uuid,
            applicationSection: "data",
            instances: [
              deployment_Admin as EntityInstance,
              deployment_Miroir as EntityInstance,
            ],
          },
        ],
      },
    },
    applicationDeploymentMap,
  );
  if (resultAdminModel.status !== "ok") {
    throw new Error(`Error loading Admin data: ${JSON.stringify(resultAdminModel, null, 2)}`);
  }

  localCache.handleLocalCacheAction(
    {
      actionType: "rollback",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: adminSelfApplication.uuid },
    },
    applicationDeploymentMap,
  );

  // Wire the mock domain controller getLocalCache to return the real local cache
  if (typeof (domainController.getLocalCache as any).mockReturnValue === "function") {
    (domainController.getLocalCache as any).mockReturnValue(localCache);
  }

  // ----- Build the React wrapper component -----
  const handleToggleOutline = () => {};
  const handleNavigateToPath = (_path: string[]) => {};

  const Wrapper: React.FC<{ children?: React.ReactNode }> = (props) => {
    return (
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <LocalCacheProvider store={(localCache as any).getInnerStore()}>
            <MiroirContextReactProvider
              miroirContext={miroirContext}
              domainController={domainController}
              testingDeploymentUuid={selfApplicationDeploymentLibrary.uuid}
            >
              <DocumentOutlineContextProvider
                isOutlineOpen={true}
                onToggleOutline={handleToggleOutline}
                onNavigateToPath={handleNavigateToPath}
              >
                <ReportPageContextProvider>{props.children}</ReportPageContextProvider>
              </DocumentOutlineContextProvider>
            </MiroirContextReactProvider>
          </LocalCacheProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    );
  };

  return {
    Wrapper,
    localCache,
    domainController,
    miroirContext,
    applicationDeploymentMap,
  };
}

// ################################################################################################
/**
 * Render a Runner component inside a fully initialized test wrapper.
 *
 * Returns the render result plus references to the mock domainController,
 * localCache, etc., for assertions.
 */
export function renderRunner(
  ui: React.ReactElement,
  envOptions?: Parameters<typeof createRunnerTestEnvironment>[0],
) {
  const env = createRunnerTestEnvironment(envOptions);
  const renderResult = render(ui, { wrapper: env.Wrapper });
  return {
    ...renderResult,
    ...env,
  };
}
