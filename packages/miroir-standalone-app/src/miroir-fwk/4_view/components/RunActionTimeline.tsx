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

import { ActionTrackingData, LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { useMiroirContextService } from '../MiroirContextReactProvider.js';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunActionTimeline")
).then((logger: LoggerInterface) => { log = logger });

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

  // Debug: Log render with action count
  // log.info(`RunActionTimeline [${componentId}] - Component rendered with ${actions.length} actions`);

  // Subscribe to action tracking updates
  useEffect(() => {
    // log.info(`RunActionTimeline [${componentId}] - Setting up subscription`);
    
    const unsubscribe = context.miroirContext.runActionTracker.subscribe((newActions: ActionTrackingData[]) => {
      // log.info(`RunActionTimeline [${componentId}] - Received subscription update:`, newActions.length, 'actions');
      setActions(newActions);
    });

    // Get initial actions
    const initialActions = context.miroirContext.runActionTracker.getAllActions();
    // log.info(`RunActionTimeline [${componentId}] - Initial actions:`, initialActions.length, 'actions');
    setActions(initialActions);

    return () => {
      // log.info(`RunActionTimeline [${componentId}] - Cleaning up subscription`);
      unsubscribe();
    };
  }, [context.miroirContext.runActionTracker, componentId]);

  // Filter actions based on current filters
  const filteredActions = useMemo(() => {
    let result: ActionTrackingData[];
    
    log.debug(`RunActionTimeline [${componentId}] - Filtering with:`, filters);
    
    if (!filters.actionType && !filters.trackingType && !filters.status && !filters.minDuration && !filters.since) {
      // log.info(`RunActionTimeline [${componentId}] - No filters applied, using all actions`);
      result = actions;
    } else {
      // log.info(`RunActionTimeline [${componentId}] - Applying filters, tracker methods available:`, {
      //   hasGetFilteredActions: !!context.miroirContext.runActionTracker.getFilteredActions
      // });
      
      // Try using the tracker's built-in filtering if available
      if (context.miroirContext.runActionTracker.getFilteredActions) {
        try {
          const filterCriteria = {
            actionType: filters.actionType || undefined,
            trackingType: filters.trackingType as 'action' | 'testSuite' | 'test' | 'testAssertion' || undefined,
            status: filters.status as 'running' | 'completed' | 'error' || undefined,
            minDuration: filters.minDuration ? parseInt(filters.minDuration) : undefined,
            since: filters.since ? new Date(filters.since).getTime() : undefined,
          };
          // log.info(`RunActionTimeline [${componentId}] - Using tracker filtering with criteria:`, filterCriteria);
          result = context.miroirContext.runActionTracker.getFilteredActions(filterCriteria);
        } catch (error) {
          log.error(`RunActionTimeline [${componentId}] - Tracker filtering failed:`, error);
          result = actions; // Fallback to all actions
        }
      } else {
        // Fallback to manual filtering
        // log.info(`RunActionTimeline [${componentId}] - Using manual filtering`);
        result = actions.filter(action => {
          let include = true;
          if (filters.actionType && action.actionType !== filters.actionType) {
            // log.debug(`RunActionTimeline [${componentId}] - Excluding action ${action.id} due to actionType filter:`, {
            //   expected: filters.actionType,
            //   actual: action.actionType
            // });
            include = false;
          }
          if (filters.trackingType && action.trackingType !== filters.trackingType) {
            // log.debug(`RunActionTimeline [${componentId}] - Excluding action ${action.id} due to trackingType filter:`, {
            //   expected: filters.trackingType,
            //   actual: action.trackingType
            // });
            include = false;
          }
          if (filters.status && action.status !== filters.status) {
            // log.debug(`RunActionTimeline [${componentId}] - Excluding action ${action.id} due to status filter:`, {
            //   expected: filters.status,
            //   actual: action.status
            // });
            include = false;
          }
          if (filters.minDuration && action.duration && action.duration < parseInt(filters.minDuration)) {
            // log.debug(`RunActionTimeline [${componentId}] - Excluding action ${action.id} due to minDuration filter:`, {
            //   expected: filters.minDuration,
            //   actual: action.duration
            // });
            include = false;
          }
          if (filters.since && action.startTime && action.startTime < new Date(filters.since).getTime()) {
            // log.debug(`RunActionTimeline [${componentId}] - Excluding action ${action.id} due to since filter:`, {
            //   expected: filters.since,
            //   actual: action.startTime
            // });
            include = false;
          }
          return include;
        });
      }
    }
    
    // log.info(`RunActionTimeline [${componentId}] - Filtered:`, result.length, 'actions from', actions.length, 'total');
    return result;
  }, [actions, filters, context.miroirContext.runActionTracker, componentId]);

  // Get unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    // log.debug(`RunActionTimeline [${componentId}] - Computing actionTypes from ${actions.length} actions`);
    
    const allActionTypes = actions
      .map(action => action.actionType)
      .filter(actionType => actionType && actionType.trim() !== '');
    
    const types = new Set(allActionTypes);
    const result = Array.from(types).sort();
    
    // log.debug(`RunActionTimeline [${componentId}] - Found ${result.length} unique action types:`, result);
    
    return result;
  }, [actions.length, actions.map(a => a.id).join(','), componentId]);

  // Get unique tracking types for filter dropdown
  const trackingTypes = useMemo(() => {
    // log.debug(`RunActionTimeline [${componentId}] - Computing trackingTypes from ${actions.length} actions`);
    
    const allTrackingTypes = actions
      .map(action => action.trackingType)
      .filter(trackingType => trackingType && trackingType.trim() !== '');
    
    const types = new Set(allTrackingTypes);
    const result = Array.from(types).sort();
    
    // log.debug(`RunActionTimeline [${componentId}] - Found ${result.length} unique tracking types:`, result);
    
    return result;
  }, [actions.length, actions.map(a => a.id).join(','), componentId]);

  // Build tree structure for nested display (TreeNode uses nested children)
  // Sort by timestamp descending (newest first)
  const actionTree = useMemo<TreeNode[]>(() => {
    const rootActions = filteredActions
      .filter((action: ActionTrackingData) => !action.parentId)
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0)); // Sort newest first
    
    // log.info(`RunActionTimeline [${componentId}] - Building tree with`, rootActions.length, 'root actions from', filteredActions.length, 'filtered actions');

    const buildTree = (action: ActionTrackingData): TreeNode => {
      const children: TreeNode[] = filteredActions
        .filter((child: ActionTrackingData) => child.parentId === action.id)
        .sort((a, b) => (b.startTime || 0) - (a.startTime || 0)) // Sort children newest first too
        .map((c) => buildTree(c));

      // Return a TreeNode with nested children (may be empty array)
      return ({ ...(action as any), children } as TreeNode);
    };

    const tree = rootActions.map(buildTree);
    // log.info(`RunActionTimeline [${componentId}] - Tree built with`, tree.length, 'top-level items');
    
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
    // log.info(`RunActionTimeline [${componentId}] - Filter change:`, { field, value, oldFilters: filters });
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      // log.info(`RunActionTimeline [${componentId}] - New filters:`, newFilters);
      return newFilters;
    });
  }, [filters, componentId]);

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
            primaryTypographyProps={{ component: "div" }}
            secondaryTypographyProps={{ component: "div" }}
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium" component="span">
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
                <Typography variant="caption" color="text.secondary" component="span">
                  {formatDuration(action.duration)}
                </Typography>
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" component="span">
                  Started: {formatTime(action.startTime)}
                </Typography>
                {action.endTime && (
                  <Typography variant="caption" component="span">
                    Ended: {formatTime(action.endTime)}
                  </Typography>
                )}
                {action.error && (
                  <Typography variant="caption" color="error" component="span">
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
        height: '100%',
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
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f5f5f5', position: 'relative', zIndex: 1000 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Tracking Type</InputLabel>
              <select 
                value={filters.trackingType}
                onChange={(e) => {
                  handleFilterChange('trackingType', e.target.value);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #c4c4c4',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff',
                  width: '100%',
                  marginTop: '16px',
                  fontFamily: 'inherit'
                }}
              >
                <option value="">All</option>
                {trackingTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </FormControl>
            
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Action Type</InputLabel>
              <select 
                value={filters.actionType}
                onChange={(e) => {
                  handleFilterChange('actionType', e.target.value);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #c4c4c4',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff',
                  width: '100%',
                  marginTop: '16px',
                  fontFamily: 'inherit'
                }}
              >
                <option value="">All</option>
                {actionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </FormControl>
            
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => {
                  log.info(`RunActionTimeline [${componentId}] - Status dropdown changed:`, e.target.value);
                  handleFilterChange('status', e.target.value);
                }}
                onOpen={() => log.info(`RunActionTimeline [${componentId}] - Status dropdown opened`)}
                onClose={() => log.info(`RunActionTimeline [${componentId}] - Status dropdown closed`)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      zIndex: 2000,
                    },
                  },
                }}
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

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
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
