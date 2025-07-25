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
  Tooltip,
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

// Helper function to determine the type icon
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

// Helper function to get type color
const getTypeColor = (type: string) => {
  switch (type) {
    case 'object':
      return '#2196f3';
    case 'array':
      return '#4caf50';
    case 'root':
      return '#9c27b0';
    default:
      return '#757575';
  }
};

// Helper function to build tree structure from any object
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

// Tree node component
const TreeNodeComponent: React.FC<{
  node: TreeNode;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onNavigate?: (path: string[]) => void;
  selectedPath?: string;
}> = ({ node, expandedNodes, onToggleExpand, onNavigate, selectedPath }) => {
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

  return (
    <>
      <ListItem
        disablePadding
        sx={{
          backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        }}
      >
        <Tooltip title="Double-click to scroll to element" placement="right" arrow>
          <ListItemButton
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            sx={{
              paddingLeft: `${indentLevel + 8}px`,
              minHeight: 32,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {getTypeIcon(node.type, hasChildren, isExpanded)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: getTypeColor(node.type),
                  fontWeight: isSelected ? 600 : 400,
                }}
                noWrap
              >
                {node.label}
              </Typography>
            }
          />
          {hasChildren && (
            <IconButton size="small" sx={{ padding: '2px' }}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>
        </Tooltip>
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

// Main Document Outline component
export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [currentWidth, setCurrentWidth] = useState(width);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Build tree structure from data
  const treeNodes = useMemo(() => {
    try {
      return buildTreeFromObject(data);
    } catch (error) {
      console.error('Error building tree structure:', error);
      return [];
    }
  }, [data]);

  // Initialize expanded nodes based on auto-expand logic
  React.useEffect(() => {
    const autoExpandedNodes = new Set<string>();
    
    const collectAutoExpandedNodes = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.isExpanded) {
          autoExpandedNodes.add(node.id);
        }
        if (node.children) {
          collectAutoExpandedNodes(node.children);
        }
      });
    };
    
    collectAutoExpandedNodes(treeNodes);
    setExpandedNodes(autoExpandedNodes);
  }, [treeNodes]);

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

  // Resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on mouse position from the right edge
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setCurrentWidth(clampedWidth);
      if (onWidthChange) {
        onWidthChange(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
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
          backgroundColor: 'white',
          boxShadow: 2,
          '&:hover': {
            backgroundColor: 'grey.100',
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
          borderLeft: '1px solid #e0e0e0',
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
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          },
          '&:active': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          },
        }}
      />
      
      <Box sx={{ padding: 1, paddingTop: '8px' }}> {/* Minimal top padding */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {title}
          </Typography>
          <IconButton size="small" onClick={onToggle}>
            <Close />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Tooltip title="Expand All">
            <IconButton size="small" onClick={handleExpandAll}>
              <ExpandMore />
            </IconButton>
          </Tooltip>
          <Tooltip title="Collapse All">
            <IconButton size="small" onClick={handleCollapseAll}>
              <ExpandLess />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider />
      </Box>
      
      <List dense sx={{ flexGrow: 1, overflow: 'auto' }}>
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
        <Box sx={{ padding: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No structure to display
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default DocumentOutline;
