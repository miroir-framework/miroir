import * as React from 'react';

export interface DraggableContainerProps {
  title?: string;
  children: React.ReactNode;
  storageKey?: string;
  defaultPosition?: { x: number; y: number };
}

// Generic draggable container component
export const DraggableContainer: React.FC<DraggableContainerProps> = ({
  title = "Performance Stats",
  children,
  storageKey = "performanceStatsPosition",
  defaultPosition = { x: 10, y: 10 }
}) => {
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

  return (
    <div
      ref={dragRef}
      onMouseDown={handleMouseDown}
      style={{
        fontSize: "0.7rem",
        color: "#333",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "8px",
        border: "2px solid #007acc",
        borderRadius: "4px",
        fontFamily: "monospace",
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 9999,
        maxWidth: "500px",
        maxHeight: "80vh",
        overflow: "hidden",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
    >
      <div
        className="drag-handle"
        style={{
          fontWeight: "bold",
          borderBottom: "1px solid #ddd",
          marginBottom: "8px",
          padding: "4px 0",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "12px", opacity: 0.7 }}>⋮⋮</span>
        {title}
      </div>
      {children}
    </div>
  );
};
