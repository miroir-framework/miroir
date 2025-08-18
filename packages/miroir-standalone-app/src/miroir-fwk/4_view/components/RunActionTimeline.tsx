import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from '@mui/icons-material';

import { ActionTrackingData } from 'miroir-core';
import { useMiroirContextService } from '../MiroirContextReactProvider.js';

export interface RunActionTimelineProps {
  className?: string;
  style?: React.CSSProperties;
}

interface FilterState {
  actionType: string;
  status: string;
  minDuration: string;
  since: string;
}

export const RunActionTimeline: React.FC<RunActionTimelineProps> = ({
  className,
  style,
}) => {
  const context = useMiroirContextService();
  const [actions, setActions] = useState<ActionTrackingData[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    actionType: '',
    status: '',
    minDuration: '',
    since: '',
  });

  // Subscribe to action tracking updates
  useEffect(() => {
    const unsubscribe = context.miroirContext.runActionTracker.subscribe((newActions: ActionTrackingData[]) => {
      setActions(newActions);
    });

    // Get initial actions
    setActions(context.miroirContext.runActionTracker.getAllActions());

    return unsubscribe;
  }, [context.miroirContext.runActionTracker]);

  // Filter actions based on current filters
  const filteredActions = useMemo(() => {
    if (!filters.actionType && !filters.status && !filters.minDuration && !filters.since) {
      return actions;
    }

    return context.miroirContext.runActionTracker.getFilteredActions({
      actionType: filters.actionType || undefined,
      status: filters.status as any || undefined,
      minDuration: filters.minDuration ? parseInt(filters.minDuration) : undefined,
      since: filters.since ? new Date(filters.since).getTime() : undefined,
    });
  }, [actions, filters, context.miroirContext.runActionTracker]);

  // Get unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set(actions.map(action => action.actionType));
    return Array.from(types).sort();
  }, [actions]);

  // Build tree structure for nested display
  const actionTree = useMemo(() => {
    const rootActions = filteredActions.filter((action: ActionTrackingData) => !action.parentId);
    
    const buildTree = (action: ActionTrackingData): ActionTrackingData & { children: any[] } => {
      const children = filteredActions
        .filter((child: ActionTrackingData) => child.parentId === action.id)
        .map(buildTree);
      
      return { ...action, ...children };
    };
    
    return rootActions.map(buildTree);
  }, [filteredActions]);

  const handleToggleExpanded = useCallback((actionId: string) => {
    setExpanded(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  }, []);

  const handleClearActions = useCallback(() => {
    context.miroirContext.runActionTracker.clear();
  }, [context.miroirContext.runActionTracker]);

  const handleRefresh = useCallback(() => {
    setActions(context.miroirContext.runActionTracker.getAllActions());
  }, [context.miroirContext.runActionTracker]);

  const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  const renderAction = (action: ActionTrackingData & { children?: any[] }, depth = 0) => {
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
          }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            {getStatusIcon(action.status)}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {action.actionLabel || action.actionType}
                </Typography>
                <Chip
                  label={action.status}
                  size="small"
                  color={getStatusColor(action.status) as any}
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
    <Paper
      elevation={1}
      className={className}
      style={{
        position: 'fixed',
        top: '64px', // Below app bar
        right: '16px',
        width: '400px',
        maxHeight: 'calc(100vh - 80px)',
        zIndex: 1200,
        ...style,
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Action Timeline</Typography>
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
          {filteredActions.length} actions ({actions.filter(a => a.status === 'running').length} running)
        </Typography>
      </Box>

      <Collapse in={showFilters}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              No actions to display
            </Typography>
          </Box>
        ) : (
          <List dense>
            {actionTree.map((action: ActionTrackingData & { children?: any[] }) => renderAction(action))}
          </List>
        )}
      </Box>
    </Paper>
  );
};
