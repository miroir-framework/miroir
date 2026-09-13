import { afterEach, describe, vi, type ExpectStatic } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Container } from "react-dom";
import * as RRDom from "react-router-dom";

import {
  defaultSelfApplicationDeploymentMap,
  type Deployment,
} from "miroir-core";
import {
  reportMultistepCountryCreate,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import {
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import { ReportPage } from "../../../../src/miroir-fwk/4_view/routes/ReportPage";
import type { ReportViewProps } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportHooks";
import {
  deleteLibraryCountryFromJzodEditorTestCache,
  extractValuesFromRenderedElements,
  getLibraryCountryFromJzodEditorTestCache,
  LIBRARY_TEST_TRACER_COUNTRY_UUID,
  prepareAndRunTestSuites,
  restoreLibraryMultistepTracerReportInJzodEditorTestCache,
  upsertLibraryCountryInJzodEditorTestCache,
  upsertLibraryReportInJzodEditorTestCache,
  upsertLibraryStoredQueryInJzodEditorTestCache,
  waitAfterUserInteraction,
  type ReactComponentTestSuitePrep,
  type ReactComponentTestSuites,
} from "../../JzodElementEditorTestTools";
import bookCountByPublisherQuery from "../../../../../miroir-test-app_deployment-library/assets/library_model/e4320b9e-ab45-4abe-85d8-359604b3c62f/6176dcdf-39a6-4805-8dc5-3c2366a31a11.json" with { type: "json" };

const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT_UUID = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const MULTISTEP_REPORT_UUID = "d2b2fbbd-6844-4422-8412-4e3c303296bc";
const COUNTRY_ENTITY_UUID = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";

const deployment_Library: Deployment = {
  uuid: LIBRARY_DEPLOYMENT_UUID,
  parentName: "Deployment",
  parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
  name: "LibraryApplicationFilesystemDeployment",
  defaultLabel: "LibraryApplicationFilesystemDeployment",
  selfApplication: LIBRARY_APPLICATION_UUID,
  description: "The default Filesystem Deployment for SelfApplication Library",
  configuration: {
    admin: {
      emulatedServerType: "filesystem",
      directory: "miroir-test-app_deployment-admin/assets",
    },
    model: {
      emulatedServerType: "filesystem",
      directory: "miroir-test-app_deployment-library/assets/library_model",
    },
    data: {
      emulatedServerType: "filesystem",
      directory: "miroir-test-app_deployment-library/assets/library_data",
    },
  },
};

const tracerPageParams = {
  applicationSection: "data" as const,
  application: LIBRARY_APPLICATION_UUID,
  deploymentUuid: deployment_Library.uuid,
  instanceUuid: undefined,
  reportUuid: MULTISTEP_REPORT_UUID,
};

const BOOK_COUNT_BY_PUBLISHER_QUERY_UUID = "6176dcdf-39a6-4805-8dc5-3c2366a31a11";

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

// Vitest/happy-dom cannot load miroir-diagram-class → svg-toolbelt (CJS `exports` in an ESM package).
vi.mock("../../../../src/miroir-fwk/4_view/components/Reports/ModelDiagramReportSectionView.js", () => ({
  ModelDiagramReportSectionView: () => null,
}));

vi.spyOn(RRDom, "useParams").mockReturnValue({
  applicationSection: "data",
  deploymentUuid: deployment_Library.uuid,
  instanceUuid: undefined,
  reportUuid: MULTISTEP_REPORT_UUID,
  application: LIBRARY_APPLICATION_UUID,
});

function inputByName(container: Container, name: string): HTMLInputElement | undefined {
  const direct = container.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
  if (direct) {
    return direct;
  }
  const byTestId = screen.queryAllByTestId("miroirInput").find((element) => {
    const asInput = element as HTMLInputElement;
    if (asInput.name === name) {
      return true;
    }
    const nested = element.querySelector(`input[name="${name}"]`);
    return !!nested;
  });
  if (!byTestId) {
    return undefined;
  }
  if ((byTestId as HTMLInputElement).name === name) {
    return byTestId as HTMLInputElement;
  }
  return (byTestId.querySelector(`input[name="${name}"]`) as HTMLInputElement | null) ?? undefined;
}

async function waitForHost() {
  await waitFor(() => {
    expect(screen.getByTestId("multistep-report-host")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
  });
}

async function typeStepOne(container: Container, name: string, iso: string) {
  const nameInput = inputByName(container, "stepOne.name");
  const isoInput = inputByName(container, "stepOne.iso3166-1Alpha-2");
  expect(nameInput).toBeTruthy();
  expect(isoInput).toBeTruthy();
  await act(async () => {
    fireEvent.change(nameInput as HTMLInputElement, { target: { value: name } });
    fireEvent.change(isoInput as HTMLInputElement, { target: { value: iso } });
  });
  await waitAfterUserInteraction();
}

function expectStepOneInputs(container: Container, present: boolean) {
  const nameInput = inputByName(container, "stepOne.name");
  if (present) {
    expect(nameInput).toBeTruthy();
  } else {
    expect(nameInput).toBeUndefined();
  }
}

function expectMarkdownConfirm(present: boolean) {
  const text = screen.queryByText(/Confirm the country details/i);
  if (present) {
    expect(text).toBeTruthy();
  } else {
    expect(text).toBeNull();
  }
}

function cloneFrozenTracer(): any {
  return structuredClone(reportMultistepCountryCreate);
}

function readJsonTestId(testId: string): any {
  const node = screen.getByTestId(testId);
  const raw = node.textContent ?? "";
  return raw.length > 0 ? JSON.parse(raw) : {};
}

async function waitForTracerCloneOnScreen() {
  await waitFor(() => {
    expect(screen.getByTestId("multistep-report-host")).toBeTruthy();
  });
}

async function changeApplicationFieldToMiroir(container: Container) {
  const applicationInput = await waitFor(() => {
    const input = inputByName(container, "stepOne.application");
    expect(input).toBeTruthy();
    return input as HTMLInputElement;
  });
  await act(async () => {
    fireEvent.change(applicationInput, { target: { value: selfApplicationMiroir.uuid } });
  });
  await waitAfterUserInteraction();
}

const pageLabel = "multistepProcess.274";

const jzodElementEditorTests: Record<string, ReactComponentTestSuitePrep<any>> = {
  multistepProcess: {
    editor: ReportPage,
    wireLocalCacheCompositeAction: true,
    getJzodEditorTests: (
      componentUnderTest: React.FC<ReportViewProps>,
    ): ReactComponentTestSuites<ReportViewProps> => {
      return {
        multistepProcess: {
          suiteRenderComponent: componentUnderTest,
          tests: {
            "happy-path-three-steps": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                expectStepOneInputs(container, true);
                expectMarkdownConfirm(false);
                expect(screen.queryByRole("button", { name: "Finish" })).toBeNull();

                await typeStepOne(container, "Testland", "TL");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();

                expectStepOneInputs(container, false);
                expectMarkdownConfirm(true);
                expect(screen.queryByRole("button", { name: "Finish" })).toBeNull();

                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();

                expectMarkdownConfirm(false);
                expect(screen.getByRole("button", { name: "Finish" })).toBeTruthy();
                expect(screen.queryByRole("button", { name: "Next" })).toBeNull();

                fireEvent.click(screen.getByRole("button", { name: "Finish" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  const country = getLibraryCountryFromJzodEditorTestCache();
                  expect(country).toBeTruthy();
                  expect(country?.name).toEqual("Testland");
                  expect((country as any)?.["iso3166-1Alpha-2"]).toEqual("TL");
                  expect(country?.uuid).toEqual(LIBRARY_TEST_TRACER_COUNTRY_UUID);
                });
              },
            },
            "next-invalid-required": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                expectStepOneInputs(container, true);
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                expectStepOneInputs(container, true);
                expectMarkdownConfirm(false);
                expect(screen.queryByText(/Echoed name/i)).toBeNull();
              },
            },
            "finish-only-on-last": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                expect(screen.queryByRole("button", { name: "Finish" })).toBeNull();
                expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();

                await typeStepOne(container, "Testland", "TL");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                expect(screen.queryByRole("button", { name: "Finish" })).toBeNull();
                expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();

                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                expect(screen.getByRole("button", { name: "Finish" })).toBeTruthy();
                expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
              },
            },
            "back-keeps-bag": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await typeStepOne(container, "Testland", "TL");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                expectMarkdownConfirm(true);

                fireEvent.click(screen.getByRole("button", { name: "Back" }));
                await waitAfterUserInteraction();
                expectStepOneInputs(container, true);
                const values = extractValuesFromRenderedElements(
                  expect,
                  undefined,
                  container,
                  "stepOne",
                  "after back",
                );
                expect(values["stepOne.name"] ?? values.name).toEqual("Testland");
                expect(
                  values["stepOne.iso3166-1Alpha-2"] ?? values["iso3166-1Alpha-2"],
                ).toEqual("TL");
              },
            },
            "cancel-confirm": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await typeStepOne(container, "Testland", "TL");
                fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
                await waitAfterUserInteraction();
                fireEvent.click(screen.getByRole("button", { name: "Confirm cancel" }));
                await waitAfterUserInteraction();
                expect(screen.queryByTestId("multistep-report-host")).toBeNull();
                expect(getLibraryCountryFromJzodEditorTestCache()).toBeUndefined();
                expect(inputByName(container, "stepOne.name")).toBeUndefined();
              },
            },
            "reinit-keeps-bag": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await typeStepOne(container, "Testland", "TL");
                const nameInput = inputByName(container, "stepOne.name") as HTMLInputElement;
                await act(async () => {
                  fireEvent.change(nameInput, { target: { value: "Testland" } });
                });
                await waitAfterUserInteraction();
                const values = extractValuesFromRenderedElements(
                  expect,
                  undefined,
                  container,
                  "stepOne",
                  "after reinit",
                );
                expect(values["stepOne.name"] ?? values.name).toEqual("Testland");
                expect(
                  values["stepOne.iso3166-1Alpha-2"] ?? values["iso3166-1Alpha-2"],
                ).toEqual("TL");
              },
            },
            "finish-action-error": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                upsertLibraryCountryInJzodEditorTestCache({
                  uuid: LIBRARY_TEST_TRACER_COUNTRY_UUID,
                  parentName: "Country",
                  parentUuid: COUNTRY_ENTITY_UUID,
                  name: "Collisionland",
                  "iso3166-1Alpha-2": "XX",
                } as any);
                await waitForHost();
                await typeStepOne(container, "Testland", "TL");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                expect(screen.getByRole("button", { name: "Finish" })).toBeTruthy();

                fireEvent.click(screen.getByRole("button", { name: "Finish" }));
                await waitAfterUserInteraction();

                expect(screen.getByTestId("multistep-report-host")).toBeTruthy();
                expect(screen.getByRole("button", { name: "Finish" })).toBeTruthy();
                const collision = getLibraryCountryFromJzodEditorTestCache();
                expect(collision?.name).toEqual("Collisionland");

                fireEvent.click(screen.getByRole("button", { name: "Back" }));
                await waitAfterUserInteraction();
                fireEvent.click(screen.getByRole("button", { name: "Back" }));
                await waitAfterUserInteraction();
                expectStepOneInputs(container, true);
                const values = extractValuesFromRenderedElements(
                  expect,
                  undefined,
                  container,
                  "stepOne",
                  "after finish error",
                );
                expect(values["stepOne.name"] ?? values.name).toEqual("Testland");
                expect(
                  values["stepOne.iso3166-1Alpha-2"] ?? values["iso3166-1Alpha-2"],
                ).toEqual("TL");
              },
            },
            "later-step-query-sees-bag": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await typeStepOne(container, "Testland", "TL");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                expect(screen.getByRole("button", { name: "Finish" })).toBeTruthy();
                await waitFor(() => {
                  const echoDocument = Array.from(container.querySelectorAll("pre")).find((node) => {
                    if (node.getAttribute("data-testid")) {
                      return false;
                    }
                    return (node.textContent ?? "").includes("Testland");
                  });
                  expect(echoDocument).toBeTruthy();
                });
              },
            },
            "query-pageparams-is-launch-plus-bag": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await typeStepOne(container, "Testland", "TL");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                const pageParams = await waitFor(() => {
                  const parsed = readJsonTestId("report-query-pageparams");
                  expect(parsed.stepOne?.name).toEqual("Testland");
                  return parsed;
                });
                expect(pageParams).not.toHaveProperty("pageParams");
                expect(pageParams.stepOne).toEqual({
                  name: "Testland",
                  "iso3166-1Alpha-2": "TL",
                });
                expect(pageParams.application).toEqual(LIBRARY_APPLICATION_UUID);
                expect(pageParams.reportUuid).toEqual(MULTISTEP_REPORT_UUID);
                expect(pageParams.applicationSection).toEqual("data");
                expect(pageParams.deploymentUuid).toEqual(deployment_Library.uuid);
                expect(pageParams.reportData).toBeUndefined();
                expect(pageParams[reportMultistepCountryCreate.name]).toBeUndefined();
                expect(container).toBeTruthy();
              },
            },
            "input-apply-does-not-navigate": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                const clone = cloneFrozenTracer();
                clone.definition.section.definition[0].definition.urlParamFields = ["name"];
                upsertLibraryReportInJzodEditorTestCache(clone);
                await waitFor(() => {
                  expect(screen.getByRole("button", { name: "OK" })).toBeTruthy();
                });
                await typeStepOne(container, "Testland", "TL");
                const searchBefore = window.location.search;
                navigateMock.mockClear();
                fireEvent.click(screen.getByRole("button", { name: "OK" }));
                await waitAfterUserInteraction();
                expect(window.location.search).toEqual(searchBefore);
                expect(navigateMock).not.toHaveBeenCalled();
              },
            },
            "application-field-does-not-navigate": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                const clone = cloneFrozenTracer();
                clone.definition.section.definition[0].definition.inputMLSchema.definition.application =
                  {
                    type: "uuid",
                    optional: true,
                    tag: {
                      value: {
                        defaultLabel: "Application",
                      },
                    },
                  };
                upsertLibraryReportInJzodEditorTestCache(clone);
                navigateMock.mockClear();
                await changeApplicationFieldToMiroir(container);
                const navigateCalls = navigateMock.mock.calls.map((call) => String(call[0] ?? ""));
                expect(
                  navigateCalls.some((url) => url.includes("page=report") || url.startsWith("/?")),
                ).toBe(false);
              },
            },
            "runStoredQueries-skipped": {
              props: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "data",
                deploymentUuid: deployment_Library.uuid,
                pageParams: tracerPageParams,
                reportDefinition: reportMultistepCountryCreate as any,
                applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
              },
              tests: async (expect: ExpectStatic, _container: Container) => {
                await waitForHost();
                upsertLibraryStoredQueryInJzodEditorTestCache(bookCountByPublisherQuery as any);
                const clone = cloneFrozenTracer();
                clone.definition.runStoredQueries = [
                  {
                    storedQuery: BOOK_COUNT_BY_PUBLISHER_QUERY_UUID,
                    label: "BookCountByPublisher",
                  },
                ];
                upsertLibraryReportInJzodEditorTestCache(clone);
                await waitForTracerCloneOnScreen();
                await waitAfterUserInteraction();
                await waitAfterUserInteraction();
                const stored = await waitFor(() => readJsonTestId("report-stored-query-data"));
                expect(stored?.["00_BookCountByPublisher"]).toBeFalsy();
                const storedJson = JSON.stringify(stored ?? {});
                expect(storedJson).not.toContain("00_BookCountByPublisher");
                expect(storedJson).not.toMatch(/publisherName/);
              },
            },
          },
        },
      };
    },
  },
};

describe("multistepProcess.274", () => {
  afterEach(() => {
    deleteLibraryCountryFromJzodEditorTestCache();
    restoreLibraryMultistepTracerReportInJzodEditorTestCache();
    navigateMock.mockClear();
  });
  prepareAndRunTestSuites(
    pageLabel,
    jzodElementEditorTests,
    defaultSelfApplicationDeploymentMap,
  );
});
