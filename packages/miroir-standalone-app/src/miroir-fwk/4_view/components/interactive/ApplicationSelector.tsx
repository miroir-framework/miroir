import {
  type JzodObject,
  type LoggerInterface,
  MiroirLoggerFactory,
  adminConfigurationDeploymentAdmin,
  adminSelfApplication,
  defaultSelfApplicationDeploymentMap,
  entityApplicationForAdmin,
  noValue,
  selfApplicationMiroir,
} from "miroir-core";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { TypedValueObjectEditorWithFormik } from "../Reports/TypedValueObjectEditorWithFormik";
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
  const application = adminSelfApplication.uuid;
  const deploymentUuid = adminConfigurationDeploymentAdmin.uuid;
  const formikValuePathAsString = "applicationSelector";
  const formLabel = "Select Application to delete";

  // ##############################################################################################
  const formMLSchema: JzodObject = useMemo(
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
              },
            },
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
                    objectUuidAttributeLabelPosition: "hidden",
                    objectHideDeleteButton: true,
                    uuid: {
                      selector: "muiSelector", // "portalSelector" or "muiSelector"
                    },
                  },
                  foreignKeyParams: {
                    targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                    targetEntity: entityApplicationForAdmin.uuid,
                    targetEntityFilterInstancesBy: {
                      attributeName: "uuid",
                      not: true,
                      values: [noValue.uuid, selfApplicationMiroir.uuid, adminSelfApplication.uuid],
                    },
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
    // log.info(
    //   "ApplicationSelector: got new mode:",
    //   // formikContext.values.transformerEditor_transformer_selector.mode
    //   persistedToolsPageState?.applicationSelector
    // );
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

  const onChangeVector = useMemo(
    () => {
      const vector = {
        application: (value: any, rootLessListKey: string) => {
          onApplicationChange(value);
          // log.info("ApplicationSelector set currentInnerApplication done:", applicationUuid);
        },
      };
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
      // log.info(
      //   "ApplicationSelector: debounced update - pushing applicationUuid to context:",
      //   applicationUuid
      // );
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
        valueObjectEditMode="update"
        labelElement={labelElement}
        application={application}
        applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
        deploymentUuid={deploymentUuid}
        applicationSection="model"
        initialValueObject={initialFormValue}
        formValueMLSchema={formMLSchema}
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
