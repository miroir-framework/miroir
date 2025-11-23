import { FC, useMemo, useState, useRef, useCallback, useEffect } from 'react';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft.js';
import ChevronRightIcon from '@mui/icons-material/ChevronRight.js';

// import AutoStories from '@mui/icons-material/AutoStories';
import {
  adminApplicationLibrary,
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
  selfApplicationLibrary,
  type JzodObject
} from "miroir-core";
import { applicationParis, defaultMenuParisUuid, packageName, selfApplicationParis } from '../../../../constants.js';
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
import { ApplicationSelector } from '../interactive/ApplicationSelector.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Sidebar"), "UI",
).then((logger: LoggerInterface) => {log = logger});
// ################################################################################################
export const SidebarWidth = 200;


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

  const context = useMiroirContextService();
  const currentApplication = context.toolsPageState.applicationSelector;
  const setCurrentApplication = useCallback((applicationUuid: string) => {
    context.updateToolsPageStateDEFUNCT({
      ...context.toolsPageState,
      applicationSelector: applicationUuid,
    });
  }, [context]);

  const miroirSidebarSections = useMemo(() => (
    [
      {
        deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        menuUuid: menuDefaultMiroir.uuid
      },
      {
        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
        menuUuid: menuDefaultAdmin.uuid
      },
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

  const filteredAppSidebarSections = useMemo(() => (
    [
      {
        deploymentUuid: adminConfigurationDeploymentParis.uuid,
        applicationUuid: applicationParis.uuid,
        menuUuid: defaultMenuParisUuid
      },
      {
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        applicationUuid: adminApplicationLibrary.uuid,
        menuUuid: menuDefaultLibrary.uuid
      }
    ]
    .filter(section => section.applicationUuid === currentApplication)
  ), [currentApplication]);

  const appSidebarSections = useMemo(() => (
    filteredAppSidebarSections
    .map((section, index) => (
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
  ), [props.open, props.setOpen, filteredAppSidebarSections]);

  const memoizedSidebarSections = useMemo(() => (
    [
      ...appSidebarSections,
      ...miroirSidebarSections,
    ]
    // .map((section, index) => (
    //   <>
    //     {index > 0 && <ThemedDivider />}
    //     <SidebarSection
    //       key={section.menuUuid}
    //       deploymentUuid={section.deploymentUuid}
    //       menuUuid={section.menuUuid}
    //       open={props.open}
    //       setOpen={props.setOpen}
    //     />
    //   </>
    // ))
  ), [appSidebarSections, miroirSidebarSections]);

  return (
    <ThemedDrawer open={props.open} width={props.width}>
      <ThemedDrawerHeader>
        <div
          style={{
            position: "relative",
            width: "calc(width)",
            color: currentTheme.colors.text,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: 2,
            }}
          >
            {/* <ThemedIconButton padding={0} onClick={() => props.setOpen(false)} aria-label="Close sidebar"> */}
            <ThemedIconButton style={{padding:0}} onClick={() => props.setOpen(false)} aria-label="Close sidebar">
              <ChevronLeftIcon />
            </ThemedIconButton>
          </div>
          <ApplicationSelector
            applicationUuid={currentApplication}
            onApplicationChange={setCurrentApplication}
          />
        </div>
      </ThemedDrawerHeader>
      <ThemedScrollableContent>{memoizedSidebarSections}</ThemedScrollableContent>
      {/* Resize handle - only show when sidebar is open */}
      {props.open && <ThemedResizeHandle onMouseDown={handleMouseDown} isResizing={isResizing} />}
    </ThemedDrawer>
  );
};

