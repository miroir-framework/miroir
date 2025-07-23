import {
  JzodUnion,
  JzodUnion_RecursivelyUnfold_ReturnTypeOK,
  JzodElement,
  getObjectUniondiscriminatorValuesFromResolvedSchema,
} from "miroir-core";
// import { getObjectUniondiscriminatorValuesFromResolvedSchema } from "miroir-core/src/1_core/jzod/getObjectUniondiscriminatorValuesFromResolvedSchema";
import { UnionInformation } from "../components/JzodElementEditorInterface";

export function getUnionInformation(
  unfoldedRawSchema: JzodUnion,
  resolvedElementJzodSchema: JzodElement | undefined,
  recursivelyUnfoldedUnionSchema: JzodUnion_RecursivelyUnfold_ReturnTypeOK | undefined
): UnionInformation | undefined {
  const objectUniondiscriminatorValues = getObjectUniondiscriminatorValuesFromResolvedSchema(
    resolvedElementJzodSchema,
    unfoldedRawSchema,
    recursivelyUnfoldedUnionSchema?.result ?? []
    // recursivelyUnfoldedUnionSchema?.discriminator
  );
  return {
    unfoldedRawSchema: unfoldedRawSchema,
    resolvedElementJzodSchema: resolvedElementJzodSchema,
    objectBranches: recursivelyUnfoldedUnionSchema?.result ?? [],
    discriminator: recursivelyUnfoldedUnionSchema?.discriminator as string,
    discriminatorValues: objectUniondiscriminatorValues,
  };
}
