

import {
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  LoggerInterface,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
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
import { ThemedOnScreenDebug } from "../Themes/BasicComponents";
import { JzodElementEditor } from "./JzodElementEditor";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodAnyEditorProps } from "./JzodElementEditorInterface";
import { ThemedLabeledEditor } from "../Themes/FormComponents.js";
import { ThemedDisplayValue } from "../Themes/DisplayComponents.js";
import { FileSelector } from "../Themes/FileSelector.js";
import { useCallback, useState } from "react";

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
    currentValueObject,
    currentValueObjectAtKey: currentValue,
    formikRootLessListKey,
    localResolvedElementJzodSchemaBasedOnValue,
    currentModel,
    miroirMetaModel,
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
    currentValueObject || undefined,
  );
  const [fileError, setFileError] = useState<string | undefined>(undefined);

  const setSelectedFileContents = useCallback(
    (metaModel: MetaModel | undefined) => {
      formik.setFieldValue(formikRootLessListKey, metaModel);
    },
    [formikRootLessListKey, formik],
  );

  const format = localResolvedElementJzodSchemaBasedOnValue?.tag?.value?.display?.any?.format;

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    props.currentApplication,
    props.applicationDeploymentMap,
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

  if (format === "file") {
    // if (readOnly) {
    //   return (
    //     <ThemedLabeledEditor
    //       labelElement={labelElement ?? <>{name}</>}
    //       editor={<ThemedDisplayValue value={currentValue} type="string" />}
    //     />
    //   );
    // }
    return (
      <>
      fomat = "file"
      <ThemedLabeledEditor
        labelElement={labelElement ?? <>{name}</>}
        editor={
          <FileSelector
            title=""
            buttonLabel={"Select File"}
            accept={"*.json"}
            folder={format === "folder"}
            setSelectedFileContents={setSelectedFileContents}
            setSelectedFileError={setFileError}
            setSelectedFileName={setSelectedFileName}
            selectedFileName={selectedFileName}
            error={fileError}
            showBorder={false}
            compact={true}
            style={{ marginBottom: 0 }}
          />
        }
      />
      </>
    );
  }

  return (
    <div key={rootLessListKey}>
      {/* <ThemedOnScreenHelper label="JzodAnyEditor" data={rootLessListKey} /> */}
      <ThemedOnScreenDebug
        label={`JzodAnyEditor Render Count for ${rootLessListKey} ${JzodAnyEditorRenderCount}`}
        data={(typeCheckKeyMap ?? {})[rootLessListKey]}
        initiallyUnfolded={false}
        useCodeBlock={true}
      />
      <div>
        <ChangeValueTypeSelect
          onChange={(type: JzodElement) => {
            log.info(`JzodAnyEditor: Change value type to ${type} for ${rootLessListKey}`);
            const defaultValue = getDefaultValueForJzodSchemaWithResolutionNonHook(
              "build",
              type,
              // formik.values[reportSectionPathAsString],
              currentValueObject,
              rootLessListKey,
              undefined, // currentDefaultValue is not known yet, this is what this call will determine
              [], // currentPath on value is root
              true, // force optional attributes to receive a default value
              props.currentApplication,
              props.applicationDeploymentMap,
              currentDeploymentUuid,
              currentMiroirModelEnvironment,
              {}, // transformerParams
              {}, // contextResults
              deploymentEntityState,
            );
            // formik.setFieldValue(rootLessListKey, defaultValue, false);
            formik.setFieldValue(formikRootLessListKey, defaultValue, false);
          }}
        />
        {/* <label>{label || "Any Value"}</label> */}
        {labelElement ?? <>No label</>}
      </div>
      <div>
        <JzodElementEditor
          name={name}
          valueObjectEditMode={props.valueObjectEditMode}
          existingObject={props.existingObject}
          listKey={listKey}
          rootLessListKey={rootLessListKey}
          rootLessListKeyArray={rootLessListKeyArray}
          reportSectionPathAsString={reportSectionPathAsString}
          currentApplication={props.currentApplication}
          applicationDeploymentMap={props.applicationDeploymentMap}
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          resolvedElementJzodSchemaDEFUNCT={resolvedElementJzodSchema}
          typeCheckKeyMap={typeCheckKeyMap}
          labelElement={<>{name}</>}
          foreignKeyObjects={foreignKeyObjects}
          insideAny={true}
          indentLevel={0}
          returnsEmptyElement={resolvedElementJzodSchema?.type === "undefined" ? true : false}
          readOnly={props.readOnly}
        />
        {/* <JzodElementEditorReactCodeMirror
          formikRootLessListKey={formikRootLessListKey}
          initialValue={JSON.stringify(currentValueObjectAtKey, null, 2)}
          codeMirrorValue={codeMirrorValue}
          setCodeMirrorValue={setCodeMirrorValue}
          codeMirrorIsValidJson={codeMirrorIsValidJson}
          setCodeMirrorIsValidJson={setCodeMirrorIsValidJson}
          rootLessListKey={props.rootLessListKey}
          rootLessListKeyArray={props.rootLessListKeyArray}
          hidden={!displayAsCodeEditor}
          insideAny={props.insideAny}
          isUnderTest={isUnderTest}
          displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
        /> */}
      </div>
    </div>
  );
};
