import { useFormikContext } from "formik";
import { useMemo } from "react";

import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  Domain2QueryReturnType,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
  TransformerForRuntime
} from "miroir-core";
import {
  Domain2ElementFailed,
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

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunnerView"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});


// ################################################################################################
export const InnerRunnerView = <T extends Record<string, any>>({
  runnerName,
  deploymentUuid,
  formMlSchema,
  initialFormValue,
  action,
  labelElement,
  formikValuePathAsString,
  formLabel,
  displaySubmitButton,
  useActionButton = true,
  validateOnChange = false,
  validateOnBlur = false,
  ...props
  // enableReinitialize = true,
}: RunnerProps<T>) => {
  // const domainController: DomainControllerInterface = useDomainControllerService();
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);
  const context = useMiroirContextService();
  const formikContext = useFormikContext<any>();
  
  //   log.info("RunnerView handleSubmit", action.actionType, "values", values);

  //   switch (action.actionType) {
  //     case "onSubmit": {
  //       return action.onSubmit(values, formikHelpers);
  //       break;
  //     }
  //     case "compositeAction": {
  //       log.info("RunnerView handleSubmit compositeAction", action.compositeAction);
  //       const result = await domainController.handleCompositeAction(
  //         action.compositeAction,
  //         currentMiroirModelEnvironment,
  //         values as Record<string, any>
  //       );
  //       formikHelpers.setSubmitting(false);
  //       formikHelpers.setValues(initialValues);
  //       return result;
  //       break;
  //     }
  //     case "compositeActionTemplate": {
  //       const result = await domainController.handleCompositeActionTemplate(
  //         action.compositeActionTemplate,
  //         currentMiroirModelEnvironment,
  //         values as Record<string, any>
  //       );
  //       log.info(
  //         "RunnerView handleSubmit compositeActionTemplate",
  //         action.compositeActionTemplate,
  //         "result",
  //         result
  //       );
  //       formikHelpers.setSubmitting(false);
  //       formikHelpers.setValues(initialValues);
  //       return result;
  //       break;
  //     }
  //     default: {
  //       const exhaustiveCheck: never = action;
  //       // throw new Error(`Unhandled action type: ${JSON.stringify(exhaustiveCheck)}`);
  //       return new Action2Error(
  //         "FailedToHandleAction",
  //         `Unhandled action type: ${JSON.stringify(exhaustiveCheck)}`
  //       );
  //       break;
  //     }
  //   }
  // };

  const deploymentUuidQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = useMemo(
    () =>
      formikContext.values[runnerName]?.application !== noValue.uuid && props.deploymentUuidQuery
        ? ({
            ...props.deploymentUuidQuery,
            queryParams: {
              ...(props.deploymentUuidQuery.queryParams ?? {}),
              ...formikContext.values, // letting the template access the form state
            },
          } as BoxedQueryTemplateWithExtractorCombinerTransformer)
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            deploymentUuid: "",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            extractors: {},
          },
    [
      props.deploymentUuidQuery,
      (formikContext.values as any)[runnerName]?.application,
    ]
  );

  const deploymentUuidQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults({} as any, deploymentUuidQuery);

  if (deploymentUuidQueryResults instanceof Domain2ElementFailed) { // should never happen
    throw new Error("DeleteEntityRunner: failed to get report data: " + JSON.stringify(deploymentUuidQueryResults, null, 2));
  }
  const {reportData: deploymentUuidFromApplicationUuid, resolvedQuery} = deploymentUuidQueryResults;

  const targetSchema: JzodObject = useMemo(() => {
    if (typeof formMlSchema === "object" && "formMlSchemaType" in formMlSchema) {
      if (formMlSchema.formMlSchemaType === "mlSchema") {
        return formMlSchema.mlSchema;
      } else {
        return transformer_extended_apply_wrapper(
          context.miroirContext.miroirActivityTracker, // activityTracker
          "runtime", // step
          [], // transformerPath
          "formMlSchemaAsTransformer", // transformerLabel
          formMlSchema.transformer as any as TransformerForRuntime, // TODO: correct type
          currentMiroirModelEnvironment, // TODO: the DeploymentUuid can change, need to handle that?
          { [runnerName]: { deploymentUuidQuery: deploymentUuidFromApplicationUuid } }, // transformerParams
          {}, // contextResults
          "value"
        ) as JzodObject;
      }
    } else {
      return formMlSchema as JzodObject;
    }
  }, [
    formMlSchema,
    deploymentUuidFromApplicationUuid,
    currentMiroirModelEnvironment,
    context.miroirContext.miroirActivityTracker,
  ]);

  return (
    <>
      {/* <ThemedOnScreenHelper
        label={`Runner ${runnerName} formik values`}
        data={formikContext.values}
      /> */}
      {/* <ThemedOnScreenHelper label={`Runner ${runnerName} targetSchema`} data={targetSchema} /> */}
      {/* <ThemedOnScreenHelper
        label={`Runner ${runnerName} application`}
        data={(formikContext.values as any)[runnerName]?.application}
      /> */}
      {/* <ThemedOnScreenHelper
        label={`Runner ${runnerName} deploymentUuidQuery`}
        data={deploymentUuidQuery}
      /> */}
      {/* <ThemedOnScreenHelper
        label={`Runner ${runnerName} deploymentUuidFromApplicationUuid`}
        data={deploymentUuidFromApplicationUuid}
      /> */}
      <TypedValueObjectEditor
        labelElement={labelElement}
        deploymentUuid={deploymentUuid}
        applicationSection="model"
        formValueMLSchema={targetSchema}
        // formValueMLSchema={formMlSchema}
        formikValuePathAsString={formikValuePathAsString}
        formLabel={formLabel}
        zoomInPath=""
        maxRenderDepth={Infinity}
        displaySubmitButton={displaySubmitButton}
        useActionButton={useActionButton}
      />
      {/* <ThemedOnScreenHelper
        label={`Runner ${runnerName} targetSchema`}
        data={targetSchema}
      /> */}
    </>
  );
};
