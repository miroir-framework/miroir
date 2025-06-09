import {
  JzodElement,
  JzodReference,
  JzodSchema,
  JzodUnion,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";

// ################################################################################################
export const jzodUnion_recursivelyUnfold = (
  jzodUnion: JzodUnion,
  expandedReferences: Set<string>,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): ({
  result: JzodElement[],
  expandedReferences: Set<string>,
}) => {
  // TODO: handle case when resolved reference is itself a reference
  // TODO: handle case when resolved reference is itself union with references (is that done?)

  let result: JzodElement[] = jzodUnion.definition
  .filter((a: JzodElement) => a.type != "schemaReference" && a.type != "union");

  // treating references
  const referencesToBeExplored: JzodReference[] = jzodUnion.definition
  .filter((a: JzodElement) => a.type == "schemaReference")
  .filter((a => !expandedReferences.has(a.definition.relativePath as any)))
  ;
  const resolvedReferences: JzodElement[] = referencesToBeExplored.map((a: JzodReference) =>
    resolveJzodSchemaReferenceInContext(
      miroirFundamentalJzodSchema,
      a,
      currentModel,
      miroirMetaModel,
      { ...relativeReferenceJzodContext, ...a.context }
    )
  );

  for (const r of resolvedReferences.filter((a: JzodElement) => a.type != "union") as JzodElement[]) {
    result.push(r);
  }

  
  // treating unions
  const newExpandedReferences = new Set(referencesToBeExplored.map((a: JzodReference) => a.definition.relativePath as string));
  const unionsToBeExplored: JzodUnion[] = [
    ...jzodUnion.definition.filter((a: JzodElement) => a.type == "union") as JzodUnion[],
    ...resolvedReferences.filter((a: JzodElement) => a.type == "union") as JzodUnion[]];

  // log.info(
  //   "recursivelyUnfoldUnionAndReferences called for union",
  //   jzodUnion,
  //   "found references to be explored",
  //   referencesToBeExplored,
  //   "resolvedReferences",
  //   resolvedReferences,
  //   "unionsToBeExplored",
  //   unionsToBeExplored,
  // );
  for (const r of unionsToBeExplored) {
    const {result: subResult, expandedReferences: subExpandedReferences} = jzodUnion_recursivelyUnfold(
      r as JzodUnion,
      newExpandedReferences,
      miroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      relativeReferenceJzodContext
    );
    for (const s of subResult) {
      result.push(s);
    }
    subExpandedReferences.forEach(ref => newExpandedReferences.add(ref));
  }
  return {
    result,
    expandedReferences: newExpandedReferences,
  }
}
