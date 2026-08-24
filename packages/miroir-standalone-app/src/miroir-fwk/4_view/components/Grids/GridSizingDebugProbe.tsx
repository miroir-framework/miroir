import React, { useState } from "react";
import { useMiroirContextService } from "miroir-react";

export interface GridSizingProbeTarget {
  label: string;
  selector: string;
}

/**
 * On-demand DOM sizing probe for grid containers and their inner elements (ag-grid / Glide).
 * Rendered only when the debug-info flag is on; measurements are taken on click so no
 * post-mount effect is needed.
 */
export const GridSizingDebugProbe: React.FC<{ targets: GridSizingProbeTarget[] }> = ({
  targets,
}) => {
  const context = useMiroirContextService();
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);

  if (!context.showDebugInfo) return null;

  const measure = () => {
    const next: Record<string, unknown> = {};
    for (const target of targets) {
      const element = document.querySelector(target.selector) as HTMLElement | null;
      if (!element) {
        next[target.label] = null;
        continue;
      }
      const computed = getComputedStyle(element);
      next[target.label] = {
        styleAttr: element.getAttribute("style"),
        computedHeight: computed.height,
        computedMaxHeight: computed.maxHeight,
        overflowY: computed.overflowY,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      };
    }
    setSnapshot(next);
  };

  return (
    <div style={{ fontFamily: "monospace", fontSize: "11px", margin: "4px 0" }}>
      <button type="button" onClick={measure}>
        measure grid DOM
      </button>
      {snapshot ? (
        <pre style={{ whiteSpace: "pre-wrap", margin: "4px 0" }}>
          {JSON.stringify(snapshot, null, 1)}
        </pre>
      ) : null}
    </div>
  );
};

export default GridSizingDebugProbe;
