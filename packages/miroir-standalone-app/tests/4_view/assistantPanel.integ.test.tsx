/**
 * #633 slice 6: the shell in miroir-react mounts the assistant only through the host's
 * `assistantPanel` slot. Without the slot the AI AppBar button mounts nothing; with it, the
 * button mounts the slot's component.
 *
 * vitest: React rendering of the shell, which MiroirTest reaches only once the shell is built.
 *
 * Run:
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- assistantPanel.integ
 * ```
 */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultSelfApplicationDeploymentMap, type ProcessCapabilities } from "@miroir-framework/core";
import { MiroirShellHostProvider, RootComponent, type MiroirShellHost } from "@miroir-framework/react";

import {
  buildComponentTestWrapper,
  type ComponentTestWrapper,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestTools";

const aiCapabilities: ProcessCapabilities = {
  ai: true,
  mcp: false,
  agentBackend: "none",
  designerTools: true,
  availableStoreTypes: [],
  creatableStoreTypes: [],
  storeAdministration: false,
};

function FakeAssistantPanel(): React.JSX.Element {
  return <div data-testid="fake-assistant-panel" />;
}

describe("assistantPanel", () => {
  let wrapper: ComponentTestWrapper | undefined;
  // The context keeps the AI sidebar state in sessionStorage: each case starts with it closed.
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    cleanup();
    wrapper?.miroirEventService.destroy();
    wrapper = undefined;
  });

  function renderShell(host: MiroirShellHost) {
    wrapper = buildComponentTestWrapper({
      applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
      processCapabilities: aiCapabilities,
    });
    const { Wrapper } = wrapper;
    const router = createMemoryRouter([
      { path: "/", element: <RootComponent />, children: [{ index: true, element: <div /> }] },
    ]);
    render(
      <Wrapper>
        <MiroirShellHostProvider host={host}>
          <RouterProvider router={router} />
        </MiroirShellHostProvider>
      </Wrapper>,
    );
  }

  it("mounts no assistant when the host gives no assistantPanel", async () => {
    renderShell({});
    expect(screen.queryByTestId("fake-assistant-panel")).toBeNull();
    fireEvent.click(await screen.findByLabelText("AI Assistant"));
    expect(screen.queryByTestId("fake-assistant-panel")).toBeNull();
  });

  it("mounts the host's assistantPanel once the AI Assistant button is used", async () => {
    renderShell({ assistantPanel: FakeAssistantPanel });
    expect(screen.queryByTestId("fake-assistant-panel")).toBeNull();
    fireEvent.click(await screen.findByLabelText("AI Assistant"));
    expect(await screen.findByTestId("fake-assistant-panel")).toBeTruthy();
  });
});
