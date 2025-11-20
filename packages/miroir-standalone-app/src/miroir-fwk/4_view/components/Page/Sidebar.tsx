import { FC, useMemo, useState, useRef, useCallback, useEffect } from 'react';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft.js';
import ChevronRightIcon from '@mui/icons-material/ChevronRight.js';

// import AutoStories from '@mui/icons-material/AutoStories';
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentParis,
  entityApplicationForAdmin,
  LoggerInterface,
  menuDefaultAdmin,
  menuDefaultLibrary,
  menuDefaultMiroir,
  MiroirLoggerFactory,
  type JzodObject
} from "miroir-core";
import { defaultMenuParisUuid, packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { SidebarSection } from './SidebarSection.js';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { 
  ThemedDrawer, 
  ThemedDrawerHeader, 
  ThemedResizeHandle, 
  ThemedDivider, 
  ThemedIconButton,
  ThemedScrollableContent 
} from "../Themes/index"
import { OuterRunnerView } from '../Runners/OuterRunnerView.js';
import { noValue } from '../ValueObjectEditor/JzodElementEditorInterface.js';
import { TypedValueObjectEditorWithFormik } from '../Reports/TypedValueObjectEditorWithFormik.js';
import { useMiroirContextService } from '../../MiroirContextReactProvider.js';
import { useCurrentModelEnvironment } from '../../ReduxHooks.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Sidebar"), "UI",
).then((logger: LoggerInterface) => {log = logger});
// ################################################################################################
export const SidebarWidth = 200;

const ApplicationSelector: FC<{
  onApplicationChange?: (applicationUuid: string) => void
}> = () => {
  const runnerName: string = "deleteApplication";

  const formMlSchema: JzodObject = useMemo(
    () => ({
      type: "object",
      definition: {
        applicationSelector: {
          type: "object",
          definition: {
            application: {
              type: "uuid",
              nullable: true,
              tag: {
                value: {
                  defaultLabel: "Application",
                  editable: true,
                  selectorParams: {
                    targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                    targetEntity: entityApplicationForAdmin.uuid,
                    targetEntityOrderInstancesBy: "name",
                  },
                },
              },
            },
          }
        }
      },
    }),
    []
  );

  const initialFormValue = useMemo(() => {
    return {
      applicationSelector: {
        application: noValue.uuid,
      },
    };
  }, []);

  // const deleteApplicationActionTemplate = useMemo((): CompositeActionTemplate => {
  //   return {
  //     actionType: "compositeAction",
  //     actionLabel: "deleteApplicationAndDeployment",
  //     actionName: "sequence",
  //     definition: [
  //       // Step 1: Query to get the deployment UUID from the selected application
  //       {
  //         actionType: "compositeRunBoxedExtractorOrQueryAction",
  //         actionLabel: "getDeploymentForApplication",
  //         nameGivenToResult: "deploymentInfo",
  //         query: {
  //           actionType: "runBoxedExtractorOrQueryAction",
  //           actionName: "runQuery",
  //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //           deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //           payload: {
  //             applicationSection: "data",
  //             query: {
  //               queryType: "boxedQueryWithExtractorCombinerTransformer",
  //               deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //               pageParams: {},
  //               queryParams: {},
  //               contextResults: {},
  //               extractors: {
  //                 deployments: {
  //                   label: "deployments of the application",
  //                   extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //                   parentUuid: entityDeployment.uuid,
  //                   parentName: entityDeployment.name,
  //                   applicationSection: "data",
  //                   filter: {
  //                     attributeName: "adminApplication",
  //                     value: {
  //                       transformerType: "mustacheStringTemplate",
  //                       interpolation: "build",
  //                       definition: "{{deleteApplicationAndDeployment.application}}",
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       // Step 2: Delete the store
  //       {
  //         actionType: "storeManagementAction_deleteStore",
  //         actionLabel: "deleteStore",
  //         endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //         deploymentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           interpolation: "runtime",
  //           definition: "{{deploymentInfo.deployments.0.uuid}}",
  //         } as any,
  //         configuration: {
  //           transformerType: "getFromContext",
  //           interpolation: "runtime",
  //           // definition: "{{deploymentInfo.deployments.0.configuration}}",
  //           referencePath: ["deploymentInfo","deployments",0,"configuration"],
  //         } as any,
  //       },
  //       // Step 3: Delete the Deployment instance from admin
  //       {
  //         actionType: "deleteInstance",
  //         actionLabel: "deleteDeployment",
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //         payload: {
  //           applicationSection: "data",
  //           objects: [
  //             {
  //               parentUuid: entityDeployment.uuid,
  //               applicationSection: "data",
  //               instances: [
  //                 {
  //                   parentUuid: entityDeployment.uuid,
  //                   uuid: {
  //                     transformerType: "mustacheStringTemplate",
  //                     interpolation: "runtime",
  //                     definition: "{{deploymentInfo.deployments.0.uuid}}",
  //                   } as any,
  //                 },
  //               ],
  //             },
  //           ],
  //         } as any,
  //       },
  //       // Step 4: Delete the AdminApplication instance
  //       {
  //         actionType: "deleteInstance",
  //         actionLabel: "deleteAdminApplication",
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //         payload: {
  //           applicationSection: "data",
  //           objects: [
  //             {
  //               parentUuid: entityApplicationForAdmin.uuid,
  //               applicationSection: "data",
  //               instances: [
  //                 {
  //                   parentUuid: entityApplicationForAdmin.uuid,
  //                   uuid: {
  //                     transformerType: "mustacheStringTemplate",
  //                     interpolation: "build",
  //                     definition: "{{deleteApplicationAndDeployment.application}}",
  //                   } as any,
  //                 },
  //               ],
  //             },
  //           ],
  //         } as any,
  //       },
  //     ],
  //   };
  // }, []);
  const labelElement = useMemo(
    () => (
      <>
        {/* <AutoStories style={{ verticalAlign: "middle", marginRight: 4 }} />  */}
        Application Selector
      </>
    ),
    []
  );
  const deploymentUuid = adminConfigurationDeploymentAdmin.uuid;
  const formikValuePathAsString = "applicationSelector";
  const formLabel = "Select Application to delete";

  // const context = useMiroirContextService();
  // const currentMiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);

  return (
    <TypedValueObjectEditorWithFormik
      labelElement={labelElement}
      deploymentUuid={deploymentUuid}
      applicationSection="model"
      initialValueObject={initialFormValue}
      formValueMLSchema={formMlSchema}
      formikValuePathAsString={formikValuePathAsString}
      formLabel={formLabel}
      zoomInPath=""
      onChangeVector={{
        application: (value: any, rootLessListKey: string) => {
          log.info("ApplicationSelector observed application change", value, rootLessListKey);
        },
      }}
      maxRenderDepth={Infinity}
      displaySubmitButton="noDisplay"
      useActionButton={false}
      onSubmit={(data: any) => {
        log.info("Application Selector submitted data", data);
        return Promise.resolve();
      }}
    />

    // <OuterRunnerView
    //   runnerName={runnerName}
    //   deploymentUuid={deploymentUuid}
    //   formMlSchema={formMlSchema}
    //   initialFormValue={initialFormValue}
    //   action={{
    //     actionType: "compositeActionTemplate",
    //     compositeActionTemplate: deleteApplicationActionTemplate,
    //   }}
    //   labelElement={<h2>Delete Application & Deployment</h2>}
    //   formikValuePathAsString="deleteApplicationAndDeployment"
    //   formLabel="Delete Application & Deployment"
    //   displaySubmitButton="onFirstLine"
    //   useActionButton={true}
    // />
  );

}

