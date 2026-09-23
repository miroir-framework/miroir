/**
 * Issue #284 Slice 5 — branching multistep host (visitedStepIds, onNext, inputSchemaFromBag).
 *
 * Run:
 * ```bash
 * RUN_TEST=multistepBranch.284 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepBranch.284
 * ```
 */
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
  getLibraryCountryFromJzodEditorTestCache,
  LIBRARY_TEST_TRACER_COUNTRY_UUID,
  prepareAndRunTestSuites,
  restoreLibraryMultistepTracerReportInJzodEditorTestCache,
  upsertLibraryCountryInJzodEditorTestCache,
  upsertLibraryReportInJzodEditorTestCache,
  waitAfterUserInteraction,
  type ReactComponentTestSuitePrep,
  type ReactComponentTestSuites,
} from "../../JzodElementEditorTestTools";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "multistepBranch.284";

const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT_UUID = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const BRANCH_REPORT_UUID = "4f7dab24-b3eb-4d59-9275-dcc8f912ecd2";
const MULTISTEP_COUNTRY_REPORT_UUID = "d2b2fbbd-6844-4422-8412-4e3c303296bc";
const COUNTRY_ENTITY_UUID = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
const ON_NEXT_COLLISION_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

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

const currentUseParams = {
  applicationSection: "data" as const,
  deploymentUuid: deployment_Library.uuid,
  instanceUuid: undefined as string | undefined,
  reportUuid: BRANCH_REPORT_UUID,
  application: LIBRARY_APPLICATION_UUID,
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
  });
}

function readStepBag(): Record<string, unknown> {
  const node = screen.getByTestId("multistep-step-bag");
  const raw = node.textContent ?? "";
  return raw.length > 0 ? JSON.parse(raw) : {};
}

function stepLabelText(): string {
  return screen.getByTestId("multistep-step-label").textContent ?? "";
}

