import {
  BugReport,
  ErrorIcon,
  ExpandLess,
  ExpandMore,
  Info,
  Warning
} from './Themes/MaterialSymbolWrappers';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { getActivityTopic, type MiroirEventLog } from 'miroir-core';
import React from 'react';

// Utility function to get appropriate icon for log level
export const getLogLevelIcon = (level: string) => {
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
export const getLogLevelColor = (level: string) => {
  switch (level) {
    case 'trace': return 'default';
    case 'debug': return 'info';
    case 'info': return 'primary';
    case 'warn': return 'warning';
    case 'error': return 'error';
    default: return 'default';
  }
};

// const LogEntryComponent: React.FC<{ logEntry: MiroirEventLog; isExpanded: boolean; onToggle: () => void }> = ({
export const EventLogComponent: React.FC<{ eventLog: MiroirEventLog; isExpanded: boolean; onToggle: () => void }> = ({
  eventLog: eventLog,
  isExpanded,
  onToggle
}) => {
  const timestamp = new Date(eventLog.timestamp).toLocaleTimeString();
  
  return (
    <ListItem
      divider
      sx={{
        flexDirection: "column",
        alignItems: "stretch",
        backgroundColor:
          eventLog.level === "error"
            ? "rgba(244, 67, 54, 0.05)"
            : eventLog.level === "warn"
            ? "rgba(255, 152, 0, 0.05)"
            : "inherit",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", width: "100%", cursor: "pointer" }}
        onClick={onToggle}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>{getLogLevelIcon(eventLog.level)}</ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={eventLog.level.toUpperCase()}
                size="small"
                color={getLogLevelColor(eventLog.level) as any}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                {timestamp}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                [{eventLog.loggerName}]
              </Typography>
            </Box>
          }
          secondary={
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {eventLog.message}
            </Typography>
          }
        />
        <IconButton size="small">{isExpanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ pl: 7, pb: 1 }}>
          {eventLog.args.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Arguments:
              </Typography>
              <Box
                sx={{
                  pl: 1,
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  backgroundColor: "#f5f5f5",
                  p: 1,
                  borderRadius: 1,
                  mt: 0.5,
                }}
              >
                {eventLog.args.map((arg: any, index: number) => (
                  <div key={index}>
                    {typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)}
                  </div>
                ))}
              </Box>
            </Box>
          )}

          {eventLog.event && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Context:
              </Typography>
              <Box sx={{ pl: 1, mt: 0.5 }}>
                {/* {Object.entries(logEntry.event).map(([key, value]) => (
                  value && (
                    <Typography key={key} variant="caption" display="block">
                      {key}: {String(value)}
                    </Typography>
                  )
                ))} */}
                <Typography variant="caption" display="block">
                  activity: {String(eventLog.event.activity?.activityId || "N/A")}, type:{" "}
                  {String(eventLog.event.activity?.activityType || "N/A")}, topic:{" "}
                  {String(getActivityTopic(eventLog.event.activity) || "N/A")}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </ListItem>
  );
};
