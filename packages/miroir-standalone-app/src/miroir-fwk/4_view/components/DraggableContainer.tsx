/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import * as React from 'react';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';

export interface DraggableContainerProps {
  title?: string;
  children: React.ReactNode;
  storageKey?: string;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
}

// Generic draggable container component
export const DraggableContainer: React.FC<DraggableContainerProps> = ({
  title = "Performance Stats",
  children,
  storageKey = "performanceStatsPosition",
  defaultPosition = { x: 10, y: 10 },
  onClose
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const [position, setPosition] = React.useState(() => {
    // Load position from sessionStorage
    const saved = sessionStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : defaultPosition;
  });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
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

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };
        setPosition(newPosition);
        // Save position to sessionStorage
        sessionStorage.setItem(storageKey, JSON.stringify(newPosition));
      }
    },
    [isDragging, dragStart, storageKey]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
    zIndex: 9999,
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'hidden',
    boxShadow: currentTheme.elevation.medium,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
  });

  const headerStyles = css({
    fontWeight: currentTheme.typography.fontWeight.bold,
    borderBottom: `1px solid ${currentTheme.colors.divider}`,
    marginBottom: currentTheme.spacing.sm,
    padding: `${currentTheme.spacing.xs} 0`,
    cursor: 'grab',
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
      {children}
    </div>
  );
};
