/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { FC, useMemo } from "react";
import { FormikProps } from "formik";

import {
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";

import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import {
  ThemedBlobContainer,
} from "../Themes/index";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext";

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

export const BlobEditorField: FC<BlobEditorFieldProps> = ({
  rootLessListKey,
  rootLessListKeyArray,
  currentValue,
  formik,
  readOnly = false,
  allowedMimeTypes = [],
  onError,
}) => {
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

  return (
    <ThemedBlobContainer isClickable={!readOnly}>
      <div>Blob Editor Field - Basic Structure</div>
      <div style={{ fontSize: '12px', marginTop: '8px' }}>
        {blobData.hasContents ? (
          <>
            <div>Filename: {blobData.filename || 'unknown'}</div>
            <div>MIME: {blobData.mimeType || 'unknown'}</div>
            <div>Encoding: {blobData.encoding || 'unknown'}</div>
          </>
        ) : (
          <div>No contents</div>
        )}
      </div>
    </ThemedBlobContainer>
  );
};
