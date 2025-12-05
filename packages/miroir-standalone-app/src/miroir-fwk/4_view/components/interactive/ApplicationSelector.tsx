import {
  type JzodObject,
  type LoggerInterface,
  MiroirLoggerFactory,
  adminConfigurationDeploymentAdmin,
  entityApplicationForAdmin,
} from "miroir-core";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { TypedValueObjectEditorWithFormik } from "../Reports/TypedValueObjectEditorWithFormik";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useMiroirContextService } from "../../MiroirContextReactProvider";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ApplicationSelector"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

export const ApplicationSelector: FC<{
  applicationUuid: string | undefined;
  onApplicationChange: (applicationUuid: string) => void;
}> = ({ applicationUuid, onApplicationChange }) => {
  const runnerName: string = "ApplicationSelector";
  const context = useMiroirContextService();
  const persistedToolsPageState: any = context.toolsPageState;
  
  // Ref for debouncing application UUID updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const labelElement = useMemo(
    () => (
      <>
        {/* <AutoStories style={{ verticalAlign: "middle", marginRight: 4 }} />  */}
        {/* Application Selector */}
      </>
    ),
    []
  );
  const deploymentUuid = adminConfigurationDeploymentAdmin.uuid;
  const formikValuePathAsString = "applicationSelector";
  const formLabel = "Select Application to delete";

  // ##############################################################################################
  const formMlSchema: JzodObject = useMemo(
    () => ({
      type: "object",
      definition: {
        [formikValuePathAsString]: {
          type: "object",
          tag: {
            value: {
              defaultLabel: "Application Selector",
              display: {
                // unfoldSubLevels: 1,
                objectWithoutHeader: true,
                objectOrArrayWithoutFrame: true,
                objectAttributesNoIndent: true,
              }
            }
          },
          definition: {
            application: {
              type: "uuid",
              nullable: true,
              tag: {
                value: {
                  defaultLabel: "Application",
                  editable: true,
                  display: {
                    objectUuidAttributeLabelPosition: "stacked",
                    objectHideDeleteButton: true,
                  },
                  selectorParams: {
                    targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                    targetEntity: entityApplicationForAdmin.uuid,
                    targetEntityOrderInstancesBy: "name",
                  },
                },
              },
            },
          },
        },
      },
    }),
    []
  );

  // ##################################################################################
  // transformerEditor_transformer_selector initial load, persistedState -> formik
  const initialSelectorValue = useMemo(() => {
    log.info(
      "ApplicationSelector: got new mode:",
      // formikContext.values.transformerEditor_transformer_selector.mode
      persistedToolsPageState?.applicationSelector
    );
    return persistedToolsPageState?.applicationSelector?? noValue.uuid;
  }, []);

  // ##############################################################################################
  const initialFormValue = useMemo(() => {
    return {
      applicationSelector: {
        application: initialSelectorValue,
      },
    };
  }, []);


  // const [currentInnerApplication, setCurrentInnerApplication] = useState<string>(noValue.uuid);

  // const context = useMiroirContextService();
  // const currentMiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);
  const onChangeVector = useMemo(
    () => {
      const vector = {
        // "applicationSelector.application": (value: any, rootLessListKey: string) => {
        application: (value: any, rootLessListKey: string) => {
          log.info("ApplicationSelector observed application change", value, rootLessListKey);
          onApplicationChange(value);
          // setCurrentInnerApplication(value);
          // log.info("ApplicationSelector set currentInnerApplication done:", applicationUuid);
        },
      };
      log.info("ApplicationSelector creating onChangeVector", Object.keys(vector), vector);
      return vector;
    },
    [onApplicationChange]
  );

  // Debounced update to persisted state when applicationUuid changes
  // formik -> persistedToolsPageState
  useEffect(() => {
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Only update if applicationUuid is defined and not the default noValue
    if (
      !applicationUuid ||
      applicationUuid === noValue.uuid ||
      persistedToolsPageState?.applicationSelector === applicationUuid
    ) {
      return;
    }
    
    // Debounce the update - only push to context after 2 seconds of no changes
    updateTimeoutRef.current = setTimeout(() => {
      log.info(
        "ApplicationSelector: debounced update - pushing applicationUuid to context:",
        applicationUuid
      );
      // context.updateToolsPageStateDEFUNCT({
      //   ...persistedToolsPageState,
      //   applicationSelector: applicationUuid,
      // });
      onApplicationChange(applicationUuid);
    }, 2000); // 2 second debounce
    
    // Cleanup timeout on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [applicationUuid, context]);

  return (
    <
    >
      {/* <ThemedOnScreenHelper
        label={`ApplicationSelector: applicationUuid "${applicationUuid}"`}
        // data={{ applicationUuid, currentInnerApplication, onChangeVector }}
        data={{
          onChangeVector,
          keys: Object.keys(onChangeVector),
          hasfunc: onChangeVector["application"] ? "defined" : "undefined",
          func: onChangeVector["application"].toString(),
        }}
      /> */}
      <TypedValueObjectEditorWithFormik
        mode="update"
        labelElement={labelElement}
        deploymentUuid={deploymentUuid}
        applicationSection="model"
        initialValueObject={initialFormValue}
        formValueMLSchema={formMlSchema}
        formikValuePathAsString={formikValuePathAsString}
        formLabel={formLabel}
        zoomInPath=""
        onChangeVector={onChangeVector}
        maxRenderDepth={Infinity}
        displaySubmitButton="noDisplay"
        useActionButton={false}
        onSubmit={(data: any) => {
          log.info("Application Selector submitted data", data);
          return Promise.resolve();
        }}
      />
    </>
  );
};
