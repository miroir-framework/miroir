import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function transformerInterfaceFromDefinition(
  transformerDefinition: TransformerDefinition,
  target: "build" | "runtime"
): JzodElement {
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
    definition: {
      transformerType:
        transformerDefinition.transformerInterface.transformerParameterSchema.transformerType,
      ...transformerDefinition.transformerInterface.transformerParameterSchema.transformerDefinition
        .definition,
      applyTo: {
        type: "union",
        discriminator: "referenceType",
        definition: [
          (
            transformerDefinition.transformerInterface.transformerParameterSchema
              .transformerDefinition.definition as any
          ).applyTo,
          {
            type: "schemaReference",
            definition: {
              relativePath: "transformer_inner_referenced_extractor",
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            },
            context: {},
          },
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
      },
    },
  };
  return result;
}
