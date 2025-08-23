import { useFormikContext } from "formik";
import React, { FC, useCallback, useMemo, type Key } from "react";


import {
  adminConfigurationDeploymentMiroir,
  getDefaultValueForJzodSchemaWithResolution,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  JzodObject,
  jzodUnionResolvedTypeForObject,
  LoggerInterface,
  MetaModel,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resolvePathOnObject,
  type JzodSchema,
  type KeyMapEntry,
  type MiroirModelEnvironment,
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
  currentObjectValue: any,
  selectedValue: string,
  discriminatorType: "enum" | "literal" | "schemaReference",
  parentKeyMap: KeyMapEntry,
  rootLessListKey: string,
  rootLessListKeyArray: (string | number)[],
  // currentValuePath: (string | number)[],
  // currentTypePath: (string | number)[],
  currentDeploymentUuid: string | undefined,
  modelEnvironment: MiroirModelEnvironment,
  // currentMiroirFundamentalJzodSchema: any,
  // currentModel: MetaModel,
  // miroirMetaModel: MetaModel,
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
  // if (typeof parentKeyMap.discriminator !== "string") {
  //   throw new Error(
  //     "handleDiscriminatorChange called but current object does not have a string discriminator!"
  //   );
  // }
  let newJzodSchema: JzodElement | undefined = undefined;
  if (Array.isArray(parentKeyMap.discriminator)) {
    if (!parentKeyMap.recursivelyUnfoldedUnionSchema) {
      throw new Error(
        "handleDiscriminatorChange called but current object does not have a recursivelyUnfoldedUnionSchema, cannot proceed!"
      );
    }
    if (parentKeyMap.resolvedSchema.type !== "object") {
      throw new Error(
        "handleDiscriminatorChange called but current object is not of type object, cannot proceed!"
      );
    }
    // if (parentKeyMap.discriminator.length !== 1) {
    //   throw new Error(
    //     "handleDiscriminatorChange called but current object has multiple discriminators, which is not supported yet!"
    //   );
    // }
    // // for now we only support one discriminator per union
    // if (parentKeyMap.discriminatorValues.length !== 1) {
    //   throw new Error(
    //     "handleDiscriminatorChange called but current object has multiple discriminatorValues sets, which is not supported yet!"
    //   );
    // }
    // if (parentKeyMap.discriminatorValues[0].length === 0) {
    //   throw new Error(
    //     "handleDiscriminatorChange called but current object has no discriminatorValues, cannot proceed!"
    //   );
    // }
    const discriminator = parentKeyMap.discriminator[0];
    const discriminatorTypeLocal = parentKeyMap.resolvedSchema.definition[discriminator]?.type;
    if (!discriminatorTypeLocal) {
      throw new Error(
        `handleDiscriminatorChange could not find discriminator type for discriminator ${discriminator} in ${JSON.stringify(parentKeyMap.resolvedSchema)}`
      );
    }
    if (
      (discriminatorType === "literal" && discriminatorTypeLocal !== "literal") ||
      (discriminatorType === "enum" && discriminatorTypeLocal !== "enum") ||
      (discriminatorType === "schemaReference" && discriminatorTypeLocal !== "schemaReference")
    ) {
      throw new Error(
        `handleDiscriminatorChange discriminator type mismatch: expected ${discriminatorType} but found ${discriminatorTypeLocal} for discriminator ${discriminator} in ${JSON.stringify(parentKeyMap.resolvedSchema)}`
      );
    }
    const resolveUnionResult = jzodUnionResolvedTypeForObject(
      parentKeyMap.recursivelyUnfoldedUnionSchema.result,
      parentKeyMap.discriminator,
      currentObjectValue,
      parentKeyMap.valuePath,
      parentKeyMap.typePath,
      modelEnvironment,
      {}, // relativeReferenceJzodContext
    );

    if (resolveUnionResult.status === "error") {
      throw new Error(
        `handleDiscriminatorChange jzodUnionResolvedTypeForObject error: ${resolveUnionResult.error}`
      );
    }
    newJzodSchema = resolveUnionResult.resolvedJzodObjectSchema;
      // parentKeyMap.recursivelyUnfoldedUnionSchema?.result.find((a: JzodElement) => {
      //   if (a.type !== "object") return false;
      //   const discriminatorElement = a.definition[discriminator as string];
      //   if (!discriminatorElement) return false;
        
      //   if (discriminatorType === "literal" && discriminatorElement.type === "literal") {
      //     return (discriminatorElement as JzodLiteral).definition === selectedValue;
      //   } else if (discriminatorType === "enum" && discriminatorElement.type === "enum") {
      //     return (discriminatorElement as JzodEnum).definition.includes(selectedValue);
      //   } else if (discriminatorType === "schemaReference" && discriminatorElement.type === "schemaReference") {
      //     return (
      //       typeof discriminatorElement.definition === "object" &&
      //       discriminatorElement.definition.relativePath === selectedValue
      //     );
      //   } else {
      //     // fallback: try to match .definition directly if it exists, otherwise compare the element itself
      //     if (typeof discriminatorElement === "object" && "definition" in discriminatorElement) {
      //       return (discriminatorElement as any).definition === selectedValue;
      //     } else {
      //       return false; // unknown discriminator type, don't match
      //     }
      //   }
      // });
  } else {
    newJzodSchema =
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
  }


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

  const defaultValue = modelEnvironment
    ? getDefaultValueForJzodSchemaWithResolutionNonHook(
        newJzodSchemaWithOptional,
        formik.values,
        rootLessListKey,
        undefined,
        [],
        undefined,
        true,
        currentDeploymentUuid,
        modelEnvironment
        // {
        //   miroirFundamentalJzodSchema: currentMiroirFundamentalJzodSchema,
        //   currentModel,
        //   miroirMetaModel,
        // }
      )
    : undefined;

  const targetRootLessListKey = rootLessListKeyArray.slice(0, rootLessListKeyArray.length - 1).join(".")??"";
  // const targetRootLessListKey = rootLessListKey;
  log.info(
    `handleDiscriminatorChange (${discriminatorType})`,
    "targetRootLessListKey",
    targetRootLessListKey,
    "defaultValue",
    defaultValue,
    "formik.values",
    JSON.stringify(formik.values, null, 2)
  );
  if (targetRootLessListKey.length === 0) {
    // If the target key is empty, we set the value directly on formik.values
    formik.setValues(
      // ...formik.values,
      defaultValue,
    );
  } else {
    formik.setFieldValue(
      targetRootLessListKey,
      defaultValue,
      false
    );
  }
};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodLiteralEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
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

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      currentModel,
      miroirMetaModel: miroirMetaModel,
    };
  }, [context.miroirFundamentalJzodSchema, currentModel, miroirMetaModel]);

  const formik = useFormikContext<Record<string, any>>();

  const parentKey = rootLessListKey.includes('.') ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf('.')) : '';
  const parentKeyMap:KeyMapEntry | undefined = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
  const currentKeyMap: KeyMapEntry | undefined = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;

  // Check if this literal is a discriminator
  const isDiscriminator = 
    parentKeyMap?.discriminator && 
    parentKeyMap?.discriminatorValues;
  
  const discriminatorIndex: number = !parentKeyMap?.discriminator
    ? -1
    : typeof parentKeyMap?.discriminator == "string"
    ? 0
    : parentKeyMap?.discriminator?.findIndex((d: string) => d === name);
  if (isDiscriminator && discriminatorIndex === -1) {
    throw new Error(
      `JzodLiteralEditor: isDiscriminator is true but could not find discriminator index for name "${name}" in parentKeyMap.discriminator ${parentKeyMap?.discriminator}`
    );
  }

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
  const handleSelectLiteralChange = useCallback(
    (event: any) => {
      if (!isDiscriminator) {
        throw new Error(
          "handleSelectLiteralChange called but this literal is not a discriminator!"
        );
      }
      if (!parentKeyMap) {
        throw new Error(
          "handleSelectLiteralChange called but current object does not have information about the discriminated union type it must be part of!"
        );
      }
      handleDiscriminatorChange(
        currentValue, // object value
        event.target.value,
        "literal",
        parentKeyMap,
        rootLessListKey,
        rootLessListKeyArray,
        // currentKeyMap?.currentValuePath??[],
        // currentKeyMap?.currentTypePath??[],
        currentDeploymentUuid,
        currentMiroirModelEnvironment,
        formik,
        log
      );
    },
    [
      parentKeyMap,
      rootLessListKey,
      rootLessListKeyArray,
      currentDeploymentUuid,
      currentMiroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      formik,
    ]
  );

  // log.info(
  //   "JzodLiteralEditor render",
  //   JzodLiteralEditorRenderCount,
  //   "rootLessListKey",
  //   rootLessListKey,
  //   "currentKeyMap",
  //   currentKeyMap,
  // );
  const currentDiscriminatorValues = parentKeyMap?.discriminatorValues && discriminatorIndex !== -1
    ? parentKeyMap.discriminatorValues[discriminatorIndex]
    : [];
  log.info(
    "JzodLiteralEditor render",
    JzodLiteralEditorRenderCount,
    "rootLessListKey",
    rootLessListKey,
    "parentKeyMap?.discriminator",
    parentKeyMap?.discriminator,
    "parentKeyMap?.discriminatorValues",
    parentKeyMap?.discriminatorValues,
    "currentDiscriminatorValues",
    currentDiscriminatorValues,
  );
  // Memoize discriminator values for better rendering performance
  const discriminatorMenuItems = useMemo(() => {
    if (isDiscriminator && parentKeyMap?.discriminatorValues) {
      // return parentKeyMap.discriminatorValues[discriminatorIndex].sort().map((v) => (
      return currentDiscriminatorValues.sort().map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ));
    }
    return null;
  }, [isDiscriminator, currentKeyMap]);
  log.info(
    "JzodLiteralEditor render",
    JzodLiteralEditorRenderCount,
    "rootLessListKey",
    rootLessListKey,
    readOnly ? "readOnly" : "editable",
    isDiscriminator ? "discriminator" : "not discriminator",
    "currentValue",
    currentValue,
    "parentKeyMap.discriminator",
    parentKeyMap?.discriminator,
    "parentKeyMap.discriminatorValues",
    parentKeyMap?.discriminatorValues,
  );
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
