import {
  adminConfigurationDeploymentMiroir,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  resolvePathOnObject,
  miroirFundamentalJzodSchema,
  JzodSchema,
  MiroirModelEnvironment,
  jzodUnionResolvedTypeForObject,
  KeyMapEntry
} from "miroir-core";
import React, { FC, useMemo, useCallback } from "react";
import { useFormikContext } from "formik";
import { useMiroirContextService } from "../../MiroirContextReactProvider";
import { useCurrentModel } from "../../ReduxHooks";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { 
  ThemedSelect,
  ThemedLabeledEditor,
  ThemedDisplayValue
} from "../Themes/index"
import { JzodEnumEditorProps } from "./JzodElementEditorInterface";

// Common function to handle discriminator changes
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodEnumEditor"), "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// Common function to handle discriminator changes
const handleDiscriminatorChange = (
  selectedValue: string,
  discriminatorType: "enum" | "literal" | "schemaReference",
  parentKeyMap: KeyMapEntry,
  rootLessListKey: string,
  rootLessListKeyArray: (string | number)[],
  currentDeploymentUuid: string | undefined,
  modelEnvironment: MiroirModelEnvironment,
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
    const discriminator = parentKeyMap.discriminator[0];
    const discriminatorTypeLocal = parentKeyMap.resolvedSchema.definition[discriminator]?.type;
    if (!discriminatorTypeLocal) {
      throw new Error(
        `handleDiscriminatorChange could not find discriminator type for discriminator ${discriminator} in ${JSON.stringify(parentKeyMap.resolvedSchema)}`
      );
    }
    const newParentValue = {
      ...resolvePathOnObject(formik.values, parentKeyMap.valuePath),
      [rootLessListKeyArray[rootLessListKeyArray.length - 1]]: selectedValue,
    };
    log.info(
      "handleDiscriminatorChange newParentValue",
      newParentValue,
      "parentKeyMap",
      parentKeyMap,
      rootLessListKeyArray[rootLessListKeyArray.length - 1],
      "selectedValue",
      selectedValue
    );
    const resolveUnionResult = jzodUnionResolvedTypeForObject(
      parentKeyMap.recursivelyUnfoldedUnionSchema.result,
      parentKeyMap.discriminator,
      newParentValue,
      parentKeyMap.valuePath,
      parentKeyMap.typePath,
      modelEnvironment,
      {}, // relativeReferenceJzodContext
    );

    log.info(
      `handleDiscriminatorChange (${discriminatorType}) jzodUnionResolvedTypeForObject result`,
      resolveUnionResult,
    );
    if (resolveUnionResult.status === "error") {
      throw new Error(
        `handleDiscriminatorChange jzodUnionResolvedTypeForObject error: ${resolveUnionResult.error}`
      );
    }
    newJzodSchema = resolveUnionResult.resolvedJzodObjectSchema;
  } else {
    newJzodSchema =
      parentKeyMap.recursivelyUnfoldedUnionSchema?.result.find((a: JzodElement) => {
        if (a.type !== "object") return false;
        const discriminatorElement = a.definition[parentKeyMap.discriminator as string];
        if (!discriminatorElement) return false;
        
        if (discriminatorElement.type === "literal") {
          return (discriminatorElement as JzodLiteral).definition === selectedValue;
        } else if (discriminatorElement.type === "enum") {
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

  log.info(`handleDiscriminatorChange (${discriminatorType})`, "newJzodSchema", JSON.stringify(newJzodSchema, null, 2));
  const defaultValue = modelEnvironment
    ? {
      ...getDefaultValueForJzodSchemaWithResolutionNonHook(
        "build",
        newJzodSchemaWithOptional,
        formik.values,
        rootLessListKey,
        undefined,
        [],
        undefined,
        true,
        currentDeploymentUuid,
        modelEnvironment
      ),
      [Array.isArray(parentKeyMap.discriminator) ? parentKeyMap.discriminator[0] : parentKeyMap.discriminator]: selectedValue,
    }
    : undefined;

  const targetRootLessListKey = rootLessListKeyArray.slice(0, rootLessListKeyArray.length - 1).join(".")??"";
  log.info(
    `handleDiscriminatorChange (${discriminatorType})`,
    "targetRootLessListKey",
    targetRootLessListKey,
    "defaultValue",
    JSON.stringify(defaultValue, null, 2),
    "formik.values",
    // JSON.stringify(formik.values, null, 2)
    formik.values
  );
  if (targetRootLessListKey.length === 0) {
    // If the target key is empty, we set the value directly on formik.values
    formik.setValues(
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

export const JzodEnumEditor: FC<JzodEnumEditorProps> = ({
  name,
  labelElement,
  // rawJzodSchema,
  listKey,
  rootLessListKey,
  rootLessListKeyArray,
  forceTestingMode,
  typeCheckKeyMap,
  currentDeploymentUuid,
  readOnly,
}: JzodEnumEditorProps) => {
  // const currentValue = resolvePathOnObject(props.formik.values, props.rootLessListKeyArray);

  const formik = useFormikContext<Record<string, any>>();
  const context = useMiroirContextService();
  const currentModel = useCurrentModel(currentDeploymentUuid);
  const miroirMetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;

  const parentKey = rootLessListKey.includes(".")
    ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf("."))
    : "";
  const parentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
  const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;
  const rawJzodSchema = currentKeyMap?.rawSchema;
  const currentEnumSchema: JzodElement | undefined = currentKeyMap?.resolvedSchema;
  // const possibleEnumValues = (currentKeyMap?.resolvedSchema).;
  // Log only when component renders to track performance
  // log.info(
  //   "JzodEnumEditor: render for",
  //     name,
  //     "rootLessListKey=",rootLessListKey,
  //     "rawJzodSchema=", rawJzodSchema,
  // );


  const discriminatorIndex: number = !parentKeyMap?.discriminator
    ? -1
    : typeof parentKeyMap?.discriminator == "string"
    ? 0
    : parentKeyMap?.discriminator?.findIndex((d: string) => d === name);

  const isDiscriminator =
    parentKeyMap?.discriminator &&
    parentKeyMap?.discriminatorValues &&
    discriminatorIndex !== -1;

  // if (isDiscriminator && discriminatorIndex === -1) {
  //   throw new Error(
  //     `JzodEnumEditor: isDiscriminator is true but could not find discriminator index for name "${name}" in parentKeyMap.discriminator ${parentKeyMap?.discriminator} with values ${parentKeyMap?.discriminatorValues}`
  //   );
  // }

  // Create the model environment needed for discriminator change handling
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        currentMiroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      currentModel,
      miroirMetaModel: miroirMetaModel,
    };
  }, [currentMiroirFundamentalJzodSchema, currentModel, miroirMetaModel]);

  // Handler for discriminator select change (using common function)
  const handleSelectEnumChange = useCallback(
    (event: any) => {
      if (!parentKeyMap) {
        throw new Error("handleSelectEnumChange called but parentKeyMap is undefined!");
      }
      handleDiscriminatorChange(
        event.target.value,
        "enum",
        parentKeyMap,
        rootLessListKey,
        rootLessListKeyArray,
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
      currentMiroirModelEnvironment,
      formik,
    ]
  );

  const currentDiscriminatorValues =
    parentKeyMap?.discriminatorValues && discriminatorIndex !== -1
      ? parentKeyMap.discriminatorValues[discriminatorIndex]
      : [];

  // Memoize the menu items for better performance
  const menuItems = useMemo(() => {
    if (isDiscriminator && parentKeyMap?.discriminatorValues) {
      return currentDiscriminatorValues.sort().map((v, index) => (
        <option key={v} value={v} aria-label={rootLessListKey + "." + index}>
          {v}
        </option>
      ));
    } else {
      return (currentEnumSchema?.type == "enum"?currentEnumSchema.definition:[]).map((v, index) => (
        <option key={v} value={v} aria-label={rootLessListKey + "." + index}>
          {v}
        </option>
      ));
    }
  }, [isDiscriminator, parentKeyMap, rawJzodSchema, rootLessListKey]);

  // Memoize the select options for the filterable select
  const selectOptions = useMemo(() => {
    if (isDiscriminator && parentKeyMap?.discriminatorValues) {
      return currentDiscriminatorValues.sort().map((v) => ({
        value: v,
        label: v
      }));
    } else {
      return (currentEnumSchema?.type == "enum" ? currentEnumSchema.definition : []).map((v) => ({
        value: v,
        label: v
      }));
    }
  }, [isDiscriminator, parentKeyMap, currentEnumSchema, currentDiscriminatorValues]);

  // Handler for the new filterable select component
  const handleFilterableSelectEnumChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    if (isDiscriminator) {
      if (!parentKeyMap) {
        throw new Error("handleFilterableSelectEnumChange called but parentKeyMap is undefined!");
      }
      handleDiscriminatorChange(
        selectedValue,
        "enum",
        parentKeyMap,
        rootLessListKey,
        rootLessListKeyArray,
        currentDeploymentUuid,
        currentMiroirModelEnvironment,
        formik,
        log
      );
    } else {
      // For non-discriminator enums, just set the field value
      formik.setFieldValue(rootLessListKey, selectedValue);
    }
  }, [isDiscriminator, parentKeyMap, rootLessListKey, rootLessListKeyArray, currentDeploymentUuid, currentMiroirModelEnvironment, formik]);

  const editor = useMemo(() => {
    if (readOnly) {
      const currentValue = formik.getFieldProps(rootLessListKey).value;
      return <ThemedDisplayValue value={currentValue} type="enum" />;
    }
    
    if (currentEnumSchema?.type === "enum") {
      const currentValue = formik.getFieldProps(rootLessListKey).value;
      
      return (
        <div>
          {isDiscriminator ? (
            <>
              <ThemedSelect
                filterable={true}
                options={selectOptions}
                value={currentValue}
                onChange={handleFilterableSelectEnumChange}
                placeholder={`Select ${name}...`}
                filterPlaceholder="Type to filter options..."
                minWidth="200px"
              />
              <span style={{ fontSize: '1.2em', color: '#696969' }} title="Enum discriminator">★</span>
            </>
          ) : (
            <ThemedSelect
              filterable={true}
              options={selectOptions}
              value={currentValue}
              onChange={handleFilterableSelectEnumChange}
              placeholder={`Select ${name}...`}
              filterPlaceholder="Type to filter options..."
              minWidth="200px"
            />
          )}
          {forceTestingMode ? (
            <div>enumValues={JSON.stringify((rawJzodSchema as JzodEnum).definition)}</div>
          ) : (
            <></>
          )}
        </div>
      );
    } else {
      return (<div>error on enum {rootLessListKey}: schema is not an enum {JSON.stringify(currentEnumSchema, undefined, 2)}</div>)
    }
  }, [readOnly, currentEnumSchema, rootLessListKey, menuItems, formik, forceTestingMode, isDiscriminator, handleSelectEnumChange]);
  return (
    <ThemedLabeledEditor
      labelElement={labelElement ?? <></>}
      editor={editor}
    />
  );
};
