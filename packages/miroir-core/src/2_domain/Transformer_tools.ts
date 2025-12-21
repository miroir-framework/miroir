import { JzodElement, JzodObject, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function substituteTransformerReferencesInJzodElement<T>(
  // jzodElement: JzodObject,
  jzodElement: any,
  newReference: Record<string, string>,
): T {
  if (jzodElement == null || jzodElement == undefined) {
    return jzodElement;
  }
  if (typeof jzodElement == "object") {
    if (Array.isArray(jzodElement)) {
      return jzodElement.map((v) => substituteTransformerReferencesInJzodElement(v, newReference)) as T;
    }
    if (jzodElement.type == "schemaReference") {
      return {
        ...jzodElement,
        definition: {
          ...jzodElement.definition,
          relativePath:
            Object.hasOwn(newReference, jzodElement.definition.relativePath)
              ? newReference[jzodElement.definition.relativePath]
              : jzodElement.definition.relativePath,
        },
      };
    } else {
      return Object.fromEntries(
        Object.entries(jzodElement).map(([key, value]) => {
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
  return jzodElement;
}

// ################################################################################################
export function transformerInterfaceFromDefinition(
  transformerDefinition: TransformerDefinition,
  target: "build" | "buildPlusRuntime",
  referenceMap: Record<string, string> = {},
  optionalInterpolation: boolean = false
): JzodElement {
  let relativePath
  let innerReferenceRelativePath:
    | "transformerForBuild"
    | "transformerForBuildPlusRuntime"
    | undefined = undefined;
  switch (target) {
    case "build": {
      innerReferenceRelativePath = "transformerForBuild";
      relativePath = optionalInterpolation
        ? "transformerForBuild_optional_Abstract"
        : "transformerForBuild_Abstract";
      break;
    }
    case "buildPlusRuntime":
      innerReferenceRelativePath = "transformerForBuildPlusRuntime";
      relativePath = "transformerForBuildPlusRuntime_optional_Abstract";
      break;
    default:
      throw new Error(`Unknown target: ${target}`);
  }

  const newApplyTo: JzodElement = (// allow using a transformer in place of a value for applyTo
    transformerDefinition.transformerInterface.transformerParameterSchema
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

  const newDefinition = substituteTransformerReferencesInJzodElement<JzodObject>(
    transformerDefinition.transformerInterface.transformerParameterSchema.transformerDefinition,
    referenceMap
  ).definition;

  const result: JzodElement = {
    type: "object",
    extend: transformerDefinition.transformerInterface.transformerParameterSchema
      .transformerDefinition.extend
      ? [
          ...(Array.isArray(
            transformerDefinition.transformerInterface.transformerParameterSchema
              .transformerDefinition.extend
          )
            ? transformerDefinition.transformerInterface.transformerParameterSchema
                .transformerDefinition.extend
            : [
                transformerDefinition.transformerInterface.transformerParameterSchema
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
      transformerDefinition.transformerInterface.transformerParameterSchema
        .transformerDefinition.definition as any
    ).applyTo?{
      transformerType:
        transformerDefinition.transformerInterface.transformerParameterSchema.transformerType,
      ...newDefinition,
      applyTo: newApplyTo,
    }:
    {
      transformerType:
        transformerDefinition.transformerInterface.transformerParameterSchema.transformerType,
      ...newDefinition
    },
  };
  return result;
}
