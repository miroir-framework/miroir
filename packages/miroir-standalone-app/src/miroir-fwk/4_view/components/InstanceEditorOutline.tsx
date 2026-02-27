import {
  Close,
  Code,
  DataObject,
  ExpandLess,
  ExpandMore,
  Folder,
  FolderOpen,
  MenuOpen,
  Settings,
  ViewList
} from './Themes/MaterialSymbolWrappers';
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { MiroirLoggerFactory, type KeyMapEntry, type LoggerInterface } from 'miroir-core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';
import { useMiroirContextService } from 'miroir-react';
import { exclusivelyUnfoldPath } from './Reports/FoldedStateTreeUtils.js';
import { useDocumentOutlineContext } from './ValueObjectEditor/InstanceEditorOutlineContext.js';
import { getFoldedDisplayValue } from './ValueObjectEditor/JzodElementEditorHooks.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "InstanceEditorOutline"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// Types for tree structure
export interface TreeNode {
  id: string;
  label: string;
  type: 'object' | 'array' | 'root';
  targetElement: any;
  path: string[];
  children?: TreeNode[];
  level: number;
  isExpanded?: boolean;
}

export interface DocumentOutlineProps {
  isOpen: boolean;
  onToggle: () => void;
  // data: any;
  // rootObjectKey: string; // The key of the root object in the data, added to distinguish potential outlines for multiple ReportSectionEntityInstances
  onNavigate?: (path: string[]) => void;
  // title?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
  // typeCheckKeyMap?: Record<string, KeyMapEntry>; // Schema information for display names
}

// Helper functions - optimized with useMemo in components
const getTypeIcon = (type: string, hasChildren: boolean, isExpanded: boolean) => {
  switch (type) {
    case 'object':
      return hasChildren ? (isExpanded ? <FolderOpen /> : <Folder />) : <DataObject />;
    case 'array':
      return <ViewList />;
    case 'root':
      return <Code />;
    default:
      return <Settings />;
  }
};

const getTypeColor = (type: string, theme: any) => {
  switch (type) {
    case 'object':
      return theme.colors.primary;
    case 'array':
      return theme.colors.success;
    case 'root':
      return theme.colors.secondary;
    default:
      return theme.colors.textSecondary;
  }
};

// ################################################################################################
// Tree building function - optimized for performance
const buildTreeFromObject = (
  targetElement: any,
  treePath: string[] = [],
  rootObjectKey: string, // The key of the root object in the data, added to distinguish potential outlines for multiple ReportSectionEntityInstances
  level: number = 0,
  maxDepth: number = 10,
  typeCheckKeyMap?: Record<string, KeyMapEntry>
): TreeNode[] => {
  if (level > maxDepth || targetElement === null || targetElement === undefined) {
    return [];
  }

  const nodes: TreeNode[] = [];

  if (Array.isArray(targetElement)) {
    targetElement.forEach((item, index) => {
      // Only include objects and arrays, skip primitives
      if (item && (typeof item === 'object' || Array.isArray(item))) {
        const currentPath = [...treePath, index.toString()];
        const children = buildTreeFromObject(
          item,
          currentPath,
          rootObjectKey,
          level + 1,
          maxDepth,
          typeCheckKeyMap
        );
        
        // Build the rootLessListKey for schema lookup, similar to how JzodArrayEditor does it
        const rootLessListKey = treePath.length > 0 ? treePath.slice(1).join('.') : ''; // ignore the first element which is the rootObjectKey
        const itemRootLessListKey = rootLessListKey.length > 0 ? `${rootLessListKey}.${index}` : `${index}`;
        
        // Get the schema for this array item
        // const itemSchema = typeCheckKeyMap?.[itemRootLessListKey]?.rawSchema;
        const itemSchema = typeCheckKeyMap?.[itemRootLessListKey]?.resolvedSchema;
        
        // Try to get folded display value using the schema
        let displayName = `[${index}]`;
        const foldedDisplayValue = getFoldedDisplayValue(itemSchema, item);
        // log.info(`Outline: Processing array item at ${itemRootLessListKey}, foldedDisplayValue: ${foldedDisplayValue}, item:`, item, "itemSchema:", itemSchema,
        //   "typeCheckKeyMap",
        //   typeCheckKeyMap,
        // );
        if (foldedDisplayValue !== null) {
          // Use the schema-based display value
          displayName = `[${index}] - ${foldedDisplayValue}`;
        } else {
          // Fall back to the existing hardcoded logic
          if (item && typeof item === 'object') {
            if (item.name) {
              displayName = `[${index}] - ${item.name}`;
            } else if (item.actionLabel) {
              displayName = `[${index}] - ${item.actionLabel}`;
            } else if (item.actionType) {
              displayName = `[${index}] - ${item.actionType}`;
            } else if (item.type) {
              displayName = `[${index}] - ${item.type}`;
            }
          }
        }
        
        nodes.push({
          id: currentPath.join('.'),
          targetElement:item,
          label: displayName,
          type: Array.isArray(item) ? 'array' : 'object',
          path: currentPath,
          children,
          level,
          isExpanded: level < 2, // Auto-expand first 2 levels
        });
      }
    });
  } else if (targetElement && typeof targetElement === 'object') {
    Object.entries(targetElement).forEach(([key, value]) => {
      // Only include objects and arrays, skip primitives
      // log.info("Outline: Processing object with path", treePath, "key:", key);
      if (value && (typeof value === 'object' || Array.isArray(value))) {
        const currentPath = [...treePath, key];
        const children = buildTreeFromObject(value, currentPath, rootObjectKey, level + 1, maxDepth, typeCheckKeyMap);
        
        nodes.push({
          id: currentPath.join('.'),
          label: key,
          targetElement:value,
          type: Array.isArray(value) ? 'array' : 'object',
          path: currentPath,
          children,
          level,
          isExpanded: level < 2, // Auto-expand first 2 levels
        });
      }
    });
  }

  return nodes;
};

