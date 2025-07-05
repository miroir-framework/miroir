// import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
// import CodeMirror from '@uiw/react-codemirror';
// import {ReactCodeMirror} from '@uiw/react-codemirror';
import ReactCodeMirror from '@uiw/react-codemirror';
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import React, { useCallback, useEffect } from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { JzodElementEditorReactCodeMirrorProps } from "./JzodElementEditorInterface";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditorReactCodeMirror")
).then((logger: LoggerInterface) => {
  log = logger;
});

const extensions = [javascript()];

const JzodElementEditorReactCodeMirrorComponent: React.FC<JzodElementEditorReactCodeMirrorProps> = (
  props: JzodElementEditorReactCodeMirrorProps
) => {
  const {
    initialValue,
    // formik,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    rootLessListKey,
    rootLessListKeyArray,
    hidden,
    insideAny,
    displayAsStructuredElementSwitch,
    jzodSchemaTooltip,
  } = props;
  
  if (props.isUnderTest) {
    // For testing purposes, return a simple div with the value
    return (
      <div style={{ border: "1px solid red", padding: "10px" }}>
        <pre>{codeMirrorValue}</pre>
      </div>
    );
  }
   useEffect(() => {
    log.info(
      "JzodElementEditorReactCodeMirrorComponent mounted with initialValue:",
      initialValue
    );
    if (initialValue) {
      setCodeMirrorValue(initialValue);
      try {
        JSON.parse(initialValue);
        setCodeMirrorIsValidJson(true);
      } catch {
        setCodeMirrorIsValidJson(false);
      }
    } else {
      setCodeMirrorValue("");
      setCodeMirrorIsValidJson(false);
    }
  }, [
  ]);

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
    log.info(
      "handleChange CodeMirror value changed:",
      value
    );
    try {
      JSON.parse(value);
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
    setCodeMirrorValue(value);
  }, [setCodeMirrorIsValidJson, setCodeMirrorValue]);
  
  const handleCheck = useCallback(() => {
    try {
      const parsed = JSON.parse(codeMirrorValue);
      log.info(
        "handleCheck Parsed CodeMirror value:",
        JSON.stringify(parsed, null, 2)
      );
      setCodeMirrorValue(JSON.stringify(parsed, null, 2));
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  }, [codeMirrorValue, setCodeMirrorValue, setCodeMirrorIsValidJson]);

  // Calculate height once
  const editorHeight = `${(new String(codeMirrorValue??"").match(/\n/g)?.length || 0) * 20 + 60}px`;

  return (
    <span>
      <span>
      {jzodSchemaTooltip??<></>}
      </span>
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
        {props.displayAsStructuredElementSwitch && (
          <span style={{ marginBottom: "10px" }}>{displayAsStructuredElementSwitch}</span>
        )}
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
// TODO: is this useful / old school?
export const JzodElementEditorReactCodeMirror = JzodElementEditorReactCodeMirrorComponent;
// React.memo(
//   JzodElementEditorReactCodeMirrorComponent,
//   (prevProps, nextProps) => {
//     // Custom comparison function to determine if the component should re-render
//     return (
//       prevProps.codeMirrorValue === nextProps.codeMirrorValue &&
//       prevProps.codeMirrorIsValidJson === nextProps.codeMirrorIsValidJson &&
//       prevProps.hidden === nextProps.hidden &&
//       prevProps.insideAny === nextProps.insideAny &&
//       JSON.stringify(prevProps.initialValue) === JSON.stringify(nextProps.initialValue)
//     );
//   }
// );
