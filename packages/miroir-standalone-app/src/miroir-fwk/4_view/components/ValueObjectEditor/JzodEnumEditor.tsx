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
  TransformerFailure,
  type ApplicationDeploymentMap,
  type JzodObject,
  type JzodUnion,
  type ReduxDeploymentsState,
  type ReduxStateWithUndoRedo,
  type SyncBoxedExtractorOrQueryRunnerMap,
  type Uuid
} from "miroir-core";
import React, { FC, useCallback, useMemo, useState } from "react";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useCurrentModelEnvironment, useDefaultValueParams } from "../../ReduxHooks";
import {
  ThemedDisplayValue,
  ThemedLabeledEditor,
  ThemedSelectWithPortal
} from "../Themes/index";
import { JzodEnumEditorProps } from "./JzodElementEditorInterface";
import { isPrimaryUnionDiscriminatorField } from "./unionDiscriminatorField.js";
import { useSelector } from "react-redux";
import { getMemoizedReduxDeploymentsStateSelectorMap } from "miroir-localcache-redux";
import { JsonDisplayHelper } from "miroir-react";

// Common function to handle discriminator changes
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodEnumEditor");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

function resolveDiscriminatorParentValue(
  formikValues: Record<string, unknown>,
  reportSectionPathAsString: string,
  valuePath: KeyMapEntry["valuePath"],
  rootLessListKeyArray: (string | number)[],
  selectedValue: string,
): Record<string, unknown> {
  const reportSectionValues = formikValues[reportSectionPathAsString];
  if (reportSectionValues == null) {
    throw new Error(
      `Cannot update discriminator: form section "${reportSectionPathAsString}" is missing`,
    );
  }
  try {
    return {
      ...resolvePathOnObject(reportSectionValues, valuePath),
      [rootLessListKeyArray[rootLessListKeyArray.length - 1]]: selectedValue,
    };
  } catch (error) {
    if (error instanceof TransformerFailure) {
      throw new Error(
        `Cannot update "${reportSectionPathAsString}.${valuePath.join(".")}": current value does not contain that path`,
        { cause: error },
      );
    }
    throw error;
  }
}

