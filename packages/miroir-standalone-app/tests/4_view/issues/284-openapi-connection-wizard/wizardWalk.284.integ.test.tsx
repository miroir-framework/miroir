/**
 * Issue #284 Slice 6 — OpenAPI connection wizard walk (home launcher → Finish).
 *
 * Run:
 * ```bash
 * RUN_TEST=wizardWalk.284 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem wizardWalk.284
 * ```
 */
import { afterAll, afterEach, beforeAll, describe, vi, type ExpectStatic } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { Container } from "react-dom";
import * as RRDom from "react-router-dom";

import {
  allowInsecureBaseUrlsForTests,
  clearAllowedInsecureBaseUrlsForTests,
  defaultSelfApplicationDeploymentMap,
  entityReport,
  type ApplicationDeploymentMap,
  type EntityInstance,
} from "miroir-core";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

import { ReportPage } from "../../../../src/miroir-fwk/4_view/routes/ReportPage";
import type { ReportViewProps } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportHooks";
import {
  getJzodEditorTestLocalCache,
  prepareAndRunTestSuites,
  waitAfterUserInteraction,
  type ReactComponentTestSuitePrep,
  type ReactComponentTestSuites,
} from "../../JzodElementEditorTestTools";
import {
  startFakeExternalServiceServer,
  type FakeExternalServiceServer,
} from "../../../utils/fakeExternalServiceServer.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun = !RUN_TEST || RUN_TEST === "wizardWalk.284";

const HOME_REPORT_UUID = "29ef8018-43fc-4ee9-a736-6f9d625be7b7";
const WIZARD_REPORT_UUID = "dbd94bfe-b803-4bfd-8bb2-70a5932d5d1a";
const MIROIR_APPLICATION_UUID = selfApplicationMiroir.uuid;
const MIROIR_DEPLOYMENT_UUID = deployment_Miroir.uuid;
const LIBRARY_APPLICATION_UUID = selfApplicationLibrary.uuid;
const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const REPORT_ENTITY_UUID = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const ENDPOINT_NAME = "discogsPublic";
const PROBE_OPERATION_ID = "getRelease";
const CONVERTIBLE_OP = "getRelease";
const ONE_OF_ONLY_OP = "oneOfOnly";

const dataAssetsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
);

function loadReportAsset(uuid: string): EntityInstance {
  return JSON.parse(readFileSync(join(dataAssetsDir, `${uuid}.json`), "utf8")) as EntityInstance;
}

const currentUseParams = {
  applicationSection: "data" as const,
  deploymentUuid: MIROIR_DEPLOYMENT_UUID,
  instanceUuid: undefined as string | undefined,
  reportUuid: HOME_REPORT_UUID,
  application: MIROIR_APPLICATION_UUID,
};

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock("../../../../src/miroir-fwk/4_view/components/Reports/ModelDiagramReportSectionView.js", () => ({
  ModelDiagramReportSectionView: () => null,
}));

vi.spyOn(RRDom, "useParams").mockImplementation(() => ({ ...currentUseParams }));

let fakeServer: FakeExternalServiceServer | undefined;

/** Short settle; avoid waitAfterUserInteraction (Loading UI can stall it when Library is selected). */
async function waitAfterUserInteraction(): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
}

function testApplicationDeploymentMap(): ApplicationDeploymentMap {
  return {
    ...defaultSelfApplicationDeploymentMap,
    [LIBRARY_APPLICATION_UUID]: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  };
}

function upsertMiroirReportInTestCache(report: EntityInstance): void {
  const localCache = getJzodEditorTestLocalCache();
  if (!localCache) {
    throw new Error("upsertMiroirReportInTestCache: localCache is not initialized");
  }
  const map = testApplicationDeploymentMap();
  const deploymentUuid = map[MIROIR_APPLICATION_UUID];
  const domainState = localCache.getDomainState();
  const parentUuid = (report.parentUuid as string) ?? entityReport.uuid;
  for (const applicationSection of ["data", "model"] as const) {
    const existing =
      domainState?.[deploymentUuid]?.[applicationSection]?.[parentUuid]?.[report.uuid as string];
    const result = localCache.handleLocalCacheAction(
      {
        actionType: existing ? "updateInstance" : "createInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: MIROIR_APPLICATION_UUID,
          applicationSection,
          parentUuid,
          objects: [{ ...report, parentUuid }],
        },
      } as any,
      map,
    );
    if (result.status !== "ok") {
      throw new Error(
        `upsertMiroirReportInTestCache failed (${applicationSection}): ${JSON.stringify(result)}`,
      );
    }
  }
}

