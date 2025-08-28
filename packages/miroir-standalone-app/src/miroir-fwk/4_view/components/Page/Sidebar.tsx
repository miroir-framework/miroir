import { FC, useMemo, useState, useRef, useCallback, useEffect } from 'react';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft.js';
import ChevronRightIcon from '@mui/icons-material/ChevronRight.js';

import AutoStories from '@mui/icons-material/AutoStories';
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  LoggerInterface,
  menuDefaultAdmin,
  menuDefaultLibrary,
  menuDefaultMiroir,
  MiroirLoggerFactory
} from "miroir-core";
import { adminConfigurationDeploymentParis, defaultMenuParisUuid, packageName } from '../../../../constants.js';
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

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Sidebar")
).then((logger: LoggerInterface) => {log = logger});

export const SidebarWidth = 200;

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

