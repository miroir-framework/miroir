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

import { ReportPage } from "../../../../src/miroir-fwk/4_view/routes/ReportPage";
import type { ReportViewProps } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportHooks";
import {
  deleteLibraryCountryFromJzodEditorTestCache,
  extractValuesFromRenderedElements,
  getLibraryCountryFromJzodEditorTestCache,
  LIBRARY_TEST_TRACER_COUNTRY_UUID,
  prepareAndRunTestSuites,
  upsertLibraryCountryInJzodEditorTestCache,
  waitAfterUserInteraction,
  type ReactComponentTestSuitePrep,
  type ReactComponentTestSuites,
} from "../../JzodElementEditorTestTools";

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

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
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
          },
        },
      };
    },
  },
};

describe("multistepProcess.274", () => {
  afterEach(() => {
    deleteLibraryCountryFromJzodEditorTestCache();
  });
  prepareAndRunTestSuites(
    pageLabel,
    jzodElementEditorTests,
    defaultSelfApplicationDeploymentMap,
  );
});
