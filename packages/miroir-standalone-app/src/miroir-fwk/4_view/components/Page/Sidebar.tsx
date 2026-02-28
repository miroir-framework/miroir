import { FC, useCallback, useEffect, useMemo, useState } from 'react';


// import AutoStories from '@mui/icons-material/AutoStories';
import {
  LoggerInterface,
  menuDefaultMiroir,
  MiroirLoggerFactory,
  selfApplicationMiroir,
  type Uuid
} from "miroir-core";
import {
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
  menuDefaultAdmin
} from "miroir-test-app_deployment-admin";

import { useMiroirContextService } from 'miroir-react';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useMenusOfApplications } from '../../ReduxHooks.js';
import { ApplicationSelector } from '../interactive/ApplicationSelector.js';
import {
  ThemedDivider,
  ThemedDrawer,
  ThemedDrawerHeader,
  ThemedScrollableContent
} from "../Themes/index";
import { SidebarSection } from './SidebarSection.js';

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
  // const { currentTheme } = useMiroirTheme();
  const [isResizing, setIsResizing] = useState(false);
  // const resizeRef = useRef<HTMLDivElement>(null);

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
  const currentApplicationDeploymentMap = context.applicationDeploymentMap;
  const currentApplication = context.toolsPageState.applicationSelector;
  const setCurrentApplication = useCallback((applicationUuid: string) => {
    context.updateToolsPageStateDEFUNCT({
      ...context.toolsPageState,
      applicationSelector: applicationUuid,
    });
    context.setApplication(applicationUuid);
  }, [context]);

  const miroirSidebarSections = useMemo(() => (
    [
      {
        deploymentUuid: deployment_Miroir.uuid,
        applicationUuid: selfApplicationMiroir.uuid,
        menuUuid: menuDefaultMiroir.uuid
      },
      {
        deploymentUuid: deployment_Admin.uuid,
        applicationUuid: adminSelfApplication.uuid,
        menuUuid: menuDefaultAdmin.uuid
      },
    ]
    .filter(section => context.showModelTools)
    .map((section, index) => (
      <>
        {index > 0 && <ThemedDivider />}
        <SidebarSection
          key={section.menuUuid}
          applicationUuid={section.applicationUuid}
          applicationDeploymentMap={currentApplicationDeploymentMap}
          deploymentUuid={section.deploymentUuid}
          menuUuid={section.menuUuid}
          open={props.open}
          setOpen={props.setOpen}
        />
      </>
    ))
  ), [props.open, context.showModelTools, props.setOpen]);

  const applicationMenus = useMenusOfApplications(
    Object.keys(currentApplicationDeploymentMap ?? {}),
    currentApplicationDeploymentMap ?? {},
  );
  // log.info("Sidebar: applicationMenus", applicationMenus);
  const filteredAppSidebarSections: {
    deploymentUuid: Uuid;
    applicationUuid: Uuid;
    menuUuid: Uuid;
  }[] = useMemo(
    () => applicationMenus
    .filter(menu => menu.menus && menu.menus.length > 0)
    .filter(menu => menu.application === currentApplication)
    .map(menu => {
      const applicationUuid = menu.application;
      const deploymentUuid = currentApplicationDeploymentMap?.[applicationUuid];
      if (!deploymentUuid) {
        throw new Error(`No deployment found for application ${applicationUuid}`);
        // return null;
      }
      return {
        applicationUuid,
        deploymentUuid,
        menuUuid: menu.menus?.[0].uuid ?? menuDefaultMiroir.uuid, // TODO: correct!
      };
    })
    .filter((section): section is { deploymentUuid: Uuid; applicationUuid: Uuid; menuUuid: Uuid } => !!section),
    [applicationMenus, currentApplicationDeploymentMap, currentApplication],
  );
  // log.info("Sidebar: filteredAppSidebarSections", filteredAppSidebarSections);

  const appSidebarSections = useMemo(() => (
    filteredAppSidebarSections
    .map((section, index) => (
      <>
        {index > 0 && <ThemedDivider />}
        <SidebarSection
          key={section.menuUuid}
          applicationUuid={section.applicationUuid}
          applicationDeploymentMap={currentApplicationDeploymentMap}
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
  ), [appSidebarSections, miroirSidebarSections]);

  return (
    <ThemedDrawer
      open={props.open}
      width={props.width}
      style={{ padding: "0" }}
      onMouseDown={handleMouseDown}
      isResizing={isResizing}
      resizeHandle="right"
    >
      <ThemedDrawerHeader>
        {/* <div
          style={{
            // position: "relative",
            // width: "calc(width)",
            color: currentTheme.colors.text,
          }}
        > */}
        <ApplicationSelector
          applicationUuid={currentApplication}
          onApplicationChange={setCurrentApplication}
        />
        {/* </div> */}
      </ThemedDrawerHeader>
      <ThemedScrollableContent hideScrollbar>{memoizedSidebarSections}</ThemedScrollableContent>
      {/* Resize handle - only show when sidebar is open */}
    </ThemedDrawer>
  );
};

