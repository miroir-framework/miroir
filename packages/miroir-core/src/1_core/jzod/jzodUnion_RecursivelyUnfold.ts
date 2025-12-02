// import type { JzodUnion_RecursivelyUnfold_ReturnType } from "../../0_interfaces/1_core/jzodUnion_RecursivelyUnfoldInterface";
import type {
  JzodElement,
  JzodReference,
  JzodUnion,
  JzodUnion_RecursivelyUnfold_ReturnType
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";

// ################################################################################################
export const jzodUnion_recursivelyUnfold = <T extends MiroirModelEnvironment>(
  jzodUnion: JzodUnion,
  expandedReferences: Set<string>,
  modelEnvironment: T,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): JzodUnion_RecursivelyUnfold_ReturnType => {
  try {
    // TODO: handle case when resolved reference is itself a reference
    // TODO: handle case when resolved reference is itself union with references (is that done?)

    let result: JzodElement[] = jzodUnion.definition.filter(
      (a: JzodElement) => a.type != "schemaReference" && a.type != "union"
    );

    // treating references
    const referencesToBeExplored: JzodReference[] = jzodUnion.definition
      .filter((a: JzodElement) => a.type == "schemaReference")
      .filter((a: any) => !expandedReferences.has(a.definition.relativePath as any)) as any[];
    const resolvedReferences: JzodElement[] = referencesToBeExplored.map((a: JzodReference) =>
      resolveJzodSchemaReferenceInContext(
        a,
        { ...relativeReferenceJzodContext, ...a.context },
        modelEnvironment
        // miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
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
      ...(jzodUnion.definition.filter((a: JzodElement) => a.type == "union") as JzodUnion[]),
      ...(resolvedReferences.filter((a: JzodElement) => a.type == "union") as JzodUnion[]),
    ];

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
        modelEnvironment,
        // miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
        relativeReferenceJzodContext
      );

      if (subResult.status === "error") {
        return subResult;
      }

      for (const s of subResult.result) {
        result.push(s);
      }
      subResult.expandedReferences.forEach((ref) => newExpandedReferences.add(ref));
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
      error: `Error while recursively unfolding JzodUnion: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};
