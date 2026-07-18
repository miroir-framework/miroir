/**
 * Depth truncation + subtree aggregates for render-insight snapshots.
 * maxDepth hides inline nodes deeper than N and summarizes them onto the
 * deepest visible ancestor (formik-path prefix, or root when no formikPath).
 */

import type { RenderInsightNode } from "./renderInsightRegistry.js";

export interface RenderInsightPathRef {
  path: string;
  navigationCount: number;
}

export interface RenderInsightAggregate {
  descendantCount: number;
  sumNavigationRenders: number;
  avgNavigationRenders: number;
  min: RenderInsightPathRef;
  max: RenderInsightPathRef;
}

export interface SummarizedInsightNode extends RenderInsightNode {
  aggregate?: RenderInsightAggregate;
}

export interface SummarizeTreeOptions {
  maxDepth: number;
}

function formikUnder(child: RenderInsightNode, parent: RenderInsightNode): boolean {
  if (!parent.formikPath || !child.formikPath) {
    return false;
  }
  return child.formikPath.startsWith(parent.formikPath + ".");
}

/** Whether `child` is considered under `parent` for aggregation. */
export function isInsightDescendant(
  child: RenderInsightNode,
  parent: RenderInsightNode
): boolean {
  if (child.depth <= parent.depth) {
    return false;
  }
  if (formikUnder(child, parent)) {
    return true;
  }
  // Root-style parent (no formik path): claim all deeper nodes; deepest
  // specific ancestor wins when assigning (see summarizeTree).
  if (!parent.formikPath) {
    return true;
  }
  return false;
}

function buildAggregate(descendants: RenderInsightNode[]): RenderInsightAggregate {
  let sum = 0;
  let min = descendants[0];
  let max = descendants[0];
  for (const d of descendants) {
    sum += d.navigationCount;
    if (d.navigationCount < min.navigationCount) min = d;
    if (d.navigationCount > max.navigationCount) max = d;
  }
  return {
    descendantCount: descendants.length,
    sumNavigationRenders: sum,
    avgNavigationRenders: sum / descendants.length,
    min: { path: min.pathKey, navigationCount: min.navigationCount },
    max: { path: max.pathKey, navigationCount: max.navigationCount },
  };
}

/**
 * Return visible nodes (depth <= maxDepth). Nodes at the visibility boundary
 * that have hidden descendants get an `aggregate` summary.
 */
export function summarizeTree(
  nodes: RenderInsightNode[],
  options: SummarizeTreeOptions
): SummarizedInsightNode[] {
  const { maxDepth } = options;
  const visible = nodes.filter((n) => n.depth <= maxDepth);
  const hidden = nodes.filter((n) => n.depth > maxDepth);

  // Assign each hidden node to the deepest claiming visible ancestor
  const descendantsByVisiblePath = new Map<string, RenderInsightNode[]>();
  for (const h of hidden) {
    let best: RenderInsightNode | undefined;
    for (const v of visible) {
      if (!isInsightDescendant(h, v)) continue;
      if (!best || v.depth > best.depth) {
        best = v;
      }
    }
    if (!best) continue;
    const list = descendantsByVisiblePath.get(best.pathKey) ?? [];
    list.push(h);
    descendantsByVisiblePath.set(best.pathKey, list);
  }

  return visible.map((v) => {
    const descendants = descendantsByVisiblePath.get(v.pathKey);
    if (!descendants || descendants.length === 0) {
      return { ...v };
    }
    return { ...v, aggregate: buildAggregate(descendants) };
  });
}
