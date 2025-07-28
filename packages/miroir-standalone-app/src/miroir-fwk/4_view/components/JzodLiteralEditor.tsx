import { useFormikContext } from "formik";
import React, { FC, useCallback, useMemo } from "react";


import {
  adminConfigurationDeploymentMiroir,
  getDefaultValueForJzodSchemaWithResolution,
  JzodElement,
  JzodLiteral,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
} from "miroir-core";

import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { useMiroirContextService } from "../MiroirContextReactProvider";
import { useCurrentModel } from "../ReduxHooks";
import { JzodLiteralEditorProps } from "./JzodElementEditorInterface";
import { 
  ThemedLabeledEditor, 
  ThemedSelect
} from "./ThemedComponents";

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
  
  // ############################################################################################
  // uses setFormState to update the formik state (updating the parent value)
  const handleSelectLiteralChange = useCallback((event: any) => {
    // This literal is the discriminator of a discriminated union object.

    if (!parentKeyMap) {
      throw new Error(
        "handleSelectLiteralChange called but current object does not have information about the discriminated union type it must be part of!"
      );
    }
    if (!parentKeyMap.discriminator) {
      throw new Error(
        "handleSelectLiteralChange called but current object does not have a discriminated union type!"
      );
    }

    const currentAttributeName = rootLessListKeyArray[rootLessListKeyArray.length - 1];

    // log.info(
    //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ handleSelectLiteralChange event",
    //   event.target.value,
    //   "rootLessListKey",
    //   rootLessListKey,
    //   "attribute",
    //   currentAttributeName,
    //   "name",
    //   name,
    //   "formik.values",
    //   formik.values,
    //   "currentKeyMap",
    //   currentKeyMap
    // );
    if (typeof parentKeyMap.discriminator !== "string") {
      throw new Error(
        "handleSelectLiteralChange called but current object does not have a string discriminator!"
      );
    }
    // TODO: handle array discriminators
    if (!parentKeyMap.discriminator || typeof parentKeyMap.discriminator !== "string") {
      throw new Error(
        "handleSelectLiteralChange called but parentKeyMap.discriminator is not a string!"
      );
    }

    const newJzodSchema: JzodElement | undefined = // attribute is either discriminator or sub-discriminator
      parentKeyMap.recursivelyUnfoldedUnionSchema?.result.find(
        (a: JzodElement) =>
          a.type == "object" &&
          a.definition[parentKeyMap.discriminator as string].type == "literal" &&
          (a.definition[parentKeyMap.discriminator as string] as JzodLiteral)
            .definition == event.target.value
      );
    if (!newJzodSchema) {
      throw new Error(
        "handleSelectLiteralChange could not find union branch for discriminator " +
          (parentKeyMap.discriminator as string) +
          " in " +
          JSON.stringify(parentKeyMap.resolvedSchema)
      );
    } else {
      // log.info(
      //   "handleSelectLiteralChange found newJzodSchema",
      //   newJzodSchema,
      //   "for discriminator",
      //   parentKeyMap.discriminator,
      //   "value",
      //   event.target.value
      // );
    }
    const newJzodSchemaWithOptional = parentKeyMap.rawSchema.optional
      ? {
          ...newJzodSchema,
          optional: true,
        }
      : newJzodSchema;
    // log.info("handleSelectLiteralChange newJzodSchemaWithOptional", newJzodSchemaWithOptional);

    const defaultValue = currentMiroirFundamentalJzodSchema
      ? getDefaultValueForJzodSchemaWithResolution(
          newJzodSchemaWithOptional,
          true, // force optional attributes to receive a default value
          currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel
        )
      : undefined;
    // log.info(
    //   "handleSelectLiteralChange defaultValue",
    //   defaultValue,
    //   "formik.values",
    //   JSON.stringify(formik.values, null, 2)
    // );
    formik.setFieldValue(
      // replacing parent value (the object containing the discriminator Literal)
      rootLessListKeyArray.slice(0, rootLessListKeyArray.length - 1).join("."),
      defaultValue,
      false // do not validate on change
    );
  }, [
    rootLessListKeyArray,
    rootLessListKey,
    name,
    formik,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel
  ]);

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
        isDiscriminator ? (
          <>
            <ThemedSelect
              id={rootLessListKey}
              label={name}
              variant="standard"
              labelId="demo-simple-select-label"
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
