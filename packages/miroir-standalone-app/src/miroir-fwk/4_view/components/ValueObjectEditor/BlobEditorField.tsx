/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { FC, useMemo, useState, useCallback, useRef } from "react";
import { FormikProps } from "formik";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import GetAppIcon from "@mui/icons-material/GetApp";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/icons-material/Loop";

import {
  LoggerInterface,
  MiroirLoggerFactory,
  getBlobFileIcon,
  base64ToBlob,
  fileToBase64,
  validateMimeType,
  formatFileSize,
  MAX_BLOB_FILE_SIZE,
  BLOB_SIZE_WARNING_THRESHOLD,
} from "miroir-core";

import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import {
  ThemedBlobContainer,
  ThemedBlobEmptyState,
  ThemedBlobPreview,
  ThemedBlobMetadata,
  ThemedBlobIconDisplay,
  ThemedBlobDropZone,
} from "../Themes/index";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext";
import { DraggableContainer } from "../DraggableContainer";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "BlobEditorField"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// BlobEditorField Component
// ################################################################################################
/**
 * BlobEditorField - A specialized React component for displaying and editing binary content (blobs)
 * within the Miroir Framework's entity editor system.
 * 
 * @component
 * 
 * ## Purpose
 * 
 * This component provides a complete user interface for managing blob data (images, PDFs, documents, etc.)
 * within Miroir's JzodObjectEditor. It automatically renders different UI modes based on the blob's
 * MIME type and provides interactive upload capabilities via drag-and-drop or click-to-upload.
 * 
 * ## Key Features
 * 
 * - **Image Preview**: Displays images with a responsive preview and full-size lightbox modal
 * - **File Icons**: Shows appropriate icons for non-image files (PDF, ZIP, text, etc.)
 * - **Drag-and-Drop Upload**: Supports dragging files from the file system
 * - **Click-to-Upload**: Click anywhere on the container to trigger file selection
 * - **MIME Type Validation**: Validates uploaded files against allowed types from schema
 * - **File Size Validation**: Enforces 5MB warning threshold and 10MB hard limit
 * - **Read-Only Mode**: Disables uploads while maintaining preview and download functionality
 * - **Error Handling**: Graceful error display for validation failures and corrupted data
 * - **Metadata Display**: Shows filename and MIME type information
 * - **Download**: Provides download button for non-image files
 * 
 * ## Integration with JzodObjectEditor
 * 
 * This component is automatically used by `JzodObjectEditor` when:
 * 1. The schema has `tag.value.isBlob === true`
 * 2. The object structure matches: `{ filename: string, contents: { encoding, mimeType, data } }`
 * 
 * The JzodObjectEditor detects the isBlob tag and renders BlobEditorField instead of
 * regular object attribute editors.
 * 
 * ## Blob Data Structure
 * 
 * Expected blob object structure:
 * ```typescript
 * {
 *   filename: string,              // User-visible filename
 *   contents: {
 *     encoding: 'base64' | 'data-uri',  // Encoding format
 *     mimeType: string,                  // MIME type (e.g., 'image/png')
 *     data: string                       // Base64-encoded blob data
 *   }
 * }
 * ```
 * 
 * ## Props Documentation
 * 
 * @param {BlobEditorFieldProps} props
 * 
 * @prop {string} rootLessListKey - Formik field path to the blob object (e.g., "myBlob" or "myObject.myBlob")
 * @prop {(string|number)[]} rootLessListKeyArray - Array representation of the field path for nested access
 * @prop {any} currentValue - The blob object containing filename and contents
 * @prop {FormikProps<any>} formik - Formik context for form state management and updates
 * @prop {boolean} [readOnly=false] - If true, disables upload interactions but keeps preview/download
 * @prop {string[]} [allowedMimeTypes=[]] - Array of allowed MIME types (e.g., ['image/png', 'application/pdf'])
 *                                           Extracted from schema's mimeType enum definition
 * @prop {(error: string) => void} [onError] - Callback function invoked when validation errors occur
 * 
 * ## Usage Example
 * 
 * ```tsx
 * <BlobEditorField
 *   rootLessListKey="myDocument"
 *   rootLessListKeyArray={["myDocument"]}
 *   currentValue={{
 *     filename: "report.pdf",
 *     contents: {
 *       encoding: "base64",
 *       mimeType: "application/pdf",
 *       data: "JVBERi0xLjQKJeLjz9MKCg=="
 *     }
 *   }}
 *   formik={formik}
 *   readOnly={false}
 *   allowedMimeTypes={["application/pdf", "image/png"]}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 * 
 * ## Display Modes
 * 
 * The component automatically selects the appropriate display mode:
 * 
 * 1. **Empty State**: When contents is undefined/null
 *    - Shows upload prompt with cloud icon
 *    - Click or drag-and-drop to upload
 * 
 * 2. **Image Preview**: When MIME type starts with "image/"
 *    - Displays thumbnail preview (max 200x200px)
 *    - Click preview to open lightbox modal
 *    - Shows filename and MIME type
 *    - Click container or drag-drop to replace
 * 
 * 3. **File Icon**: For all other MIME types
 *    - Shows appropriate icon (PDF, ZIP, text, generic)
 *    - Displays filename and MIME type
 *    - Download button to save file
 *    - Click container or drag-drop to replace
 * 
 * ## File Upload Workflow
 * 
 * 1. User triggers upload (click or drag-drop)
 * 2. File size validation (warning at 5MB, reject at 10MB)
 * 3. MIME type validation against allowedMimeTypes
 * 4. Loading state displayed with spinner
 * 5. File converted to base64 using FileReader API
 * 6. Formik values updated atomically (filename, encoding, mimeType, data)
 * 7. Preview updated or error displayed
 * 
 * ## Validation Rules
 * 
 * ### Blob Structure Validation
 * - Encoding must be 'base64' or 'data-uri'
 * - MIME type is required when contents exist
 * - Data field must contain non-empty string
 * - Missing contents field is valid (empty state)
 * 
 * ### Upload Validation
 * - File must match one of the allowedMimeTypes (if specified)
 * - File size must be ≤ 10 MB (hard limit)
 * - Files > 5 MB show confirmation dialog
 * - Only one file can be uploaded at a time
 * 
 * ## Error Handling
 * 
 * The component handles these error scenarios:
 * - Invalid encoding in existing blob
 * - Missing required fields (mimeType, data)
 * - Upload file type mismatch
 * - Upload file too large
 * - File read errors
 * - Multiple files dropped
 * 
 * All errors are displayed inline and optionally reported via onError callback.
 * 
 * ## Customization Options
 * 
 * ### Theming
 * Uses Miroir's theme system via `useMiroirTheme()` hook. Themed components used:
 * - ThemedBlobContainer
 * - ThemedBlobPreview
 * - ThemedBlobEmptyState
 * - ThemedBlobMetadata
 * - ThemedBlobIconDisplay
 * - ThemedBlobDropZone
 * 
 * ### Allowed MIME Types
 * Control which file types can be uploaded by setting the mimeType enum in your entity schema:
 * ```json
 * "mimeType": {
 *   "type": "enum",
 *   "definition": ["image/png", "image/jpeg", "application/pdf"]
 * }
 * ```
 * 
 * ### Size Limits
 * File size limits are defined in constants:
 * - `BLOB_SIZE_WARNING_THRESHOLD`: 5 MB (shows confirmation)
 * - `MAX_BLOB_FILE_SIZE`: 10 MB (hard reject)
 * 
 * ## Accessibility
 * 
 * - Hidden file input with proper accept attribute
 * - Alt text on images using filename
 * - Keyboard navigation support
 * - Clear error messages
 * - ARIA labels on interactive elements
 * 
 * ## Performance Considerations
 * 
 * - Uses React.useMemo for blob data parsing
 * - Uses React.useCallback for event handlers
 * - Base64 conversion is async (doesn't block UI)
 * - Large files may impact Formik validation performance
 * 
 * ## Dependencies
 * 
 * External:
 * - Formik (form state management)
 * - @emotion/react (styling)
 * - @mui/icons-material (icons)
 * 
 * Internal (miroir-core):
 * - fileToBase64: Converts File/Blob to base64
 * - base64ToBlob: Converts base64 to Blob for download
 * - validateMimeType: Validates file type
 * - getBlobFileIcon: Returns icon name for MIME type
 * - formatFileSize: Formats bytes to human-readable
 * 
 * @see JzodObjectEditor - Parent component that ifThenElsely renders this
 * @see packages/miroir-standalone-app/docs/BlobEditing.md - User-facing documentation
 */

