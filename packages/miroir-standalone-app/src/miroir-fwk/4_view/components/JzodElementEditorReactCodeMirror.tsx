// import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
// import CodeMirror from '@uiw/react-codemirror';
// import {ReactCodeMirror} from '@uiw/react-codemirror';
import ReactCodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { alterObjectAtPath, JzodElement } from "miroir-core";
import React, { useCallback, useEffect, useRef, useState } from "react";
// import * as reactCodeMirror from '@uiw/react-codemirror';

// const { ReactCodeMirror } = reactCodeMirror;

// import React, { useState } from "react";

// #####################################################################################################
type JzodElementEditorReactCodeMirrorProps = {
  initialValue: any;
  // rawJzodSchema: JzodElement;
  // formik: any; // Formik instance
  codeMirrorValue: string;
  setCodeMirrorValue: React.Dispatch<React.SetStateAction<string>>;
  codeMirrorIsValidJson: boolean;
  setCodeMirrorIsValidJson: React.Dispatch<React.SetStateAction<boolean>>;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  isUnderTest?: boolean; // codemirror issue with vitest https://github.com/miroir-framework/miroir/issues/56
  hidden?: boolean; // used to control visibility of the editor 
  insideAny?: boolean; // used to control visibility of the editor
  switches?: JSX.Element;
  // displayAsCode?: boolean; // used to display the editor as a structured element, not as code editor  
};

const extensions = [javascript()];

const JzodElementEditorReactCodeMirrorComponent: React.FC<JzodElementEditorReactCodeMirrorProps> = (
  props: JzodElementEditorReactCodeMirrorProps
) => {
  const {
    initialValue: currentValue,
    // formik,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    rootLesslistKey,
    rootLesslistKeyArray,
    hidden,
    insideAny,
    // displayAsCode,
  } = props;
  
  // Initialize CodeMirror value from current value when it changes
  useEffect(() => {
    // Only update if the value doesn't match current JSON
    try {
      const currentValueString = JSON.stringify(currentValue, null, 2);
      if (codeMirrorValue === "" || (
        codeMirrorIsValidJson && 
        JSON.stringify(JSON.parse(codeMirrorValue)) !== JSON.stringify(currentValue)
      )) {
        setCodeMirrorValue(currentValueString);
      }
    } catch (e) {
      // Ignore JSON parse errors - leave the current editor state
    }
  }, [currentValue, codeMirrorValue, codeMirrorIsValidJson]);

  if (props.isUnderTest) {
    // For testing purposes, return a simple div with the value
    return (
      <div style={{ border: "1px solid red", padding: "10px" }}>
        <pre>{codeMirrorValue}</pre>
      </div>
    );
  }
  
  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(codeMirrorValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setCodeMirrorValue(formatted);
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  }, [codeMirrorValue, setCodeMirrorValue, setCodeMirrorIsValidJson]);
  
  const handleChange = useCallback((value: string) => {
    setCodeMirrorValue(value);
    try {
      JSON.parse(value);
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  }, [setCodeMirrorValue, setCodeMirrorIsValidJson]);
  
  const handleCheck = useCallback(() => {
    try {
      const parsed = JSON.parse(codeMirrorValue);
      setCodeMirrorValue(JSON.stringify(parsed, null, 2));
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  }, [codeMirrorValue, setCodeMirrorValue, setCodeMirrorIsValidJson]);

  // Calculate height once
  const editorHeight = `${(codeMirrorValue.match(/\n/g)?.length || 0) * 20 + 60}px`;

  return (
    <span>
      <span
        style={{
          border: `2px solid ${codeMirrorIsValidJson ? "green" : "red"}`,
          borderRadius: "4px",
          padding: "2px",
          minWidth: "40ch",
          position: "relative",
          display: !hidden && !insideAny ? "inline-block" : "none", // control visibility
        }}
      >
        {props.switches && <span style={{ marginBottom: "10px" }}>{props.switches}</span>}
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
          height={editorHeight}
          value={codeMirrorValue}
          extensions={extensions}
          onChange={handleChange}
        />
      </span>
    </span>
  );
}

// Apply memoization to prevent unnecessary re-renders
export const JzodElementEditorReactCodeMirror = React.memo(
  JzodElementEditorReactCodeMirrorComponent,
  (prevProps, nextProps) => {
    // Custom comparison function to determine if the component should re-render
    return (
      prevProps.codeMirrorValue === nextProps.codeMirrorValue &&
      prevProps.codeMirrorIsValidJson === nextProps.codeMirrorIsValidJson &&
      prevProps.hidden === nextProps.hidden &&
      prevProps.insideAny === nextProps.insideAny &&
      JSON.stringify(prevProps.initialValue) === JSON.stringify(nextProps.initialValue)
    );
  }
);
