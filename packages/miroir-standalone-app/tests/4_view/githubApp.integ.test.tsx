/**
 * GitHub example app (#472): deployment boot + repositories Report.
 *
 * Vitest integ: full deployment boot + report rendering are not MiroirTest-reachable
 * with a local HTTP server (same pattern as spotifyApp.integ.test.tsx).
 * Package assets keep https://api.github.com; the test points the Endpoint at the fake server.
 *
 * Run:
 * ```bash
 * RUN_TEST=githubApp npm run testByFile -w miroir-standalone-app -- githubApp --profile emulatedServer-filesystem
 * ```
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter, type Params } from "react-router-dom";
import * as RRDom from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { DomainControllerInterface, Report } from "miroir-core";
import { clearSecrets, MiroirContext, registerSecrets } from "miroir-core";
import { LocalCacheProvider, MiroirContextReactProvider } from "miroir-react";
import { defaultStoredMiroirTheme } from "miroir-app-miroir";
import {
  deployment_GitHub_DO_NOT_USE,
  reportGitHubRepositories,
  selfApplicationGitHub,
} from "miroir-example-github";

import { ReportPageContextProvider } from "../../src/miroir-fwk/4_view/components/Reports/ReportPageContext.js";
import { ReportViewWithEditor } from "../../src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.js";
import { DocumentOutlineContextProvider } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/InstanceEditorOutlineContext.js";
import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { ReportUrlParamKeys } from "../../src/constants.js";
import {
  applicationDeploymentMap,
  bootGitHubTestbed,
  reseedGitHub,
  type GitHubTestbed,
} from "../helpers/githubAppTestbed.js";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock("miroir-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-react")>();
  return {
    ...actual,
    JsonDisplayHelper: () => null,
  };
});

vi.mock("../../src/miroir-fwk/4_view/components/Reports/ModelDiagramReportSectionView.js", () => ({
  ModelDiagramReportSectionView: () => null,
}));

const RUN_TEST = process.env.RUN_TEST;
const shouldRun = !RUN_TEST || RUN_TEST === "githubApp" || RUN_TEST === "githubApp.integ.test";

const TEST_TOKEN = "ghp_test-token";

function repository(id: number, name: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    node_id: `node-${id}`,
    name,
    full_name: `octocat/${name}`,
    owner: { login: "octocat", id: 1, avatar_url: "https://example.test/a.png", html_url: "https://github.com/octocat" },
    private: false,
    html_url: `https://github.com/octocat/${name}`,
    description: null,
    language: "TypeScript",
    stargazers_count: 3,
    updated_at: "2026-10-01T10:00:00Z",
    archive_url: "not bound, stripped by the client",
    ...extra,
  };
}

const REPOSITORIES = [
  repository(11, "hello-miroir"),
  repository(12, "private-notes", { private: true, language: null, stargazers_count: 0 }),
];

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "githubApp test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

let testbed: GitHubTestbed;
let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;

function renderGitHubReport(reportDefinition: Report) {
  const pageParams: Params<ReportUrlParamKeys> = {
    application: selfApplicationGitHub.uuid,
    deploymentUuid: deployment_GitHub_DO_NOT_USE.uuid,
    applicationSection: "data",
    reportUuid: reportDefinition.uuid,
    instanceUuid: "",
  };
  vi.spyOn(RRDom, "useParams").mockReturnValue(pageParams);
  const search = new URLSearchParams({ page: "report", ...(pageParams as Record<string, string>) }).toString();
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={[`/?${search}`]}
    >
      <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
        <LocalCacheProvider store={domainController.getLocalCache().getInnerStore()}>
          <MiroirContextReactProvider
            miroirContext={miroirContext}
            domainController={domainController}
            testingApplication={selfApplicationGitHub.uuid}
            testingDeploymentUuid={deployment_GitHub_DO_NOT_USE.uuid}
          >
            <DocumentOutlineContextProvider
              isOutlineOpen={false}
              onToggleOutline={() => {}}
              onNavigateToPath={() => {}}
            >
              <ReportPageContextProvider>
                <ReportViewWithEditor
                  applicationSection="data"
                  application={selfApplicationGitHub.uuid}
                  applicationDeploymentMap={applicationDeploymentMap}
                  deploymentUuid={deployment_GitHub_DO_NOT_USE.uuid}
                  pageParams={pageParams}
                  reportDefinition={reportDefinition}
                />
              </ReportPageContextProvider>
            </DocumentOutlineContextProvider>
          </MiroirContextReactProvider>
        </LocalCacheProvider>
      </MiroirThemeProvider>
    </MemoryRouter>,
  );
}

function shownOnPage(text: string): boolean {
  return !!screen.queryByDisplayValue(text) || screen.queryAllByText(text, { exact: false }).length > 0;
}

beforeAll(async () => {
  testbed = await bootGitHubTestbed();
  domainController = testbed.domainController;
  miroirContext = new MiroirContext(
    testbed.miroirActivityTracker,
    testbed.miroirEventService,
    testbed.miroirConfig,
  );
}, 60000);

beforeEach(async () => {
  testbed.fakeServer.receivedRequests.length = 0;
  registerSecrets({ githubToken: TEST_TOKEN });
  testbed.fakeServer.setFixture("GET", "/user/repos", { body: REPOSITORIES });
  testbed.fakeServer.setFixtureForAuth("GET", "/user/repos", "Bearer ghp_revoked", {
    status: 401,
    body: { message: "Bad credentials", status: "401" },
  });
  await reseedGitHub(testbed);
}, 60000);

afterEach(() => {
  cleanup();
  clearSecrets();
});

afterAll(async () => {
  clearSecrets();
  await testbed?.fakeServer.close();
});

describe.skipIf(!shouldRun)("githubApp: GitHub deployment and repositories Report", () => {
  it("lists the connected user's repositories", async () => {
    renderGitHubReport(reportGitHubRepositories);
    await waitFor(
      () => {
        expect(shownOnPage("octocat/hello-miroir")).toBe(true);
        expect(shownOnPage("octocat/private-notes")).toBe(true);
      },
      { timeout: 15000 },
    );
  });

  it("asks GitHub for the 100 most recently updated repositories with the user's token and GitHub's headers", async () => {
    renderGitHubReport(reportGitHubRepositories);
    await waitFor(() => expect(testbed.fakeServer.receivedRequests.length).toBeGreaterThan(0), {
      timeout: 15000,
    });
    const request = testbed.fakeServer.receivedRequests[0];
    expect(request.path).toBe("/user/repos");
    expect(new URLSearchParams(request.search).get("per_page")).toBe("100");
    expect(new URLSearchParams(request.search).get("sort")).toBe("updated");
    expect(request.headers.authorization).toBe(`Bearer ${TEST_TOKEN}`);
    expect(request.headers["user-agent"]).toBe("miroir-example-github");
    expect(request.headers.accept).toBe("application/vnd.github+json");
    expect(request.headers["x-github-api-version"]).toBe("2022-11-28");
  });

  it("shows no repositories and a load failure when GitHub refuses the token", async () => {
    registerSecrets({ githubToken: "ghp_revoked" });
    renderGitHubReport(reportGitHubRepositories);
    await waitFor(
      () => {
        expect(testbed.fakeServer.receivedRequests.length).toBeGreaterThan(0);
        expect(shownOnPage("octocat/hello-miroir")).toBe(false);
        expect(screen.queryAllByText(/Report async load failed/).length).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );
  });
});
