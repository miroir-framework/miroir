import { JzodElement, JzodReference } from "@miroir-framework/jzod-ts";
import { JzodSchemaReferencesList } from "./JzodSchemaReferencesList";
import { Graph, alg } from "@dagrejs/graphlib";

export function jzodReferencesGraphConnectedComponents(
  elements: Record<string, JzodElement>,
  filter?: string[]
): string[][] | undefined {
  const graph = new Graph();
  for (const element of Object.entries(elements)) {
    const refs: JzodReference[] = JzodSchemaReferencesList(element[1]);
    if (!graph.hasNode(element[0])) {
      graph.setNode(element[0]);
    }
    // graph.setNode(element[0], element[0]);
    for (const ref of refs) {
      if (!ref.definition.relativePath) {
        throw new Error("Relative path not found in JzodReference: " + JSON.stringify(ref));
      }
      if (!filter || !filter.includes(ref.definition.relativePath)) {
        if (!graph.hasNode(ref.definition.relativePath)) {
          graph.setNode(ref.definition.relativePath);
        }
        graph.setEdge(element[0], ref.definition.relativePath);
      }
    }
  }

  return alg.components(graph);
}