function homeReportProps(): ReportViewProps {
  currentUseParams.reportUuid = HOME_REPORT_UUID;
  currentUseParams.application = MIROIR_APPLICATION_UUID;
  currentUseParams.deploymentUuid = MIROIR_DEPLOYMENT_UUID;
  currentUseParams.applicationSection = "data";
  const home = loadReportAsset(HOME_REPORT_UUID);
  upsertMiroirReportInTestCache(home);
  upsertMiroirReportInTestCache(loadReportAsset(WIZARD_REPORT_UUID));
  return {
    application: MIROIR_APPLICATION_UUID,
    applicationSection: "data",
    deploymentUuid: MIROIR_DEPLOYMENT_UUID,
    pageParams: {
      applicationSection: "data",
      application: MIROIR_APPLICATION_UUID,
      deploymentUuid: MIROIR_DEPLOYMENT_UUID,
      reportUuid: HOME_REPORT_UUID,
    },
    reportDefinition: home as any,
    applicationDeploymentMap: testApplicationDeploymentMap(),
  };
}

function wizardReportProps(): ReportViewProps {
  currentUseParams.reportUuid = WIZARD_REPORT_UUID;
  currentUseParams.application = MIROIR_APPLICATION_UUID;
  currentUseParams.deploymentUuid = MIROIR_DEPLOYMENT_UUID;
  currentUseParams.applicationSection = "data";
  const wizard = loadReportAsset(WIZARD_REPORT_UUID);
  upsertMiroirReportInTestCache(wizard);
  const localCache = getJzodEditorTestLocalCache();
  if (localCache) {
    const map = testApplicationDeploymentMap();
    localCache.handleLocalCacheAction(
      {
        actionType: "createInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: ADMIN_APPLICATION_UUID,
          applicationSection: "data",
          parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
          objects: [
            {
              uuid: LIBRARY_APPLICATION_UUID,
              name: "Library",
              parentName: "SelfApplication",
              parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
            },
            {
              uuid: MIROIR_APPLICATION_UUID,
              name: "Miroir",
              parentName: "SelfApplication",
              parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
            },
            {
              uuid: ADMIN_APPLICATION_UUID,
              name: "Admin",
              parentName: "SelfApplication",
              parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
            },
          ],
        },
      } as any,
      map,
    );
  }
  return {
    application: MIROIR_APPLICATION_UUID,
    applicationSection: "data",
    deploymentUuid: MIROIR_DEPLOYMENT_UUID,
    pageParams: {
      applicationSection: "data",
      application: MIROIR_APPLICATION_UUID,
      deploymentUuid: MIROIR_DEPLOYMENT_UUID,
      reportUuid: WIZARD_REPORT_UUID,
    },
    reportDefinition: wizard as any,
    applicationDeploymentMap: testApplicationDeploymentMap(),
  };
}

function stepLabelText(): string {
  return screen.getByTestId("multistep-step-label").textContent ?? "";
}

function finishAlertText(): string {
  return screen.queryByTestId("multistep-finish-error")?.textContent ?? "";
}

