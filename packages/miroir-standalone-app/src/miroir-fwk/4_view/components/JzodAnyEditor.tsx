

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
import { getJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodAnyEditorProps } from "./JzodElementEditorInterface";
import { ChangeValueTypeSelect } from "./ChangeValueTypeSelect";
import { JzodElement, JzodSchema } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

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
    rootLesslistKey,
    rootLesslistKeyArray,
    rawJzodSchema,
    currentDeploymentUuid,
    currentApplicationSection,
    foreignKeyObjects,
    unionInformation,
    resolvedElementJzodSchema, // handleSelectLiteralChange,
    label,
    insideAny,
    // indentLevel,
    // visible = true, // added visibility prop
  } = props;
    const { formik, currentModel, miroirMetaModel,  } = getJzodElementEditorHooks(props, JzodAnyEditorRenderCount, "JzodAnyEditor");
  
  const currentValue = resolvePathOnObject(formik.values, rootLesslistKeyArray);


  return (
    <div key={rootLesslistKey}>
      <div>
        <ChangeValueTypeSelect
          onChange={(type: JzodElement) => {
            log.info(
              `JzodAnyEditor: Change value type to ${type} for ${rootLesslistKey}`
            );
            const defaultValue = getDefaultValueForJzodSchemaWithResolution(
              type,
              miroirFundamentalJzodSchema as JzodSchema, // context.miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel
            )
            formik.setFieldValue(rootLesslistKey, defaultValue, false);
          }}
          // currentType={resolvedElementJzodSchema?.type || "undefined"}
        />
        <label>{label || "Any Value"}</label>
      </div>
      <div>
        <JzodElementEditor
          name={name}
          listKey={listKey}
          rootLesslistKey={rootLesslistKey}
          rootLesslistKeyArray={rootLesslistKeyArray}
          rawJzodSchema={rawJzodSchema}
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          unionInformation={unionInformation}
          resolvedElementJzodSchema={resolvedElementJzodSchema}
          label={label}
          foreignKeyObjects={foreignKeyObjects}
          insideAny={true}
          indentLevel={0}
          returnsEmptyElement={resolvedElementJzodSchema?.type === "undefined" ? true : false}
        />
      </div>
    </div>
  );

};
