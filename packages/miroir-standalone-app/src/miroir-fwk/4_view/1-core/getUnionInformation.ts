import { JzodUnion, JzodUnion_RecursivelyUnfold_ReturnTypeOK, JzodElement } from "miroir-core";
import { getObjectUniondiscriminatorValuesFromResolvedSchema } from "../../../getObjectUniondiscriminatorValuesFromResolvedSchema";
import { UnionInformation } from "../components/JzodElementEditorInterface";

export function getUnionInformation(
  unfoldedRawSchema: JzodUnion,
  resolvedElementJzodSchema: JzodElement | undefined,
  recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnTypeOK | undefined
):
  | UnionInformation
  | undefined {
  const objectUniondiscriminatorValues = getObjectUniondiscriminatorValuesFromResolvedSchema(
    resolvedElementJzodSchema,
    unfoldedRawSchema,
    recursivelyUnfoldedRawSchema?.result ?? [],
    recursivelyUnfoldedRawSchema?.discriminator
  );
  return {
    unfoldedRawSchema: unfoldedRawSchema,
    resolvedElementJzodSchema: resolvedElementJzodSchema,
    objectBranches: recursivelyUnfoldedRawSchema?.result ?? [],
    discriminator: recursivelyUnfoldedRawSchema?.discriminator as string,
    discriminatorValues: objectUniondiscriminatorValues,
  };
}
