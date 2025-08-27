import {
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  LoggerInterface,
  MetaModel,
} from "miroir-core";

// Common function to handle discriminator changes
export const handleDiscriminatorChange = (
  selectedValue: string,
  discriminatorType: "enum" | "literal" | "schemaReference",
  parentKeyMap: any,
  rootLessListKey: string,
  rootLessListKeyArray: (string | number)[],
  currentDeploymentUuid: string | undefined,
  currentMiroirFundamentalJzodSchema: any,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  formik: any,
  log: LoggerInterface
) => {
  if (!parentKeyMap) {
    throw new Error(
      "handleDiscriminatorChange called but current object does not have information about the discriminated union type it must be part of!"
    );
  }
  if (!parentKeyMap.discriminator) {
    throw new Error(
      "handleDiscriminatorChange called but current object does not have a discriminated union type!"
    );
  }
  if (typeof parentKeyMap.discriminator !== "string") {
    throw new Error(
      "handleDiscriminatorChange called but current object does not have a string discriminator!"
    );
  }

  const newJzodSchema: JzodElement | undefined =
    parentKeyMap.recursivelyUnfoldedUnionSchema?.result.find((a: JzodElement) => {
      if (a.type !== "object") return false;
      const discriminatorElement = a.definition[parentKeyMap.discriminator as string];
      if (!discriminatorElement) return false;
      
      if (discriminatorType === "literal" && discriminatorElement.type === "literal") {
        return (discriminatorElement as JzodLiteral).definition === selectedValue;
      } else if (discriminatorType === "enum" && discriminatorElement.type === "enum") {
        return (discriminatorElement as JzodEnum).definition.includes(selectedValue);
      } else if (discriminatorType === "schemaReference" && discriminatorElement.type === "schemaReference") {
        return (
          typeof discriminatorElement.definition === "object" &&
          discriminatorElement.definition.relativePath === selectedValue
        );
      } else {
        // fallback: try to match .definition directly if it exists, otherwise compare the element itself
        if (typeof discriminatorElement === "object" && "definition" in discriminatorElement) {
          return (discriminatorElement as any).definition === selectedValue;
        } else {
          return false; // unknown discriminator type, don't match
        }
      }
    });

  if (!newJzodSchema) {
    throw new Error(
      `handleDiscriminatorChange could not find union branch for discriminator ${parentKeyMap.discriminator} with value ${selectedValue} in ${JSON.stringify(parentKeyMap.resolvedSchema)}`
    );
  }

  const newJzodSchemaWithOptional = parentKeyMap.rawSchema.optional
    ? {
        ...newJzodSchema,
        optional: true,
      }
    : newJzodSchema;

  const defaultValue = currentMiroirFundamentalJzodSchema
    ? getDefaultValueForJzodSchemaWithResolutionNonHook(
        newJzodSchemaWithOptional,
        formik.values,
        rootLessListKey,
        undefined,
        [],
        undefined,
        true,
        currentDeploymentUuid,
        {
          miroirFundamentalJzodSchema: currentMiroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel,
        }
      )
    : undefined;

  log.info(
    `handleDiscriminatorChange (${discriminatorType}) defaultValue`,
    defaultValue,
    "formik.values",
    JSON.stringify(formik.values, null, 2)
  );

  formik.setFieldValue(
    rootLessListKeyArray.slice(0, rootLessListKeyArray.length - 1).join("."),
    defaultValue,
    false
  );
};
