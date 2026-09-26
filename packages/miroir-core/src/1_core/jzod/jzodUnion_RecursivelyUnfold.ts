// import type { JzodUnion_RecursivelyUnfold_ReturnType } from "../../0_interfaces/1_core/jzodUnion_RecursivelyUnfoldInterface";
import type {
  MlElement,
  MlReference,
  MlUnion,
  JzodUnion_RecursivelyUnfold_ReturnType
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import { recursiveResolveJzodSchemaReferenceInContext, resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";

// ################################################################################################
export const jzodUnion_recursivelyUnfold = <T extends MiroirModelEnvironment>(
  mlUnion: MlUnion,
  expandedReferences: Set<string>,
  modelEnvironment: T,
  relativeReferenceJzodContext: { [k: string]: MlElement }
): JzodUnion_RecursivelyUnfold_ReturnType => {
  try {
    // TODO: handle case when resolved reference is itself a reference
    // TODO: handle case when resolved reference is itself union with references (is that done?)

    let result: MlElement[] = mlUnion.definition.filter(
      (a: MlElement) => a.type != "schemaReference" && a.type != "union"
    );

    // treating references
    const referencesToBeExplored: MlReference[] = mlUnion.definition
      .filter((a: MlElement) => a.type == "schemaReference")
      .filter((a: any) => !expandedReferences.has(a.definition.relativePath as any)) as any[];
    const resolvedReferences: MlElement[] = referencesToBeExplored.map((a: MlReference) =>
      recursiveResolveJzodSchemaReferenceInContext(
        a,
        { ...relativeReferenceJzodContext, ...a.context },
        modelEnvironment
      )
    );

    for (const r of resolvedReferences.filter(
      (a: MlElement) => a.type != "union"
    ) as MlElement[]) {
      result.push(r);
    }

    // treating unions
    const newExpandedReferences = new Set([
      ...expandedReferences,
      ...referencesToBeExplored.map((a: MlReference) => a.definition.relativePath as string),
    ]);
    const unionsToBeExplored: MlUnion[] = [
      ...(mlUnion.definition.filter((a: MlElement) => a.type == "union") as MlUnion[]),
      ...(resolvedReferences.filter((a: MlElement) => a.type == "union") as MlUnion[]),
    ];

    // log.info(
    //   "recursivelyUnfoldUnionAndReferences called for union",
    //   mlUnion,
    //   "found references to be explored",
    //   referencesToBeExplored,
    //   "resolvedReferences",
    //   resolvedReferences,
    //   "unionsToBeExplored",
    //   unionsToBeExplored,
    // );
    for (const r of unionsToBeExplored) {
      const subResult = jzodUnion_recursivelyUnfold(
        r as MlUnion,
        newExpandedReferences,
        modelEnvironment,
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
      ...(mlUnion.discriminator?{discriminator: mlUnion.discriminator}: {}),
    };
  } catch (error) {
    return {
      status: "error",
      // error: error instanceof Error ? error.message : String(error)
      error: `Error while recursively unfolding MlUnion: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};
