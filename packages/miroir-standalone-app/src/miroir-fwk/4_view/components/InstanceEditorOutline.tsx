/**
 * InstanceEditorOutline Component - Optimized for Performance
 * 
 * Performance optimizations implemented:
 * 1. React.memo on main component and TreeNodeComponent
 * 2. useMemo for expensive computations (tree building, icons, colors)
 * 3. useCallback for event handlers to prevent unnecessary re-renders
 * 4. Throttled resize handling for smooth interaction
 * 5. Stable references for tree nodes and expanded state
 * 6. Removed tooltips and replaced with simple instruction note
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
  Typography,
  IconButton,
  Divider,
  Box,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  FolderOpen,
  Folder,
  Description,
  Code,
  DataObject,
  ViewList,
  Settings,
  Close,
  MenuOpen,
} from '@mui/icons-material';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';

// Types for tree structure
export interface TreeNode {
  id: string;
  label: string;
  type: 'object' | 'array' | 'root';
  path: string[];
  children?: TreeNode[];
  level: number;
  isExpanded?: boolean;
}

export interface DocumentOutlineProps {
  isOpen: boolean;
  onToggle: () => void;
  data: any;
  onNavigate?: (path: string[]) => void;
  title?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
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

// Tree building function - optimized for performance
const buildTreeFromObject = (
  obj: any,
  path: string[] = [],
  level: number = 0,
  maxDepth: number = 10
): TreeNode[] => {
  if (level > maxDepth || obj === null || obj === undefined) {
    return [];
  }

  const nodes: TreeNode[] = [];

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      // Only include objects and arrays, skip primitives
      if (item && (typeof item === 'object' || Array.isArray(item))) {
        const currentPath = [...path, index.toString()];
        const children = buildTreeFromObject(item, currentPath, level + 1, maxDepth);
        
        nodes.push({
          id: currentPath.join('.'),
          label: `[${index}]${item && typeof item === 'object' ? 
            (item.name ? ` - ${item.name}` : 
             item.actionLabel ? ` - ${item.actionLabel}` :
             item.actionType ? ` - ${item.actionType}` :
             item.type ? ` - ${item.type}` : '') : ''}`,
          type: Array.isArray(item) ? 'array' : 'object',
          path: currentPath,
          children,
          level,
          isExpanded: level < 2, // Auto-expand first 2 levels
        });
      }
    });
  } else if (obj && typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      // Only include objects and arrays, skip primitives
      if (value && (typeof value === 'object' || Array.isArray(value))) {
        const currentPath = [...path, key];
        const children = buildTreeFromObject(value, currentPath, level + 1, maxDepth);
        
        nodes.push({
          id: currentPath.join('.'),
          label: key,
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

// Optimized Tree node component with React.memo
const TreeNodeComponent = React.memo<{
  node: TreeNode;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onNavigate?: (path: string[]) => void;
  selectedPath?: string;
}>(({ node, expandedNodes, onToggleExpand, onNavigate, selectedPath }) => {
  const miroirTheme = useMiroirTheme();
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = selectedPath === node.path.join('.');

  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  }, [node.id, hasChildren, onToggleExpand]);

  const handleDoubleClick = useCallback(() => {
    if (onNavigate) {
      onNavigate(node.path);
    }
  }, [node.path, onNavigate]);

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
});

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Main Document Outline component - optimized with React.memo
export const InstanceEditorOutline = React.memo<DocumentOutlineProps>(({
  isOpen,
  onToggle,
  data,
  onNavigate,
  title = "Document Outline",
  width = 300,
  minWidth = 200,
  maxWidth = 600,
  onWidthChange,
}) => {
  const miroirTheme = useMiroirTheme();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [currentWidth, setCurrentWidth] = useState(width);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Build tree structure from data with stable reference
  const treeNodes = useMemo(() => {
    try {
      return buildTreeFromObject(data, [], 0, 10);
    } catch (error) {
      console.error('Error building tree structure:', error);
      return [];
    }
  }, [data]);

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
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          borderLeft: `1px solid ${miroirTheme.currentTheme.colors.border}`,
          backgroundColor: miroirTheme.currentTheme.colors.surface,
          color: miroirTheme.currentTheme.colors.text,
          position: 'fixed',
          top: 0, // Start from the very top
          height: '100vh', // Full viewport height
        },
      }}
    >
      {/* Resize handle */}
      <Box
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: 'transparent',
          cursor: 'ew-resize',
          zIndex: 1000,
          '&:hover': {
            backgroundColor: miroirTheme.currentTheme.colors.hover,
          },
          '&:active': {
            backgroundColor: miroirTheme.currentTheme.colors.selected,
          },
        }}
      />
      
      <Box sx={{ padding: 1, paddingTop: '8px', backgroundColor: miroirTheme.currentTheme.colors.surface }}> {/* Minimal top padding */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '1rem', 
              fontWeight: 600,
              color: miroirTheme.currentTheme.colors.text,
            }}
          >
            {title}
          </Typography>
          <IconButton 
            size="small" 
            onClick={onToggle}
            sx={{ color: miroirTheme.currentTheme.colors.text }}
          >
            <Close />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
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
              fontSize: '0.75rem', 
              color: miroirTheme.currentTheme.colors.textSecondary,
              fontStyle: 'italic',
              display: 'block',
              lineHeight: 1.2
            }}
          >
            Double-click any item to scroll to it in the editor
          </Typography>
        </Box>
        
        <Divider sx={{ backgroundColor: miroirTheme.currentTheme.colors.divider }} />
      </Box>
      
      <List dense sx={{ flexGrow: 1, overflow: 'hidden', backgroundColor: miroirTheme.currentTheme.colors.surface }}>
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
        <Box sx={{ padding: 2, textAlign: 'center', backgroundColor: miroirTheme.currentTheme.colors.surface }}>
          <Typography 
            variant="body2" 
            sx={{ color: miroirTheme.currentTheme.colors.textSecondary }}
          >
            No structure to display
          </Typography>
        </Box>
      )}
    </Drawer>
  );
});

export default InstanceEditorOutline;
