

import {
  getDefaultValueForJzodSchemaWithResolution,
  LoggerInterface,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resolvePathOnObject
} from "miroir-core";

import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { JzodElementEditor } from "./JzodElementEditor";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodAnyEditorProps } from "./JzodElementEditorInterface";
import { ChangeValueTypeSelect } from "./ChangeValueTypeSelect";
import { JzodElement, JzodSchema } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { measuredUseJzodElementEditorHooks } from "../tools/hookPerformanceMeasure";

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
    rawJzodSchema,
    currentDeploymentUuid,
    currentApplicationSection,
    foreignKeyObjects,
    unionInformation,
    resolvedElementJzodSchema, // handleSelectLiteralChange,
    localRootLessListKeyMap,
    labelElement,
    insideAny,
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


  return (
    <div key={rootLessListKey}>
      <div>
        <ChangeValueTypeSelect
          onChange={(type: JzodElement) => {
            log.info(
              `JzodAnyEditor: Change value type to ${type} for ${rootLessListKey}`
            );
            const defaultValue = getDefaultValueForJzodSchemaWithResolution(
              type,
              miroirFundamentalJzodSchema as JzodSchema, // context.miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel
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
          rawJzodSchema={rawJzodSchema}
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          unionInformation={unionInformation}
          resolvedElementJzodSchema={resolvedElementJzodSchema}
          localRootLessListKeyMap={localRootLessListKeyMap}
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
