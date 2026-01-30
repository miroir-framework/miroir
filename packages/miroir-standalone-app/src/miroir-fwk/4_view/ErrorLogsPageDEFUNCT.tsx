import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertColor,
  Tooltip,
  Fab,
  Badge,
} from '@mui/material';
import {
  ExpandMoreIcon,
  ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  DeleteIcon,
  FilterList as FilterListIcon,
} from './components/Themes/MaterialSymbolWrappers';

import { useErrorLogService } from './MiroirContextReactProvider.js';
import { ErrorLogEntry } from './services/ErrorLogService.js';

// ##############################################################################################
// Error Logs Page - Comprehensive error management and viewing interface
// ##############################################################################################

export const ErrorLogsPageDEFUNCT: React.FC = () => {
  const errorLogService = useErrorLogService();
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  // filteredErrors is now derived via useMemo
  const [selectedError, setSelectedError] = useState<ErrorLogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  // Refresh errors from the service
  const refreshErrors = () => {
    setErrors([...errorLogService.getAllErrors()]);
  };

  // Initial load and set up refresh
  useEffect(() => {
    refreshErrors();
    
    // Subscribe to new errors for real-time updates
    const unsubscribe = errorLogService.subscribe((newError: ErrorLogEntry) => {
      refreshErrors();
    });

    return unsubscribe;
  }, [errorLogService]);

  // Filter errors based on current filters using useMemo
  const filteredErrors = useMemo(() => {
    let filtered = errors;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(error => error.category === categoryFilter);
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter(error => error.severity === severityFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(error => 
        error.errorMessage.toLowerCase().includes(searchLower) ||
        error.errorType.toLowerCase().includes(searchLower) ||
        (error.userMessage && error.userMessage.toLowerCase().includes(searchLower))
      );
    }
    if (!showResolved) {
      filtered = filtered.filter(error => !error.isResolved);
    }
    return filtered;
  }, [errors, categoryFilter, severityFilter, searchTerm, showResolved]);

  // Get error statistics
  const stats = useMemo(() => errorLogService.getErrorStats(), [errors]);

  // Helper functions
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (severity: string): AlertColor => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'startup':
        return 'error';
      case 'server':
        return 'warning';
      case 'client':
        return 'info';
      case 'network':
        return 'primary';
      case 'validation':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleResolveError = (errorId: string) => {
    errorLogService.resolveError(errorId);
    refreshErrors();
  };

  const handleClearAllErrors = () => {
    errorLogService.clearAllErrors();
    refreshErrors();
  };

  const handleExportErrors = () => {
    const exportData = errorLogService.exportErrors();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (error: ErrorLogEntry) => {
    setSelectedError(error);
    setDetailsOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Error Management Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshErrors}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportErrors}
            disabled={errors.length === 0}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClearAllErrors}
            disabled={errors.length === 0}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Errors
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Unresolved
              </Typography>
              <Typography variant="h4" color="error">
                {stats.unresolved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical/Error
              </Typography>
              <Typography variant="h4" color="error">
                {(stats.bySeverity.critical || 0) + (stats.bySeverity.error || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Warnings
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.bySeverity.warning || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterListIcon sx={{ mr: 1 }} />
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search errors..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="startup">Startup</MenuItem>
                  <MenuItem value="server">Server</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                  <MenuItem value="network">Network</MenuItem>
                  <MenuItem value="validation">Validation</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  label="Severity"
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant={showResolved ? "contained" : "outlined"}
                onClick={() => setShowResolved(!showResolved)}
                fullWidth
              >
                {showResolved ? 'Hide Resolved' : 'Show Resolved'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error List */}
      {filteredErrors.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="textSecondary" align="center">
              {errors.length === 0 ? 'No errors logged yet.' : 'No errors match the current filters.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Error</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredErrors.map((error) => (
                <TableRow key={error.id} sx={{ opacity: error.isResolved ? 0.6 : 1 }}>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimestamp(error.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getSeverityIcon(error.severity)}
                      <Chip
                        label={error.severity}
                        color={getSeverityColor(error.severity)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={error.category}
                      color={getCategoryColor(error.category) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {error.userMessage || error.errorMessage}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {error.errorType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {error.isResolved ? (
                      <Chip
                        label="Resolved"
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                      />
                    ) : (
                      <Chip
                        label="Open"
                        color="error"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(error)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {!error.isResolved && (
                        <Tooltip title="Mark as Resolved">
                          <IconButton
                            size="small"
                            onClick={() => handleResolveError(error.id)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Error Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Error Details
          {selectedError && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              {getSeverityIcon(selectedError.severity)}
              <Chip label={selectedError.category} size="small" />
              <Chip label={selectedError.severity} color={getSeverityColor(selectedError.severity)} size="small" />
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedError && (
            <Box sx={{ mt: 2 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Basic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Timestamp
                      </Typography>
                      <Typography>{formatTimestamp(selectedError.timestamp)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Error ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {selectedError.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Error Type
                      </Typography>
                      <Typography>{selectedError.errorType}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Typography>
                        {selectedError.isResolved ? 'Resolved' : 'Open'}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Error Message</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity={getSeverityColor(selectedError.severity)}>
                    {selectedError.userMessage && (
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>User Message:</strong> {selectedError.userMessage}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Technical Message:</strong> {selectedError.errorMessage}
                    </Typography>
                  </Alert>
                </AccordionDetails>
              </Accordion>

              {selectedError.stack && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Stack Trace</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 300
                      }}
                    >
                      {selectedError.stack}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Context Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto'
                      }}
                    >
                      {JSON.stringify(selectedError.context, null, 2)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedError.originalError && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Original Error Data</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 300
                      }}
                    >
                      {JSON.stringify(selectedError.originalError, null, 2)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedError && !selectedError.isResolved && (
            <Button
              onClick={() => {
                handleResolveError(selectedError.id);
                setDetailsOpen(false);
              }}
              color="success"
            >
              Mark as Resolved
            </Button>
          )}
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Unresolved Errors */}
      {stats.unresolved > 0 && (
        <Fab
          color="error"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {
            setCategoryFilter('all');
            setSeverityFilter('all');
            setShowResolved(false);
            setSearchTerm('');
          }}
        >
          <Badge badgeContent={stats.unresolved} color="secondary">
            <ErrorIcon />
          </Badge>
        </Fab>
      )}
    </Box>
  );
};
