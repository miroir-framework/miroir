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
  const context = useMiroirContextService();
  const {
    name,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    currentDeploymentUuid,
    currentApplicationSection,
    foreignKeyObjects,
    resolvedElementJzodSchema, // handleSelectLiteralChange,
    foldedObjectAttributeOrArrayItems,
    setFoldedObjectAttributeOrArrayItems,
    labelElement,
    insideAny,
    typeCheckKeyMap,
  } = props;
  const { formik, currentModel, miroirMetaModel } = measuredUseJzodElementEditorHooks(
    props,
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

  const currentValue = resolvePathOnObject(formik.values, rootLessListKeyArray);
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
      <div>
        <ChangeValueTypeSelect
          onChange={(type: JzodElement) => {
            log.info(`JzodAnyEditor: Change value type to ${type} for ${rootLessListKey}`);
            const defaultValue = getDefaultValueForJzodSchemaWithResolutionNonHook(
              type,
              formik.values,
              rootLessListKey,
              undefined, // currentDefaultValue is not known yet, this is what this call will determine
              [], // currentPath on value is root
              deploymentEntityState,
              true, // force optional attributes to receive a default value
              currentDeploymentUuid,
              currentMiroirModelEnvironment
            );
            formik.setFieldValue(rootLessListKey, defaultValue, false);
          }}
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
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          resolvedElementJzodSchema={resolvedElementJzodSchema}
          typeCheckKeyMap={typeCheckKeyMap}
          foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
          setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
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
