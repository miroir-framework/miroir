import { afterEach, describe, vi, type ExpectStatic } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { Container } from "react-dom";
import * as RRDom from "react-router-dom";

import {
  defaultSelfApplicationDeploymentMap,
  type Deployment,
} from "miroir-core";
import {
  reportMultistepCountryCreate,
  reportMultistepLaunchPad,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import { ReportPage } from "../../../../src/miroir-fwk/4_view/routes/ReportPage";
import { reportUrl } from "../../../../src/miroir-fwk/4_view/navigation";
import type { ReportViewProps } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportHooks";
import {
  deleteLibraryCountryFromJzodEditorTestCache,
  getLibraryCountryFromJzodEditorTestCache,
  LIBRARY_TEST_TRACER_COUNTRY_UUID,
  prepareAndRunTestSuites,
  waitAfterUserInteraction,
  type ReactComponentTestSuitePrep,
  type ReactComponentTestSuites,
} from "../../JzodElementEditorTestTools";

const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT_UUID = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const MULTISTEP_REPORT_UUID = "d2b2fbbd-6844-4422-8412-4e3c303296bc";
const LAUNCH_PAD_REPORT_UUID = "b6d9e2a1-4c58-4f70-8a13-9e2f0c5d7b44";
const FRANCE_COUNTRY_UUID = "b62fc20b-dcf5-4e3b-a247-62d0475cf60f";

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

const launchPageParams = {
  applicationSection: "data" as const,
  application: LIBRARY_APPLICATION_UUID,
  deploymentUuid: deployment_Library.uuid,
  instanceUuid: undefined,
  reportUuid: LAUNCH_PAD_REPORT_UUID,
  playlistId: "pl-274",
};

const currentUseParams = {
  applicationSection: "data" as const,
  deploymentUuid: deployment_Library.uuid,
  instanceUuid: undefined as string | undefined,
  reportUuid: LAUNCH_PAD_REPORT_UUID,
  application: LIBRARY_APPLICATION_UUID,
  playlistId: "pl-274",
};

const tracerPageParams = {
  applicationSection: "data" as const,
  application: LIBRARY_APPLICATION_UUID,
  deploymentUuid: deployment_Library.uuid,
  instanceUuid: undefined,
  reportUuid: MULTISTEP_REPORT_UUID,
};

const routeHostTracerProps = {
  application: selfApplicationLibrary.uuid,
  applicationSection: "data" as const,
  deploymentUuid: deployment_Library.uuid,
  pageParams: tracerPageParams,
  reportDefinition: reportMultistepCountryCreate as any,
  applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
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

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "multistepLaunch.274.phase5" ||
  RUN_TEST === "multistepLaunch.274.phase5.integ.test";

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

function expectedTracerReportUrl(instanceUuid?: string): string {
  return reportUrl(
    LIBRARY_APPLICATION_UUID,
    LIBRARY_DEPLOYMENT_UUID,
    "data",
    MULTISTEP_REPORT_UUID,
    instanceUuid,
  );
}

function readPageParamsIn(scope: HTMLElement | Document = document): Record<string, any> {
  const node = within(scope as HTMLElement).getByTestId("report-query-pageparams");
  const raw = node.textContent ?? "";
  return raw.length > 0 ? JSON.parse(raw) : {};
}

async function waitForLaunchPad() {
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Open tracer as modal" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open tracer as route" })).toBeTruthy();
  });
}

async function waitForAgGrid() {
  await waitFor(() => {
    expect(document.getElementById("entity-instance-ag-grid")).toBeTruthy();
  });
}

async function typeStepOneIn(container: Container, name: string, iso: string) {
  const nameInput = await waitFor(() => {
    const input = inputByName(container, "stepOne.name");
    expect(input).toBeTruthy();
    return input as HTMLInputElement;
  });
  const isoInput = inputByName(container, "stepOne.iso3166-1Alpha-2");
  expect(isoInput).toBeTruthy();
  await act(async () => {
    fireEvent.change(nameInput, { target: { value: name } });
    fireEvent.change(isoInput as HTMLInputElement, { target: { value: iso } });
  });
  await waitAfterUserInteraction();
}

const launchPadProps = {
  application: selfApplicationLibrary.uuid,
  applicationSection: "data" as const,
  deploymentUuid: deployment_Library.uuid,
  pageParams: launchPageParams,
  reportDefinition: reportMultistepLaunchPad as any,
  applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
};

