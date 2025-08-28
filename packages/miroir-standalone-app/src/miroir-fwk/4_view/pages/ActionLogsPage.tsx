import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Download,
  Clear,
  Search,
  BugReport,
  Info,
  Warning,
  Error as ErrorIcon,
  Visibility,
  Close,
  PlayArrow,
  CheckCircle,
  ErrorOutline
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useMiroirContextService } from '../MiroirContextReactProvider';

// Local type definitions (temporarily until exports work)
interface ActionLogEntry {
  id: string;
  actionId: string;
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  loggerName: string;
  message: string;
  args: any[];
  context?: {
    testSuite?: string;
    test?: string;
    testAssertion?: string;
    compositeAction?: string;
    action?: string;
  };
}

interface ActionLogs {
  actionId: string;
  actionType: string;
  actionLabel?: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'error';
  logs: ActionLogEntry[];
  logCounts: {
    trace: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    total: number;
  };
}

interface ActionLogFilter {
  actionId?: string;
  actionType?: string;
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  since?: number;
  searchText?: string;
  loggerName?: string;
}

// Utility function to get appropriate icon for log level
const getLogLevelIcon = (level: string) => {
  switch (level) {
    case 'trace': return <BugReport fontSize="small" />;
    case 'debug': return <BugReport fontSize="small" />;
    case 'info': return <Info fontSize="small" />;
    case 'warn': return <Warning fontSize="small" color="warning" />;
    case 'error': return <ErrorIcon fontSize="small" color="error" />;
    default: return <Info fontSize="small" />;
  }
};

// Utility function to get chip color for log level
const getLogLevelColor = (level: string) => {
  switch (level) {
    case 'trace': return 'default';
    case 'debug': return 'info';
    case 'info': return 'primary';
    case 'warn': return 'warning';
    case 'error': return 'error';
    default: return 'default';
  }
};

// Utility function to get icon for action status
const getActionStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return <PlayArrow color="primary" />;
    case 'completed': return <CheckCircle color="success" />;
    case 'error': return <ErrorOutline color="error" />;
    default: return <PlayArrow />;
  }
};

