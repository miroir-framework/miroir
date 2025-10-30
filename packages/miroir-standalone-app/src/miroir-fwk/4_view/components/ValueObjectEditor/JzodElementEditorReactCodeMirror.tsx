// import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
// import CodeMirror from '@uiw/react-codemirror';
// import {ReactCodeMirror} from '@uiw/react-codemirror';
import ReactCodeMirror from '@uiw/react-codemirror';
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import React, { useCallback, useEffect } from "react";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { JzodElementEditorReactCodeMirrorProps } from "./JzodElementEditorInterface";
import { 
  ThemedBox,
  ThemedStyledButton,
  ThemedSpan,
  ThemedCodeBlock,
  ThemedOnScreenHelper
} from "../Themes/index";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditorReactCodeMirror"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

const extensions = [javascript()];

export const JzodElementEditorReactCodeMirror: React.FC<JzodElementEditorReactCodeMirrorProps> = (
  props: JzodElementEditorReactCodeMirrorProps
) => {
  const {
    initialValue,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    hidden,
    insideAny,
    displayAsStructuredElementSwitch,
    jzodSchemaTooltip,
    readOnly
  } = props;

  if (props.isUnderTest) {
    // For testing purposes, return a simple div with the value
    return (
      <ThemedBox border="1px solid red" padding="10px">
        codeMirrorValue: <pre>{codeMirrorValue}</pre>
      </ThemedBox>
    );
  }

  // If readOnly, render a themed code block instead of the editor
  if (readOnly) {
    return (
      <span>
        <span>{jzodSchemaTooltip ?? <></>}</span>
        <ThemedSpan
          style={{
            border: '2px solid green',
            borderRadius: '4px',
            padding: '2px',
            minWidth: '40ch',
            position: 'relative',
            display: !hidden && !insideAny ? 'inline-block' : 'none'
          }}
        >
          {props.displayAsStructuredElementSwitch && (
            <ThemedSpan style={{ marginBottom: "10px" }}>{displayAsStructuredElementSwitch}</ThemedSpan>
          )}
          <ThemedCodeBlock>{codeMirrorValue}</ThemedCodeBlock>
        </ThemedSpan>
      </span>
    );
  }

  useEffect(() => {
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
  }, []);

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
    // log.info(
    //   "handleChange CodeMirror value changed:",
    //   value
    // );
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

  // Calculate the width based on the longest line in the text
  const editorWidth = `${Math.max(...(codeMirrorValue?.split('\n').map(line => line.length) || [0])) + 3}ch`;
  // const editorWidth = `${Math.max(...(codeMirrorValue?.split('\n').map(line => line.length) || [0])) + 1}em`;

  return (
    <span>
      {/* <ThemedOnScreenHelper label="JzodElementEditorReactCodeMirror" data={{
        hidden: hidden,
        insideAny: insideAny,
        readOnly: readOnly,
      }}/> */}
      <span>
        {jzodSchemaTooltip ?? <></>}
      </span>
      <ThemedSpan
        style={{
          border: `2px solid ${codeMirrorIsValidJson ? "green" : "red"}`,
          borderRadius: "4px",
          padding: "2px",
          minWidth: "40ch",
          position: "relative",
          display: !hidden && !insideAny ? "inline-block" : "none" // control visibility
        }}
      >
        {props.displayAsStructuredElementSwitch && (
          <ThemedSpan style={{ marginBottom: "10px" }}>{displayAsStructuredElementSwitch}</ThemedSpan>
        )}
        <ThemedStyledButton
          aria-label="Format JSON"
          style={{
            position: "absolute",
            top: "4px",
            right: "36px",
            zIndex: 2,
            background: "#eee",
            border: "1px solid #ccc",
            borderRadius: "3px",
            padding: "2px 6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          onClick={handleFormat}
          title="Format JSON"
        >
          {"{}"}
        </ThemedStyledButton>
        <ThemedStyledButton
          aria-label="Check and Apply JSON"
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            zIndex: 2,
            background: "#eee",
            border: "1px solid #ccc",
            borderRadius: "3px",
            padding: "2px 6px",
            cursor: codeMirrorIsValidJson ? "pointer" : "not-allowed",
            fontWeight: "bold",
            color: codeMirrorIsValidJson ? "green" : "gray"
          }}
          onClick={handleCheck}
          title="Check and Apply JSON"
          disabled={!codeMirrorIsValidJson}
        >
          ✓
        </ThemedStyledButton>
        <ReactCodeMirror
          value={codeMirrorValue}
          extensions={extensions}
          onChange={handleChange}
          style={{ overflowY: 'auto', width: editorWidth }}
        />
      </ThemedSpan>
    </span>
  );
}

// Apply memoization to prevent unnecessary re-renders
// TODO: is this useful / old school?
// export const JzodElementEditorReactCodeMirror = JzodElementEditorReactCodeMirror;
// React.memo(
//   JzodElementEditorReactCodeMirror,
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
