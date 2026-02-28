import { useCallback, useEffect, useMemo, useState } from "react";


import {
  LoggerInterface,
  MiroirLoggerFactory,
  mStringify,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  transformer_extended_apply_wrapper,
  type MetaModel,
  type MiroirModelEnvironment
} from "miroir-core";

import { packageName } from "../../../../constants";
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo, useSelector } from "../../../miroir-localcache-imports.js";
import { cleanLevel } from "../../constants";
import { useMiroirContextService } from "../../MiroirContextReactProvider";
import { useCurrentModelEnvironment } from "../../ReduxHooks";
import { DebugHelper } from "../Page/DebugHelper.js";
import { ThemedStatusText } from "../Themes/BasicComponents";
import { FileSelector } from "../Themes/FileSelector.js";
import { ThemedSwitch } from "../Themes/UIComponents.js";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodAnyEditorProps } from "./JzodElementEditorInterface";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodAnyEditor"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
/**
 * JzodAnyEditor Component
 * 
 * Editor for Jzod schema elements of type "any".
 * Supports dynamic type selection and rendering of appropriate sub-editors.
 */
let JzodAnyEditorRenderCount: number = 0;
export const JzodAnyEditor: React.FC<JzodAnyEditorProps> = (
  props: JzodAnyEditorProps
) => {
  JzodAnyEditorRenderCount++;
  const context = useMiroirContextService();
  const {
    // name,
    // listKey,
    rootLessListKey,
    // rootLessListKeyArray,
    reportSectionPathAsString,
    // currentDeploymentUuid,
    // currentApplicationSection,
    // foreignKeyObjects,
    // resolvedElementJzodSchemaDEFUNCT, // handleSelectLiteralChange,
    // labelElement,
    insideAny,
    // readOnly,
    // typeCheckKeyMap,
  } = props;

  const {
    formik,
    currentTypecheckKeyMap,
    currentValueObject,
    currentValueObjectAtKey,
    formikRootLessListKey,
    localResolvedElementJzodSchemaBasedOnValue,
    // currentModel,
    // miroirMetaModel,
    // // 
    // displayAsStructuredElement,
    // setDisplayAsStructuredElement,
    // codeMirrorValue,
    // setCodeMirrorValue,
    // codeMirrorIsValidJson,
    // setCodeMirrorIsValidJson,

  } = useJzodElementEditorHooks(
    props.rootLessListKey,
    props.rootLessListKeyArray,
    reportSectionPathAsString,
    props.typeCheckKeyMap,
    props.currentApplication,
    props.applicationDeploymentMap,
    props.currentDeploymentUuid,
    JzodAnyEditorRenderCount,
    "JzodAnyEditor",
  );

  const [selectedFileName, setSelectedFileName] = useState<string | undefined>(undefined);
  const [fileError, setFileError] = useState<string | undefined>(undefined);

  // Compute the reset value from the schema's initializeTo tag (used for CLEAR and post-submit reset)
  const initializeTo = currentTypecheckKeyMap?.rawSchema?.tag?.value?.initializeTo;

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    props.currentApplication,
    props.applicationDeploymentMap,
  );

  // Resolve the reset value from the schema's initializeTo tag (used for CLEAR and post-submit reset)
  const resetFieldValue = useMemo(() => {
    if (!initializeTo) return undefined;
    if (initializeTo.initializeToType === "value") {
      return initializeTo.value;
    }
    if (initializeTo.initializeToType === "transformer" && initializeTo.transformer) {
      return transformer_extended_apply_wrapper(
        undefined, // activityTracker – not needed for build-time init
        "build",
        [formikRootLessListKey, "initializeTo"],
        "initializeTo",
        initializeTo.transformer,
        currentMiroirModelEnvironment,
        formik.values, // transformerParams
        {}, // contextResults
        "value",
      );
    }
    return undefined;
  }, [initializeTo, currentMiroirModelEnvironment]);

  // Directly write file contents into formik (no intermediate state) to avoid race conditions on clear
  const setSelectedFileContents = useCallback(
    (contents: MetaModel | undefined) => {
      log.info(
        "JzodAnyEditor - setSelectedFileContents for",
        formikRootLessListKey,
        "contents:",
        mStringify(contents, null, 2)
      );
      formik.setFieldValue(formikRootLessListKey, contents !== undefined ? contents : resetFieldValue);
    },
    [formik, formikRootLessListKey, resetFieldValue],
  );

  // Sync selectedFileName from formik value: reset when cleared, show placeholder when a file object is loaded
  // but selectedFileName hasn't been set (e.g. after a code-editor round-trip remounts this component)
  useEffect(() => {
    const isReset = currentValueObjectAtKey === undefined || currentValueObjectAtKey === resetFieldValue;
    if (isReset) {
      setSelectedFileName(undefined);
      setFileError(undefined);
    } else if (
      typeof currentValueObjectAtKey === "object" &&
      currentValueObjectAtKey !== null &&
      selectedFileName === undefined
    ) {
      // File content is in formik but display name was lost (e.g. remount after code-editor round-trip)
      const name = (currentValueObjectAtKey as any).applicationName;
      setSelectedFileName(typeof name === "string" ? name : "(file loaded)");
    }
  }, [currentValueObjectAtKey, resetFieldValue]);

  const handleClear = useCallback(() => {
    formik.setFieldValue(formikRootLessListKey, resetFieldValue);
    setSelectedFileName(undefined);
    setFileError(undefined);
  }, [formik, formikRootLessListKey, resetFieldValue]);

  const format = currentTypecheckKeyMap?.rawSchema?.tag?.value?.display?.any?.format;
  const label = currentTypecheckKeyMap?.rawSchema?.tag?.value?.defaultLabel?? formikRootLessListKey[formikRootLessListKey.length -1];

  // // ##############################################################################################
  // const handleDisplayAsStructuredElementSwitchChange = useCallback(
  //   (event: React.ChangeEvent<HTMLInputElement>) => {
  //     log.info(
  //       "handleDisplayAsStructuredElementSwitchChange",
  //       props.rootLessListKey,
  //       "Switching display mode to:",
  //       event.target.checked
  //     );
  //     if (event.target.checked) {
  //       try {
  //         const parsedCodeMirrorValue = JSON.parse(codeMirrorValue);
  //         log.info(
  //           "handleDisplayAsStructuredElementSwitchChange Parsed CodeMirror value for structured element display:",
  //           mStringify(parsedCodeMirrorValue, null, 2)
  //         );
  //         // if (props.rootLessListKey && props.rootLessListKey.length > 0) {
  //           // Invoke onChangeVector callback if registered for this field
  //           const onChangeCallback = props.onChangeVector?.[props.rootLessListKey];
  //           if (onChangeCallback) {
  //             onChangeCallback(parsedCodeMirrorValue, props.rootLessListKey);
  //           }
  //           formik.setFieldValue(formikRootLessListKey, parsedCodeMirrorValue);
  //         // } else {
  //         //   formik.setValues(parsedCodeMirrorValue);
  //         // }
  //       } catch (e) {
  //         log.error("Failed to parse JSON in switch handler:", e);
  //         // Keep display mode as is in case of error
  //         return;
  //       }
  //     } else {
  //       // if switching to code editor, reset the codeMirrorValue to the current value
  //       // setCodeMirrorValue(safeStringify(currentValue));
  //       setCodeMirrorValue(JSON.stringify(currentValueObject, null, 2));
  //     }
  //     setDisplayAsStructuredElement(event.target.checked);
  //   },
  //   [
  //     currentValueObject,
  //     codeMirrorValue,
  //     formik,
  //     props.rootLessListKey,
  //     setCodeMirrorValue,
  //     setDisplayAsStructuredElement,
  //   ]
  // );

  // const resolvedTypeIsObjectOrArrayOrAny = useMemo(() => 
  //   !localResolvedElementJzodSchemaBasedOnValue || ["any", "object", "record", "array", "tuple"].includes(
  //     localResolvedElementJzodSchemaBasedOnValue.type
  //   ), [localResolvedElementJzodSchemaBasedOnValue]
  // );

  //   // Switches for display mode
  // const displayAsStructuredElementSwitch: JSX.Element = useMemo(
  //   () => (
  //     <>
  //       {!props.readOnly && resolvedTypeIsObjectOrArrayOrAny ? (
  //         <ThemedSwitch
  //           checked={displayAsStructuredElement}
  //           id={`displayAsStructuredElementSwitch-${props.rootLessListKey}`}
  //           name={`displayAsStructuredElementSwitch-${props.rootLessListKey}`}
  //           onChange={handleDisplayAsStructuredElementSwitchChange}
  //           disabled={!codeMirrorIsValidJson}
  //         />
  //       ) : (
  //         <></>
  //       )}
  //     </>
  //   ),
  //   [
  //     props.readOnly,
  //     resolvedTypeIsObjectOrArrayOrAny,
  //     displayAsStructuredElement,
  //     handleDisplayAsStructuredElementSwitchChange,
  //     codeMirrorIsValidJson,
  //   ]
  // );
  
  // // const currentValue = resolvePathOnObject(formik.values[reportSectionPathAsString], rootLessListKeyArray);
  // const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
  //   getMemoizedReduxDeploymentsStateSelectorMap();

  // const deploymentEntityState: ReduxDeploymentsState = useSelector(
  //   (state: ReduxStateWithUndoRedo) =>
  //     deploymentEntityStateSelectorMap.extractState(
  //       state.presentModelSnapshot.current,
  //       props.applicationDeploymentMap,
  //       () => ({}),
  //       currentMiroirModelEnvironment,
  //     ),
  // );
  if (insideAny) {
    log.info(`JzodAnyEditor Rendered insideAny for ${rootLessListKey} ${JzodAnyEditorRenderCount}`);
    return (<ThemedStatusText style={{color: "red"}}>
      JzodAnyEditor rendered inside an "any" type is not supported yet.
    </ThemedStatusText>)
  }
  if (format === "file") {
    return (
      <div key={rootLessListKey}>
        {/* fomat = "file" */}
        <DebugHelper
          componentName="JzodAnyEditor"
          elements={[{
            label: `JzodAnyEditor Render ${JzodAnyEditorRenderCount} for ${rootLessListKey} format=file`,
            data: {
              reportSectionPathAsString,
              rootLessListKey,
              currentValueObject,
              currentValueObjectAtKey,
              formik: formik.values,
              currentTypecheckKeyMap,
            },
            useCodeBlock: true,
          }]}
        />
        {/* <ThemedLabeledEditor
          labelElement={labelElement ?? <>{name}</>}
          editor={ */}
        {label}
        <FileSelector
          title=""
          buttonLabel={"Select File"}
          accept={"*.json"}
          // folder={false}
          setSelectedFileContents={setSelectedFileContents}
          setSelectedFileError={setFileError}
          setSelectedFileName={setSelectedFileName}
          selectedFileName={selectedFileName}
          error={fileError}
          showBorder={false}
          compact={true}
          style={{ marginBottom: 0 }}
          onFileClear={handleClear}
        />
      </div>
    );
  }

  if (localResolvedElementJzodSchemaBasedOnValue?.type === "any") {
    return (
      <>
        {props.submitButton ?? <></>}
        JzodAnyEditor rendering as JzodElementEditorReactCodeMirror 1 format: {format}
      </>
    );
  }

  return (
    <div key={rootLessListKey}>
      {/* <ThemedOnScreenHelper label="JzodAnyEditor" data={rootLessListKey} /> */}
      <DebugHelper
        componentName="JzodAnyEditor"
        elements={[{
          label: `JzodAnyEditor Render ${JzodAnyEditorRenderCount} for ${rootLessListKey} general case`,
          data: {currentValueObject, currentValueObjectAtKey, currentTypecheckKeyMap},
          useCodeBlock: true,
        }]}
      />
    </div>
  );
};