function buildBranchFixtureReport(): any {
  return {
    uuid: BRANCH_REPORT_UUID,
    selfApplication: LIBRARY_APPLICATION_UUID,
    parentName: "Report",
    parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
    conceptLevel: "Model",
    name: "MultistepBranchFixture284",
    defaultLabel: "Branch fixture",
    type: "multistep",
    description: "Slice 5 branching fixture (not a deployment asset).",
    definition: {
      compositeActionSequence: {
        actionType: "compositeActionSequence",
        actionLabel: "MultistepBranchFixtureFinish",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        payload: {
          actionSequence: [
            {
              actionType: "createInstance",
              actionLabel: "createCountryOnFinish",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              payload: {
                application: LIBRARY_APPLICATION_UUID,
                applicationSection: "data",
                parentUuid: COUNTRY_ENTITY_UUID,
                objects: [
                  {
                    transformerType: "createObject",
                    definition: {
                      uuid: LIBRARY_TEST_TRACER_COUNTRY_UUID,
                      parentName: "Country",
                      parentUuid: COUNTRY_ENTITY_UUID,
                      name: "BranchFinishLand",
                      "iso3166-1Alpha-2": "BF",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      section: {
        type: "list",
        definition: [
          {
            stepId: "dynamic",
            section: {
              type: "inputReportSection",
              definition: {
                label: "Dynamic schema",
                inputPrefix: "dynamic",
              },
            },
            inputSchemaFromBag: {
              transformerType: "returnValue",
              interpolation: "runtime",
              value: {
                type: "object",
                definition: {
                  requiredField: {
                    type: "string",
                  },
                },
              },
            },
          },
          {
            stepId: "choice",
            section: {
              type: "inputReportSection",
              definition: {
                label: "Choice",
                inputPrefix: "choice",
                inputMLSchema: {
                  type: "object",
                  definition: {
                    takeSecretPath: {
                      type: "boolean",
                    },
                  },
                },
              },
            },
            onNext: {
              actionType: "compositeActionSequence",
              actionLabel: "choiceOnNext",
              endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              payload: {
                actionSequence: [
                  {
                    actionType: "createInstance",
                    actionLabel: "onNextMaybeCollide",
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    payload: {
                      application: LIBRARY_APPLICATION_UUID,
                      applicationSection: "data",
                      parentUuid: COUNTRY_ENTITY_UUID,
                      objects: [
                        {
                          transformerType: "createObject",
                          definition: {
                            uuid: ON_NEXT_COLLISION_UUID,
                            parentName: "Country",
                            parentUuid: COUNTRY_ENTITY_UUID,
                            name: "OnNextLand",
                            "iso3166-1Alpha-2": "ON",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            branch: {
              test: {
                transformerType: "getFromParameters",
                interpolation: "runtime",
                referencePath: ["choice", "takeSecretPath"],
              },
              whenTrue: "secret",
              whenFalse: "review",
            },
          },
          {
            stepId: "secret",
            section: {
              type: "inputReportSection",
              definition: {
                label: "Secret",
                inputPrefix: "secret",
                inputMLSchema: {
                  type: "object",
                  definition: {
                    secretValue: {
                      type: "string",
                    },
                    clientSecret: {
                      type: "string",
                      optional: true,
                    },
                    refreshToken: {
                      type: "string",
                      optional: true,
                    },
                    token: {
                      type: "string",
                      optional: true,
                    },
                  },
                },
              },
            },
          },
          {
            stepId: "review",
            section: {
              type: "markdownReportSection",
              definition: {
                label: "Review",
                markdown: "Ready to finish.",
              },
            },
          },
        ],
      },
    },
  };
}

function mountBranchFixture() {
  currentUseParams.reportUuid = BRANCH_REPORT_UUID;
  upsertLibraryReportInJzodEditorTestCache(buildBranchFixtureReport());
}

function branchFixtureProps(): ReportViewProps {
  mountBranchFixture();
  return {
    application: selfApplicationLibrary.uuid,
    applicationSection: "data",
    deploymentUuid: deployment_Library.uuid,
    pageParams: {
      applicationSection: "data",
      application: LIBRARY_APPLICATION_UUID,
      deploymentUuid: deployment_Library.uuid,
      reportUuid: BRANCH_REPORT_UUID,
    },
    reportDefinition: buildBranchFixtureReport(),
    applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
  };
}

async function fillDynamicRequired(container: Container, value: string) {
  const input = await waitFor(() => {
    const found = inputByName(container, "dynamic.requiredField");
    expect(found).toBeTruthy();
    return found as HTMLInputElement;
  });
  await act(async () => {
    fireEvent.change(input, { target: { value } });
  });
  await waitAfterUserInteraction();
}

async function goToChoiceStep(container: Container) {
  await waitFor(() => {
    expect(stepLabelText().length).toBeGreaterThan(0);
  });
  if (/Dynamic/i.test(stepLabelText())) {
    await fillDynamicRequired(container, "filled");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitAfterUserInteraction();
  }
  await waitFor(() => {
    expect(stepLabelText()).toMatch(/Choice/i);
  });
}

async function setTakeSecretPath(checked: boolean) {
  const checkbox = await waitFor(() => {
    const found = screen
      .getAllByRole("checkbox")
      .find((el) => (el as HTMLInputElement).name === "choice.takeSecretPath") as
      | HTMLInputElement
      | undefined;
    expect(found).toBeTruthy();
    return found as HTMLInputElement;
  });
  if (checkbox.checked !== checked) {
    await act(async () => {
      fireEvent.click(checkbox);
    });
    await waitAfterUserInteraction();
  }
}

async function typeStepOneCountry(container: Container, name: string, iso: string) {
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

const pageLabel = "multistepBranch.284";

const jzodElementEditorTests: Record<string, ReactComponentTestSuitePrep<any>> = {
  multistepBranch: {
    editor: ReportPage,
    wireLocalCacheCompositeAction: true,
    getJzodEditorTests: (
      componentUnderTest: React.FC<ReportViewProps>,
    ): ReactComponentTestSuites<ReportViewProps> => {
      return {
        multistepBranch: {
          suiteRenderComponent: componentUnderTest,
          tests: {
            "false-branch-skips-secret-finish": {
              props: () => branchFixtureProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await goToChoiceStep(container);
                await setTakeSecretPath(false);
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Review/i);
                  expect(screen.getByRole("button", { name: "Finish" })).toBeTruthy();
                });
                expect(inputByName(container, "secret.secretValue")).toBeUndefined();

                fireEvent.click(screen.getByRole("button", { name: "Finish" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  const country = getLibraryCountryFromJzodEditorTestCache();
                  expect(country).toBeTruthy();
                  expect(country?.name).toEqual("BranchFinishLand");
                });
                expect(navigateMock).toHaveBeenCalledWith(-1);
              },
            },
            "back-from-review-to-choice": {
              props: () => branchFixtureProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await goToChoiceStep(container);
                await setTakeSecretPath(false);
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Review/i);
                });

                fireEvent.click(screen.getByRole("button", { name: "Back" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Choice/i);
                });
                expect(stepLabelText()).not.toMatch(/Secret/i);
                expect(inputByName(container, "secret.secretValue")).toBeUndefined();
              },
            },
            "onNext-error-stays-with-inner-message": {
              props: () => {
                const props = branchFixtureProps();
                upsertLibraryCountryInJzodEditorTestCache({
                  uuid: ON_NEXT_COLLISION_UUID,
                  parentName: "Country",
                  parentUuid: COUNTRY_ENTITY_UUID,
                  name: "CollisionLand",
                  "iso3166-1Alpha-2": "CL",
                } as any);
                return props;
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await goToChoiceStep(container);
                await setTakeSecretPath(false);
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();

                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Choice/i);
                  expect(screen.getByTestId("multistep-finish-error")).toBeTruthy();
                });
                const alertText = screen.getByTestId("multistep-finish-error").textContent ?? "";
                expect(alertText).toMatch(/createInstance colliding uuid already present/i);
                expect(alertText).not.toMatch(
                  /handleCompositeActionTemplate compositeInstanceAction error/,
                );
                expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
                expect(screen.queryByRole("button", { name: "Finish" })).toBeNull();
              },
            },
            "bare-section-back-is-index-minus-one": {
              props: () => {
                currentUseParams.reportUuid = MULTISTEP_COUNTRY_REPORT_UUID;
                restoreLibraryMultistepTracerReportInJzodEditorTestCache();
                return {
                  application: selfApplicationLibrary.uuid,
                  applicationSection: "data",
                  deploymentUuid: deployment_Library.uuid,
                  pageParams: {
                    applicationSection: "data",
                    application: LIBRARY_APPLICATION_UUID,
                    deploymentUuid: deployment_Library.uuid,
                    reportUuid: MULTISTEP_COUNTRY_REPORT_UUID,
                  },
                  reportDefinition: reportMultistepCountryCreate as any,
                  applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                };
              },
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await waitFor(() => {
                  expect(inputByName(container, "stepOne.name")).toBeTruthy();
                });
                await typeStepOneCountry(container, "Testland", "TL");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  expect(screen.queryByText(/Confirm the country details/i)).toBeTruthy();
                });

                fireEvent.click(screen.getByRole("button", { name: "Back" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  expect(inputByName(container, "stepOne.name")).toBeTruthy();
                });
              },
            },
            "dynamic-schema-gates-next": {
              props: () => branchFixtureProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Dynamic schema/i);
                });
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                expect(stepLabelText()).toMatch(/Dynamic schema/i);
                expect(inputByName(container, "dynamic.requiredField")).toBeTruthy();

                await fillDynamicRequired(container, "now-filled");
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Choice/i);
                });
              },
            },
            "cancel-dialog-text-and-secret-bag-redaction": {
              props: () => branchFixtureProps(),
              tests: async (expect: ExpectStatic, container: Container) => {
                await waitForHost();
                await goToChoiceStep(container);
                await setTakeSecretPath(true);
                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                await waitFor(() => {
                  expect(stepLabelText()).toMatch(/Secret/i);
                });

                const secretInput = await waitFor(() => {
                  const found = inputByName(container, "secret.secretValue");
                  expect(found).toBeTruthy();
                  return found as HTMLInputElement;
                });
                await act(async () => {
                  fireEvent.change(secretInput, { target: { value: "sekret-value" } });
                });
                for (const [field, value] of [
                  ["secret.clientSecret", "cs"],
                  ["secret.refreshToken", "rt"],
                  ["secret.token", "tok"],
                ] as const) {
                  const optional = inputByName(container, field);
                  if (optional) {
                    await act(async () => {
                      fireEvent.change(optional, { target: { value } });
                    });
                  }
                }
                await waitAfterUserInteraction();

                fireEvent.click(screen.getByRole("button", { name: "Next" }));
                await waitAfterUserInteraction();
                if (screen.queryByRole("button", { name: "Finish" })) {
                  fireEvent.click(screen.getByRole("button", { name: "Back" }));
                  await waitAfterUserInteraction();
                }
                await waitFor(() => {
                  const bag = readStepBag();
                  expect(bag).not.toHaveProperty("clientSecret");
                  expect(bag).not.toHaveProperty("refreshToken");
                  expect(bag).not.toHaveProperty("token");
                  expect(bag).not.toHaveProperty("secretValue");
                  const secretBag = bag.secret as Record<string, unknown> | undefined;
                  if (secretBag && typeof secretBag === "object") {
                    expect(secretBag).not.toHaveProperty("secretValue");
                    expect(secretBag).not.toHaveProperty("clientSecret");
                    expect(secretBag).not.toHaveProperty("refreshToken");
                    expect(secretBag).not.toHaveProperty("token");
                  }
                });

                fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
                await waitAfterUserInteraction();
                const dialog = screen.getByLabelText("Cancel this process");
                expect(dialog.textContent).toContain("The values you entered will be discarded.");
                expect(dialog.textContent).not.toContain(
                  "Mid-step writes already saved are not undone.",
                );
              },
            },
          },
        },
      };
    },
  },
};

(shouldRun ? describe : describe.skip)("multistepBranch.284", () => {
  afterEach(() => {
    deleteLibraryCountryFromJzodEditorTestCache();
    deleteLibraryCountryFromJzodEditorTestCache(ON_NEXT_COLLISION_UUID);
    restoreLibraryMultistepTracerReportInJzodEditorTestCache();
    currentUseParams.reportUuid = BRANCH_REPORT_UUID;
    navigateMock.mockClear();
  });
  prepareAndRunTestSuites(
    pageLabel,
    jzodElementEditorTests,
    defaultSelfApplicationDeploymentMap,
  );
});
