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
  const blobData = useMemo(() => {
    if (!currentValue || !currentValue.contents) {
      return {
        hasContents: false,
        encoding: undefined,
        mimeType: undefined,
        data: undefined,
        filename: currentValue?.filename,
      };
    }

    const { contents } = currentValue;
    return {
      hasContents: true,
      encoding: contents.encoding,
      mimeType: contents.mimeType,
      data: contents.data,
      filename: currentValue.filename,
    };
  }, [currentValue]);

  log.debug(() => `BlobEditorField parsed blob data:`, blobData);

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
