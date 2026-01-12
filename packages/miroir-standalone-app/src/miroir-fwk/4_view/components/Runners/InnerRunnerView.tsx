import { useFormikContext } from "formik";
import { useMemo } from "react";

import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  Domain2QueryReturnType,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
  TransformerForBuildPlusRuntime,
  Uuid,
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  entityDeployment,
  MiroirLoggerFactory,
  transformer_extended_apply_wrapper
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useMiroirContextService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { useQueryTemplateResults } from "../Reports/ReportHooks.js";
import { TypedValueObjectEditor } from "../Reports/TypedValueObjectEditor.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import type { RunnerProps } from "./RunnerInterface.js";
import { ThemedOnScreenDebug } from "../Themes/BasicComponents.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunnerView"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

let count = 0;

// ################################################################################################
// InnerRunnerView
// ################################################################################################
export const InnerRunnerView = <T extends Record<string, any>>({
  runnerName,
  application,
  applicationDeploymentMap,
  // deploymentUuid,
  formMLSchema,
  initialFormValue,
  action,
  // labelElement,
  formikValuePathAsString,
  formLabel,
  displaySubmitButton,
  useActionButton = false,
  validateOnChange = false,
  validateOnBlur = false,
  ...props
  // enableReinitialize = true,
}: RunnerProps<T>) => {
  count += 1;
  const context = useMiroirContextService();
  const formikContext = useFormikContext<any>();
  const currentApplication: Uuid = application??formikContext.values[runnerName]?.application;
  const currentDeploymentUuid: Uuid = applicationDeploymentMap[currentApplication] || "";
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    currentApplication,
    applicationDeploymentMap
  );
  
  const deploymentUuidFromApplicationUuid: Uuid = applicationDeploymentMap[currentApplication] || "";

  const targetSchema: JzodObject = useMemo(() => {
    if (typeof formMLSchema === "object" && "formMLSchemaType" in formMLSchema) {
      if (formMLSchema.formMLSchemaType === "mlSchema") {
        return formMLSchema.mlSchema;
      } else {
        return transformer_extended_apply_wrapper(
          context.miroirContext.miroirActivityTracker, // activityTracker
          "runtime", // step
          [], // transformerPath
          "formMlSchemaAsTransformer", // transformerLabel
          formMLSchema.transformer as any as TransformerForBuildPlusRuntime, // TODO: correct type
          currentMiroirModelEnvironment, // TODO: the DeploymentUuid can change, need to handle that?
          { [runnerName]: formikContext.values[runnerName] }, // transformerParams
          // { [runnerName]: { deploymentUuidQuery: deploymentUuidFromApplicationUuid } }, // transformerParams
          {}, // contextResults
          "value"
        ) as JzodObject;
      }
    } else {
      return formMLSchema as JzodObject;
    }
  }, [
    formMLSchema,
    deploymentUuidFromApplicationUuid,
    currentMiroirModelEnvironment,
    context.miroirContext.miroirActivityTracker,
  ]);

  return (
    <>
      <ThemedOnScreenDebug
        label={`Runner ${runnerName} formik values`}
        data={formikContext.values}
        initiallyUnfolded={false}
        copyButton={true}
        useCodeBlock={true}
      />
      <ThemedOnScreenDebug
        label={`Runner ${runnerName} count ${count} targetSchema`}
        data={targetSchema}
        initiallyUnfolded={false}
        copyButton={true}
        useCodeBlock={true}
      />
      <ThemedOnScreenDebug
        label={`Runner ${runnerName} currentApplication ${currentApplication}`}
        data={currentApplication}
        initiallyUnfolded={false}
        // copyButton={true}
        // useCodeBlock={true}
      />
      <ThemedOnScreenDebug
        label={`Runner ${runnerName} deploymentUuidFromApplicationUuid`}
        data={deploymentUuidFromApplicationUuid}
        initiallyUnfolded={false}
        copyButton={true}
        useCodeBlock={true}
      />
      <TypedValueObjectEditor
        labelElement={<h2>{formLabel}</h2>}
        application={currentApplication}
        applicationDeploymentMap={applicationDeploymentMap}
        deploymentUuid={currentDeploymentUuid}
        applicationSection="model"
        formValueMLSchema={targetSchema}
        formikValuePathAsString={formikValuePathAsString}
        formLabel={formLabel}
        zoomInPath=""
        maxRenderDepth={Infinity}
        displaySubmitButton={displaySubmitButton}
        useActionButton={useActionButton}
        valueObjectEditMode="create" // N/A
      />
      {/* <ThemedOnScreenHelper
        label={`Runner ${runnerName} targetSchema`}
        data={targetSchema}
      /> */}
    </>
  );
};
