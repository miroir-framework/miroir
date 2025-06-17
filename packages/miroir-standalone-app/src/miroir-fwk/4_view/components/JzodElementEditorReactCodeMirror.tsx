

// import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
// import CodeMirror from '@uiw/react-codemirror';
// import {ReactCodeMirror} from '@uiw/react-codemirror';
import ReactCodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { alterObjectAtPath, JzodElement } from "miroir-core";
import { useCallback, useRef, useState } from "react";
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

export const JzodElementEditorReactCodeMirror: React.FC<JzodElementEditorReactCodeMirrorProps> = (
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
  // const codeMirrorRef = useRef<any>(null);
  // const editor = useRef();
  // const { setContainer } = useCodeMirror({
  //   container: editor.current,
  //   extensions,
  //   value: code,
  // });

  // useEffect(() => {
  //   if (editor.current) {
  //     setContainer(editor.current);
  //   }
  // }, [editor.current]);

  
  // const [codeMirrorIsValidJson, setCodeMirrorIsValidJson] = useState(true);
  // const [codeMirrorValue, setCodeMirrorValue] = useState<string>(() =>
  //   // "\"start!\""
  //   JSON.stringify(currentValue, null, 2)
  // );
  
  // useEffect(() => {
  //   if (props.rawJzodSchema?.type == "any") {
  //     try {
  //       if (JSON.stringify(JSON.parse(codeMirrorValue)) !== JSON.stringify(currentValue)) {
  //         setCodeMirrorValue(JSON.stringify(currentValue, null, 2));
  //       }
  //     } catch {
  //       // ignore parse error, user is editing
  //     }
  //     // const editor = codeMirrorRef.current?.view;

  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [currentValue]);

  // useEffect(() => {
  //   const editor = codeMirrorRef.current?.view;

  //   return () => {
  //     if (editor) {
  //       editor.destroy(); // Ensure cleanup
  //     }
  //   };
  // }, []);

  if (props.isUnderTest) {
    // For testing purposes, return a simple div with the value
    return (
      <div style={{ border: "1px solid red", padding: "10px" }}>
        <pre>{codeMirrorValue}</pre>
      </div>
    );
  }
  const handleFormat = () => {
    try {
      // const editor = codeMirrorRef.current?.view;
      const parsed = JSON.parse(codeMirrorValue);
      const formatted = JSON.stringify(parsed, null, 2);

      // Try to keep cursor position steady
      // if (editor) {
      //   const { state } = editor;
      //   const selection = state.selection.main;
      //   // Calculate offset from start
      //   const offset = selection.from;
      //   setCodeMirrorValue(formatted);

      //   // After value update, set cursor position
      //   setTimeout(() => {
      //     // Find the closest position in the new text
      //     const newOffset = Math.min(offset, formatted.length);
      //     editor.dispatch({
      //       selection: { anchor: newOffset },
      //       scrollIntoView: true,
      //     });
      //   }, 0);
      // } else {
        setCodeMirrorValue(formatted);
      // }
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  };
  const handleChange = (value: string, viewUpdate?: any) => {
    setCodeMirrorValue(value);
    try {
      JSON.parse(value);
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  }
  const handleCheck = () => {
    try {
      const parsed = JSON.parse(codeMirrorValue);
      // formik.setFieldValue(rootLesslistKey, parsed, false);
      // const newFormState = alterObjectAtPath(formik.values, rootLesslistKeyArray, parsed);
      // formik.setValues(newFormState, false); // do not validate on change
      // formik.setFieldTouched(props.rootLesslistKey, true, false); // mark field as touched
      setCodeMirrorValue(parsed);
      setCodeMirrorIsValidJson(true);
    } catch {
      setCodeMirrorIsValidJson(false);
    }
  };

  return (
    <span>
      {/* ici */}
      {/* {props.switches && (
        <span style={{ marginBottom: "10px" }}>
          {props.switches}
        </span>
      )} */}
      {/* la */}
      <span
        style={{
          border: `2px solid ${codeMirrorIsValidJson ? "green" : "red"}`,
          borderRadius: "4px",
          padding: "2px",
          minWidth: "40ch",
          position: "relative",
          // display: "inline-block",
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
          height={`${(codeMirrorValue.match(/\n/g)?.length || 0) * 20 + 60}px`}
          value={codeMirrorValue}
          extensions={extensions}
          onChange={handleChange} // ref={codeMirrorRef}
        />
      </span>
    </span>
  );
  }