function twoGetOpenApiDocument(): string {
  return JSON.stringify({
    openapi: "3.0.0",
    info: { title: "WizardTwoGet", version: "1.0.0" },
    paths: {
      "/releases/{id}": {
        get: {
          operationId: CONVERTIBLE_OP,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/oneof": {
        get: {
          operationId: ONE_OF_ONLY_OP,
          responses: {
            "200": {
              description: "oneof only",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [{ type: "string" }, { type: "number" }],
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

async function setInputByNameOrLabel(nameOrLabel: RegExp, value: string, optional = false): Promise<boolean> {
  let field: HTMLElement | undefined;
  try {
    field = await waitFor(
      () => {
        const byName = Array.from(
          document.querySelectorAll("textarea, input:not([type=file]):not([type=checkbox])"),
        ).find((el) => {
          const name = (el as HTMLInputElement).name ?? "";
          const aria = el.getAttribute("aria-label") ?? "";
          const id = el.id ?? "";
          return nameOrLabel.test(name) || nameOrLabel.test(aria) || nameOrLabel.test(id);
        }) as HTMLElement | undefined;
        if (byName) {
          return byName;
        }
        const byLabel = screen.queryByLabelText(nameOrLabel);
        if (!byLabel && optional) {
          return null as any;
        }
        expect(byLabel ?? byName).toBeTruthy();
        return (byLabel ?? byName) as HTMLElement;
      },
      { timeout: optional ? 1500 : 5000 },
    );
  } catch {
    if (optional) {
      return false;
    }
    throw new Error(`setInputByNameOrLabel: no field matching ${nameOrLabel}`);
  }
  if (!field) {
    return false;
  }
  await act(async () => {
    fireEvent.focus(field!);
    fireEvent.change(field!, { target: { value } });
    fireEvent.input(field!, { target: { value } });
    fireEvent.blur(field!);
  });
  await waitAfterUserInteraction();
  return true;
}

async function clickNext(): Promise<void> {
  const next =
    screen.queryByTestId("multistep-next") ??
    screen.getByRole("button", { name: "Next" });
  expect((next as HTMLButtonElement).disabled).toBe(false);
  await act(async () => {
    fireEvent.click(next);
  });
  await waitAfterUserInteraction();
}

async function pickLibraryApplication(container: Container): Promise<void> {
  const select = await waitFor(() => {
    const found = container.querySelector(
      '[name="application.application"], [aria-label="application.application"]',
    ) as HTMLElement | null;
    expect(found).toBeTruthy();
    return found!;
  });
  const stateTracker = screen.getByTestId("themed-select-state-application.application");
  fireEvent.click(select);
  await waitFor(() => {
    expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
  });
  const option = await waitFor(() => {
    const found = screen.getByLabelText(
      `application.application-option-${LIBRARY_APPLICATION_UUID}`,
    );
    expect(found).toBeTruthy();
    return found;
  });
  fireEvent.click(option);
  await waitAfterUserInteraction();
}

async function advanceToDocument(container: Container): Promise<void> {
  await waitFor(() => expect(stepLabelText()).toMatch(/Application/i));
  await pickLibraryApplication(container);
  await clickNext();
  await waitFor(() => expect(stepLabelText()).toMatch(/Endpoint name/i));
  await setInputByNameOrLabel(/endpointName|Endpoint name/i, ENDPOINT_NAME);
  await clickNext();
  await waitFor(() => expect(stepLabelText()).toMatch(/OpenAPI document/i));
}

const pageLabel = "wizardWalk.284";

const jzodElementEditorTests: Record<string, ReactComponentTestSuitePrep<any>> = {
  wizardWalk: {
    editor: ReportPage,
    wireLocalCacheCompositeAction: true,
    getJzodEditorTests: (
      componentUnderTest: React.FC<ReportViewProps>,
    ): ReactComponentTestSuites<ReportViewProps> => {
      return {
        wizardWalk: {
          suiteRenderComponent: componentUnderTest,
          tests: {
            "launcher-connect-external-service": {
              props: () => homeReportProps(),
              tests: async (expect: ExpectStatic, _container: Container) => {
                await waitFor(() => {
                  expect(
                    screen.queryByRole("button", { name: "Connect an external service" }),
                  ).toBeTruthy();
                });
                fireEvent.click(
                  screen.getByRole("button", { name: "Connect an external service" }),
                );
                await waitAfterUserInteraction();
                expect(navigateMock).toHaveBeenCalled();
                const href = String(navigateMock.mock.calls[0]?.[0] ?? "");
                expect(href).toContain(WIZARD_REPORT_UUID);
                expect(href).toContain(MIROIR_APPLICATION_UUID);
              },
            },
            "wizard-report-mounts-multistep-host": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, _container: Container) => {
                await waitFor(() => {
                  expect(screen.getByTestId("multistep-report-host")).toBeTruthy();
                });
                expect(stepLabelText()).toMatch(/Application/i);
              },
            },
            "picker-lists-fixture-application-only": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitFor(() => {
                  expect(screen.getByTestId("multistep-report-host")).toBeTruthy();
                });
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Application/i);
                });
                const select = await waitFor(() => {
                  const found = container.querySelector(
                    '[name="application.application"], [aria-label="application.application"]',
                  ) as HTMLElement | null;
                  expect(found).toBeTruthy();
                  return found!;
                });
                const stateTracker = screen.getByTestId(
                  "themed-select-state-application.application",
                );
                fireEvent.click(select);
                await waitFor(() => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
                });
                await waitAfterUserInteraction();
                const options = await waitFor(() => {
                  const found = screen.getAllByRole("option");
                  expect(found.length).toBeGreaterThan(0);
                  return found;
                });
                const values = options.map((el) => {
                  const aria = el.getAttribute("aria-label") ?? "";
                  const match = aria.match(/-option-(.+)$/);
                  return match?.[1] ?? "";
                });
                const labels = options.map((el) => (el.textContent ?? "").trim());
                expect(values).toContain(LIBRARY_APPLICATION_UUID);
                expect(labels.some((l) => /Library/i.test(l))).toBe(true);
                expect(values).not.toContain(MIROIR_APPLICATION_UUID);
                expect(values).not.toContain(ADMIN_APPLICATION_UUID);
                expect(labels.some((l) => l === "Miroir")).toBe(false);
                expect(labels.some((l) => l === "Admin")).toBe(false);
              },
            },
            "document-invalid-stays-with-parser-message": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await advanceToDocument(container);
                await setInputByNameOrLabel(/Paste OpenAPI|document\.text/i, "");
                await clickNext();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/OpenAPI document/i);
                  const alert = finishAlertText();
                  expect(alert).toMatch(
                    /openApiDocument is empty|openApiDocument must be a YAML\/JSON string or an object/i,
                  );
                  expect(alert).not.toMatch(/Required fields are missing/i);
                });
              },
            },
            "document-valid-lists-convertible-hides-oneof": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await advanceToDocument(container);
                await setInputByNameOrLabel(/Paste OpenAPI|document\.text/i, twoGetOpenApiDocument());
                await clickNext();
                await waitFor(() => expect(stepLabelText()).toMatch(/Base URL/i));
                const bagRaw = screen.getByTestId("multistep-step-bag").textContent ?? "";
                const bag = JSON.parse(bagRaw) as {
                  document?: { convertibleOperationIds?: string[] };
                };
                expect(bag.document?.convertibleOperationIds).toEqual([CONVERTIBLE_OP]);
                expect(bag.document?.convertibleOperationIds).not.toContain(ONE_OF_ONLY_OP);
              },
            },
            "document-upload-fills-text": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await advanceToDocument(container);
                const upload = screen.getByTestId("openapi-document-upload") as HTMLInputElement;
                const file = new File([twoGetOpenApiDocument()], "openapi.json", {
                  type: "application/json",
                });
                await act(async () => {
                  fireEvent.change(upload, { target: { files: [file] } });
                });
                await waitAfterUserInteraction();
                await waitFor(() => {
                  const textAreas = Array.from(
                    container.querySelectorAll("textarea, input"),
                  ) as HTMLInputElement[];
                  const filled = textAreas.some((el) =>
                    (el.value ?? "").includes(CONVERTIBLE_OP),
                  );
                  expect(filled).toBe(true);
                });
              },
            },
            "cleared-url-does-not-override-pasted-document": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await advanceToDocument(container);
                await setInputByNameOrLabel(/fetch from HTTPS URL|document\.url/i, "http://127.0.0.1/spec.yaml");
                await clickNext();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/OpenAPI document/i);
                  expect(finishAlertText()).toMatch(/not allowed|failed to fetch URL/i);
                });
                await setInputByNameOrLabel(/fetch from HTTPS URL|document\.url/i, "");
                await setInputByNameOrLabel(/Paste OpenAPI|document\.text/i, twoGetOpenApiDocument());
                await clickNext();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Base URL/i);
                  expect(finishAlertText()).not.toMatch(/failed to fetch URL|not allowed/i);
                });
              },
            },
            "document-private-url-refused": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await advanceToDocument(container);
                await setInputByNameOrLabel(/fetch from HTTPS URL|document\.url/i, "http://127.0.0.1/");
                await clickNext();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/OpenAPI document/i);
                  expect(finishAlertText()).toMatch(
                    /Insecure or private external service baseUrl is not allowed/i,
                  );
                });
              },
            },
            "public-path-skips-secrets": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await advanceToDocument(container);
                await setInputByNameOrLabel(/Paste OpenAPI|document\.text/i, twoGetOpenApiDocument());
                await clickNext();
                await waitFor(() => expect(stepLabelText()).toMatch(/Base URL/i));
                await setInputByNameOrLabel(/baseUrl\.baseUrl|^baseUrl$/i, fakeServer!.baseUrl);
                await setInputByNameOrLabel(/userAgent|User-Agent/i, "MiroirTest/284", true);
                await clickNext();
                await waitFor(() => expect(stepLabelText()).toMatch(/Authentication/i));
                // authenticated defaults to false
                await clickNext();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Operations/i);
                  expect(stepLabelText()).not.toMatch(/Secret|Scheme|token/i);
                });
              },
            },
            "secrets-absent-from-bag-and-formik-dump": {
              props: () => {
                sessionStorage.setItem("showDebugInfo", "true");
                // Mount a one-step custom-token report so we can type a secret without
                // depending on scheme-branch navigation in this cycle.
                const wizard = loadReportAsset(WIZARD_REPORT_UUID) as any;
                const fullSteps = wizard.definition.section.definition as any[];
                const secretsCustom = fullSteps.find((s: any) => s.stepId === "secretsCustom");
                wizard.definition = {
                  ...wizard.definition,
                  section: {
                    type: "list",
                    definition: [secretsCustom],
                  },
                };
                currentUseParams.reportUuid = WIZARD_REPORT_UUID;
                currentUseParams.application = MIROIR_APPLICATION_UUID;
                currentUseParams.deploymentUuid = MIROIR_DEPLOYMENT_UUID;
                upsertMiroirReportInTestCache(wizard);
                return {
                  application: MIROIR_APPLICATION_UUID,
                  applicationSection: "data",
                  deploymentUuid: MIROIR_DEPLOYMENT_UUID,
                  pageParams: {
                    applicationSection: "data",
                    application: MIROIR_APPLICATION_UUID,
                    deploymentUuid: MIROIR_DEPLOYMENT_UUID,
                    reportUuid: WIZARD_REPORT_UUID,
                  },
                  reportDefinition: wizard,
                  applicationDeploymentMap: testApplicationDeploymentMap(),
                };
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitFor(() => {
                  expect(screen.getByTestId("multistep-report-host")).toBeTruthy();
                });
                await waitFor(() => expect(stepLabelText()).toMatch(/Custom token/i));
                const secret = "super-secret-token-value-284";
                await setInputByNameOrLabel(/secretsCustom\.token/i, secret);
                await setInputByNameOrLabel(/secretsCustom\.credentialKey/i, "discogsPublicToken", true);
                await waitAfterUserInteraction();
                // Force a re-render capture of the bag dump
                await act(async () => {
                  fireEvent.blur(document.activeElement as Element);
                });
                await waitAfterUserInteraction();
                const bag = screen.getByTestId("multistep-step-bag").textContent ?? "";
                expect(bag).not.toContain(secret);
                // Formik debug dump uses omitSecretKeysFromBagDump for multistep reports
                const formikBlocks = Array.from(container.querySelectorAll("[data-testid=visual-debug-overlay]"))
                  .map((el) => el.textContent ?? "")
                  .join("\n");
                expect(formikBlocks).not.toContain(secret);
                // Also assert the helper itself
                const { omitSecretKeysFromBagDump } = await import(
                  "../../../../src/miroir-fwk/4_view/components/Reports/MultistepReportHost.js"
                );
                expect(
                  JSON.stringify(
                    omitSecretKeysFromBagDump({
                      secretsCustom: { token: secret, credentialKey: "x" },
                    }),
                  ),
                ).not.toContain(secret);
              },
            },
            "finish-public-creates-endpoint-and-report": {
              props: () => wizardReportProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await advanceToDocument(container);
                await setInputByNameOrLabel(/Paste OpenAPI|document\.text/i, twoGetOpenApiDocument());
                await clickNext();
                await waitFor(() => expect(stepLabelText()).toMatch(/Base URL/i));
                await setInputByNameOrLabel(/baseUrl\.baseUrl|^baseUrl$/i, fakeServer!.baseUrl);
                await setInputByNameOrLabel(/userAgent|User-Agent/i, "MiroirTest/284", true);
                await clickNext();
                await waitFor(() => expect(stepLabelText()).toMatch(/Authentication/i));
                await clickNext();
                await waitFor(() => expect(stepLabelText()).toMatch(/Operations/i));
                await waitFor(() => {
                  expect(screen.getByText(CONVERTIBLE_OP)).toBeTruthy();
                });
                await clickNext();
                await waitFor(() => expect(stepLabelText()).toMatch(/Probe parameters/i));
                await setInputByNameOrLabel(/^id$|probeParams\.id/i, "1");
                await clickNext();
                await waitFor(() => expect(stepLabelText()).toMatch(/Review/i));
                await waitFor(() => {
                  const probe = screen.getByTestId("probe-call-parameters").textContent ?? "";
                  expect(probe).toContain("Check probe call parameters");
                  expect(probe).toContain(CONVERTIBLE_OP);
                  expect(probe).toContain(`${fakeServer!.baseUrl}/releases/1`);
                });
                await clickNext();
                await waitFor(() => {
                  expect(stepLabelText(), finishAlertText() || "no finish error").toMatch(/Probe result/i);
                });
                await waitFor(() => {
                  const outcome = screen.getByTestId("probe-outcome").textContent ?? "";
                  expect(outcome).toContain("Probe succeeded.");
                });
                const bagBeforeFinish = screen.getByTestId("multistep-step-bag").textContent ?? "";
                fireEvent.click(screen.getByRole("button", { name: "Finish" }));
                await waitAfterUserInteraction();
                await waitFor(
                  () => {
                    const err = finishAlertText();
                    expect(
                      err,
                      `Finish failed: ${err}; bag=${bagBeforeFinish}`,
                    ).toBe("");
                  },
                  { timeout: 15000 },
                );
                const localCache = getJzodEditorTestLocalCache();
                expect(localCache).toBeTruthy();
                const domainState = localCache!.getDomainState();
                const libraryDeployment =
                  testApplicationDeploymentMap()[LIBRARY_APPLICATION_UUID];
                const endpoints =
                  domainState?.[libraryDeployment]?.model?.[ENDPOINT_ENTITY_UUID] ?? {};
                const reports =
                  domainState?.[libraryDeployment]?.model?.[REPORT_ENTITY_UUID] ?? {};
                const endpoint = Object.values(endpoints).find((row: any) => row?.name === ENDPOINT_NAME);
                const report = Object.values(reports).find(
                  (row: any) => row?.name === `${ENDPOINT_NAME}_${PROBE_OPERATION_ID}`,
                );
                expect(endpoint).toBeTruthy();
                expect((endpoint as any).uuid).toMatch(
                  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                );
                expect(report).toBeTruthy();
                const menus =
                  domainState?.[libraryDeployment]?.model?.[
                    "dde4c883-ae6d-47c3-b6df-26bc6e3c1842"
                  ] ?? {};
                const menuText = JSON.stringify(menus);
                expect(menuText).toContain((report as any).uuid);
                // No Entity row created for the probe
                const entities =
                  domainState?.[libraryDeployment]?.model?.[
                    "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
                  ] ?? {};
                expect(
                  Object.values(entities).some(
                    (e: any) => e?.name === ENDPOINT_NAME,
                  ),
                ).toBe(false);
              },
            },
          },
        },
      };
    },
  },
};

(shouldRun ? describe : describe.skip)("wizardWalk.284", () => {
  beforeAll(async () => {
    fakeServer = await startFakeExternalServiceServer({
      [`GET /releases/1`]: { body: { id: "1", name: "x" } },
    });
    allowInsecureBaseUrlsForTests([fakeServer.baseUrl]);
  }, 60000);

  afterAll(async () => {
    clearAllowedInsecureBaseUrlsForTests();
    if (fakeServer) {
      await fakeServer.close();
      fakeServer = undefined;
    }
  });

  afterEach(() => {
    currentUseParams.reportUuid = HOME_REPORT_UUID;
    navigateMock.mockClear();
    sessionStorage.removeItem("showDebugInfo");
  });
  prepareAndRunTestSuites(pageLabel, jzodElementEditorTests, testApplicationDeploymentMap());
});
