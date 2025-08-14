

import {
  ReduxDeploymentsState,
  getDefaultValueForJzodSchemaWithResolution,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  LoggerInterface,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resolvePathOnObject,
  SyncBoxedExtractorOrQueryRunnerMap
} from "miroir-core";

import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { JzodElementEditor } from "./JzodElementEditor";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodAnyEditorProps } from "./JzodElementEditorInterface";
import { ChangeValueTypeSelect } from "../ChangeValueTypeSelect";
import { JzodElement, JzodSchema } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { measuredUseJzodElementEditorHooks } from "../../tools/hookPerformanceMeasure";
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo } from "miroir-localcache-redux";
import { useSelector } from "react-redux";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodAnyEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

let JzodAnyEditorRenderCount: number = 0;
export const JzodAnyEditor: React.FC<JzodAnyEditorProps> = (
  props: JzodAnyEditorProps
) => {
  JzodAnyEditorRenderCount++;
  const {
    name,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    // rawJzodSchema,
    currentDeploymentUuid,
    currentApplicationSection,
    foreignKeyObjects,
    resolvedElementJzodSchema, // handleSelectLiteralChange,
    foldedObjectAttributeOrArrayItems,
    setFoldedObjectAttributeOrArrayItems,
    // localRootLessListKeyMap,
    labelElement,
    insideAny,
    typeCheckKeyMap,
    // indentLevel,
    // visible = true, // added visibility prop
  } = props;
    // const { formik, currentModel, miroirMetaModel } = useJzodElementEditorHooks(
    const { formik, currentModel, miroirMetaModel } = measuredUseJzodElementEditorHooks(
      props,
      JzodAnyEditorRenderCount,
      "JzodAnyEditor"
    );
  
  const currentValue = resolvePathOnObject(formik.values, rootLessListKeyArray);
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
      getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(state.presentModelSnapshot.current, () => ({}))
  );


  return (
    <div key={rootLessListKey}>
      <div>
        <ChangeValueTypeSelect
          onChange={(type: JzodElement) => {
            log.info(
              `JzodAnyEditor: Change value type to ${type} for ${rootLessListKey}`
            );
            const defaultValue = getDefaultValueForJzodSchemaWithResolutionNonHook(
              type,
              formik.values,
              rootLessListKey,
              undefined, // currentDefaultValue is not known yet, this is what this call will determine
              [], // currentPath on value is root
              deploymentEntityState,
              true, // force optional attributes to receive a default value
              currentDeploymentUuid,
              miroirFundamentalJzodSchema as JzodSchema, // context.miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
            )
            formik.setFieldValue(rootLessListKey, defaultValue, false);
          }}
          // currentType={resolvedElementJzodSchema?.type || "undefined"}
        />
        {/* <label>{label || "Any Value"}</label> */}
        {labelElement ?? <></>}
      </div>
      <div>
        <JzodElementEditor
          name={name}
          listKey={listKey}
          rootLessListKey={rootLessListKey}
          rootLessListKeyArray={rootLessListKeyArray}
          // rawJzodSchema={rawJzodSchema}
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          resolvedElementJzodSchema={resolvedElementJzodSchema}
          typeCheckKeyMap={typeCheckKeyMap}
          foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
          setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
          // localRootLessListKeyMap={localRootLessListKeyMap}
          labelElement={<></>}
          foreignKeyObjects={foreignKeyObjects}
          insideAny={true}
          indentLevel={0}
          returnsEmptyElement={resolvedElementJzodSchema?.type === "undefined" ? true : false}
        />
      </div>
    </div>
  );

};