// ################################################################################################
let count = 0;
export const Sidebar: FC<{
  open: boolean;
  setOpen: (v: boolean) => void;
  width?: number;
  onWidthChange?: (width: number) => void;
}> = (props) => {
  count++;
  const { currentTheme } = useMiroirTheme();
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing && props.onWidthChange) {
        const newWidth = Math.max(150, Math.min(500, e.clientX)); // Min 150px, Max 500px
        props.onWidthChange(newWidth);
      }
    },
    [isResizing, props.onWidthChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const memoizedSidebarSections = useMemo(() => (
    [
      {
        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
        menuUuid: menuDefaultAdmin.uuid
      },
      {
        deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        menuUuid: menuDefaultMiroir.uuid
      },
      {
        deploymentUuid: adminConfigurationDeploymentParis.uuid,
        menuUuid: defaultMenuParisUuid
      },
      {
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        menuUuid: menuDefaultLibrary.uuid
      }
    ].map((section, index) => (
      <>
        {index > 0 && <ThemedDivider />}
        <SidebarSection
          key={section.menuUuid}
          deploymentUuid={section.deploymentUuid}
          menuUuid={section.menuUuid}
          open={props.open}
          setOpen={props.setOpen}
        />
      </>
    ))
  ), [props.open, props.setOpen]);

  return (
    <ThemedDrawer open={props.open} width={props.width}>
      <ThemedDrawerHeader>
        <ThemedIconButton onClick={() => props.setOpen(false)} aria-label="Close sidebar">
          <ChevronLeftIcon />
        </ThemedIconButton>
        <span style={{ marginLeft: currentTheme.spacing.xs, color: currentTheme.colors.text }}>
          <ApplicationSelector/>
          count: {count}
        </span>
      </ThemedDrawerHeader>
      <ThemedScrollableContent>
        {memoizedSidebarSections}
      </ThemedScrollableContent>
      {/* Resize handle - only show when sidebar is open */}
      {props.open && (
        <ThemedResizeHandle
          onMouseDown={handleMouseDown}
          isResizing={isResizing}
        />
      )}
    </ThemedDrawer>
  );
};

