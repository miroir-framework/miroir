import { useCallback, useState, useMemo, useEffect } from "react";
import { color } from "d3";


import {
  alterObjectAtPath2,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  LoggerInterface,
  MiroirLoggerFactory,
  mStringify,
  ReduxDeploymentsState,
  resolvePathOnObject,
  SyncBoxedExtractorOrQueryRunnerMap,
  type MetaModel,
  type MiroirModelEnvironment
} from "miroir-core";

import { JzodElement } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo, useSelector } from "../../../miroir-localcache-imports.js";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useMiroirContextService } from "../../MiroirContextReactProvider";
import { useCurrentModelEnvironment } from "../../ReduxHooks";
import { ChangeValueTypeSelect } from "../ChangeValueTypeSelect";
import { ThemedOnScreenDebug, ThemedStatusText } from "../Themes/BasicComponents";
import { JzodElementEditor } from "./JzodElementEditor";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodAnyEditorProps } from "./JzodElementEditorInterface";
import { ThemedLabeledEditor } from "../Themes/FormComponents.js";
import { ThemedDisplayValue } from "../Themes/DisplayComponents.js";
import { FileSelector } from "../Themes/FileSelector.js";
import { JzodElementEditorReactCodeMirror } from "./JzodElementEditorReactCodeMirror.js";
import { ThemedSwitch } from "../Themes/UIComponents.js";

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
    name,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    reportSectionPathAsString,
    currentDeploymentUuid,
    currentApplicationSection,
    foreignKeyObjects,
    resolvedElementJzodSchemaDEFUNCT: resolvedElementJzodSchema, // handleSelectLiteralChange,
    labelElement,
    insideAny,
    readOnly,
    typeCheckKeyMap,
  } = props;

  const {
    formik,
    currentTypecheckKeyMap,
    currentValueObject,
    currentValueObjectAtKey,
    formikRootLessListKey,
    localResolvedElementJzodSchemaBasedOnValue,
    currentModel,
    miroirMetaModel,
    // 
    displayAsStructuredElement,
    setDisplayAsStructuredElement,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,

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

  const [selectedFileName, setSelectedFileName] = useState<string | undefined>(
    currentValueObjectAtKey || undefined,
  );
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [selectedFileContents, setSelectedFileContents] = useState<
    MetaModel | undefined
  >(undefined);

  // const setSelectedFileContents = useCallback(
  //   (metaModel: MetaModel | undefined) => {
  //     // formik.setFieldValue(formikRootLessListKey, metaModel);
  //     log.info(
  //       "JzodAnyEditor - setSelectedFileContents for",
  //       formikRootLessListKey,
  //       "to metaModel:",
  //       mStringify(metaModel, null, 2)
  //     );
  //     formik.setValues(
  //       {
  //         ...formik.values,
  //         [formikRootLessListKey]: metaModel
  //       });
  //   },
  //   [formikRootLessListKey, formik],
  // );
  useEffect(() => {
    if (selectedFileContents !== undefined) {
      log.info(
        "JzodAnyEditor - useEffect selectedFileContents changed for",
        formikRootLessListKey,
        "to metaModel:",
        mStringify(selectedFileContents, null, 2)
      );
      formik.setFieldValue(formikRootLessListKey, selectedFileContents);
      // formik.setValues(
      //   alterObjectAtPath2(
      //     formik.values,
      //     [reportSectionPathAsString,...rootLessListKeyArray],
      //     selectedFileContents
      //   )
      //   // alterObjectAtPath2(
      //   //   formik.values,
      //   //   rootLessListKeyArray,
      //   //   selectedFileContents
      //   // )
      //   // {
      //   //   ...formik.values,
      //   //   [formikRootLessListKey]: selectedFileContents
      //   // }
      // );
    }
  }, [selectedFileContents, reportSectionPathAsString]);

  const format = currentTypecheckKeyMap?.rawSchema?.tag?.value?.display?.any?.format;
  const label = currentTypecheckKeyMap?.rawSchema?.tag?.value?.defaultLabel?? formikRootLessListKey[formikRootLessListKey.length -1];

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    props.currentApplication,
    props.applicationDeploymentMap,
  );

  // ##############################################################################################
    const handleDisplayAsStructuredElementSwitchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      log.info(
        "handleDisplayAsStructuredElementSwitchChange",
        props.rootLessListKey,
        "Switching display mode to:",
        event.target.checked
      );
      if (event.target.checked) {
        try {
          const parsedCodeMirrorValue = JSON.parse(codeMirrorValue);
          log.info(
            "handleDisplayAsStructuredElementSwitchChange Parsed CodeMirror value for structured element display:",
            mStringify(parsedCodeMirrorValue, null, 2)
          );
          // if (props.rootLessListKey && props.rootLessListKey.length > 0) {
            // Invoke onChangeVector callback if registered for this field
            const onChangeCallback = props.onChangeVector?.[props.rootLessListKey];
            if (onChangeCallback) {
              onChangeCallback(parsedCodeMirrorValue, props.rootLessListKey);
            }
            formik.setFieldValue(formikRootLessListKey, parsedCodeMirrorValue);
          // } else {
          //   formik.setValues(parsedCodeMirrorValue);
          // }
        } catch (e) {
          log.error("Failed to parse JSON in switch handler:", e);
          // Keep display mode as is in case of error
          return;
        }
      } else {
        // if switching to code editor, reset the codeMirrorValue to the current value
        // setCodeMirrorValue(safeStringify(currentValue));
        setCodeMirrorValue(JSON.stringify(currentValueObject, null, 2));
      }
      setDisplayAsStructuredElement(event.target.checked);
    },
    [
      currentValueObject,
      codeMirrorValue,
      formik,
      props.rootLessListKey,
      setCodeMirrorValue,
      setDisplayAsStructuredElement,
    ]
  );

  const resolvedTypeIsObjectOrArrayOrAny = useMemo(() => 
    !localResolvedElementJzodSchemaBasedOnValue || ["any", "object", "record", "array", "tuple"].includes(
      localResolvedElementJzodSchemaBasedOnValue.type
    ), [localResolvedElementJzodSchemaBasedOnValue]
  );

    // Switches for display mode
  const displayAsStructuredElementSwitch: JSX.Element = useMemo(
    () => (
      <>
        {!props.readOnly && resolvedTypeIsObjectOrArrayOrAny ? (
          <ThemedSwitch
            checked={displayAsStructuredElement}
            id={`displayAsStructuredElementSwitch-${props.rootLessListKey}`}
            name={`displayAsStructuredElementSwitch-${props.rootLessListKey}`}
            onChange={handleDisplayAsStructuredElementSwitchChange}
            disabled={!codeMirrorIsValidJson}
          />
        ) : (
          <></>
        )}
      </>
    ),
    [
      props.readOnly,
      resolvedTypeIsObjectOrArrayOrAny,
      displayAsStructuredElement,
      handleDisplayAsStructuredElementSwitchChange,
      codeMirrorIsValidJson,
    ]
  );
  
  // const currentValue = resolvePathOnObject(formik.values[reportSectionPathAsString], rootLessListKeyArray);
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        props.applicationDeploymentMap,
        () => ({}),
        currentMiroirModelEnvironment,
      ),
  );
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
        <ThemedOnScreenDebug
          label={`JzodAnyEditor Render ${JzodAnyEditorRenderCount} for ${rootLessListKey} format=file`}
          data={{
            reportSectionPathAsString,
            rootLessListKey,
            // rootLessListKeyArray,
            currentValueObject,
            currentValueObjectAtKey,
            formik: formik.values,
            currentTypecheckKeyMap,
          }}
          initiallyUnfolded={false}
          useCodeBlock={true}
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
      <ThemedOnScreenDebug
        label={`JzodAnyEditor Render ${JzodAnyEditorRenderCount} for ${rootLessListKey} general case`}
        data={{currentValueObject, currentValueObjectAtKey, currentTypecheckKeyMap}}
        initiallyUnfolded={false}
        useCodeBlock={true}
      />
    </div>
  );
};
