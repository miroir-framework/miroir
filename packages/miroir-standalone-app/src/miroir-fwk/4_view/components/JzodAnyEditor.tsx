import React, { useCallback, useEffect, useRef, useState } from "react";


import {
  alterObjectAtPath,
  LoggerInterface,
  MiroirLoggerFactory,
  resolvePathOnObject
} from "miroir-core";

import { javascript } from "@codemirror/lang-javascript";
import ReactCodeMirror from "@uiw/react-codemirror";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { JzodElementEditor } from "./JzodElementEditor";
import { getJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodAnyEditorProps } from "./JzodElementEditorInterface";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodAnyEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

let JzodAnyEditorRenderCount: number = 0;
export const JzodAnyEditor: React.FC<JzodAnyEditorProps> = (
  props: JzodAnyEditorProps
) => {
  JzodAnyEditorRenderCount++;
  const {
    name,
    listKey,
    rootLesslistKey,
    rootLesslistKeyArray,
    rawJzodSchema,
    currentDeploymentUuid,
    currentApplicationSection,
    foreignKeyObjects,
    unionInformation,
    resolvedElementJzodSchema, // handleSelectLiteralChange,
    label,
    insideAny
    // visible = true, // added visibility prop
  } = props;
    const {
      // context,
      // currentModel,
      // deploymentEntityStateSelectorMap,
      formik,
      // miroirMetaModel,
      codeMirrorRef,
      codeMirrorIsValidJson,
      setCodeMirrorIsValidJson,
      codeMirrorValue,
      setCodeMirrorValue,
    } = getJzodElementEditorHooks(props, JzodAnyEditorRenderCount, "JzodAnyEditor");
  
  const currentValue = resolvePathOnObject(formik.values, rootLesslistKeyArray);

  // Update editor value if currentValue changes (external change)
  // useEffect(() => {
  //   try {
  //     if (JSON.stringify(JSON.parse(codeMirrorValue)) !== JSON.stringify(currentValue)) {
  //       setCodeMirrorValue(JSON.stringify(currentValue, null, 2));
  //     }
  //   } catch {
  //     // ignore parse error, user is editing
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [currentValue]);

  // const handleChange = useCallback((value: string, viewUpdate?: any) => {
  const handleChange = (value: string, viewUpdate?: any) => {
    setCodeMirrorValue(value);
    try {
      JSON.parse(value);
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  }
  // , []);

  // Format JSON and try to keep cursor position
  // const handleFormat = useCallback(() => {
  const handleFormat = () => {
    try {
      const editor = codeMirrorRef.current?.view;
      const parsed = JSON.parse(codeMirrorValue);
      const formatted = JSON.stringify(parsed, null, 2);

      // Try to keep cursor position steady
      if (editor) {
        const { state } = editor;
        const selection = state.selection.main;
        // Calculate offset from start
        const offset = selection.from;
        setCodeMirrorValue(formatted);

        // After value update, set cursor position
        setTimeout(() => {
          // Find the closest position in the new text
          const newOffset = Math.min(offset, formatted.length);
          editor.dispatch({
            selection: { anchor: newOffset },
            scrollIntoView: true,
          });
        }, 0);
      } else {
        setCodeMirrorValue(formatted);
      }
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  };
  // }, [codeMirrorValue]);

  // Synchronise codemirror content with formik
  // const handleCheck = useCallback(() => {
  const handleCheck = () => {
    try {
      const parsed = JSON.parse(codeMirrorValue);
      // formik.setFieldValue(rootLesslistKey, parsed, false);
      const newFormState =  alterObjectAtPath(formik.values, rootLesslistKeyArray, parsed);
      formik.setValues(newFormState, false); // do not validate on change
      formik.setFieldTouched(rootLesslistKey, true, false); // mark field as touched
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  };
  // }, [codeMirrorValue, formik, rootLesslistKey]);

  // if (resolvedElementJzodSchema?.type == "undefined") {
    return (
      <div key={rootLesslistKey}>
        <div
          style={{
            border: `2px solid ${codeMirrorIsValidJson ? "green" : "red"}`,
            borderRadius: "4px",
            padding: "2px",
            minWidth: "40ch",
            position: "relative",
            // display: "inline-block",
            display: !insideAny ? "inline-block" : "none", // control visibility
          }}
        >
          <button
            type="button"
            aria-label="Format JSON"
            style={{
              position: "absolute",
              top: 4,
              right: 36,
              zIndex: 2,
              background: "#eee",
              border: "1px solid #ccc",
              borderRadius: "3px",
              padding: "2px 6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={handleFormat}
            title="Format JSON"
          >
            {"{}"}
          </button>
          <button
            type="button"
            aria-label="Check and Apply JSON"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              zIndex: 2,
              background: "#eee",
              border: "1px solid #ccc",
              borderRadius: "3px",
              padding: "2px 6px",
              cursor: codeMirrorIsValidJson ? "pointer" : "not-allowed",
              fontWeight: "bold",
              color: codeMirrorIsValidJson ? "green" : "gray",
            }}
            onClick={handleCheck}
            title="Check and Apply JSON"
            disabled={!codeMirrorIsValidJson}
          >
            ✓
          </button>
          <ReactCodeMirror
            ref={codeMirrorRef}
            value={codeMirrorValue}
            height="200px"
            extensions={[javascript({ jsx: true })]}
            onChange={handleChange}
          />
        </div>
        <div>
          <JzodElementEditor
            name={name}
            listKey={listKey}
            rootLesslistKey={rootLesslistKey}
            rootLesslistKeyArray={rootLesslistKeyArray}
            rawJzodSchema={rawJzodSchema}
            currentDeploymentUuid={currentDeploymentUuid}
            currentApplicationSection={currentApplicationSection}
            unionInformation={unionInformation}
            resolvedElementJzodSchema={resolvedElementJzodSchema}
            label={label}
            foreignKeyObjects={foreignKeyObjects}
            insideAny={true}
            returnsEmptyElement={resolvedElementJzodSchema?.type === "undefined" ? true : false}
          />
        </div>
      </div>
    );

};
