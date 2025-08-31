/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import * as React from 'react';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';
import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DraggableContainer")
).then((logger: LoggerInterface) => {log = logger});


export interface DraggableContainerProps {
  title?: string;
  children: React.ReactNode;
  storageKey?: string;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  onClose?: () => void;
}

// Generic draggable container component
export const DraggableContainer: React.FC<DraggableContainerProps> = ({
  title = "Performance Stats",
  children,
  storageKey = "performanceStatsPosition",
  defaultPosition = { x: 10, y: 10 },
  defaultSize = { width: 500, height: 400 },
  onClose
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const [position, setPosition] = React.useState(() => {
    // Load position from sessionStorage
    const saved = sessionStorage.getItem(storageKey);
    let result = saved ? JSON.parse(saved) : defaultPosition;
    
    // Ensure the timeline stays within viewport bounds
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    result.x = Math.max(0, Math.min(result.x, viewport.width - 400)); // Keep 400px minimum visible
    result.y = Math.max(0, Math.min(result.y, viewport.height - 200)); // Keep 200px minimum visible
    
    log.debug('DraggableContainer position init:', { storageKey, saved, result, defaultPosition });
    return result;
  });

  const [size, setSize] = React.useState(() => {
    // Load size from sessionStorage
    const saved = sessionStorage.getItem(`${storageKey}_size`);
    const result = saved ? JSON.parse(saved) : defaultSize;
    log.debug('DraggableContainer size init:', { storageKey, saved, result, defaultSize });
    return result;
  });

  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeDirection, setResizeDirection] = React.useState<string>('');
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, width: 0, height: 0, startX: 0, startY: 0 });
  const dragRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.target === dragRef.current || (e.target as HTMLElement)?.closest(".drag-handle")) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
        e.preventDefault();
      }
    },
    [position]
  );

  const handleResizeMouseDown = React.useCallback(
    (e: React.MouseEvent, direction: string) => {
      setIsResizing(true);
      setResizeDirection(direction);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
        startX: position.x,
        startY: position.y,
      });
      e.preventDefault();
      e.stopPropagation();
    },
    [size, position]
  );

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        const newPosition = {
          x: Math.max(0, Math.min(e.clientX - dragStart.x, viewport.width - 400)),
          y: Math.max(0, Math.min(e.clientY - dragStart.y, viewport.height - 200)),
        };
        setPosition(newPosition);
        // Save position to sessionStorage
        sessionStorage.setItem(storageKey, JSON.stringify(newPosition));
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.startX;
        let newY = resizeStart.startY;
        
        // Handle horizontal resizing
        if (resizeDirection.includes('e')) {
          // Resizing from east (right) edge - west (left) side is fixed
          newWidth = Math.max(300, resizeStart.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          // Resizing from west (left) edge - east (right) side is fixed
          newWidth = Math.max(300, resizeStart.width - deltaX);
          // Adjust position to keep right edge fixed
          newX = resizeStart.startX - (newWidth - resizeStart.width);
        }
        
        // Handle vertical resizing
        if (resizeDirection.includes('s')) {
          // Resizing from south (bottom) edge - north (top) side is fixed
          newHeight = Math.max(200, resizeStart.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          // Resizing from north (top) edge - south (bottom) side is fixed
          newHeight = Math.max(200, resizeStart.height - deltaY);
          // Adjust position to keep bottom edge fixed
          newY = resizeStart.startY - (newHeight - resizeStart.height);
        }
        
        const newSize = { width: newWidth, height: newHeight };
        const newPosition = { x: newX, y: newY };
        
        setSize(newSize);
        setPosition(newPosition);
        sessionStorage.setItem(`${storageKey}_size`, JSON.stringify(newSize));
        sessionStorage.setItem(storageKey, JSON.stringify(newPosition));
      }
    },
    [isDragging, isResizing, dragStart, resizeStart, resizeDirection, storageKey]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const containerStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    color: currentTheme.colors.text,
    backgroundColor: currentTheme.colors.backgroundPaper,
    padding: currentTheme.spacing.sm,
    border: `2px solid ${currentTheme.colors.primary}`,
    borderRadius: currentTheme.borderRadius.md,
    fontFamily: currentTheme.typography.fontFamily,
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex: 9999,
    overflow: 'hidden',
    boxShadow: currentTheme.elevation.medium,
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
  });

  // log.debug('DraggableContainer render:', { title, position, size });

  const headerStyles = css({
    fontWeight: currentTheme.typography.fontWeight.bold,
    borderBottom: `1px solid ${currentTheme.colors.divider}`,
    marginBottom: currentTheme.spacing.sm,
    padding: `${currentTheme.spacing.xs} 0`,
    cursor: isDragging ? 'grabbing' : 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: currentTheme.spacing.xs,
    color: currentTheme.colors.primary,
  });

  const titleContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: currentTheme.spacing.xs,
  });

  const dragIconStyles = css({
    fontSize: '12px',
    opacity: 0.7,
    color: currentTheme.colors.textSecondary,
  });

  const closeButtonStyles = css({
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: currentTheme.colors.textSecondary,
    padding: '2px 4px',
    borderRadius: currentTheme.borderRadius.sm,
    '&:hover': {
      backgroundColor: currentTheme.colors.error + '20',
      color: currentTheme.colors.error,
    },
  });

  const contentStyles = css({
    flex: 1,
    overflow: 'auto',
    minHeight: 0, // Allow content to shrink
  });

  const resizeHandleBase = css({
    position: 'absolute',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: currentTheme.colors.primary + '20',
    },
  });

  const resizeHandles = {
    e: css(resizeHandleBase, {
      top: 0,
      right: 0,
      width: '8px',
      height: '100%',
      cursor: 'ew-resize',
    }),
    s: css(resizeHandleBase, {
      bottom: 0,
      left: 0,
      width: '100%',
      height: '8px',
      cursor: 'ns-resize',
    }),
    se: css(resizeHandleBase, {
      bottom: 0,
      right: 0,
      width: '16px',
      height: '16px',
      cursor: 'nw-resize',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        width: '0',
        height: '0',
        borderLeft: '8px solid transparent',
        borderBottom: `8px solid ${currentTheme.colors.textSecondary}40`,
      },
    }),
    w: css(resizeHandleBase, {
      top: 0,
      left: 0,
      width: '8px',
      height: '100%',
      cursor: 'ew-resize',
    }),
    n: css(resizeHandleBase, {
      top: 0,
      left: 0,
      width: '100%',
      height: '8px',
      cursor: 'ns-resize',
    }),
    nw: css(resizeHandleBase, {
      top: 0,
      left: 0,
      width: '16px',
      height: '16px',
      cursor: 'nw-resize',
    }),
    ne: css(resizeHandleBase, {
      top: 0,
      right: 0,
      width: '16px',
      height: '16px',
      cursor: 'ne-resize',
    }),
    sw: css(resizeHandleBase, {
      bottom: 0,
      left: 0,
      width: '16px',
      height: '16px',
      cursor: 'sw-resize',
    }),
  };

  return (
    <div ref={dragRef} onMouseDown={handleMouseDown} css={containerStyles}>
      <div className="drag-handle" css={headerStyles}>
        <div css={titleContainerStyles}>
          <span css={dragIconStyles}>⋮⋮</span>
          {title}
        </div>
        {onClose && (
          <button 
            css={closeButtonStyles}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
          >
            ×
          </button>
        )}
      </div>
      <div css={contentStyles}>
        {children}
      </div>
      
      {/* Resize handles */}
      <div css={resizeHandles.n} onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
      <div css={resizeHandles.s} onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
      <div css={resizeHandles.e} onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
      <div css={resizeHandles.w} onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
      <div css={resizeHandles.ne} onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
      <div css={resizeHandles.nw} onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
      <div css={resizeHandles.se} onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
      <div css={resizeHandles.sw} onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
    </div>
  );
};