// ################################################################################################
// Optimized Tree node component with React.memo
const TreeNodeComponent:React.FC<{
  node: TreeNode;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onNavigate?: (path: string[]) => void;
  selectedPath?: string;
}> = ({ node, expandedNodes, onToggleExpand, onNavigate, selectedPath }) => {
  const miroirTheme = useMiroirTheme();
  const context = useMiroirContextService();
  // const reportContext = useReportPageContext();
  const outlineContext = useDocumentOutlineContext();
  
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = selectedPath === node.path.join('.');

  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  }, [node.id, hasChildren, onToggleExpand]);

  const handleDoubleClick = useCallback(() => {
    // log.info(
    //   "Outline: Node double-clicked, exclusively unfolding path",
    //   node.path,
    //   "for instance:",
    //   outlineContext.reportInstance
    // );
    if (context.setFoldedObjectAttributeOrArrayItems) {
      const newFoldedObjectAttributeOrArrayItems = exclusivelyUnfoldPath(
      {},
      outlineContext.reportInstance,
      node.path
      );
      // log.info("Outline: New foldedObjectAttributeOrArrayItems state after double-click:", newFoldedObjectAttributeOrArrayItems);
      context.setFoldedObjectAttributeOrArrayItems(newFoldedObjectAttributeOrArrayItems);

      // Leave some time before calling onNavigate to ensure main panel has been unfolded
      if (onNavigate) {
        setTimeout(() => {
          onNavigate(node.path);
        }, 500); // 500ms delay to allow unfolding to complete
      }
    } else {
      log.warn("Outline: No setFoldedObjectAttributeOrArrayItems function available in context");
      if (onNavigate) {
        onNavigate(node.path);
      }
    }
  }, [node.path, context.setFoldedObjectAttributeOrArrayItems, onNavigate]);

  const indentLevel = node.level * 16;

  const typeIcon = useMemo(
    () => getTypeIcon(node.type, hasChildren, isExpanded),
    [node.type, hasChildren, isExpanded]
  );
  const typeColor = useMemo(() => getTypeColor(node.type, miroirTheme.currentTheme), [node.type, miroirTheme.currentTheme]);

  return (
    <>
      <ListItem
        disablePadding
        sx={{
          backgroundColor: isSelected ? miroirTheme.currentTheme.colors.selected : 'transparent',
        }}
      >
        <ListItemButton
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          sx={{
            paddingLeft: `${indentLevel + 8}px`,
            minHeight: 32,
            '&:hover': {
              backgroundColor: miroirTheme.currentTheme.colors.hover,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: typeColor }}>
            {typeIcon}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: typeColor as string,
                  fontWeight: isSelected ? 600 : 400,
                }}
                noWrap
              >
                {node.label}
              </Typography>
            }
          />
          {hasChildren && (
            <IconButton 
              size="small" 
              sx={{ 
                padding: '2px',
                color: miroirTheme.currentTheme.colors.text,
              }}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>
      </ListItem>
      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          {node.children?.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onNavigate={onNavigate}
              selectedPath={selectedPath}
            />
          ))}
        </Collapse>
      )}
    </>
  );
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Main Document Outline component - optimized with React.memo
// export const InstanceEditorOutline = React.memo<DocumentOutlineProps>(({
export const InstanceEditorOutline: React.FC<DocumentOutlineProps> = ({
  isOpen,
  onToggle,
  // data,
  // rootObjectKey,
  onNavigate,
  // title = "Document Outline",
  width = 300,
  minWidth = 200,
  maxWidth = 600,
  onWidthChange,
})  => {
  const miroirTheme = useMiroirTheme();
  const outlineContext = useDocumentOutlineContext();
  // const rootObjectKey=Object.keys(outlineContext.outlineData || {})[0] || "";
  const rootObjectKey=Object.keys(outlineContext.reportInstance || {})[0] || "";
   
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [currentWidth, setCurrentWidth] = useState(width);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Build tree structure from data with stable reference
  const treeNodes = useMemo(() => {
    try {
      // log.info(
      //   "Outline: Rebuilding tree structure from data:",
      //   "outlineContext.reportInstance",
      //   outlineContext.reportInstance,
      //   "rootObjectKey:", rootObjectKey,
      //   "typeCheckKeyMap:",
      //   outlineContext.typeCheckKeyMap
      // );
      // return buildTreeFromObject(outlineContext.outlineData, [], rootObjectKey, 0, 10, outlineContext.typeCheckKeyMap);
      return buildTreeFromObject(outlineContext.reportInstance, [], rootObjectKey, 0, 10, outlineContext.typeCheckKeyMap);
    } catch (error) {
      console.error('Error building tree structure:', error);
      return [];
    }
  // }, [outlineContext.outlineData, rootObjectKey, outlineContext.typeCheckKeyMap]);
  }, [outlineContext.reportInstance, rootObjectKey, outlineContext.typeCheckKeyMap]);

  // log.info("Outline: Built tree structure treeNodes:", treeNodes);
  // Initialize expanded nodes based on auto-expand logic - optimized
  const autoExpandedNodes = useMemo(() => {
    const expandedSet = new Set<string>();
    
    const collectAutoExpandedNodes = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.isExpanded) {
          expandedSet.add(node.id);
        }
        if (node.children) {
          collectAutoExpandedNodes(node.children);
        }
      });
    };
    
    collectAutoExpandedNodes(treeNodes);
    return expandedSet;
  }, [treeNodes]);

  // Update expanded nodes when auto-expanded nodes change
  React.useEffect(() => {
    setExpandedNodes(autoExpandedNodes);
  }, [autoExpandedNodes]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleNavigate = useCallback((path: string[]) => {
    setSelectedPath(path.join('.'));
    if (onNavigate) {
      onNavigate(path);
    }
  }, [onNavigate]);

  // Memoized expand/collapse handlers
  const handleExpandAll = useCallback(() => {
    const allNodeIds = new Set<string>();
    
    const collectAllNodes = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          allNodeIds.add(node.id);
          collectAllNodes(node.children);
        }
      });
    };
    
    collectAllNodes(treeNodes);
    setExpandedNodes(allNodeIds);
  }, [treeNodes]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Optimized resize functionality with throttling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    let throttleTimer: NodeJS.Timeout;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Throttle resize updates for better performance
      if (throttleTimer) clearTimeout(throttleTimer);
      
      throttleTimer = setTimeout(() => {
        // Calculate new width based on mouse position from the right edge
        const newWidth = window.innerWidth - e.clientX;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        
        setCurrentWidth(clampedWidth);
        if (onWidthChange) {
          onWidthChange(clampedWidth);
        }
      }, 16); // ~60fps throttling
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (throttleTimer) clearTimeout(throttleTimer);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isResizing, minWidth, maxWidth, onWidthChange]);

  // Update currentWidth when width prop changes
  useEffect(() => {
    setCurrentWidth(width);
  }, [width]);

  if (!isOpen) {
    return (
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'fixed',
          right: 8,
          top: 100,
          zIndex: 1200,
          backgroundColor: miroirTheme.currentTheme.colors.surface,
          color: miroirTheme.currentTheme.colors.text,
          boxShadow: 2,
          border: `1px solid ${miroirTheme.currentTheme.colors.border}`,
          '&:hover': {
            backgroundColor: miroirTheme.currentTheme.colors.hover,
          },
        }}
      >
        <MenuOpen />
      </IconButton>
    );
  }

  return (
    <Drawer
      ref={drawerRef}
      variant="persistent"
      anchor="right"
      open={isOpen}
      sx={{
        width: currentWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: currentWidth,
          boxSizing: "border-box",
          borderLeft: `1px solid ${miroirTheme.currentTheme.colors.border}`,
          backgroundColor: miroirTheme.currentTheme.colors.surface,
          color: miroirTheme.currentTheme.colors.text,
          position: "fixed",
          top: 0, // Start from the very top
          height: "100vh", // Full viewport height
        },
      }}
    >
      {/* Resize handle */}
      <Box
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          backgroundColor: "transparent",
          cursor: "ew-resize",
          zIndex: 1000,
          "&:hover": {
            backgroundColor: miroirTheme.currentTheme.colors.hover,
          },
          "&:active": {
            backgroundColor: miroirTheme.currentTheme.colors.selected,
          },
        }}
      />

      <Box
        sx={{
          padding: 1,
          paddingTop: "8px",
          backgroundColor: miroirTheme.currentTheme.colors.surface,
        }}
      >
        {" "}
        {/* Minimal top padding */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              color: miroirTheme.currentTheme.colors.text,
            }}
          >
            {outlineContext.outlineTitle}
          </Typography>
          <IconButton
            size="small"
            onClick={onToggle}
            sx={{ color: miroirTheme.currentTheme.colors.text }}
          >
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <IconButton
            size="small"
            onClick={handleExpandAll}
            title="Expand All"
            sx={{ color: miroirTheme.currentTheme.colors.text }}
          >
            <ExpandMore />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleCollapseAll}
            title="Collapse All"
            sx={{ color: miroirTheme.currentTheme.colors.text }}
          >
            <ExpandLess />
          </IconButton>
        </Box>
        {/* Instruction note */}
        <Box sx={{ mb: 1, px: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              color: miroirTheme.currentTheme.colors.textSecondary,
              fontStyle: "italic",
              display: "block",
              lineHeight: 1.2,
            }}
          >
            Double-click any item to scroll to it in the editor
          </Typography>
        </Box>
        <Divider sx={{ backgroundColor: miroirTheme.currentTheme.colors.divider }} />
      </Box>

      {/* {outlineContext.reportInstance && (
        <Box sx={{ padding: 1, backgroundColor: miroirTheme.currentTheme.colors.surface }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              color: miroirTheme.currentTheme.colors.textSecondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={JSON.stringify(outlineContext.reportInstance)}
          >
            Instance ID: {outlineContext.reportInstance.uuid || '<no uuid>'}
          </Typography>
        </Box>
      )} */}

      <List
        dense
        sx={{
          flexGrow: 1,
          overflow: "hidden",
          backgroundColor: miroirTheme.currentTheme.colors.surface,
        }}
      >
        {treeNodes.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
            onNavigate={handleNavigate}
            selectedPath={selectedPath}
          />
        ))}
      </List>

      {treeNodes.length === 0 && (
        <Box
          sx={{
            padding: 2,
            textAlign: "center",
            backgroundColor: miroirTheme.currentTheme.colors.surface,
          }}
        >
          <Typography variant="body2" sx={{ color: miroirTheme.currentTheme.colors.textSecondary }}>
            No structure to display
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default InstanceEditorOutline;