// Component for displaying individual log entry
const LogEntryComponent: React.FC<{ logEntry: ActionLogEntry; isExpanded: boolean; onToggle: () => void }> = ({
  logEntry,
  isExpanded,
  onToggle
}) => {
  const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
  
  return (
    <ListItem 
      divider 
      sx={{ 
        flexDirection: 'column', 
        alignItems: 'stretch',
        backgroundColor: logEntry.level === 'error' ? 'rgba(244, 67, 54, 0.05)' : 
                       logEntry.level === 'warn' ? 'rgba(255, 152, 0, 0.05)' : 'inherit'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer' }} onClick={onToggle}>
        <ListItemIcon sx={{ minWidth: 36 }}>
          {getLogLevelIcon(logEntry.level)}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={logEntry.level.toUpperCase()} 
                size="small" 
                color={getLogLevelColor(logEntry.level) as any}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                {timestamp}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                [{logEntry.loggerName}]
              </Typography>
            </Box>
          }
          secondary={
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {logEntry.message}
            </Typography>
          }
        />
        <IconButton size="small">
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      <Collapse in={isExpanded}>
        <Box sx={{ pl: 7, pb: 1 }}>
          {logEntry.args.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Arguments:</Typography>
              <Box sx={{ pl: 1, fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, mt: 0.5 }}>
                {logEntry.args.map((arg: any, index: number) => (
                  <div key={index}>
                    {typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)}
                  </div>
                ))}
              </Box>
            </Box>
          )}
          
          {logEntry.context && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Context:</Typography>
              <Box sx={{ pl: 1, mt: 0.5 }}>
                {Object.entries(logEntry.context).map(([key, value]) => (
                  value && (
                    <Typography key={key} variant="caption" display="block">
                      {key}: {String(value)}
                    </Typography>
                  )
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </ListItem>
  );
};

// Main component for viewing action logs
export const ActionLogsPage: React.FC = () => {
  const { actionId } = useParams<{ actionId: string }>();
  const navigate = useNavigate();
  const { miroirContext } = useMiroirContextService();
  
  const [actionLogs, setActionLogs] = useState<ActionLogs[]>([]);
  const [currentActionLogs, setCurrentActionLogs] = useState<ActionLogs | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActionLogEntry | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<{
    level?: string;
    searchText?: string;
    loggerName?: string;
  }>({});

  // Subscribe to action logs updates
  useEffect(() => {
    const actionLogService = (miroirContext as any).actionLogService;
    if (!actionLogService) {
      console.warn('ActionLogService not available');
      return;
    }

    const unsubscribe = actionLogService.subscribe((logs: ActionLogs[]) => {
      setActionLogs(logs);
      
      // Update current action logs if viewing a specific action
      if (actionId) {
        const current = logs.find((log: ActionLogs) => log.actionId === actionId);
        setCurrentActionLogs(current || null);
      }
    });

    // Initial load
    const allLogs = actionLogService.getAllActionLogs();
    setActionLogs(allLogs);
    
    if (actionId) {
      const current = allLogs.find((log: ActionLogs) => log.actionId === actionId);
      setCurrentActionLogs(current || null);
    }

    return unsubscribe;
  }, [miroirContext, actionId]);

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    if (!currentActionLogs) return [];
    
    return currentActionLogs.logs.filter((log: ActionLogEntry) => {
      if (filters.level && log.level !== filters.level) {
        return false;
      }
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        if (!log.message.toLowerCase().includes(searchLower) &&
            !log.args.some((arg: any) => String(arg).toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      if (filters.loggerName && !log.loggerName.includes(filters.loggerName)) {
        return false;
      }
      return true;
    });
  }, [currentActionLogs, filters]);

  const handleToggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogIds);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogIds(newExpanded);
  };

  const handleExportLogs = () => {
    const actionLogService = (miroirContext as any).actionLogService;
    if (!actionLogService) {
      console.warn('ActionLogService not available');
      return;
    }

    const exportData = actionLogService.exportLogs();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-logs-${actionId || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  if (actionId && !currentActionLogs) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Action Logs
        </Typography>
        <Typography color="text.secondary">
          No logs found for action ID: {actionId}
        </Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  const logsToDisplay = actionId ? [currentActionLogs!] : actionLogs;
  const currentLogs = actionId ? filteredLogs : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {actionId ? `Logs for Action: ${currentActionLogs?.actionType || actionId}` : 'Action Logs'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export logs">
            <IconButton onClick={handleExportLogs}>
              <Download />
            </IconButton>
          </Tooltip>
          {actionId && (
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Back to Timeline
            </Button>
          )}
        </Box>
      </Box>

      {actionId && currentActionLogs && (
        <>
          {/* Action Details */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getActionStatusIcon(currentActionLogs.status)}
                      <Typography variant="h6">
                        {currentActionLogs.actionType}
                      </Typography>
                      {currentActionLogs.actionLabel && (
                        <Chip label={currentActionLogs.actionLabel} size="small" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Started: {new Date(currentActionLogs.startTime).toLocaleString()}
                    </Typography>
                    {currentActionLogs.endTime && (
                      <Typography variant="body2" color="text.secondary">
                        Ended: {new Date(currentActionLogs.endTime).toLocaleString()}
                      </Typography>
                    )}
                    {currentActionLogs.endTime && (
                      <Typography variant="body2" color="text.secondary">
                        Duration: {currentActionLogs.endTime - currentActionLogs.startTime}ms
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Log Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(currentActionLogs.logCounts).map(([level, count]) => (
                        level !== 'total' && (count as number) > 0 && (
                          <Badge key={level} badgeContent={count as number} color="primary">
                            <Chip 
                              label={level.toUpperCase()}
                              color={getLogLevelColor(level) as any}
                              variant="outlined"
                              size="small"
                            />
                          </Badge>
                        )
                      ))}
                      <Chip 
                        label={`Total: ${currentActionLogs.logCounts.total}`}
                        color="default"
                        variant="filled"
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Filters</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Log Level</InputLabel>
                  <Select
                    value={filters.level || ''}
                    label="Log Level"
                    onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value || undefined }))}
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    <MenuItem value="trace">Trace</MenuItem>
                    <MenuItem value="debug">Debug</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warn">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Text"
                  value={filters.searchText || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value || undefined }))}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Logger Name"
                  value={filters.loggerName || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, loggerName: e.target.value || undefined }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<Clear />}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Logs List */}
          <Paper>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                Logs ({filteredLogs.length} entries)
              </Typography>
            </Box>
            
            {filteredLogs.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No logs found matching the current filters.
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                {filteredLogs.map((log: ActionLogEntry) => (
                  <LogEntryComponent
                    key={log.id}
                    logEntry={log}
                    isExpanded={expandedLogIds.has(log.id)}
                    onToggle={() => handleToggleLogExpansion(log.id)}
                  />
                ))}
              </List>
            )}
          </Paper>
        </>
      )}

      {!actionId && (
        <>
          {/* Actions Overview */}
          <Paper>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                Recent Actions with Logs ({actionLogs.length} actions)
              </Typography>
            </Box>
            
            {actionLogs.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No action logs available. Execute some actions to see logs here.
                </Typography>
              </Box>
            ) : (
              <List>
                {actionLogs.map((actionLog) => (
                  <ListItem 
                    key={actionLog.actionId}
                    divider
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/action-logs/${actionLog.actionId}`)}
                  >
                    <ListItemIcon>
                      {getActionStatusIcon(actionLog.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {actionLog.actionType}
                          </Typography>
                          {actionLog.actionLabel && (
                            <Chip label={actionLog.actionLabel} size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Started: {new Date(actionLog.startTime).toLocaleString()}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip 
                              label={`${actionLog.logCounts.total} logs`}
                              size="small"
                              variant="outlined"
                            />
                            {actionLog.logCounts.error > 0 && (
                              <Chip 
                                label={`${actionLog.logCounts.error} errors`}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
                            {actionLog.logCounts.warn > 0 && (
                              <Chip 
                                label={`${actionLog.logCounts.warn} warnings`}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <IconButton>
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </>
      )}

      {/* Log Detail Modal */}
      <Dialog open={logDetailOpen} onClose={() => setLogDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Log Entry Details
          <IconButton
            onClick={() => setLogDetailOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedLog.message}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Level: {selectedLog.level} | Time: {new Date(selectedLog.timestamp).toLocaleString()}
              </Typography>
              {selectedLog.args.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Arguments:</Typography>
                  <pre style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4, overflow: 'auto' }}>
                    {JSON.stringify(selectedLog.args, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
