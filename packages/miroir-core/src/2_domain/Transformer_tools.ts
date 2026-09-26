import { MlElement, MlObject, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function substituteTransformerReferencesInJzodElement<T>(
  // mlElement: MlObject,
  mlElement: any,
  newReference: Record<string, string>,
): T {
  if (mlElement == null || mlElement == undefined) {
    return mlElement;
  }
  if (typeof mlElement == "object") {
    if (Array.isArray(mlElement)) {
      return mlElement.map((v) => substituteTransformerReferencesInJzodElement(v, newReference)) as T;
    }
    if (mlElement.type == "schemaReference") {
      return {
        ...mlElement,
        definition: {
          ...mlElement.definition,
          relativePath:
            Object.hasOwn(newReference, mlElement.definition.relativePath)
              ? newReference[mlElement.definition.relativePath]
              : mlElement.definition.relativePath,
        },
      };
    } else {
      return Object.fromEntries(
        Object.entries(mlElement).map(([key, value]) => {
          if (Array.isArray(value)) {
            return [
              key,
              value.map((v) => substituteTransformerReferencesInJzodElement(v, newReference)),
            ];
          } else if (typeof value === "object" && value !== null) {
            return [key, substituteTransformerReferencesInJzodElement(value, newReference)];
          } else {
            return [key, value];
          }
        })
      ) as T;
    }
  }
  return mlElement;
}

// ################################################################################################
/**
 * 
 * @param transformerDefinition - The transformer definition to convert to a MlElement.
 * @param target - The target environment to convert the transformer to.
 * @param referenceMap - A map of reference paths to the transformer definition.
 * @param optionalInterpolation - Whether to include the optional interpolation in the transformer definition.
 * @returns The transformer definition as a MlElement.
 */
export function transformerInterfaceFromDefinition(
  transformerDefinition: TransformerDefinition,
  target: "build" | "buildPlusRuntime" | "coreBuildPlusRuntime",
  referenceMap: Record<string, string> = {},
  optionalInterpolation: boolean = false
): MlElement {
  let relativePath
  let innerReferenceRelativePath:
    | "transformerForBuild"
    | "transformerForBuildPlusRuntime"
    | "coreTransformerForBuildPlusRuntime"
    | undefined = undefined;
  switch (target) {
  //   case "build": {
  //     innerReferenceRelativePath = "transformerForBuild";
  //     relativePath = optionalInterpolation
  //       ? "transformerForBuild_optional_Abstract"
  //       : "transformerForBuild_Abstract";
  //     break;
  //   }
    case "buildPlusRuntime":
      // innerReferenceRelativePath = "transformerForBuildPlusRuntime";
      // relativePath = "transformerForBuildPlusRuntime_optional_Abstract";
      // break;
    case "coreBuildPlusRuntime":
      innerReferenceRelativePath = "coreTransformerForBuildPlusRuntime";
      relativePath = "transformerForBuildPlusRuntime_optional_Abstract";
      break;
    default:
      throw new Error(`Unknown target: ${target}`);
  }

  const transformerParameterSchema = transformerDefinition.transformerInterface.transformerParameterSchema;
  const newApplyTo: MlElement = (// TODO: allow using a transformer in place of a value for applyTo
    transformerParameterSchema
      .transformerDefinition.definition as any
  ).applyTo?{
    type: "schemaReference",
    optional: true,
    definition: {
      relativePath: innerReferenceRelativePath,
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
    },
    context: {}
      // },
    // ],
  }: { type: "never"};

  const newDefinition = substituteTransformerReferencesInJzodElement<MlObject>(
    transformerParameterSchema.transformerDefinition,
    referenceMap
  ).definition;

  const result: MlElement = {
    type: "object",
    extend: transformerParameterSchema.transformerDefinition.extend
      ? [
          ...(Array.isArray(
            transformerParameterSchema
              .transformerDefinition.extend
          )
            ? transformerParameterSchema
                .transformerDefinition.extend
            : [
                transformerParameterSchema
                  .transformerDefinition.extend,
              ]),
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath
            },
            context: {},
          },
        ]
      : [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath,
            },
            context: {},
          },
        ],
    definition: (
      transformerParameterSchema
        .transformerDefinition.definition as any
    ).applyTo?{
      transformerType:
        transformerParameterSchema.transformerType,
      ...newDefinition,
      applyTo: newApplyTo,
    }:
    {
      transformerType:
        transformerParameterSchema.transformerType,
      ...newDefinition
    },
  };
  return result;
}
