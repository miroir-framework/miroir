import {
  Assignment,
  CheckCircle,
  Clear,
  Close,
  Download,
  ErrorOutline,
  History,
  PlayArrow,
  Search,
  Visibility
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  LoggerInterface,
  MiroirLoggerFactory,
  type MiroirContextInterface,
  type MiroirEvent,
  type MiroirEventLog,
  type MiroirEventService
} from "miroir-core";
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { packageName } from '../../../constants.js';
import { EventLogComponent, getLogLevelColor } from '../components/EventLogComponent';
import { cleanLevel } from '../constants.js';
import { useMiroirContextService, useMiroirEvents } from '../MiroirContextReactProvider';
import { usePageConfiguration } from '../services';

// Set up logger
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MiroirEventsPage"), "UI",
).then((logger: LoggerInterface) => {log = logger});


// Utility function to get icon for action status
const getActionStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return <PlayArrow color="primary" />;
    case 'completed': return <CheckCircle color="success" />;
    case 'error': return <ErrorOutline color="error" />;
    default: return <PlayArrow />;
  }
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Main component for viewing Miroir events
export const MiroirEventsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const navigate = useNavigate();
  const location = useLocation();
  const { miroirContext }:{ miroirContext: MiroirContextInterface} = useMiroirContextService();
  
  // UI-specific state only
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MiroirEventLog | null>(null);
  
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Events page configurations loaded successfully",
    actionName: "Events page configuration fetch"
  });

  // Filter states - create state for filters since they're user input
  const [filters, setFilters] = useState<{
    level?: string;
    searchText?: string;
    loggerName?: string;
  }>({});

  // Access events directly from service and compute derived data with memos
  const miroirEventService: MiroirEventService = miroirContext.miroirEventService;

  // Use memo to prevent unnecessary recalculations
  // const allEvents: MiroirEvent[] = Array.from(miroirEventService.events.values());
  const allEvents = useMiroirEvents();

  // Get current action logs when viewing a specific event
  const currentActionLogs = useMemo(() => {
    if (!eventId || !allEvents.length) return null;
    // const found = allEvents.find((event: MiroirEvent) => event.eventId === eventId) || null;
    const found = allEvents.find((event: MiroirEvent) => event.activity.activityId === eventId) || null;
    log.debug('MiroirEventsPage: computed currentActionLogs', { eventId, found: !!found, actionType: found?.activity.actionType });
    return found;
  }, [eventId, allEvents]);

  // Check if action exists
  const actionExists = useMemo(() => {
    if (!eventId) return true; // Not looking for specific action
    const exists = !!currentActionLogs;
    if (eventId) {
      log.info(`MiroirEventsPage: checking if action ${eventId} exists:`, exists);
      if (!exists) {
        log.warn(`Action log ${eventId} was requested but not found. Available actions:`, 
          allEvents.map(event => event.activity.activityId).join(', '));
      }
    }
    return exists;
  }, [eventId, currentActionLogs, allEvents]);

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    if (!currentActionLogs) return [];
    
    return currentActionLogs.eventLogs.filter((log: MiroirEventLog) => {
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

  const handleExportEvents = () => {
    if (!miroirEventService) {
      console.warn('MiroirEventService not available');
      return;
    }

    const exportData = miroirEventService.exportEvents();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-logs-${eventId || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    log.info(`Exported events${eventId ? ' for action ID: ' + eventId : ' (all)'}`);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Show error state if the action log doesn't exist
  if (actionExists === false) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: '100%', 
            mx: 'auto', 
            mb: 4, 
            backgroundColor: '#fff8e1',
            borderLeft: '4px solid #f44336'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ErrorOutline color="error" sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h5" color="error">
              Action Log Not Found
            </Typography>
          </Box>
          
          <Typography paragraph>
            The requested action log <code>{eventId}</code> could not be found. It may have been purged from the system or never existed.
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate(-1)}
              startIcon={<History />}
            >
              Go Back
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => navigate('/events')}
              startIcon={<Assignment />}
            >
              View All Miroir Events
            </Button>
          </Box>
        </Paper>
        
        {/* Display available events as a helpful reference */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Miroir Events
          </Typography>
          
          {allEvents.length === 0 ? (
            <Typography color="text.secondary">
              No events are currently available in the system.
            </Typography>
          ) : (
            <>
              <Typography paragraph>
                Here are the {Math.min(5, allEvents.length)} most recent events available:
              </Typography>
              
              <List sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
                {allEvents.slice(0, 5).map((event) => (
                  <ListItem 
                    key={event.activity.activityId} 
                    button
                    onClick={() => navigate(`/events?eventId=${event.activity.activityId}`)}
                    sx={{ borderBottom: '1px solid #e0e0e0' }}
                  >
                    <ListItemIcon>
                      {getActionStatusIcon(event.activity.status)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={event.activity.actionType || 'Unknown Action'} 
                      secondary={`ID: ${event.activity.activityId} • ${new Date(event.activity.startTime).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
              </List>
              
              {allEvents.length > 5 && (
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Button 
                    color="primary"
                    onClick={() => navigate('/events')}
                  >
                    View All {allEvents.length} Miroir Events
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>
    );
  }

  // Legacy check - remove query param and just go to main events page
  if (eventId && !currentActionLogs && actionExists === true) {
    // This is a fallback in case our earlier check didn't catch a missing action log
    log.warn(`Legacy check: Action log ${eventId} not found but actionExists wasn't set to false`);
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Miroir Events
        </Typography>
        <Typography color="text.secondary">
          No logs found for action ID: {eventId}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button 
            variant="outlined"
            onClick={() => navigate('/events')}
          >
            View All Miroir Events
          </Button>
        </Box>
      </Box>
    );
  }

  const logsToDisplay = eventId ? [currentActionLogs!] : allEvents;
  const currentLogs = eventId ? filteredLogs : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {eventId ? `Logs for Action: ${currentActionLogs?.activity.actionType || eventId}` : 'Miroir Events'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export logs">
            <IconButton onClick={handleExportEvents}>
              <Download />
            </IconButton>
          </Tooltip>
          {eventId && (
            <>
              <Button variant="outlined" onClick={() => navigate('/events')}>
                Back to All Logs
              </Button>
              <Button variant="text" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </>
          )}
        </Box>
      </Box>

      {eventId && currentActionLogs && (
        <>
          {/* Action Details */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getActionStatusIcon(currentActionLogs.activity.status)}
                      <Typography variant="h6">
                        {currentActionLogs.activity.actionType}
                      </Typography>
                      {currentActionLogs.activity.actionLabel && (
                        <Chip label={currentActionLogs.activity.actionLabel} size="small" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Started: {new Date(currentActionLogs.activity.startTime).toLocaleString()}
                    </Typography>
                    {currentActionLogs.activity.endTime && (
                      <Typography variant="body2" color="text.secondary">
                        Ended: {new Date(currentActionLogs.activity.endTime).toLocaleString()}
                      </Typography>
                    )}
                    {currentActionLogs.activity.endTime && (
                      <Typography variant="body2" color="text.secondary">
                        Duration: {currentActionLogs.activity.endTime - currentActionLogs.activity.startTime}ms
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
                {filteredLogs.map((log: MiroirEventLog) => (
                  <EventLogComponent
                    key={log.logId}
                    eventLog={log}
                    isExpanded={expandedLogIds.has(log.logId)}
                    onToggle={() => handleToggleLogExpansion(log.logId)}
                  />
                ))}
              </List>
            )}
          </Paper>
        </>
      )}

      {!eventId && (
        <>
          {/* Actions Overview */}
          <Paper>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                Recent Actions with Logs ({allEvents.length} actions)
              </Typography>
            </Box>
            
            {allEvents.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No events available. Execute some actions to see events here.
                </Typography>
              </Box>
            ) : (
              <List>
                {allEvents.map((actionLog: MiroirEvent) => (
                  <ListItem 
                    key={actionLog.activity.activityId}
                    divider
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/events?eventId=${actionLog.activity.activityId}`)}
                  >
                    <ListItemIcon>
                      {getActionStatusIcon(actionLog.activity.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {actionLog.activity.actionType}
                          </Typography>
                          {actionLog.activity.actionLabel && (
                            <Chip label={actionLog.activity.actionLabel} size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Started: {new Date(actionLog.activity.startTime).toLocaleString()}
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
