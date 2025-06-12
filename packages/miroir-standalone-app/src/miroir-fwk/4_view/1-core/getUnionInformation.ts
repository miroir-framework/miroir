import { JzodUnion, JzodUnion_RecursivelyUnfold_ReturnTypeOK, JzodElement } from "miroir-core";
import { getObjectUniondiscriminatorValuesFromResolvedSchema } from "../../../getObjectUniondiscriminatorValuesFromResolvedSchema";

export function getUnionInformation(
  unfoldedRawSchema: JzodUnion,
  resolvedElementJzodSchema: JzodElement | undefined,
  recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnTypeOK | undefined
):
  | {
      jzodSchema: JzodUnion;
      objectBranches: JzodElement[];
      discriminator: string;
      discriminatorValues: string[];
    }
  | undefined {
  const objectUniondiscriminatorValues = getObjectUniondiscriminatorValuesFromResolvedSchema(
    resolvedElementJzodSchema,
    unfoldedRawSchema,
    recursivelyUnfoldedRawSchema?.result ?? [],
    recursivelyUnfoldedRawSchema?.discriminator
  );
  return {
    jzodSchema: unfoldedRawSchema,
    objectBranches: recursivelyUnfoldedRawSchema?.result ?? [],
    discriminator: recursivelyUnfoldedRawSchema?.discriminator as string,
    discriminatorValues: objectUniondiscriminatorValues,
  };
}
