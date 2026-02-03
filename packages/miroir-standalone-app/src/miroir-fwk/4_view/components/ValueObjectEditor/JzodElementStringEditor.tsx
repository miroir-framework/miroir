import React, { useCallback, useState } from "react";
import { FormikProps } from "formik";

import {
  ThemedDisplayValue,
  ThemedLabeledEditor,
  ThemedTextEditor
} from "../Themes/index";
import { FileSelector } from "../Themes/FileSelector.js";
import type { JzodEditorPropsRoot } from "./JzodElementEditorInterface";
import { LoggerInterface, MiroirLoggerFactory, type MetaModel } from "miroir-core";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";

// ################################################################################################
export interface JzodElementStringEditorProps extends JzodEditorPropsRoot {
  formik: FormikProps<any>;
  formikRootLessListKey: string;
  currentValueObjectAtKey: any;
  localReadOnly: boolean;
  enhancedLabelElement: JSX.Element;
  hasPathError: boolean;
  stringDisplay?: {
    format?: "email" | "url" | "uuid" | "uri" | "date-time" | "date" | "time" | "file" | "folder";
    multiline?: boolean;
    rows?: number;
  };
}

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementStringEditor"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
/**
 * String Editor Component for Jzod Elements
 * 
 * Handles different string display modes:
 * - File selection (format: "file")
 * - Folder selection (format: "folder")
 * - Multiline text (multiline: true)
 * - Default single-line text input
 */
export const JzodElementStringEditor: React.FC<JzodElementStringEditorProps> = (props) => {
  const {
    formik,
    formikRootLessListKey,
    currentValueObjectAtKey,
    localReadOnly,
    enhancedLabelElement,
    hasPathError,
    stringDisplay,
    readOnly,
    rootLessListKey,
    onChangeVector,
  } = props;

  const format = stringDisplay?.format;
  const multiline = stringDisplay?.multiline;
  const rows = stringDisplay?.rows || 4;
  const [selectedFileName, setSelectedFileName] = useState<string | undefined>(
    currentValueObjectAtKey || undefined
  );
  const [fileError, setFileError] = useState<string | undefined>(undefined);

  const setSelectedMetaModel = useCallback((metaModel: MetaModel | undefined) => {
    formik.setFieldValue(formikRootLessListKey, metaModel);
  }, [formikRootLessListKey, formik]);

  const setSelectedFileName2 = useCallback((fileName: string | undefined) => {
    // When upload=false (default), we receive a path string
    log.info('JzodElementStringEditor - Selected file name:', fileName);
    setSelectedFileName(fileName);
    setFileError(undefined);
    // Store the file path/name in formik
    formik.setFieldValue(formikRootLessListKey, fileName);
  }, [formikRootLessListKey, onChangeVector, rootLessListKey, formik]);

  // Handle file and folder formats using FileSelector
  if (format === "file" || format === "folder") {
    if (readOnly || localReadOnly) {
      return (
        <ThemedLabeledEditor
          labelElement={enhancedLabelElement}
          editor={<ThemedDisplayValue value={currentValueObjectAtKey} type="string" />}
        />
      );
    }
    return (
      <ThemedLabeledEditor
        labelElement={enhancedLabelElement}
        editor={
          <FileSelector
            title=""
            buttonLabel={format === "folder" ? "Select Folder" : "Select File"}
            accept={format === "file" ? "*" : undefined}
            folder={format === "folder"}
            setSelectedFileContents={setSelectedMetaModel}
            setSelectedFileError={setFileError}
            setSelectedFileName={setSelectedFileName2}
            selectedFileName={selectedFileName}
            error={fileError}
            showBorder={false}
            compact={true}
            style={{ marginBottom: 0 }}
          />
        }
      />
    );
  }

  // Handle multiline text
  if (multiline) {
    return (
      <ThemedLabeledEditor
        labelElement={enhancedLabelElement}
        editor={
          readOnly || localReadOnly ? (
            <ThemedDisplayValue value={currentValueObjectAtKey} type="string" />
          ) : (
            <ThemedTextEditor
              variant="standard"
              data-testid="miroirInput"
              id={rootLessListKey}
              key={rootLessListKey}
              {...formik.getFieldProps(formikRootLessListKey)}
              multiline
              rows={rows}
              error={hasPathError}
            />
          )
        }
      />
    );
  }

  // Default single-line string input
  return (
    <ThemedLabeledEditor
      labelElement={enhancedLabelElement}
      editor={
        readOnly || localReadOnly ? (
          <ThemedDisplayValue value={currentValueObjectAtKey} type="string" />
        ) : (
          <ThemedTextEditor
            variant="standard"
            data-testid="miroirInput"
            id={rootLessListKey}
            key={rootLessListKey}
            {...formik.getFieldProps(formikRootLessListKey)}
            error={hasPathError}
          />
        )
      }
    />
  );
};

JzodElementStringEditor.displayName = "JzodElementStringEditor";