export interface BlobEditorFieldProps {
  rootLessListKey: string;
  rootLessListKeyArray: (string | number)[];
  currentValue: any; // The blob object with { filename, contents: { encoding, mimeType, data } }
  formik: FormikProps<any>;
  readOnly?: boolean;
  allowedMimeTypes?: string[]; // Extracted from schema enum for mimeType field
  onError?: (error: string) => void;
}

interface BlobValidationError {
  hasError: boolean;
  errorMessage?: string;
}

// ################################################################################################
// BlobValidationError Component
// 
// Displays validation errors with clear messaging and styling
// ################################################################################################

const BlobValidationError: FC<{ error: string }> = ({ error }) => {
  const { currentTheme } = useMiroirTheme();
  
  const errorStyles = css({
    padding: currentTheme.spacing.md,
    backgroundColor: '#fee',
    border: `2px solid ${currentTheme.colors.error || '#f44336'}`,
    borderRadius: currentTheme.borderRadius.sm,
    color: currentTheme.colors.error || '#d32f2f',
    fontSize: currentTheme.typography.fontSize.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: currentTheme.spacing.xs,
    maxWidth: '400px',
  });

  const titleStyles = css({
    fontWeight: 'bold',
    fontSize: currentTheme.typography.fontSize.md,
  });

  return (
    <div css={errorStyles}>
      <div css={titleStyles}>⚠️ Blob Validation Error</div>
      <div>{error}</div>
    </div>
  );
};