// Common function to handle discriminator changes
const handleDiscriminatorChange = (
  selectedValue: string,
  discriminatorType: "enum" | "literal" | "schemaReference",
  parentKeyMap: KeyMapEntry,
  rootLessListKey: string,
  rootLessListKeyArray: (string | number)[],
  reportSectionPathAsString: string,
  currentApplication: Uuid,
  appliationDeploymentMap: ApplicationDeploymentMap,
  currentDeploymentUuid: string | undefined,
  defaultValueParams: ReturnType<typeof useDefaultValueParams>,
  modelEnvironment: MiroirModelEnvironment,
  reduxDeploymentsState: ReduxDeploymentsState | undefined,
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
  const fieldName = String(rootLessListKeyArray[rootLessListKeyArray.length - 1] ?? "");
  if (!isPrimaryUnionDiscriminatorField(fieldName, parentKeyMap.discriminator)) {
    const targetRootLessListKey =
      [reportSectionPathAsString, ...rootLessListKeyArray.slice(0, -1)].join(".") ?? "";
    const patched = resolveDiscriminatorParentValue(
      formik.values,
      reportSectionPathAsString,
      parentKeyMap.valuePath,
      rootLessListKeyArray,
      selectedValue,
    );
    if (onChangeCallback) {
      onChangeCallback(patched, rootLessListKey);
    }
    formik.setFieldValue(targetRootLessListKey, patched, false);
    return;
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
    const newParentValue = resolveDiscriminatorParentValue(
      formik.values,
      reportSectionPathAsString,
      parentKeyMap.valuePath,
      rootLessListKeyArray,
      selectedValue,
    );
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
      parentKeyMap.rawSchema as JzodUnion,
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
          formik.values[reportSectionPathAsString],
          rootLessListKey,
          undefined, // currentDefaultValue
          [], // currentValuePath
          false, // forceOptional
          currentApplication,
          appliationDeploymentMap,
          currentDeploymentUuid,
          modelEnvironment,
          defaultValueParams, // transformerParams;
          {}, // contextResults
          reduxDeploymentsState,
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
  listKey,
  rootLessListKey,
  rootLessListKeyArray,
  reportSectionPathAsString,
  forceTestingMode,
  typeCheckKeyMap,
  currentApplication,
  applicationDeploymentMap,
  currentDeploymentUuid,
  readOnly,
  onChangeVector,
}: JzodEnumEditorProps) => {
  const formik = useFormikContext<Record<string, any>>();
  const [discriminatorChangeError, setDiscriminatorChangeError] = useState<string | undefined>();

  const parentKey = rootLessListKey.includes(".")
    ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf("."))
    : "";
  const parentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
  const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;
  // const rawJzodSchema = currentKeyMap?.rawSchema;
  const currentEnumSchema: JzodElement | undefined = currentKeyMap?.resolvedSchema;
  const formikRootLessListKeyArray = [reportSectionPathAsString, ...rootLessListKeyArray];
  const formikRootLessListKey = formikRootLessListKeyArray.join(".");

  const defaultValueParams = useDefaultValueParams(currentApplication, currentDeploymentUuid);

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
        getMemoizedReduxDeploymentsStateSelectorMap();
  // Create the model environment needed for discriminator change handling
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    currentApplication,
    applicationDeploymentMap
  );
  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        applicationDeploymentMap,
        () => ({}),
        currentMiroirModelEnvironment
      )
  );

  // Memoize the onChangeVector callback for this field to avoid repeated lookups
  const onChangeCallback = useMemo(
    () => onChangeVector?.[rootLessListKey],
    [onChangeVector, rootLessListKey]
  );

  const discriminatorIndex: number = !parentKeyMap?.discriminator
    ? -1
    : typeof parentKeyMap?.discriminator == "string" && parentKeyMap.discriminator === name
      ? 0
      : typeof parentKeyMap?.discriminator == "string"
        ? -1
        : parentKeyMap?.discriminator?.findIndex((d: string | string[]) =>
            Array.isArray(d) ? d.includes(name) : d === name,
          );

  const isDiscriminator =
    isPrimaryUnionDiscriminatorField(name, parentKeyMap?.discriminator) &&
    !!parentKeyMap?.discriminatorValues;

  // Handler for discriminator select change (using common function)
  const handleSelectEnumChange = useCallback(
    (event: any) => {
      if (!parentKeyMap) {
        throw new Error("handleSelectEnumChange called but parentKeyMap is undefined!");
      }
      try {
        setDiscriminatorChangeError(undefined);
        handleDiscriminatorChange(
          event.target.value,
          "enum",
          parentKeyMap,
          rootLessListKey,
          rootLessListKeyArray,
          // formikRootLessListKey,
          reportSectionPathAsString,
          currentApplication,
          applicationDeploymentMap,
          currentDeploymentUuid,
          defaultValueParams,
          currentMiroirModelEnvironment,
          deploymentEntityState,
          formik,
          log,
          onChangeCallback
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to apply enum discriminator change";
        log.error("JzodEnumEditor handleSelectEnumChange failed", error);
        setDiscriminatorChangeError(message);
      }
    },
    [
      parentKeyMap,
      rootLessListKey,
      rootLessListKeyArray,
      formikRootLessListKey,
      currentDeploymentUuid,
      currentMiroirModelEnvironment,
      deploymentEntityState,
      formik,
      onChangeCallback,
    ]
  );

  const currentDiscriminatorValues =
    parentKeyMap?.discriminatorValues && discriminatorIndex !== -1
      ? parentKeyMap.discriminatorValues[discriminatorIndex]
      : [];

  const menuItems = useMemo(() => {
    if (isDiscriminator && parentKeyMap?.discriminatorValues) {
      return currentDiscriminatorValues.sort().map((v, index) => (
        <option key={v} value={v} aria-label={formikRootLessListKey + "." + index}>
          {v}
        </option>
      ));
    } else {
      return (currentEnumSchema?.type == "enum"?currentEnumSchema.definition:[]).map((v, index) => (
        <option key={v} value={v} aria-label={formikRootLessListKey + "." + index}>
          {v}
        </option>
      ));
    }
  }, [isDiscriminator, parentKeyMap, formikRootLessListKey]);

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

  // Handler for the filterable select component
  const handleFilterableSelectEnumChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = event.target.value;
      if (isDiscriminator) {
        if (!parentKeyMap) {
          throw new Error("handleFilterableSelectEnumChange called but parentKeyMap is undefined!");
        }
        try {
          setDiscriminatorChangeError(undefined);
          handleDiscriminatorChange(
            selectedValue,
            "enum",
            parentKeyMap,
            rootLessListKey,
            rootLessListKeyArray,
            // formikRootLessListKey,
            reportSectionPathAsString,
            currentApplication,
            applicationDeploymentMap,
            currentDeploymentUuid,
            defaultValueParams,
            currentMiroirModelEnvironment,
            deploymentEntityState,
            formik,
            log,
            onChangeCallback
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to apply enum discriminator change";
          log.error("JzodEnumEditor handleFilterableSelectEnumChange failed", error);
          setDiscriminatorChangeError(message);
        }
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
      deploymentEntityState,
      formik,
      onChangeVector
    ]
  );

  const editor = useMemo(() => {
    if (readOnly) {
      const currentValue = formik.getFieldProps(formikRootLessListKey).value;
      return <ThemedDisplayValue value={currentValue} type="enum" />;
    }

    if (currentEnumSchema?.type === "enum") {
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
            <div>enumValues={JSON.stringify((currentEnumSchema as JzodEnum).definition)}</div>
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
    // rawJzodSchema,
    forceTestingMode,
    isDiscriminator,
    handleSelectEnumChange,
  ]);
  return (
    <div>
        <JsonDisplayHelper
          debug={true}
          componentName="JzodEnumEditor"
          elements={[
            {
              label: `key "${formikRootLessListKey}" of type ${currentEnumSchema?.type}`,
              data: {
                isDiscriminator,
                selectOptions,
                // rawJzodSchema,
                currentEnumSchema,
                currentKeyMap,
                currentDiscriminatorValues,
                parentKeyMap,
              },
              initiallyUnfolded: false,
              copyButton: true,
              useCodeBlock: true,
            },
          ]}
        />
      <ThemedLabeledEditor
        labelElement={labelElement ?? <></>}
        editor={editor}
      />
      {discriminatorChangeError ? (
        <div style={{ color: "#c62828", fontSize: "0.9em", marginTop: "4px" }}>
          {discriminatorChangeError}
        </div>
      ) : null}
    </div>
  );
};
