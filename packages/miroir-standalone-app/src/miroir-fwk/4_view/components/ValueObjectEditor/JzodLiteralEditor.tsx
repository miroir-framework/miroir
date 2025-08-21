import { useFormikContext } from "formik";
import React, { FC, useCallback, useMemo } from "react";


import {
  adminConfigurationDeploymentMiroir,
  getDefaultValueForJzodSchemaWithResolution,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  resolvePathOnObject,
} from "miroir-core";

import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useMiroirContextService } from "../../MiroirContextReactProvider";
import { useCurrentModel } from "../../ReduxHooks";
import { JzodLiteralEditorProps } from "./JzodElementEditorInterface";
import { 
  ThemedLabeledEditor, 
  ThemedSelect,
  ThemedDisplayValue
} from "../Themes/ThemedComponents";

// Common function to handle discriminator changes
const handleDiscriminatorChange = (
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

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodLiteralEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

let JzodLiteralEditorRenderCount: number = 0;
export const JzodLiteralEditor: FC<JzodLiteralEditorProps> =  (
  {
    name,
    labelElement,
    rootLessListKey,
    rootLessListKeyArray,
    currentDeploymentUuid,
    typeCheckKeyMap,
    readOnly,
  }
) => {
  JzodLiteralEditorRenderCount++;
  const context = useMiroirContextService();
  const currentModel: MetaModel = useCurrentModel(currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;

  const formik = useFormikContext<Record<string, any>>();

  const parentKey = rootLessListKey.includes('.') ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf('.')) : '';
  const parentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
  const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;

  // Check if this literal is a discriminator
  const isDiscriminator = 
    parentKeyMap?.discriminator && 
    parentKeyMap?.discriminatorValues && 
    name === parentKeyMap?.discriminator;
  
  // const currentValue = formik.getFieldProps(rootLessListKey).value;
    const currentValue = useMemo(() => {
      try {
        return rootLessListKeyArray.length > 0
          ? resolvePathOnObject(formik.values, rootLessListKeyArray)
          : formik.values;
      } catch (e) {
        log.warn(
          "JzodLiteralEditor resolvePathOnObject error",
          "rootLessListKeyArray",
          rootLessListKeyArray,
          "JzodLiteralEditorRenderCount",
          JzodLiteralEditorRenderCount,
          "formik.values",
          formik.values,
          "error",
          e
        );
        return formik.values; // fallback to formik.values if the path resolution fails
      }
    }, [formik.values, rootLessListKeyArray]);
  
  // ############################################################################################
  // uses setFormState to update the formik state (updating the parent value)
  const handleSelectLiteralChange = useCallback((event: any) => {
    handleDiscriminatorChange(
      event.target.value,
      "literal",
      parentKeyMap,
      rootLessListKey,
      rootLessListKeyArray,
      currentDeploymentUuid,
      currentMiroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      formik,
      log
    );
  }, [parentKeyMap, rootLessListKey, rootLessListKeyArray, currentDeploymentUuid, currentMiroirFundamentalJzodSchema, currentModel, miroirMetaModel, formik]);

  // log.info(
  //   "JzodLiteralEditor render",
  //   JzodLiteralEditorRenderCount,
  //   "rootLessListKey",
  //   rootLessListKey,
  //   "currentKeyMap",
  //   currentKeyMap,
  // );
  // Memoize discriminator values for better rendering performance
  const discriminatorMenuItems = useMemo(() => {
    if (isDiscriminator && parentKeyMap?.discriminatorValues) {
      return parentKeyMap.discriminatorValues.sort().map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ));
    }
    return null;
  }, [isDiscriminator, currentKeyMap]);
  return (
    <ThemedLabeledEditor
      labelElement={labelElement ?? <></>}
      editor={
        readOnly ? (
          <ThemedDisplayValue 
            value={currentValue} 
            type="literal" 
          />
        ) : isDiscriminator ? (
          <>
            <ThemedSelect
              id={rootLessListKey}
              label={name}
              variant="standard"
              {...formik.getFieldProps(rootLessListKey)}
              onChange={handleSelectLiteralChange}
            >
              {discriminatorMenuItems}
            </ThemedSelect>
            (literal discriminator)
          </>
        ) : (
          <>
            <input
              type="text"
              id={rootLessListKey}
              name={rootLessListKey}
              form={"form." + name}
              value={formik.getFieldProps(rootLessListKey).value}
              readOnly
              disabled
            />
          </>
        )
      }
    />
  );
}