const pageLabel = "multistepLaunch.274.phase5";

const jzodElementEditorTests: Record<string, ReactComponentTestSuitePrep<any>> = {
  multistepLaunch: {
    editor: ReportPage,
    wireLocalCacheCompositeAction: true,
    getJzodEditorTests: (
      componentUnderTest: React.FC<ReportViewProps>,
    ): ReactComponentTestSuites<ReportViewProps> => {
      return {
        multistepLaunch: {
          suiteRenderComponent: componentUnderTest,
          tests: {
            "open-as-modal": {
              props: launchPadProps,
              tests: async (_expect: ExpectStatic) => {
                await waitForLaunchPad();
                fireEvent.click(screen.getByRole("button", { name: "Open tracer as modal" }));
                await waitAfterUserInteraction();
                const dialog = await waitFor(() => screen.getByRole("dialog"));
                expect(within(dialog).getByTestId("multistep-report-host")).toBeTruthy();
                const pageParams = readPageParamsIn(dialog);
                expect(pageParams.application).toEqual(LIBRARY_APPLICATION_UUID);
                expect(pageParams.deploymentUuid).toEqual(LIBRARY_DEPLOYMENT_UUID);
                expect(pageParams.applicationSection).toEqual("data");
                expect(pageParams.reportUuid).toEqual(MULTISTEP_REPORT_UUID);
                expect(pageParams.playlistId).toEqual("pl-274");
              },
            },
            "open-as-route": {
              props: launchPadProps,
              tests: async (_expect: ExpectStatic) => {
                navigateMock.mockClear();
                await waitForLaunchPad();
                fireEvent.click(screen.getByRole("button", { name: "Open tracer as route" }));
                await waitAfterUserInteraction();
                expect(navigateMock).toHaveBeenCalled();
                const navigatedTo = String(navigateMock.mock.calls[0]?.[0] ?? "");
                expect(navigatedTo).toEqual(`${expectedTracerReportUrl()}&playlistId=pl-274`);
                const search = navigatedTo.includes("?")
                  ? new URLSearchParams(navigatedTo.slice(navigatedTo.indexOf("?") + 1))
                  : new URLSearchParams();
                expect(search.has("step")).toBe(false);
              },
            },
            "list-row-open-sets-instanceUuid": {
              props: launchPadProps,
              tests: async (_expect: ExpectStatic) => {
                await waitForLaunchPad();
                await waitForAgGrid();
                const openButton = await waitFor(() => {
                  const button = document.querySelector(
                    `[data-testid="row-open-report"][data-instance-uuid="${FRANCE_COUNTRY_UUID}"]`,
                  ) as HTMLElement | null;
                  expect(button).toBeTruthy();
                  return button as HTMLElement;
                });
                fireEvent.click(openButton);
                await waitAfterUserInteraction();
                const dialog = await waitFor(() => screen.getByRole("dialog"));
                expect(within(dialog).getByTestId("multistep-report-host")).toBeTruthy();
                const pageParams = readPageParamsIn(dialog);
                expect(pageParams.application).toEqual(LIBRARY_APPLICATION_UUID);
                expect(pageParams.deploymentUuid).toEqual(LIBRARY_DEPLOYMENT_UUID);
                expect(pageParams.applicationSection).toEqual("data");
                expect(pageParams.reportUuid).toEqual(MULTISTEP_REPORT_UUID);
                expect(pageParams.instanceUuid).toEqual(FRANCE_COUNTRY_UUID);
                expect(pageParams.playlistId).toEqual("pl-274");
              },
            },
            "reportUrl-has-no-step": {
              props: launchPadProps,
              tests: async (_expect: ExpectStatic) => {
                const withInstance = expectedTracerReportUrl(FRANCE_COUNTRY_UUID);
                const withoutInstance = expectedTracerReportUrl();
                for (const url of [withInstance, withoutInstance]) {
                  const search = new URLSearchParams(url.slice(url.indexOf("?") + 1));
                  expect(search.has("step")).toBe(false);
                  expect(url).not.toMatch(/[?&]step=/);
                }
                expect(withoutInstance).toEqual(
                  `/?page=report&application=${LIBRARY_APPLICATION_UUID}&deploymentUuid=${LIBRARY_DEPLOYMENT_UUID}&applicationSection=data&reportUuid=${MULTISTEP_REPORT_UUID}`,
                );
              },
            },
            "finish-in-modal-closes": {
              props: launchPadProps,
              tests: async (_expect: ExpectStatic, container: Container) => {
                await waitForLaunchPad();
                fireEvent.click(screen.getByRole("button", { name: "Open tracer as modal" }));
                await waitAfterUserInteraction();
                const dialog = await waitFor(() => screen.getByRole("dialog"));
                expect(within(dialog).getByTestId("multistep-report-host")).toBeTruthy();

                await typeStepOneIn(container, "Testland", "TL");
                fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                fireEvent.click(within(dialog).getByRole("button", { name: "Finish" }));
                await waitAfterUserInteraction();

                await waitFor(() => {
                  expect(screen.queryByRole("dialog")).toBeNull();
                  const country = getLibraryCountryFromJzodEditorTestCache();
                  expect(country).toBeTruthy();
                  expect(country?.name).toEqual("Testland");
                  expect((country as any)?.["iso3166-1Alpha-2"]).toEqual("TL");
                  expect(country?.uuid).toEqual(LIBRARY_TEST_TRACER_COUNTRY_UUID);
                });
                expect(navigateMock.mock.calls.some((call) => call[0] === -1)).toBe(false);
              },
            },
            "route-host-finish-navigates-back": {
              props: () => {
                currentUseParams.reportUuid = MULTISTEP_REPORT_UUID;
                return routeHostTracerProps;
              },
              tests: async (_expect: ExpectStatic, container: Container) => {
                navigateMock.mockClear();
                await waitFor(() => {
                  expect(screen.getByTestId("multistep-report-host")).toBeTruthy();
                });
                await typeStepOneIn(container, "RouteFinish", "RF");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                fireEvent.click(screen.getByRole("button", { name: "Finish" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  const country = getLibraryCountryFromJzodEditorTestCache();
                  expect(country?.name).toEqual("RouteFinish");
                });
                expect(navigateMock).toHaveBeenCalledWith(-1);
              },
            },
            "modal-escape-confirms-cancel": {
              props: launchPadProps,
              tests: async (_expect: ExpectStatic, container: Container) => {
                await waitForLaunchPad();
                fireEvent.click(screen.getByRole("button", { name: "Open tracer as modal" }));
                await waitAfterUserInteraction();
                const dialog = await waitFor(() => screen.getByRole("dialog"));
                expect(within(dialog).getByTestId("multistep-report-host")).toBeTruthy();
                await typeStepOneIn(container, "Testland", "TL");

                fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
                await waitAfterUserInteraction();
                const confirm = await waitFor(() => screen.getByTestId("open-report-cancel-confirm"));
                expect(within(confirm).getByText("Cancel this process?")).toBeTruthy();
                fireEvent.click(within(confirm).getByRole("button", { name: "Keep editing" }));
                await waitAfterUserInteraction();
                expect(screen.queryByTestId("open-report-cancel-confirm")).toBeNull();
                expect(within(screen.getByTestId("open-report-dialog")).getByTestId("multistep-report-host")).toBeTruthy();

                fireEvent.keyDown(screen.getByTestId("open-report-dialog"), {
                  key: "Escape",
                  code: "Escape",
                });
                await waitAfterUserInteraction();
                const confirmAgain = await waitFor(() =>
                  screen.getByTestId("open-report-cancel-confirm"),
                );
                fireEvent.click(within(confirmAgain).getByRole("button", { name: "Confirm cancel" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  expect(screen.queryByTestId("open-report-dialog")).toBeNull();
                });
                expect(getLibraryCountryFromJzodEditorTestCache()).toBeUndefined();
              },
            },
          },
        },
      };
    },
  },
};

describe.skipIf(!shouldRun)("multistep reports #274 phase5 — launchers", () => {
  afterEach(() => {
    deleteLibraryCountryFromJzodEditorTestCache();
    currentUseParams.reportUuid = LAUNCH_PAD_REPORT_UUID;
    navigateMock.mockClear();
  });

  prepareAndRunTestSuites(pageLabel, jzodElementEditorTests, defaultSelfApplicationDeploymentMap);
});
