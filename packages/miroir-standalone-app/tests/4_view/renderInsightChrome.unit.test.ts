import { describe, expect, it } from "vitest";
import {
  DEFAULT_RENDER_INSIGHT_THEME,
  RENDER_INSIGHT_OVERLAY_VALUE,
  VISUAL_DEBUG_OVERLAY_VALUE,
  getRenderInsightChromeStyle,
  resolveRenderInsightTheme,
  shortenFormikPath,
} from "../../src/miroir-fwk/4_view/tools/renderInsightChrome.js";

describe("renderInsightChrome (themable)", () => {
  it("resolves defaults when theme has no renderInsight section", () => {
    const chrome = resolveRenderInsightTheme({ components: {} });
    expect(chrome.background).toBe(DEFAULT_RENDER_INSIGHT_THEME.background);
    expect(chrome.fontSize).toBe("12px");
    expect(chrome.fontSizeSummary).toBe("13px");
  });

  it("honors theme.components.renderInsight overrides", () => {
    const chrome = resolveRenderInsightTheme({
      components: {
        renderInsight: {
          background: "#001122",
          textColor: "#ffffff",
          fontSize: "14px",
          fontSizeSummary: "15px",
        },
      },
    });
    expect(chrome.background).toBe("#001122");
    expect(chrome.textColor).toBe("#ffffff");
    expect(chrome.fontSize).toBe("14px");
    expect(chrome.fontSizeSummary).toBe("15px");
    expect(chrome.accent).toBe(DEFAULT_RENDER_INSIGHT_THEME.accent);
  });

  it("compact chrome is a fit-content pill using theme fontSize", () => {
    const style = getRenderInsightChromeStyle(
      { ...DEFAULT_RENDER_INSIGHT_THEME, fontSize: "12px" },
      { compact: true }
    );
    expect(style.display).toBe("inline-flex");
    expect(style.width).toBe("fit-content");
    expect(style.fontSize).toBe("12px");
    expect(style.backgroundColor).not.toBe("#fffbeb");
  });

  it("summary chrome uses fontSizeSummary", () => {
    const style = getRenderInsightChromeStyle(DEFAULT_RENDER_INSIGHT_THEME, {
      compact: false,
    });
    expect(style.display).toBe("block");
    expect(style.fontSize).toBe("13px");
  });

  it("shortens long formik paths for chip labels", () => {
    expect(shortenFormikPath("instance.query.definition.attributes.name")).toBe(
      "…attributes.name"
    );
  });

  it("keeps overlay markers distinct from visual-debug", () => {
    expect(RENDER_INSIGHT_OVERLAY_VALUE).not.toBe(VISUAL_DEBUG_OVERLAY_VALUE);
  });
});
