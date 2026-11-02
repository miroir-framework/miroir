// @vitest-environment happy-dom
/**
 * #633 D8 and D2: a client that registers no renderer still renders stored runner sections, and
 * an MCP tool runner reaches the MCP call its host provides, or reports the feature unavailable.
 * Not reachable through MiroirTest: React context wiring of the package. The rendering of a stored
 * runner inside a Report is covered by the app's integration tests (multistepProcess.274, ui.blockEditing).
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Runner } from "@miroir-framework/core";
import {
  MiroirShellHostProvider,
  useMiroirShellHost,
  type McpToolRunnerEnvelope,
  type MiroirShellHost,
} from "../src/contexts/MiroirShellHostContext.js";
import {
  defaultReportSectionRenderers,
  ReportSectionRenderersProvider,
  useReportSectionRenderers,
  type ReportSectionRenderers,
} from "../src/contexts/ReportSectionRenderersContext.js";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderersSeen(tree: (probe: React.ReactElement) => React.ReactElement): ReportSectionRenderers {
  let seen: ReportSectionRenderers = {};
  const Probe = () => {
    seen = useReportSectionRenderers();
    return null;
  };
  act(() => root.render(tree(<Probe />)));
  return seen;
}

describe("stored runner sections without an application renderer (#633 D8)", () => {
  it("renders stored runners without a provider", () => {
    const seen = renderersSeen((probe) => probe);
    expect(seen.storedRunner).toBe(defaultReportSectionRenderers.storedRunner);
  });

  it("renders stored runners under a provider that registers nothing", () => {
    const seen = renderersSeen((probe) => <ReportSectionRenderersProvider renderers={{}}>{probe}</ReportSectionRenderersProvider>);
    expect(seen.storedRunner).toBe(defaultReportSectionRenderers.storedRunner);
  });

  it("keeps the application's renderers next to the default", () => {
    const MiroirTestSection = () => null;
    const seen = renderersSeen((probe) => (
      <ReportSectionRenderersProvider renderers={{ miroirTestReportSection: MiroirTestSection }}>{probe}</ReportSectionRenderersProvider>
    ));
    expect(seen.miroirTestReportSection).toBe(MiroirTestSection);
    expect(seen.storedRunner).toBe(defaultReportSectionRenderers.storedRunner);
  });
});

describe("MCP tool calls of the shell host (#633 D2)", () => {
  const runner = { definition: { runnerType: "mcpToolRunner", toolName: "aTool" } } as unknown as Runner;

  async function callThroughHost(host: MiroirShellHost | undefined): Promise<McpToolRunnerEnvelope> {
    let runMcpTool: ReturnType<typeof useMiroirShellHost>["runMcpTool"] | undefined;
    const Probe = () => {
      runMcpTool = useMiroirShellHost().runMcpTool;
      return null;
    };
    act(() => root.render(host ? <MiroirShellHostProvider host={host}><Probe /></MiroirShellHostProvider> : <Probe />));
    return runMcpTool!(runner, { a: 1 }, "http://localhost/mcp", { mcp: true });
  }

  it("reports FeatureUnavailable when the host gives no MCP call", async () => {
    const envelope = await callThroughHost(undefined);
    expect(envelope).toMatchObject({ status: "error", error: { type: "FeatureUnavailable", capability: "mcp" } });
  });

  it("calls the host's MCP call once with the runner's arguments", async () => {
    const calls: unknown[][] = [];
    const envelope = await callThroughHost({
      runMcpTool: async (...args) => {
        calls.push(args);
        return { status: "ok", result: "done" };
      },
    });
    expect(envelope).toEqual({ status: "ok", result: "done" });
    expect(calls).toEqual([[runner, { a: 1 }, "http://localhost/mcp", { mcp: true }]]);
  });
});
