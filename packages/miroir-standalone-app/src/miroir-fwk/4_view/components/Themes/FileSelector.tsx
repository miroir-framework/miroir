/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { useCallback } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { CloudUploadIcon, CheckCircle as CheckCircleIcon, Clear as ClearIcon } from './MaterialSymbolWrappers';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
export interface FileSelectorProps extends Omit<ThemedComponentProps, 'children'> {
  /** Title for the file selector section */
  title?: string;
  /** Description text shown below the title */
  description?: string;
  /** Button label for file selection */
  buttonLabel?: string;
  /** Accepted file types (e.g., ".json", ".csv", ".json,.txt") */
  accept?: string;
  /** Callback when a file is selected */
  onFileSelect?: (file: File) => void;
  /** Callback when file is cleared */
  onFileClear?: () => void;
  /** Current selected file name to display */
  selectedFileName?: string | null;
  /** Error message to display */
  error?: string | null;
  /** Success message to display */
  successMessage?: string | null;
  /** Whether to show the border around the component */
  showBorder?: boolean;
}

// ################################################################################################
/**
 * Reusable File Selector Component
 * 
 * A themable file upload component that provides:
 * - File selection button with icon
 * - Display of selected file name
 * - Error and success feedback
 * - Clear file functionality
 * - Consistent styling with Miroir theme
 */
export const FileSelector: React.FC<FileSelectorProps> = ({
  title = "Select File",
  description,
  buttonLabel = "Select File",
  accept = "*",
  onFileSelect,
  onFileClear,
  selectedFileName,
  error,
  successMessage,
  showBorder = true,
  className,
  style,
}) => {
  const { currentTheme } = useMiroirTheme();

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [onFileSelect]);

  // Handle clear button click
  const handleClear = useCallback(() => {
    if (onFileClear) {
      onFileClear();
    }
  }, [onFileClear]);

  // Container styles
  const containerStyles = css({
    marginBottom: currentTheme.spacing.lg,
    padding: currentTheme.spacing.md,
    border: showBorder ? `1px solid ${currentTheme.colors.border}` : 'none',
    borderRadius: currentTheme.borderRadius.md,
    backgroundColor: currentTheme.colors.surface,
  });

  // Title styles
  const titleStyles = css({
    marginBottom: currentTheme.spacing.sm,
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.lg,
    fontWeight: currentTheme.typography.fontWeight.bold,
  });

  // Description styles
  const descriptionStyles = css({
    marginBottom: currentTheme.spacing.md,
    color: currentTheme.colors.textSecondary,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.sm,
    lineHeight: currentTheme.typography.lineHeight.normal,
  });

  // File info container styles
  const fileInfoStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: currentTheme.spacing.sm,
  });

  // File name text styles
  const fileNameStyles = css({
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.sm,
  });

  return (
    <Box css={containerStyles} className={className} style={style}>
      {/* Title */}
      {title && (
        <Typography css={titleStyles} variant="h6" component="h3">
          {title}
        </Typography>
      )}

      {/* Description */}
      {description && (
        <Typography css={descriptionStyles} variant="body2">
          {description}
        </Typography>
      )}

      {/* File selection controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
        >
          {buttonLabel}
          <input
            type="file"
            accept={accept}
            hidden
            onChange={handleFileChange}
          />
        </Button>

        {/* Selected file display */}
        {selectedFileName && (
          <Box css={fileInfoStyles}>
            <CheckCircleIcon sx={{ color: 'success.main' }} />
            <Typography css={fileNameStyles} variant="body2">
              {selectedFileName}
            </Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<ClearIcon />}
              onClick={handleClear}
            >
              Clear
            </Button>
          </Box>
        )}
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success message */}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}
    </Box>
  );
};
