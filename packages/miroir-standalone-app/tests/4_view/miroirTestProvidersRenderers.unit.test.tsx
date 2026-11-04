/**
 * #672 D7: the providers of a component or Report test take the report section renderers and the
 * shell host from their host (the app, the sandbox, a vitest helper) instead of the app's own.
 * The test runtime then has no import of the app, and a sandbox that runs MiroirTests gives its
 * cases the sandbox's renderers.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- miroirTestProvidersRenderers
 * ```
 */
import React from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { defaultSelfApplicationDeploymentMap } from "@miroir-framework/core";
import {
  useProvidedMiroirShellHost,
  useReportSectionRenderers,
  type MiroirShellHost,
  type ReportSectionRenderers,
} from "@miroir-framework/react";

import {
  buildComponentTestWrapper,
  type ComponentTestWrapper,
} from "miroir-react-testing/src/4-tests/componentTests/componentTestTools.js";

const HostMiroirTestSection: ReportSectionRenderers["miroirTestReportSection"] = () => null;
const hostRenderers: ReportSectionRenderers = { miroirTestReportSection: HostMiroirTestSection };
const hostShell: MiroirShellHost = { requestLoginToken: async () => "host-token" };

function renderProbe(options: Partial<Parameters<typeof buildComponentTestWrapper>[0]>) {
  const wrapper = buildComponentTestWrapper({
    applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
    isolateToolsPageState: true,
    ...options,
  });
  let renderers: ReportSectionRenderers | undefined;
  let shellHost: MiroirShellHost | undefined;
  const Probe: React.FC = () => {
    renderers = useReportSectionRenderers();
    shellHost = useProvidedMiroirShellHost();
    return null;
  };
  const { Wrapper } = wrapper;
  render(
    <Wrapper>
      <Probe />
    </Wrapper>,
  );
  return { wrapper, renderers: renderers!, shellHost: shellHost! };
}

describe("MiroirTestProviders renderers and shell host (#672 D7)", () => {
  let wrapper: ComponentTestWrapper | undefined;
  afterEach(() => {
    wrapper?.miroirEventService.destroy();
    wrapper = undefined;
  });

  it("gives the cases the renderers and shell host of their host", () => {
    const probe = renderProbe({ reportSectionRenderers: hostRenderers, shellHost: hostShell });
    wrapper = probe.wrapper;
    expect(probe.renderers.miroirTestReportSection).toBe(HostMiroirTestSection);
    // the miroir-react defaults stay under the host's renderers
    expect(probe.renderers.storedRunner).toBeDefined();
    expect(probe.shellHost).toBe(hostShell);
  });

  it("without a host, gives the miroir-react defaults only, not the app's renderers", () => {
    const probe = renderProbe({});
    wrapper = probe.wrapper;
    expect(probe.renderers.miroirTestReportSection).toBeUndefined();
    expect(probe.renderers.graphReportSection).toBeUndefined();
    expect(probe.renderers.storedRunner).toBeDefined();
    expect(probe.shellHost).toEqual({});
  });
});
