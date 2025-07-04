import {
  JzodElement,
  JzodReference,
  JzodSchema,
  JzodUnion,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";

export interface JzodUnion_RecursivelyUnfold_ReturnTypeOK {
  status: "ok",
  result: JzodElement[],
  expandedReferences: Set<string>,
  discriminator?: (string | string[]) | undefined
}
export interface JzodUnion_RecursivelyUnfold_ReturnTypeError {
  status: "error",
  error: string,
  innerError?: JzodUnion_RecursivelyUnfold_ReturnTypeError,
}
export type JzodUnion_RecursivelyUnfold_ReturnType = JzodUnion_RecursivelyUnfold_ReturnTypeError | JzodUnion_RecursivelyUnfold_ReturnTypeOK;

// ################################################################################################
export const jzodUnion_recursivelyUnfold = (
  jzodUnion: JzodUnion,
  expandedReferences: Set<string>,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): JzodUnion_RecursivelyUnfold_ReturnType => {
  try {
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

    for (const r of resolvedReferences.filter(
      (a: JzodElement) => a.type != "union"
    ) as JzodElement[]) {
      result.push(r);
    }

    
    // treating unions
    const newExpandedReferences = new Set([
      ...expandedReferences,
      ...referencesToBeExplored.map((a: JzodReference) => a.definition.relativePath as string),
    ]);
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
      const subResult = jzodUnion_recursivelyUnfold(
        r as JzodUnion,
        newExpandedReferences,
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );
      
      if (subResult.status === "error") {
        return subResult;
      }
      
      // // the discriminators are stringified to compare them, since they can be arrays or strings
      // if (
      //   jzodUnion.discriminator &&
      //   subResult.discriminator &&
      //   JSON.stringify(jzodUnion.discriminator) !== JSON.stringify(subResult.discriminator)
      // ) {
      //   return {
      //     status: "error",
      //     error: `Discriminator mismatch: parent union discriminator (${jzodUnion.discriminator}) does not match sub-union discriminator (${subResult.discriminator})`,
      //   };
      // }

      for (const s of subResult.result) {
        result.push(s);
      }
      subResult.expandedReferences.forEach(ref => newExpandedReferences.add(ref));
    }
    
    return {
      status: "ok",
      result,
      expandedReferences: newExpandedReferences,
      discriminator: jzodUnion.discriminator,
    };
  } catch (error) {
    return {
      status: "error",
      // error: error instanceof Error ? error.message : String(error)
      error: `Error while recursively unfolding JzodUnion: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
