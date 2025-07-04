import { MenuItem } from "@mui/material";
import { useFormikContext } from "formik";
import React, { useCallback, useMemo } from "react";


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
import { LabeledEditor, StyledSelect } from "./Style";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodLiteralEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

let JzodLiteralEditorRenderCount: number = 0;
export const JzodLiteralEditor = React.memo<JzodLiteralEditorProps>(function JzodLiteralEditorComponent(
  // props: JzodLiteralEditorProps
  {
    name,
    labelElement,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    currentDeploymentUuid,
    currentApplicationSection,
    unionInformation,
    resolvedElementJzodSchema, // handleSelectLiteralChange,
  }
) {
  JzodLiteralEditorRenderCount++;
  const context = useMiroirContextService();
  const currentModel: MetaModel = useCurrentModel(currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;

  const formik = useFormikContext<Record<string, any>>();
  
  // Check if this literal is a discriminator
  const isDiscriminator = useMemo(() => 
    unionInformation?.discriminator && 
    unionInformation?.discriminatorValues && 
    name === unionInformation?.discriminator,
    [unionInformation, name]
  );
  
  // ############################################################################################
  // uses setFormState to update the formik state (updating the parent value)
  const handleSelectLiteralChange = useCallback((event: any) => {
    // This literal is the discriminator of a discriminated union object.

    if (!unionInformation) {
      throw new Error(
        "handleSelectLiteralChange called but current object does not have information about the discriminated union type it must be part of!"
      );
    }
    if (!unionInformation.jzodSchema.discriminator) {
      throw new Error(
        "handleSelectLiteralChange called but current object does not have a discriminated union type!"
      );
    }

    const currentAttributeName = rootLessListKeyArray[rootLessListKeyArray.length - 1];

    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ handleSelectLiteralChange event",
      event.target.value,
      "rootLessListKey",
      rootLessListKey,
      "attribute",
      currentAttributeName,
      "name",
      name,
      "unionInformation",
      unionInformation,
      // JSON.stringify(unionInformation, null, 2),
      "formik.values",
      formik.values
    );

    const newJzodSchema: JzodElement | undefined = // attribute is either discriminator or sub-discriminator
      unionInformation.objectBranches.find(
        (a: JzodElement) =>
          a.type == "object" &&
          a.definition[(unionInformation as any).jzodSchema.discriminator].type == "literal" &&
          (a.definition[(unionInformation as any).jzodSchema.discriminator] as JzodLiteral)
            .definition == event.target.value
      );
    if (!newJzodSchema) {
      throw new Error(
        "handleSelectLiteralChange could not find union branch for discriminator " +
          unionInformation.discriminator +
          " in " +
          JSON.stringify(unionInformation.jzodSchema)
      );
    } else {
      log.info(
        "handleSelectLiteralChange found newJzodSchema",
        newJzodSchema,
        "for discriminator",
        unionInformation.discriminator,
        "value",
        event.target.value
      );
    }
    const newJzodSchemaWithOptional = unionInformation.jzodSchema.optional
      ? {
          ...newJzodSchema,
          optional: true,
        }
      : newJzodSchema;
    log.info("handleSelectLiteralChange newJzodSchemaWithOptional", newJzodSchemaWithOptional);

    const defaultValue = currentMiroirFundamentalJzodSchema
      ? getDefaultValueForJzodSchemaWithResolution(
          newJzodSchemaWithOptional,
          currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel
        )
      : undefined;
    log.info(
      "handleSelectLiteralChange defaultValue",
      defaultValue,
      "formik.values",
      JSON.stringify(formik.values, null, 2)
    );
    formik.setFieldValue(
      // replacing parent value (the object containing the discriminator Literal)
      rootLessListKeyArray.slice(0, rootLessListKeyArray.length - 1).join("."),
      defaultValue,
      false // do not validate on change
    );
  }, [
    unionInformation,
    rootLessListKeyArray,
    rootLessListKey,
    name,
    formik,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel
  ]);

  // Memoize discriminator values for better rendering performance
  const discriminatorMenuItems = useMemo(() => {
    if (isDiscriminator && unionInformation?.discriminatorValues) {
      return unionInformation.discriminatorValues.sort().map((v) => (
        <MenuItem key={v} value={v}>
          {v}
        </MenuItem>
      ));
    }
    return null;
  }, [isDiscriminator, unionInformation]);
  return LabeledEditor({
    labelElement: labelElement ?? <></>,
    editor: isDiscriminator ? (
      <>
        <StyledSelect
          id={rootLessListKey}
          label={name}
          variant="standard"
          labelId="demo-simple-select-label"
          {...formik.getFieldProps(rootLessListKey)}
          onChange={handleSelectLiteralChange}
        >
          {discriminatorMenuItems}
        </StyledSelect>
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
    ),
  });
  // return (
  //   <>
  //     {labelElement ?? <></>}
  //     {isDiscriminator ? (
  //       <>
  //         <StyledSelect
  //           id={rootLessListKey}
  //           label={name}
  //           variant="standard"
  //           labelId="demo-simple-select-label"
  //           {...formik.getFieldProps(rootLessListKey)}
  //           onChange={handleSelectLiteralChange}
  //         >
  //           {discriminatorMenuItems}
  //         </StyledSelect>
  //         (literal discriminator)
  //       </>
  //     ) : (
  //       <>
  //         <input
  //           type="text"
  //           id={rootLessListKey}
  //           name={rootLessListKey}
  //           form={"form." + name}
  //           value={formik.getFieldProps(rootLessListKey).value}
  //           readOnly
  //           disabled
  //         />
  //       </>
  //     )}
  //   </>
  // );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  return (
    prevProps.rootLessListKey === nextProps.rootLessListKey &&
    prevProps.name === nextProps.name &&
    prevProps.currentDeploymentUuid === nextProps.currentDeploymentUuid &&
    JSON.stringify(prevProps.unionInformation) === JSON.stringify(nextProps.unionInformation)
  );
});
