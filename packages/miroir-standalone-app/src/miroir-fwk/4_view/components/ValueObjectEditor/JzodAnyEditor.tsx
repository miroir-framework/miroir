import { useMemo } from "react";


import {
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  LoggerInterface,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  resolvePathOnObject,
  SyncBoxedExtractorOrQueryRunnerMap,
  type MiroirModelEnvironment
} from "miroir-core";

import { JzodElement, JzodSchema } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo } from "miroir-localcache-redux";
import { useSelector } from "react-redux";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useMiroirContextService } from "../../MiroirContextReactProvider";
import { measuredUseJzodElementEditorHooks } from "../../tools/hookPerformanceMeasure";
import { ChangeValueTypeSelect } from "../ChangeValueTypeSelect";
import { JzodElementEditor } from "./JzodElementEditor";
import { JzodAnyEditorProps } from "./JzodElementEditorInterface";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { ThemedOnScreenHelper } from "../Themes";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodAnyEditor"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

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
    typeCheckKeyMap,
  } = props;
  
  const {
    formik,
    currentValueObject,
    currentValueObjectAtKey: currentValue,
    formikRootLessListKey,
    currentModel,
    miroirMetaModel,
  } = useJzodElementEditorHooks(
    props.rootLessListKey,
    props.rootLessListKeyArray,
    reportSectionPathAsString,
    props.typeCheckKeyMap,
    props.currentDeploymentUuid,
    JzodAnyEditorRenderCount,
    "JzodAnyEditor"
  );

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      currentModel: currentModel,
      miroirMetaModel: miroirMetaModel,
    };
  }, [context.miroirFundamentalJzodSchema, currentModel, miroirMetaModel]);

  // const currentValue = resolvePathOnObject(formik.values[reportSectionPathAsString], rootLessListKeyArray);
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        () => ({}),
        currentMiroirModelEnvironment
      )
  );

  return (
    <div key={rootLessListKey}>
      {/* <ThemedOnScreenHelper label="JzodAnyEditor" data={rootLessListKey} /> */}
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
          listKey={listKey}
          rootLessListKey={rootLessListKey}
          rootLessListKeyArray={rootLessListKeyArray}
          reportSectionPathAsString={reportSectionPathAsString}
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          resolvedElementJzodSchemaDEFUNCT={resolvedElementJzodSchema}
          typeCheckKeyMap={typeCheckKeyMap}
          labelElement={<></>}
          foreignKeyObjects={foreignKeyObjects}
          insideAny={true}
          indentLevel={0}
          returnsEmptyElement={resolvedElementJzodSchema?.type === "undefined" ? true : false}
          readOnly={props.readOnly}
        />
      </div>
    </div>
  );
};
