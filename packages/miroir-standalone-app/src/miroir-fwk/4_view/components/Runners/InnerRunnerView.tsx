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


// ################################################################################################
export const InnerRunnerView = <T extends Record<string, any>>({
  runnerName,
  application,
  applicationDeploymentMap,
  deploymentUuid,
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
  // const domainController: DomainControllerInterface = useDomainControllerService();
  // const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);
  const context = useMiroirContextService();
  const formikContext = useFormikContext<any>();
  const currentApplication: Uuid = application??formikContext.values[runnerName]?.application;
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    currentApplication,
    applicationDeploymentMap
  );
  
  const deploymentUuidFromApplicationUuid: Uuid = applicationDeploymentMap[currentApplication] || "";
  // const deploymentUuidQueryBase:
  //   | BoxedQueryWithExtractorCombinerTransformer
  //   | BoxedQueryTemplateWithExtractorCombinerTransformer
  //   | undefined = {
  //   queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  //   application,
  //   applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
  //   deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //   pageParams: {},
  //   queryParams: {},
  //   contextResults: {},
  //   extractorTemplates: {
  //     deployments: {
  //       label: "deployments of the application",
  //       extractorTemplateType: "extractorTemplateForObjectListByEntity",
  //       parentUuid: entityDeployment.uuid,
  //       parentName: entityDeployment.name,
  //       applicationSection: "data",
  //       filter: {
  //         attributeName: "adminApplication",
  //         value: {
  //           transformerType: "mustacheStringTemplate",
  //           interpolation: "build",
  //           definition: `{{${runnerName}.application}}`,
  //         },
  //       },
  //     },
  //   },
  // } as BoxedQueryTemplateWithExtractorCombinerTransformer;
  // const deploymentUuidQuery:
  //   | BoxedQueryWithExtractorCombinerTransformer
  //   | BoxedQueryTemplateWithExtractorCombinerTransformer
  //   | undefined = useMemo(
  //   () =>
  //     formikContext.values[runnerName]?.application !== noValue.uuid && deploymentUuidQueryBase
  //       ? ({
  //           ...deploymentUuidQueryBase,
  //           queryParams: {
  //             ...(deploymentUuidQueryBase.queryParams ?? {}),
  //             ...formikContext.values, // letting the template access the form state
  //           },
  //         } as BoxedQueryTemplateWithExtractorCombinerTransformer)
  //       : {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           application,
  //           applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
  //           deploymentUuid: "",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           extractors: {},
  //         },
  //   [
  //     deploymentUuidQueryBase,
  //     (formikContext.values as any)[runnerName]?.application,
  //   ]
  // );

  // const deploymentUuidQueryResults: Domain2QueryReturnType<
  //   Domain2QueryReturnType<Record<string, any>>
  // > = useQueryTemplateResults({} as any, deploymentUuidQuery);

  // if (deploymentUuidQueryResults instanceof Domain2ElementFailed) { // should never happen
  //   throw new Error("DeleteEntityRunner: failed to get report data: " + JSON.stringify(deploymentUuidQueryResults, null, 2));
  // }
  // const {reportData: deploymentUuidFromApplicationUuid, resolvedQuery} = deploymentUuidQueryResults;

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
          { [runnerName]: { deploymentUuidQuery: deploymentUuidFromApplicationUuid } }, // transformerParams
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
        label={`Runner ${runnerName} targetSchema`}
        data={targetSchema}
        initiallyUnfolded={false}
        copyButton={true}
        useCodeBlock={true}
      />
      <ThemedOnScreenDebug
        label={`Runner ${runnerName} application ${application}`}
        data={application}
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
        deploymentUuid={deploymentUuid}
        applicationSection="model"
        formValueMLSchema={targetSchema}
        formikValuePathAsString={formikValuePathAsString}
        formLabel={formLabel}
        zoomInPath=""
        maxRenderDepth={Infinity}
        displaySubmitButton={displaySubmitButton}
        useActionButton={useActionButton}
        mode="create" // N/A
      />
      {/* <ThemedOnScreenHelper
        label={`Runner ${runnerName} targetSchema`}
        data={targetSchema}
      /> */}
    </>
  );
};
