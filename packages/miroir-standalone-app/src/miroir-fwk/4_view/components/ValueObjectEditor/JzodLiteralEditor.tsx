import { useFormikContext } from "formik";
import React, { FC, useCallback, useMemo } from "react";


import {
  defaultViewParamsFromAdminStorageFetchQueryParams,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  jzodUnionResolvedTypeForObject,
  LoggerInterface,
  MiroirLoggerFactory,
  resolvePathOnObject,
  type ApplicationDeploymentMap,
  type Domain2QueryReturnType,
  type DomainElementSuccess,
  type EntityInstancesUuidIndex,
  type JzodObject,
  type JzodUnion,
  type KeyMapEntry,
  type MiroirModelEnvironment,
  type ReduxDeploymentsState,
  type SyncBoxedExtractorOrQueryRunnerMap,
  type SyncQueryRunner,
  type Uuid,
  type ViewParams
} from "miroir-core";

import {
  getMemoizedReduxDeploymentsStateSelectorMap,
  ThemedOnScreenHelper,
  useSelector,
  type ReduxStateWithUndoRedo,
} from "miroir-react";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useCurrentModelEnvironment, useDefaultValueParams, useReduxDeploymentsStateQuerySelectorForCleanedResult } from "../../ReduxHooks";
import {
  ThemedDisplayValue,
  ThemedLabeledEditor,
  ThemedSelectWithPortal
} from "../Themes/index";
import { JzodLiteralEditorProps } from "./JzodElementEditorInterface";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodLiteralEditor"), "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Common function to handle discriminator changes
const handleDiscriminatorChange = (
  selectedValue: string,
  discriminatorType: "enum" | "literal" | "schemaReference",
  parentKeyMap: KeyMapEntry,
  rootLessListKey: string,
  rootLessListKeyArray: (string | number)[],
  reportSectionPathAsString: string,
  currentApplication: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  currentDeploymentUuid: string | undefined,
  defaultValueParams: ReturnType<typeof useDefaultValueParams>,
  modelEnvironment: MiroirModelEnvironment,
  ReduxDeploymentsState: ReduxDeploymentsState | undefined,
  formik: any,
  log: LoggerInterface,
  onChangeCallback?: (value: any, rootLessListKey: string) => void
) => {
  log.info("handleDiscriminatorChange called with:", {
    reportSectionPathAsString,
    selectedValue,
    discriminatorType,
    rootLessListKey,
    rootLessListKeyArray
  });
  
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
  let newJzodSchema: JzodElement | undefined = undefined;
  let localChosenDiscriminator: string | undefined = undefined;
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
    // const discriminator = parentKeyMap.discriminator[0];
    const discriminator: string | string[] = parentKeyMap.discriminator[0];
    const currentObjectKeys = Object.keys((parentKeyMap.resolvedSchema as JzodObject).definition);
    localChosenDiscriminator = !Array.isArray(discriminator)
      ? discriminator
      : parentKeyMap.discriminator.flat().find((d) =>
            currentObjectKeys.includes(d)
        );
    if (!localChosenDiscriminator) {
      throw new Error(
        `handleDiscriminatorChange could not find local chosen discriminator for discriminator ${discriminator} in ${JSON.stringify(parentKeyMap.resolvedSchema)}`
      );
    }
    // const discriminatorTypeLocal = parentKeyMap.resolvedSchema.definition[discriminator]?.type;
    const parentNewUnionBranch:JzodObject | undefined = parentKeyMap.recursivelyUnfoldedUnionSchema.result.find((a: JzodElement) => {
      if (a.type !== "object") return false;
      const discriminatorElement = a.definition[discriminator as string];
      if (!discriminatorElement) return false;
      return true;
    }) as JzodObject | undefined;

    log.info("handleDiscriminatorChange found parentNewUnionBranch", parentNewUnionBranch);

    const discriminatorTypeLocal: string | undefined = parentNewUnionBranch?.definition[localChosenDiscriminator as string].type;

    if (!discriminatorTypeLocal) {
      throw new Error(
        `handleDiscriminatorChange could not find discriminator type for discriminator ${discriminator} in ${JSON.stringify(
          parentKeyMap.resolvedSchema
        )}`
      );
    }
    if (
      (discriminatorType === "literal" && discriminatorTypeLocal !== "literal") ||
      (discriminatorType === "enum" && discriminatorTypeLocal !== "enum") ||
      (discriminatorType === "schemaReference" && discriminatorTypeLocal !== "schemaReference")
    ) {
      throw new Error(
        `handleDiscriminatorChange discriminator type mismatch: expected ${discriminatorType} but found ${discriminatorTypeLocal} for discriminator ${discriminator} in ${JSON.stringify(
          parentKeyMap.resolvedSchema
        )}`
      );
    }
    const newParentValue = {
      ...resolvePathOnObject(formik.values[reportSectionPathAsString], parentKeyMap.valuePath),
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
      parentKeyMap.rawSchema as JzodUnion,
      parentKeyMap.discriminator,
      newParentValue, // valueObject,
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
    localChosenDiscriminator = parentKeyMap.discriminator as string;
    newJzodSchema =
      parentKeyMap.recursivelyUnfoldedUnionSchema?.result.find((a: JzodElement) => {
        if (a.type !== "object") return false;
        const discriminatorElement = a.definition[parentKeyMap.discriminator as string];
        if (!discriminatorElement) return false;
        
        if (discriminatorElement.type === "literal") {
          return (discriminatorElement as JzodLiteral).definition === selectedValue;
        } else if (discriminatorElement.type === "enum") {
          log.info(
            "handleDiscriminatorChange checking enum",
            (discriminatorElement as JzodEnum).definition,
            "for value",
            selectedValue
          );
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
        formik.values[reportSectionPathAsString],
        rootLessListKey,
        undefined,
        [],
        // undefined,
        true,
        currentApplication,
        applicationDeploymentMap,
        currentDeploymentUuid,
        modelEnvironment,
        defaultValueParams, // transformerParams
        {}, // contextResult
        ReduxDeploymentsState,
      ),
      // [Array.isArray(parentKeyMap.discriminator) ? parentKeyMap.discriminator[0] : parentKeyMap.discriminator]: selectedValue,
      [localChosenDiscriminator]: selectedValue,
    }
    : undefined;

  const targetRootLessListKey = [reportSectionPathAsString,...rootLessListKeyArray.slice(0, rootLessListKeyArray.length - 1)].join(".")??"";
  // const targetRootLessListKey = [reportSectionPathAsString,rootLessListKeyArray].join(".")??"";
  log.info(
    `handleDiscriminatorChange (${discriminatorType})`,
    "rootLessListKeyArray",
    JSON.stringify(rootLessListKeyArray),
    "targetRootLessListKey",
    JSON.stringify(targetRootLessListKey),
    "defaultValue",
    JSON.stringify(defaultValue, null, 2),
    "formik.values",
    // JSON.stringify(formik.values, null, 2)
    formik.values
  );
  // if (targetRootLessListKey.length === 0) {
  //   // If the target key is empty, we set the value directly on formik.values
  //   formik.setFieldValue(
  //     [reportSectionPathAsString, ...targetRootLessListKey].join("."),
  //     defaultValue,
  //     false, // do not validate / refresh
  //   );
  // } else {
    // Invoke onChangeVector callback if registered for this field
    if (onChangeCallback) {
      onChangeCallback(defaultValue, rootLessListKey);
    }
    formik.setFieldValue(
      targetRootLessListKey,
      defaultValue,
      false, // do not validate / refresh
    );
  // }
};


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
    reportSectionPathAsString,
    currentApplication,
    applicationDeploymentMap,
    currentDeploymentUuid,
    typeCheckKeyMap,
    readOnly,
    hasPathError,
    onChangeVector,
  }
) => {
  JzodLiteralEditorRenderCount++;
  let error: JSX.Element | undefined = undefined;

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    currentApplication,
    applicationDeploymentMap
  );
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
        getMemoizedReduxDeploymentsStateSelectorMap();

  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<string, EntityInstancesUuidIndex> =
    useReduxDeploymentsStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        ReduxDeploymentsState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap),
      applicationDeploymentMap,
    );
  
  const viewParams: ViewParams | undefined = defaultViewParamsFromAdminStorageFetchQueryResults?.[
    "viewParams"
  ] as any;

  const defaultValueParams = useDefaultValueParams(currentApplication, currentDeploymentUuid, viewParams);

  const formik = useFormikContext<Record<string, any>>();

  // Memoize the onChangeVector callback for this field to avoid repeated lookups
  const onChangeCallback = useMemo(
    () => onChangeVector?.[rootLessListKey],
    [onChangeVector, rootLessListKey]
  );

  const parentKey = rootLessListKey.includes('.') ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf('.')) : '';
  const parentKeyMap:KeyMapEntry | undefined = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
  const currentKeyMap: KeyMapEntry | undefined = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        applicationDeploymentMap,
        () => ({}),
        currentMiroirModelEnvironment
      )
  );

    // Check if this literal is a discriminator
  const isDiscriminator = 
    !!parentKeyMap?.discriminator && 
    !!parentKeyMap?.discriminatorValues;

  const discriminatorIndex: number = !parentKeyMap?.discriminator
    ? -1
    : typeof parentKeyMap?.discriminator == "string"
    ? 0
    : parentKeyMap?.discriminator?.findIndex((d: string | string[]) =>
        Array.isArray(d) ? d.includes(name) : d === name
      );
  if (isDiscriminator && discriminatorIndex === -1) {
    error = (
      <div>
        <ThemedOnScreenHelper
          label="JzodLiteralEditor error"
          data={{
            rootLessListKey,
            name,
            parentKeyMapDiscriminator: parentKeyMap?.discriminator,
            parentKeyMapDiscriminatorValues: parentKeyMap?.discriminatorValues,
          }}
          // initiallyUnfolded={false}
          copyButton={true}
          useCodeBlock={true}
        />
        {/* <div style={{ color: "red" }}>
          Error: JzodLiteralEditor: {rootLessListKey} isDiscriminator is true but could not find
          discriminator index for name "{name}" in parentKeyMap.discriminator{" "}
          {JSON.stringify(parentKeyMap?.discriminator)} with values{" "}
          {JSON.stringify(parentKeyMap?.discriminatorValues)}
        </div> */}
      </div>
    );
    // throw new Error(
    //   `JzodLiteralEditor: isDiscriminator is true but could not find discriminator index for name "${name}" in parentKeyMap.discriminator ${parentKeyMap?.discriminator} with values ${parentKeyMap?.discriminatorValues}`
    // );
  }
  const currentReportSectionFormikValues = formik.values[reportSectionPathAsString] ?? formik.values;
  const formikRootLessListKeyArray = [reportSectionPathAsString, ...rootLessListKeyArray];
  const formikRootLessListKey = formikRootLessListKeyArray.join(".");

  const currentValue = useMemo(() => {
    try {
      return rootLessListKeyArray.length > 0
        ? resolvePathOnObject(currentReportSectionFormikValues, rootLessListKeyArray)
        : currentReportSectionFormikValues;
      // return rootLessListKeyArray.length > 0
      //   ? resolvePathOnObject(formik.values, rootLessListKeyArray)
      //   : formik.values;
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
      return currentReportSectionFormikValues; // fallback to formik.values if the path
      //        log.info("JzodLiteralEditor handleFilterableSelectChange called with event (DEBUG):", event);
    }
  }, [currentReportSectionFormikValues, rootLessListKeyArray]);


  // Handler for the new filterable select component
  const handleFilterableSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      log.info("handleFilterableSelectChange called with event:", event);
      log.info("handleFilterableSelectChange event.target.value:", event.target.value);
      log.info("handleFilterableSelectChange event.type:", event.type);
      log.info("handleFilterableSelectChange isDiscriminator:", isDiscriminator);
      log.info("handleFilterableSelectChange parentKeyMap:", parentKeyMap);
      // log.info("Stack trace:", new Error().stack);
      
      if (!isDiscriminator) {
        throw new Error(
          "handleFilterableSelectChange called but this literal is not a discriminator!"
        );
      }
      if (!parentKeyMap) {
        throw new Error(
          "handleFilterableSelectChange called but current object does not have information about the discriminated union type it must be part of!"
        );
      }
      handleDiscriminatorChange(
        event.target.value,
        "literal",
        parentKeyMap,
        rootLessListKey,
        rootLessListKeyArray,
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
    },
    [
      isDiscriminator,
      parentKeyMap,
      rootLessListKey,
      rootLessListKeyArray,
      reportSectionPathAsString,
      currentDeploymentUuid,
      currentMiroirModelEnvironment,
      formik,
      onChangeCallback
    ]
  ); // end handleFilterableSelectChange

  const currentDiscriminatorValues = parentKeyMap?.discriminatorValues && discriminatorIndex !== -1
    ? parentKeyMap.discriminatorValues[discriminatorIndex]
    : [];
  // Memoize discriminator options for the filterable select
  const discriminatorSelectOptions = useMemo(() => {
    if (isDiscriminator && currentDiscriminatorValues) {
      return currentDiscriminatorValues.sort().map((v) => ({
        value: v,
        label: v
      }));
    }
    return [];
  }, [isDiscriminator, currentDiscriminatorValues]);
  // log.info(
  //   "JzodLiteralEditor render",
  //   JzodLiteralEditorRenderCount,
  //   "rootLessListKey",
  //   JSON.stringify(rootLessListKey),
  //   "currentValue",
  //   JSON.stringify(currentValue),
  //   "currentDiscriminatorValues",
  //   JSON.stringify(currentDiscriminatorValues),
  //   "discriminatorSelectOptions",
  //   JSON.stringify(discriminatorSelectOptions)
  // );
  // Memoize discriminator values for better rendering performance

  return error ? (
    <>{error}</>
  ) : (
    <ThemedLabeledEditor
      labelElement={labelElement ?? <></>}
      editor={
        readOnly ? (
          <ThemedDisplayValue value={currentValue} type="literal" />
        ) : isDiscriminator ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "nowrap"  }}>
            <ThemedSelectWithPortal
              name={formikRootLessListKey}
              filterable={true}
              options={discriminatorSelectOptions}
              value={currentValue}
              onChange={handleFilterableSelectChange}
              placeholder={`Select ${name}...`}
              filterPlaceholder="Type to filter options..."
              minWidth="200px"
            />
            <div style={{ fontSize: "1.2em", color: "#87CEEB" }} title="Literal discriminator">
              ★
            </div>
          </div>
        ) : (
          <>
            <input
              type="text"
              id={rootLessListKey}
              form={"form." + name}
              value={formik.getFieldProps(formikRootLessListKey).value}
              readOnly
              disabled
            />
          </>
        )
      }
    />
  );
}
