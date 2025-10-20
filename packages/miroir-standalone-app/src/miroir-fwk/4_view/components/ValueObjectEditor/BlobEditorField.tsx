/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { FC, useMemo, useState, useCallback } from "react";
import { FormikProps } from "formik";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import GetAppIcon from "@mui/icons-material/GetApp";
import CloseIcon from "@mui/icons-material/Close";

import {
  LoggerInterface,
  MiroirLoggerFactory,
  getBlobFileIcon,
  base64ToBlob,
} from "miroir-core";

import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import {
  ThemedBlobContainer,
  ThemedBlobEmptyState,
  ThemedBlobPreview,
  ThemedBlobMetadata,
  ThemedBlobIconDisplay,
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

  // Empty state: no contents
  if (!blobData.hasContents) {
    return (
      <ThemedBlobContainer isClickable={!readOnly}>
        <ThemedBlobEmptyState 
          icon={<CloudUploadIcon />}
          message="Upload file"
        />
      </ThemedBlobContainer>
    );
  }

  // Valid blob with contents
  const isImage = blobData.mimeType?.startsWith('image/');
  const dataUri = createDataUri(blobData.mimeType!, blobData.data!, blobData.encoding!);

  // Image preview
  if (isImage) {
    return (
      <>
        <ThemedBlobContainer isClickable={!readOnly && !lightboxOpen}>
          <ThemedBlobPreview 
            src={dataUri}
            alt={blobData.filename || 'Image'}
            onClick={() => !readOnly && setLightboxOpen(true)}
          />
          <ThemedBlobMetadata 
            filename={blobData.filename}
            mimeType={blobData.mimeType}
          />
        </ThemedBlobContainer>
        {lightboxOpen && (
          <BlobLightboxModal 
            src={dataUri}
            filename={blobData.filename}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </>
    );
  }

  // Non-image blob display
  return (
    <ThemedBlobContainer isClickable={false}>
      <ThemedBlobIconDisplay 
        icon={getIconComponent(blobData.mimeType!)}
        filename={blobData.filename}
        mimeType={blobData.mimeType}
      />
      <button css={downloadButtonStyles} onClick={handleDownload}>
        <GetAppIcon style={{ fontSize: '18px' }} />
        Download
      </button>
    </ThemedBlobContainer>
  );
};