// ################################################################################################
// BlobLightboxModal Component
// 
// Lightbox modal for displaying full-size images
// Based on DraggableContainer with ESC key and click-outside support
// ################################################################################################

const BlobLightboxModal: FC<{
  src: string;
  filename?: string;
  onClose: () => void;
}> = ({ src, filename, onClose }) => {
  const { currentTheme } = useMiroirTheme();

  const overlayStyles = css({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: currentTheme.spacing.lg,
  });

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div css={overlayStyles} onClick={handleOverlayClick}>
      <DraggableContainer
        title={filename || 'Image Preview'}
        onClose={onClose}
        defaultSize={{ width: 800, height: 600 }}
        storageKey="blobLightboxPosition"
      >
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'auto',
        }}>
          <img 
            src={src} 
            alt={filename || 'Preview'} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              objectFit: 'contain',
            }} 
          />
        </div>
      </DraggableContainer>
    </div>
  );
};

export const BlobEditorField: FC<BlobEditorFieldProps> = ({
  rootLessListKey,
  rootLessListKeyArray,
  currentValue,
  formik,
  readOnly = false,
  allowedMimeTypes = [],
  onError,
}) => {
  const { currentTheme } = useMiroirTheme();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  log.debug(() => `BlobEditorField rendering for key: ${rootLessListKey}, value:`, currentValue);

  // Parse and validate blob structure from currentValue
  const { blobData, validationError } = useMemo(() => {
    // Handle missing contents field (undefined/null) - not an error, just empty state
    if (!currentValue || !currentValue.contents) {
      return {
        blobData: {
          hasContents: false,
          encoding: undefined,
          mimeType: undefined,
          data: undefined,
          filename: currentValue?.filename,
        },
        validationError: {
          hasError: false,
        } as BlobValidationError,
      };
    }

    const { contents } = currentValue;
    const errors: string[] = [];

    // Validate encoding field
    if (contents.encoding !== undefined && contents.encoding !== null) {
      if (contents.encoding !== 'base64' && contents.encoding !== 'data-uri') {
        errors.push(`Invalid encoding: "${contents.encoding}". Expected 'base64' or 'data-uri'.`);
      }
    } else {
      // encoding is missing when contents exist
      errors.push('Encoding is required when contents are present.');
    }

    // Validate mimeType field
    if (!contents.mimeType) {
      errors.push('MIME type is required.');
    }

    // Validate data field
    if (contents.data === undefined || contents.data === null || contents.data === '') {
      errors.push('Blob data is missing.');
    }

    // If there are validation errors, return error state
    if (errors.length > 0) {
      return {
        blobData: {
          hasContents: true,
          encoding: contents.encoding,
          mimeType: contents.mimeType,
          data: contents.data,
          filename: currentValue.filename,
        },
        validationError: {
          hasError: true,
          errorMessage: errors.join(' '),
        } as BlobValidationError,
      };
    }

    // Valid blob structure
    return {
      blobData: {
        hasContents: true,
        encoding: contents.encoding,
        mimeType: contents.mimeType,
        data: contents.data,
        filename: currentValue.filename,
      },
      validationError: {
        hasError: false,
      } as BlobValidationError,
    };
  }, [currentValue]);

  log.debug(() => `BlobEditorField parsed blob data:`, blobData);
  log.debug(() => `BlobEditorField validation error:`, validationError);

  // If there's a validation error and onError callback is provided, call it
  if (validationError.hasError && onError && validationError.errorMessage) {
    onError(validationError.errorMessage);
  }

  // Display validation error if present
  if (validationError.hasError && validationError.errorMessage) {
    return <BlobValidationError error={validationError.errorMessage} />;
  }

  // Helper to get icon component based on MIME type
  const getIconComponent = (mimeType: string): React.ReactNode => {
    const iconName = getBlobFileIcon(mimeType);
    const iconProps = { style: { fontSize: '64px' } };
    
    switch (iconName) {
      case 'Image':
        return <ImageIcon {...iconProps} />;
      case 'PictureAsPdf':
        return <PictureAsPdfIcon {...iconProps} />;
      case 'Description':
        return <DescriptionIcon {...iconProps} />;
      case 'FolderZip':
        return <FolderZipIcon {...iconProps} />;
      default:
        return <InsertDriveFileIcon {...iconProps} />;
    }
  };

  // Helper to create data URI from blob data
  const createDataUri = (mimeType: string, data: string, encoding: string): string => {
    if (encoding === 'data-uri') {
      return data; // Already a data URI
    }
    // base64 encoding
    return `data:${mimeType};base64,${data}`;
  };

  // Helper to handle download
  const handleDownload = useCallback(() => {
    if (!blobData.hasContents || !blobData.data || !blobData.mimeType) return;
    
    try {
      const blob = base64ToBlob(blobData.data, blobData.mimeType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = blobData.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      log.error('Failed to download file:', error);
      if (onError) {
        onError(`Failed to download file: ${error}`);
      }
    }
  }, [blobData, onError]);

  // ################################################################################################
  // File Upload Handlers (Tasks 6.1-6.9)
  // ################################################################################################

  // Helper to process uploaded file (Tasks 6.3-6.6)
  const processFile = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      setUploadError(undefined);

      log.debug(() => `Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

      // Task 6.5: Check file size against hard limit (10MB)
      if (file.size > MAX_BLOB_FILE_SIZE) {
        const errorMsg = `File size exceeds maximum allowed size of ${formatFileSize(MAX_BLOB_FILE_SIZE)}`;
        setUploadError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }

      // Task 6.5: Check file size warning threshold (5MB)
      if (file.size > BLOB_SIZE_WARNING_THRESHOLD) {
        const confirmed = window.confirm(
          `Warning: File size is ${formatFileSize(file.size)}. Large files may impact performance. Continue?`
        );
        if (!confirmed) {
          log.debug(() => 'User cancelled upload due to file size warning');
          return;
        }
      }

      // Task 6.4: Validate MIME type if allowedMimeTypes is specified
      if (allowedMimeTypes.length > 0) {
        const mimeValidation = validateMimeType(file.type, allowedMimeTypes);
        if (!mimeValidation.isValid) {
          const errorMsg = `File type "${file.type}" is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`;
          setUploadError(errorMsg);
          if (onError) {
            onError(errorMsg);
          }
          return;
        }
      }

      // Task 6.3: Convert file to base64
      const base64Data = await fileToBase64(file);
      
      // Task 6.3: Extract filename and MIME type
      const filename = file.name;
      const mimeType = file.type;

      log.debug(() => `File processed successfully: ${filename}, MIME: ${mimeType}`);

      // Task 6.6: Update Formik values
      // The currentValue structure is { filename, contents: { encoding, mimeType, data } }
      // We need to update both the filename and contents fields
      
      // Get the parent path (remove 'contents' from the end if present)
      const isAtContentsLevel = rootLessListKeyArray[rootLessListKeyArray.length - 1] === 'contents';
      
      // Create a deep clone of current formik values to avoid mutation
      const newValues = JSON.parse(JSON.stringify(formik.values));
      
      if (isAtContentsLevel) {
        // We're at the contents level, update parent's filename and current contents
        const parentPath = rootLessListKeyArray.slice(0, -1);
        let target = newValues;
        
        // Navigate to parent object
        for (let i = 0; i < parentPath.length; i++) {
          target = target[parentPath[i]];
        }
        
        // Update filename and contents atomically
        target.filename = filename;
        target.contents = {
          encoding: 'base64',
          mimeType: mimeType,
          data: base64Data
        };
      } else {
        // We're at the blob object level
        let target = newValues;
        
        // Navigate to the blob object
        for (let i = 0; i < rootLessListKeyArray.length; i++) {
          target = target[rootLessListKeyArray[i]];
        }
        
        // Update filename and contents atomically
        target.filename = filename;
        target.contents = {
          encoding: 'base64',
          mimeType: mimeType,
          data: base64Data
        };
      }
      
      // Update all values at once to avoid intermediate invalid states
      formik.setValues(newValues, false);

      setUploadError(undefined);
      log.info(`File uploaded successfully: ${filename}`);
    } catch (error) {
      // Task 6.8: Error handling
      const errorMsg = `Failed to read file: ${error}`;
      log.error(errorMsg, error);
      setUploadError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [allowedMimeTypes, formik, rootLessListKey, rootLessListKeyArray, onError]);

  // Task 6.1: Click-to-upload handler
  const handleContainerClick = useCallback(() => {
    if (!readOnly && !isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [readOnly, isLoading]);

  // Task 6.1: File input change handler
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (files.length > 1) {
        // Task 6.8: Handle multiple files error
        const errorMsg = 'Only one file at a time';
        setUploadError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }
      processFile(files[0]);
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = '';
  }, [processFile, onError]);

  // Task 6.2: Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!readOnly && !isLoading) {
      setIsDragging(true);
    }
  }, [readOnly, isLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (readOnly || isLoading) {
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > 1) {
        // Task 6.8: Handle multiple files error
        const errorMsg = 'Only one file at a time';
        setUploadError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }
      processFile(files[0]);
    }
  }, [readOnly, isLoading, processFile, onError]);

  // Task 6.1: Generate accept attribute from allowedMimeTypes
  const acceptAttribute = useMemo(() => {
    if (allowedMimeTypes.length === 0) {
      return undefined;
    }
    return allowedMimeTypes.join(',');
  }, [allowedMimeTypes]);

  const downloadButtonStyles = css({
    marginTop: currentTheme.spacing.sm,
    padding: `${currentTheme.spacing.xs} ${currentTheme.spacing.sm}`,
    backgroundColor: currentTheme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: currentTheme.borderRadius.sm,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: currentTheme.spacing.xs,
    fontSize: currentTheme.typography.fontSize.sm,
    '&:hover': {
      opacity: 0.9,
    },
  });

  // Task 6.7: Loading overlay styles
  const loadingOverlayStyles = css({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: currentTheme.spacing.sm,
    zIndex: 10,
    borderRadius: currentTheme.borderRadius.sm,
  });

  const spinnerStyles = css({
    animation: 'spin 1s linear infinite',
    fontSize: '48px',
    color: currentTheme.colors.primary,
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  });

  // Task 6.8: Error display styles
  const uploadErrorStyles = css({
    marginTop: currentTheme.spacing.sm,
    padding: currentTheme.spacing.sm,
    backgroundColor: '#fee',
    border: `1px solid ${currentTheme.colors.error || '#f44336'}`,
    borderRadius: currentTheme.borderRadius.sm,
    color: currentTheme.colors.error || '#d32f2f',
    fontSize: currentTheme.typography.fontSize.sm,
  });

  // Task 6.1: Hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={acceptAttribute}
      onChange={handleFileInputChange}
      style={{ display: 'none' }}
    />
  );

  // Empty state: no contents
  if (!blobData.hasContents) {
    return (
      <div style={{ position: 'relative' }}>
        {fileInput}
        <ThemedBlobContainer 
          isClickable={!readOnly && !isLoading}
          onClick={handleContainerClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <ThemedBlobEmptyState 
            icon={<CloudUploadIcon />}
            message="Upload file"
          />
          {isDragging && !readOnly && !isLoading && (
            <ThemedBlobDropZone message="Drop file here" />
          )}
          {isLoading && (
            <div css={loadingOverlayStyles}>
              <CircularProgress css={spinnerStyles} />
              <div>Processing...</div>
            </div>
          )}
        </ThemedBlobContainer>
        {uploadError && (
          <div css={uploadErrorStyles}>{uploadError}</div>
        )}
      </div>
    );
  }

  // Valid blob with contents
  const isImage = blobData.mimeType?.startsWith('image/');
  const dataUri = createDataUri(blobData.mimeType!, blobData.data!, blobData.encoding!);

  // Image preview
  if (isImage) {
    return (
      <div style={{ position: 'relative' }}>
        {fileInput}
        <ThemedBlobContainer 
          isClickable={!readOnly && !lightboxOpen && !isLoading}
          onClick={handleContainerClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <ThemedBlobPreview 
            src={dataUri}
            alt={blobData.filename || 'Image'}
            onClick={(e) => {
              if (!readOnly && !isLoading) {
                e.stopPropagation();
                setLightboxOpen(true);
              }
            }}
          />
          <ThemedBlobMetadata 
            filename={blobData.filename}
            mimeType={blobData.mimeType}
          />
          {isDragging && !readOnly && !isLoading && (
            <ThemedBlobDropZone message="Drop file to replace" />
          )}
          {isLoading && (
            <div css={loadingOverlayStyles}>
              <CircularProgress css={spinnerStyles} />
              <div>Processing...</div>
            </div>
          )}
        </ThemedBlobContainer>
        {uploadError && (
          <div css={uploadErrorStyles}>{uploadError}</div>
        )}
        {lightboxOpen && (
          <BlobLightboxModal 
            src={dataUri}
            filename={blobData.filename}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </div>
    );
  }

  // Non-image blob display
  return (
    <div style={{ position: 'relative' }}>
      {fileInput}
      <ThemedBlobContainer 
        isClickable={!readOnly && !isLoading}
        onClick={handleContainerClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ThemedBlobIconDisplay 
          icon={getIconComponent(blobData.mimeType!)}
          filename={blobData.filename}
          mimeType={blobData.mimeType}
        />
        <button css={downloadButtonStyles} onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}>
          <GetAppIcon style={{ fontSize: '18px' }} />
          Download
        </button>
        {isDragging && !readOnly && !isLoading && (
          <ThemedBlobDropZone message="Drop file to replace" />
        )}
        {isLoading && (
          <div css={loadingOverlayStyles}>
            <CircularProgress css={spinnerStyles} />
            <div>Processing...</div>
          </div>
        )}
      </ThemedBlobContainer>
      {uploadError && (
        <div css={uploadErrorStyles}>{uploadError}</div>
      )}
    </div>
  );
};
