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
// 
// A specialized editor for blob/file objects with the isBlob tag.
// Provides preview, upload, and metadata display capabilities.
// 
// Integration: Used by JzodObjectEditor when schema has tag.value.isBlob === true
// ################################################################################################

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
