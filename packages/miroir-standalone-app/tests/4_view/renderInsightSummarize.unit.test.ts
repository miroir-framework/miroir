import { describe, it, expect } from "vitest";
import type { RenderInsightNode } from "../../src/miroir-fwk/4_view/tools/renderInsightRegistry.js";
import {
  summarizeTree,
  type SummarizedInsightNode,
} from "../../src/miroir-fwk/4_view/tools/renderInsightSummarize.js";

function node(
  partial: Pick<RenderInsightNode, "pathKey" | "componentId" | "depth" | "navigationCount"> &
    Partial<RenderInsightNode>
): RenderInsightNode {
  return {
    totalCount: partial.navigationCount,
    formikPath: partial.formikPath,
    ...partial,
  };
}

/** Fixture: Root(0) → Section(1) → EntityInstance(2) → two Jzod leaves(3) */
function fixtureTree(): RenderInsightNode[] {
  return [
    node({
      pathKey: "RootComponent",
      componentId: "RootComponent",
      depth: 0,
      navigationCount: 4,
    }),
    node({
      pathKey: "ReportSectionViewWithEditor@sections.0",
      componentId: "ReportSectionViewWithEditor",
      formikPath: "sections.0",
      depth: 1,
      navigationCount: 2,
    }),
    node({
      pathKey: "ReportSectionEntityInstance@instance",
      componentId: "ReportSectionEntityInstance",
      formikPath: "instance",
      depth: 2,
      navigationCount: 3,
    }),
    node({
      pathKey: "JzodElementEditor@instance.name",
      componentId: "JzodElementEditor",
      formikPath: "instance.name",
      depth: 3,
      navigationCount: 1,
    }),
    node({
      pathKey: "JzodElementEditor@instance.firstName",
      componentId: "JzodElementEditor",
      formikPath: "instance.firstName",
      depth: 3,
      navigationCount: 18,
    }),
  ];
}

describe("summarizeTree (Phase 2.2–2.3)", () => {
  it("keeps nodes at or above maxDepth and attaches aggregates for hidden descendants", () => {
    const result = summarizeTree(fixtureTree(), { maxDepth: 2 });

    const visibleKeys = result.map((n) => n.pathKey);
    expect(visibleKeys).toEqual([
      "RootComponent",
      "ReportSectionViewWithEditor@sections.0",
      "ReportSectionEntityInstance@instance",
    ]);
    expect(result.find((n) => n.pathKey.includes("JzodElementEditor"))).toBeUndefined();

    const entity = result.find(
      (n) => n.pathKey === "ReportSectionEntityInstance@instance"
    ) as SummarizedInsightNode;
    expect(entity.aggregate).toBeDefined();
    expect(entity.aggregate!.descendantCount).toBe(2);
    expect(entity.aggregate!.sumNavigationRenders).toBe(19);
    expect(entity.aggregate!.avgNavigationRenders).toBe(9.5);
    expect(entity.aggregate!.min).toEqual({
      path: "JzodElementEditor@instance.name",
      navigationCount: 1,
    });
    expect(entity.aggregate!.max).toEqual({
      path: "JzodElementEditor@instance.firstName",
      navigationCount: 18,
    });
  });

  it("does not attach aggregates when maxDepth shows the full tree", () => {
    const result = summarizeTree(fixtureTree(), { maxDepth: 10 });
    expect(result).toHaveLength(5);
    expect(result.every((n) => n.aggregate === undefined)).toBe(true);
  });

  it("with maxDepth 0 only shows depth-0 nodes with aggregates over everything below", () => {
    const result = summarizeTree(fixtureTree(), { maxDepth: 0 });
    expect(result).toHaveLength(1);
    expect(result[0].pathKey).toBe("RootComponent");
    expect(result[0].aggregate!.descendantCount).toBe(4);
    expect(result[0].aggregate!.min.navigationCount).toBe(1);
    expect(result[0].aggregate!.max.navigationCount).toBe(18);
  });
});
