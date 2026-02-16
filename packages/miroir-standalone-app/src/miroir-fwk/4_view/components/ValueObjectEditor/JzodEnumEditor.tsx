import { useFormikContext } from "formik";
import {
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  jzodUnionResolvedTypeForObject,
  KeyMapEntry,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirModelEnvironment,
  resolvePathOnObject,
  type ApplicationDeploymentMap,
  type JzodObject,
  type Uuid
} from "miroir-core";
import React, { FC, useCallback, useMemo } from "react";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useMiroirContextService } from "../../MiroirContextReactProvider";
import { useCurrentModelEnvironment, useDefaultValueParams } from "../../ReduxHooks";
import {
  ThemedDisplayValue,
  ThemedLabeledEditor,
  ThemedSelectWithPortal
} from "../Themes/index";
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
  reportSectionPathAsString: string,
  // formikRootLessListKey: string,
  currentApplication: Uuid,
  appliationDeploymentMap: ApplicationDeploymentMap,
  currentDeploymentUuid: string | undefined,
  defaultValueParams: ReturnType<typeof useDefaultValueParams>,
  modelEnvironment: MiroirModelEnvironment,
  formik: any,
  log: LoggerInterface,
  onChangeCallback?: (value: any, rootLessListKey: string) => void
) => {
  if (!parentKeyMap) {
    throw new Error(
      "handleDiscriminatorChange called but current object does not have information about the discriminated union type it must be part of!",
    );
  }
  if (!parentKeyMap.discriminator) {
    throw new Error(
      "handleDiscriminatorChange called but current object does not have a discriminated union type!",
    );
  }
  // if (typeof parentKeyMap.discriminator !== "string") {
  //   throw new Error(
  //     "handleDiscriminatorChange called but current object does not have a string discriminator!"
  //   );
  // }
  let newJzodSchema: JzodElement | undefined = undefined;
  let localChosenDiscriminator: string | undefined = undefined;
  if (Array.isArray(parentKeyMap.discriminator)) {
    if (!parentKeyMap.recursivelyUnfoldedUnionSchema) {
      throw new Error(
        "handleDiscriminatorChange called but current object does not have a recursivelyUnfoldedUnionSchema, cannot proceed!",
      );
    }
    if (parentKeyMap.resolvedSchema.type !== "object") {
      throw new Error(
        "handleDiscriminatorChange called but current object is not of type object, cannot proceed!",
      );
    }
    const discriminator: string | string[] = parentKeyMap.discriminator[0];
    const currentObjectKeys = Object.keys((parentKeyMap.resolvedSchema as JzodObject).definition);
    localChosenDiscriminator = !Array.isArray(discriminator)
      ? discriminator
      : parentKeyMap.discriminator.flat().find((d) => currentObjectKeys.includes(d));
    if (!localChosenDiscriminator) {
      throw new Error(
        `handleDiscriminatorChange could not find local chosen discriminator for discriminator ${discriminator} in ${JSON.stringify(parentKeyMap.resolvedSchema)}`,
      );
    }
    const discriminatorTypeLocal =
      parentKeyMap.resolvedSchema.definition[localChosenDiscriminator]?.type;
    if (!discriminatorTypeLocal) {
      throw new Error(
        `handleDiscriminatorChange could not find discriminator type for discriminator ${discriminator} in ${JSON.stringify(parentKeyMap.resolvedSchema)}`,
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
      selectedValue,
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
        `handleDiscriminatorChange jzodUnionResolvedTypeForObject error: ${resolveUnionResult.error}`,
      );
    }
    newJzodSchema = resolveUnionResult.resolvedJzodObjectSchema;
  } else {
    localChosenDiscriminator = parentKeyMap.discriminator as string;
    newJzodSchema = parentKeyMap.recursivelyUnfoldedUnionSchema?.result.find((a: JzodElement) => {
      if (a.type !== "object") return false;
      const discriminatorElement = a.definition[parentKeyMap.discriminator as string];
      if (!discriminatorElement) return false;

      if (discriminatorElement.type === "literal") {
        return (discriminatorElement as JzodLiteral).definition === selectedValue;
      } else if (discriminatorElement.type === "enum") {
        return (discriminatorElement as JzodEnum).definition.includes(selectedValue);
      } else if (
        discriminatorType === "schemaReference" &&
        discriminatorElement.type === "schemaReference"
      ) {
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
      `handleDiscriminatorChange could not find union branch for discriminator ${parentKeyMap.discriminator} with value ${selectedValue} in ${JSON.stringify(parentKeyMap.resolvedSchema)}`,
    );
  }

  const newJzodSchemaWithOptional = parentKeyMap.rawSchema.optional
    ? {
        ...newJzodSchema,
        optional: true,
      }
    : newJzodSchema;

  log.info(
    `handleDiscriminatorChange (${discriminatorType})`,
    "newJzodSchema",
    JSON.stringify(newJzodSchema, null, 2),
  );
  const defaultValue = modelEnvironment
    ? {
        ...getDefaultValueForJzodSchemaWithResolutionNonHook(
          "build",
          newJzodSchemaWithOptional,
          formik.values,
          rootLessListKey,
          undefined, // currentDefaultValue
          [], // currentValuePath
          true, // forceOptional
          currentApplication,
          appliationDeploymentMap,
          currentDeploymentUuid,
          modelEnvironment,
          defaultValueParams, // transformerParams
        ),
        // [Array.isArray(parentKeyMap.discriminator) ? parentKeyMap.discriminator[0] : parentKeyMap.discriminator]: selectedValue,
        [localChosenDiscriminator]: selectedValue,
      }
    : undefined;

  // const targetRootLessListKey = rootLessListKeyArray.slice(0, rootLessListKeyArray.length - 1).join(".")??"";
  const targetRootLessListKey =
    [
      reportSectionPathAsString,
      ...rootLessListKeyArray.slice(0, rootLessListKeyArray.length - 1),
    ].join(".") ?? "";
  log.info(
    `handleDiscriminatorChange (${discriminatorType})`,
    "targetRootLessListKey",
    targetRootLessListKey,
    "defaultValue",
    JSON.stringify(defaultValue, null, 2),
    "formik.values",
    // JSON.stringify(formik.values, null, 2)
    formik.values,
  );
  // if (targetRootLessListKey.length === 0) {
  //   // If the target key is empty, we set the value directly on formik.values
  //   formik.setValues(
  //     defaultValue,
  //   );
  // } else {
  // Invoke onChangeVector callback if registered for this field
  if (onChangeCallback) {
    onChangeCallback(defaultValue, rootLessListKey);
  }
  formik.setFieldValue(targetRootLessListKey, defaultValue, false);
  // }
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// JzodEnumEditor Component
// ################################################################################################
export const JzodEnumEditor: FC<JzodEnumEditorProps> = ({
  name,
  labelElement,
  // rawJzodSchema,
  listKey,
  rootLessListKey,
  rootLessListKeyArray,
  reportSectionPathAsString,
  forceTestingMode,
  typeCheckKeyMap,
  currentApplication,
  applicationDeploymentMap: appliationDeploymentMap,
  currentDeploymentUuid,
  readOnly,
  onChangeVector,
}: JzodEnumEditorProps) => {
  // const currentValue = resolvePathOnObject(props.formik.values, props.rootLessListKeyArray);

  const formik = useFormikContext<Record<string, any>>();
  const context = useMiroirContextService();

  const parentKey = rootLessListKey.includes(".")
    ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf("."))
    : "";
  const parentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
  const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;
  const rawJzodSchema = currentKeyMap?.rawSchema;
  const currentEnumSchema: JzodElement | undefined = currentKeyMap?.resolvedSchema;
  const currentReportSectionFormikValues = formik.values[reportSectionPathAsString] ?? formik.values;
  const formikRootLessListKeyArray = [reportSectionPathAsString, ...rootLessListKeyArray];
  const formikRootLessListKey = formikRootLessListKeyArray.join(".");

  const defaultValueParams = useDefaultValueParams(currentApplication, currentDeploymentUuid);

  // Memoize the onChangeVector callback for this field to avoid repeated lookups
  const onChangeCallback = useMemo(
    () => onChangeVector?.[rootLessListKey],
    [onChangeVector, rootLessListKey]
  );

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
    : parentKeyMap?.discriminator?.findIndex((d: string | string[]) =>
        Array.isArray(d) ? d.includes(name) : d === name
      );

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
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    currentApplication,
    appliationDeploymentMap
  );
  // const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
  //   return {
  //     miroirFundamentalJzodSchema:
  //       currentMiroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as MlSchema),
  //     currentModel,
  //     miroirMetaModel: miroirMetaModel,
  //   };
  // }, [currentMiroirFundamentalJzodSchema, currentModel, miroirMetaModel]);

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
        // formikRootLessListKey,
        reportSectionPathAsString,
        currentApplication,
        appliationDeploymentMap,
        currentDeploymentUuid,
        defaultValueParams,
        currentMiroirModelEnvironment,
        formik,
        log,
        onChangeCallback
      );
    },
    [
      parentKeyMap,
      rootLessListKey,
      rootLessListKeyArray,
      formikRootLessListKey,
      currentDeploymentUuid,
      currentMiroirModelEnvironment,
      formik,
      onChangeCallback,
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
        // <option key={v} value={v} aria-label={rootLessListKey + "." + index}>
        <option key={v} value={v} aria-label={formikRootLessListKey + "." + index}>
          {v}
        </option>
      ));
    } else {
      return (currentEnumSchema?.type == "enum"?currentEnumSchema.definition:[]).map((v, index) => (
        // <option key={v} value={v} aria-label={rootLessListKey + "." + index}>
        <option key={v} value={v} aria-label={formikRootLessListKey + "." + index}>
          {v}
        </option>
      ));
    }
  }, [isDiscriminator, parentKeyMap, rawJzodSchema, formikRootLessListKey]);

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
  const handleFilterableSelectEnumChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
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
          // formikRootLessListKey,
          reportSectionPathAsString,
          currentApplication,
          appliationDeploymentMap,
          currentDeploymentUuid,
          defaultValueParams,
          currentMiroirModelEnvironment,
          formik,
          log,
          onChangeCallback
        );
      } else {
        // For non-discriminator enums, just set the field value
        // Invoke onChangeVector callback if registered for this field
        if (onChangeVector?.[rootLessListKey]) {
          onChangeVector[rootLessListKey](selectedValue, rootLessListKey);
        }
        formik.setFieldValue(formikRootLessListKey, selectedValue);
        // formik.setFieldValue(rootLessListKey, selectedValue);
      }
    },
    [
      isDiscriminator,
      parentKeyMap,
      rootLessListKey,
      rootLessListKeyArray,
      formikRootLessListKey,
      currentDeploymentUuid,
      currentMiroirModelEnvironment,
      formik,
      onChangeVector
    ]
  );

  const editor = useMemo(() => {
    if (readOnly) {
      // const currentValue = formik.getFieldProps(rootLessListKey).value;
      const currentValue = formik.getFieldProps(formikRootLessListKey).value;
      return <ThemedDisplayValue value={currentValue} type="enum" />;
    }

    if (currentEnumSchema?.type === "enum") {
      // const currentValue = formik.getFieldProps(rootLessListKey).value;
      const currentValue = formik.getFieldProps(formikRootLessListKey).value;

      return (
        <div>
          {isDiscriminator ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "nowrap"  }}>
              <ThemedSelectWithPortal
                filterable={true}
                options={selectOptions}
                value={currentValue}
                name={formikRootLessListKey}
                onChange={handleFilterableSelectEnumChange}
                placeholder={`Select ${name}...`}
                filterPlaceholder="Type to filter options..."
                minWidth="200px"
              />
              <div style={{ fontSize: "1.2em", color: "#696969" }} title="Enum discriminator">
                ★
              </div>
            </div>
          ) : (
            <ThemedSelectWithPortal
              filterable={true}
              options={selectOptions}
              value={currentValue}
              name={formikRootLessListKey}
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
      return (
        <div>
          error on enum {rootLessListKey}: schema is not an enum{" "}
          {JSON.stringify(currentEnumSchema, undefined, 2)}
        </div>
      );
    }
  }, [
    readOnly,
    currentEnumSchema,
    rootLessListKey,
    menuItems,
    formik,
    formikRootLessListKey,
    isDiscriminator,
    name,
    selectOptions,
    handleFilterableSelectEnumChange,
    rawJzodSchema,
    forceTestingMode,
    isDiscriminator,
    handleSelectEnumChange,
  ]);
  return (
    <ThemedLabeledEditor
      labelElement={labelElement ?? <></>}
      editor={editor}
    />
  );
};
