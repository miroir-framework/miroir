import { JzodElement, JzodObject, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function substituteTransformerReferencesInJzodElement<T>(
  jzodElement: any,
  // jzodElement: JzodObject,
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

export function transformerInterfaceFromDefinition(
  transformerDefinition: TransformerDefinition,
  target: "build" | "runtime",
  referenceMap: Record<string, string> = {},
): JzodElement {
  const newApplyTo: JzodElement = (
    transformerDefinition.transformerInterface.transformerParameterSchema
      .transformerDefinition.definition as any
  ).applyTo?{
    type: "union",
    discriminator: "referenceType",
    definition: [
      (
        transformerDefinition.transformerInterface.transformerParameterSchema
          .transformerDefinition.definition as any
      ).applyTo,
      // {
      //   type: "schemaReference",
      //   definition: {
      //     relativePath: "transformer_inner_referenced_extractor",
      //     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //   },
      //   context: {},
      // },
      {
        type: "schemaReference",
        definition: {
          relativePath:
            target == "runtime"
              ? "transformer_inner_referenced_transformerForRuntime"
              : "transformer_inner_referenced_transformerForBuild",
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        },
        context: {},
      },
    ],
  }: { type: "never"};

  const newDefinition = substituteTransformerReferencesInJzodElement<JzodObject>(
    transformerDefinition.transformerInterface.transformerParameterSchema.transformerDefinition,
    referenceMap
    // target == "runtime"
    //   ? {
    //       transformer: "transformerForRuntime",
    //       transformer_InnerReference: "transformerForRuntime_InnerReference",
    //       transformer_freeObjectTemplate: "transformerForRuntime_freeObjectTemplate"
    //     }
    //   : {
    //       transformer: "transformerForBuild",
    //       transformer_InnerReference: "transformerForBuild_InnerReference",
    //       transformer_freeObjectTemplate: "transformerForBuild_freeObjectTemplate"
    //     }
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
              relativePath:
                target == "runtime"
                  ? "transformerForRuntime_Abstract"
                  : "transformerForBuild_Abstract",
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
              relativePath:
                target == "runtime"
                  ? "transformerForRuntime_Abstract"
                  : "transformerForBuild_Abstract",
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
