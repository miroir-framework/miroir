// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ReportSectionRenderersProvider,
  UnsupportedReportSection,
  useReportSectionRenderers,
  type MiroirTestReportSectionRendererProps,
} from "../src/contexts/ReportSectionRenderersContext.js";

// Report section renderer registry (#610): the application provides the section kinds that
// miroir-react does not render itself; a kind with no renderer shows the fallback.

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MiroirTestSection = (props: MiroirTestReportSectionRendererProps) => (
  <div id="registered">MiroirTest section of {props.reportName}</div>
);

// Renders the way ReportSectionViewWithEditor does: the registered component, or the fallback.
const MiroirTestSectionSlot = () => {
  const renderers = useReportSectionRenderers();
  return renderers.miroirTestReportSection ? (
    <renderers.miroirTestReportSection reportName="aReport" />
  ) : (
    <UnsupportedReportSection sectionType="miroirTestReportSection" />
  );
};

describe("ReportSectionRenderersContext", () => {
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

  it("renders the component the application registered", () => {
    act(() =>
      root.render(
        <ReportSectionRenderersProvider renderers={{ miroirTestReportSection: MiroirTestSection }}>
          <MiroirTestSectionSlot />
        </ReportSectionRenderersProvider>,
      ),
    );
    expect(container.querySelector("#registered")?.textContent).toBe("MiroirTest section of aReport");
  });

  it("shows the fallback without a provider", () => {
    act(() => root.render(<MiroirTestSectionSlot />));
    expect(container.querySelector('[data-testid="unsupported-report-section"]')?.textContent).toContain(
      "miroirTestReportSection",
    );
  });
});
