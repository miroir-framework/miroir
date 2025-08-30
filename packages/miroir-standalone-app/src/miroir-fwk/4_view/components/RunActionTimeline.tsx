import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Error,
  ExpandLess,
  ExpandMore,
  Refresh,
  Clear,
  FilterList,
  Visibility,
  BugReport,
  Assignment,
  AssignmentTurnedIn,
  Science,
} from '@mui/icons-material';

import { ActionTrackingData } from 'miroir-core';
import { useMiroirContextService } from '../MiroirContextReactProvider.js';

export interface RunActionTimelineProps {
  className?: string;
  style?: React.CSSProperties;
}

interface FilterState {
  actionType: string;
  trackingType: string; // New field for filtering by action vs test types
  status: string;
  minDuration: string;
  since: string;
}

// Local tree node type: ActionTrackingData from the tracker stores children as IDs (string[]).
// For rendering, we build a nested structure where children are the actual nodes.
type TreeNode = ActionTrackingData & { children?: TreeNode[] };

export const RunActionTimeline: React.FC<RunActionTimelineProps> = React.memo(({
  className,
  style,
}) => {
  const componentId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  const context = useMiroirContextService();
  const navigate = useNavigate();
  const [actions, setActions] = useState<ActionTrackingData[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    actionType: '',
    trackingType: '', // New filter for action/test types
    status: '',
    minDuration: '',
    since: '',
  });

  // Subscribe to action tracking updates
  useEffect(() => {
    console.log(`RunActionTimeline [${componentId}] - Setting up subscription`);
    
    const unsubscribe = context.miroirContext.runActionTracker.subscribe((newActions: ActionTrackingData[]) => {
      console.log(`RunActionTimeline [${componentId}] - Received subscription update:`, newActions.length, 'actions');
      setActions(newActions);
    });

    // Get initial actions
    const initialActions = context.miroirContext.runActionTracker.getAllActions();
    console.log(`RunActionTimeline [${componentId}] - Initial actions:`, initialActions.length, 'actions');
    setActions(initialActions);

    return () => {
      console.log(`RunActionTimeline [${componentId}] - Cleaning up subscription`);
      unsubscribe();
    };
  }, [context.miroirContext.runActionTracker, componentId]);

  // Filter actions based on current filters
  const filteredActions = useMemo(() => {
    let result: ActionTrackingData[];
    
    if (!filters.actionType && !filters.trackingType && !filters.status && !filters.minDuration && !filters.since) {
      result = actions;
    } else {
      result = context.miroirContext.runActionTracker.getFilteredActions({
        actionType: filters.actionType || undefined,
        trackingType: filters.trackingType as 'action' | 'testSuite' | 'test' | 'testAssertion' || undefined,
        status: filters.status as 'running' | 'completed' | 'error' || undefined,
        minDuration: filters.minDuration ? parseInt(filters.minDuration) : undefined,
        since: filters.since ? new Date(filters.since).getTime() : undefined,
      });
    }
    
    console.log(`RunActionTimeline [${componentId}] - Filtered:`, result.length, 'actions from', actions.length, 'total');
    return result;
  }, [actions, filters, context.miroirContext.runActionTracker, componentId]);

  // Get unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set(actions.map(action => action.actionType));
    return Array.from(types).sort();
  }, [actions]);

  // Build tree structure for nested display (TreeNode uses nested children)
  const actionTree = useMemo<TreeNode[]>(() => {
    const rootActions = filteredActions.filter((action: ActionTrackingData) => !action.parentId);
    
    console.log(`RunActionTimeline [${componentId}] - Building tree with`, rootActions.length, 'root actions');

    const buildTree = (action: ActionTrackingData): TreeNode => {
      const children: TreeNode[] = filteredActions
        .filter((child: ActionTrackingData) => child.parentId === action.id)
        .map((c) => buildTree(c));

  // Return a TreeNode with nested children (may be empty array)
  return ({ ...(action as any), children } as TreeNode);
    };

    const tree = rootActions.map(buildTree);
    console.log(`RunActionTimeline [${componentId}] - Tree built with`, tree.length, 'top-level items');
    
    return tree;
  }, [filteredActions, componentId]);

  const handleToggleExpanded = useCallback((actionId: string) => {
    setExpanded(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  }, []);

  const handleViewActionLogs = useCallback((actionId: string) => {
    navigate(`/action-logs/${actionId}`);
  }, [navigate]);

  const handleClearActions = useCallback(() => {
    context.miroirContext.runActionTracker.clear();
  }, [context.miroirContext.runActionTracker]);

  const handleRefresh = useCallback(() => {
    setActions(context.miroirContext.runActionTracker.getAllActions());
  }, [context.miroirContext.runActionTracker]);

  const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const getStatusIcon = (action: ActionTrackingData) => {
    // Test-specific icons
    if (action.trackingType === 'testSuite') {
      return action.status === 'completed' ? <AssignmentTurnedIn color="success" /> : 
             action.status === 'error' ? <Assignment color="error" /> : 
             <Assignment color="primary" />;
    }
    if (action.trackingType === 'test') {
      return action.status === 'completed' && action.testResult === 'ok' ? <Science color="success" /> :
             action.status === 'error' || action.testResult === 'error' ? <BugReport color="error" /> :
             <Science color="primary" />;
    }
    if (action.trackingType === 'testAssertion') {
      return action.status === 'completed' && action.testResult === 'ok' ? <CheckCircle color="success" /> :
             action.status === 'error' || action.testResult === 'error' ? <Error color="error" /> :
             <PlayArrow color="primary" />;
    }
    
    // Standard action icons
    switch (action.status) {
      case 'running':
        return <PlayArrow color="primary" />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  const getStatusIcon_old = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayArrow color="primary" />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (action: ActionTrackingData) => {
    // For tests, consider both status and testResult
    if (action.trackingType === 'test' || action.trackingType === 'testAssertion') {
      if (action.status === 'completed' && action.testResult === 'ok') return 'success';
      if (action.status === 'error' || action.testResult === 'error') return 'error';
      if (action.status === 'running') return 'primary';
      return 'default';
    }
    
    // Standard action status colors
    switch (action.status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor_old = (status: string) => {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getDisplayLabel = (action: ActionTrackingData) => {
    // For tests, show the test-specific name
    if (action.trackingType === 'testSuite') return action.testSuite || action.actionLabel || 'Test Suite';
    if (action.trackingType === 'test') return action.test || action.actionLabel || 'Test';
    if (action.trackingType === 'testAssertion') return action.testAssertion || action.actionLabel || 'Test Assertion';
    
    // For actions, use the standard label
    return action.actionLabel || action.actionType;
  };

  const getTrackingTypeLabel = (trackingType: string) => {
    switch (trackingType) {
      case 'testSuite': return 'Test Suite';
      case 'test': return 'Test';
      case 'testAssertion': return 'Assertion';
      case 'action': return 'Action';
      default: return trackingType;
    }
  };

  const renderAction = (action: TreeNode, depth = 0) => {
    const isExpanded = expanded[action.id];
    const hasChildren = action.children && action.children.length > 0;
    const indentLevel = depth * 24;

    return (
      <div key={action.id}>
        <ListItem
          sx={{
            pl: `${16 + indentLevel}px`,
            borderLeft: depth > 0 ? '1px solid #e0e0e0' : 'none',
            ml: depth > 0 ? '12px' : 0,
            bgcolor: action.trackingType !== 'action' ? '#f8f9ff' : 'inherit', // Light blue tint for tests
          }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            {getStatusIcon(action)}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {getDisplayLabel(action)}
                </Typography>
                <Chip
                  label={getTrackingTypeLabel(action.trackingType)}
                  size="small"
                  color={action.trackingType !== 'action' ? 'secondary' : 'default'}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
                <Chip
                  label={action.trackingType === 'test' || action.trackingType === 'testAssertion' 
                    ? (action.testResult || action.status) 
                    : action.status}
                  size="small"
                  color={getStatusColor(action) as any}
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  {formatDuration(action.duration)}
                </Typography>
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption">
                  Started: {formatTime(action.startTime)}
                </Typography>
                {action.endTime && (
                  <Typography variant="caption">
                    Ended: {formatTime(action.endTime)}
                  </Typography>
                )}
                {action.error && (
                  <Typography variant="caption" color="error">
                    Error: {action.error}
                  </Typography>
                )}
              </Box>
            }
          />
          
          <Tooltip title="View Action Logs">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleViewActionLogs(action.id);
              }}
              sx={{ mr: 1 }}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          
          {hasChildren && (
            <IconButton
              size="small"
              onClick={() => handleToggleExpanded(action.id)}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded}>
            {action.children?.map((child: ActionTrackingData & { children?: any[] }) => renderAction(child, depth + 1))}
          </Collapse>
        )}
      </div>
    );
  };

  return (
    <Box
      className={className}
      style={{
        width: '100%',
        maxHeight: '70vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Filter">
              <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
                <FilterList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear All">
              <IconButton size="small" onClick={handleClearActions}>
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {filteredActions.length} items ({actions.filter(a => a.status === 'running').length} running) - 
          Actions: {actions.filter(a => a.trackingType === 'action').length}, 
          Tests: {actions.filter(a => a.trackingType !== 'action').length}
        </Typography>
      </Box>

      <Collapse in={showFilters}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tracking Type</InputLabel>
              <Select
                value={filters.trackingType}
                label="Tracking Type"
                onChange={(e) => handleFilterChange('trackingType', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="action">Actions Only</MenuItem>
                <MenuItem value="testSuite">Test Suites</MenuItem>
                <MenuItem value="test">Tests</MenuItem>
                <MenuItem value="testAssertion">Test Assertions</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" fullWidth>
              <InputLabel>Action Type</InputLabel>
              <Select
                value={filters.actionType}
                label="Action Type"
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {actionTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              size="small"
              label="Min Duration (ms)"
              value={filters.minDuration}
              onChange={(e) => handleFilterChange('minDuration', e.target.value)}
              type="number"
            />
          </Box>
        </Box>
      </Collapse>

      <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
        {actionTree.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No actions or tests to display
            </Typography>
          </Box>
        ) : (
          <List dense>
            {actionTree.map((action: ActionTrackingData & { children?: any[] }) => renderAction(action))}
          </List>
        )}
      </Box>
    </Box>
  );
});
