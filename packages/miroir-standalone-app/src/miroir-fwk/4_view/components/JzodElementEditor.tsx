import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary, withErrorBoundary } from "react-error-boundary";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Card, CardContent, MenuItem, Switch } from "@mui/material";
import TextField from '@mui/material/TextField';

import {
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  JzodElement,
  JzodLiteral,
  LoggerInterface,
  measurePerformance,
  MiroirLoggerFactory,
  mStringify
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import { JzodAnyEditor } from "./JzodAnyEditor.js";
import { JzodArrayEditor } from "./JzodArrayEditor.js";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks.js";
import { JzodElementEditorProps } from "./JzodElementEditorInterface.js";
import { JzodElementEditorReactCodeMirror } from "./JzodElementEditorReactCodeMirror.js";
import { JzodEnumEditor } from "./JzodEnumEditor.js";
import { JzodLiteralEditor } from "./JzodLiteralEditor.js";
import { JzodObjectEditor } from "./JzodObjectEditor.js";
import {
  LabeledEditor,
  LineIconButton,
  StyledSelect
} from "./Style.js";
import { ErrorFallbackComponent } from "./ErrorFallbackComponent.js";
import { measuredUseJzodElementEditorHooks } from "../tools/hookPerformanceMeasure.js";
import { RenderPerformanceMetrics } from "../tools/renderPerformanceMeasure.js";




let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

// Safe stringify function that prevents "Invalid string length" errors
function safeStringify(obj: any, maxLength: number = 2000): string {
  try {
    const str = JSON.stringify(obj, null, 2);
    if (str && str.length > maxLength) {
      return str.substring(0, maxLength) + "... [truncated]";
    }
    return str || "[unable to stringify]";
  } catch (error) {
    return `[stringify error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}

// #####################################################################################################
// const isUnderTest = true;
let isUnderTest = false;
if ((import.meta as any).env?.VITE_TEST_MODE) {
  isUnderTest = true;
  log.info("############################### JzodElementEditor is under test mode #########################################");
} else {
  log.info("############################### JzodElementEditor is NOT under test mode #########################################");
}

// #####################################################################################################
const objectTypes: string[] = ["record", "object", "union"];
const enumTypes: string[] = ["enum", "literal"];

// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

// ################################################################################################
export const ExpandOrFoldObjectAttributes = React.memo((props: {
  hiddenFormItems: { [k: string]: boolean };
  setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  listKey: string;
}): JSX.Element => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    props.setHiddenFormItems((prev) => ({
      ...prev,
      [props.listKey]: !prev[props.listKey],
    }));
  }, [props.listKey, props.setHiddenFormItems]);

  return (
    <LineIconButton
      style={{
        border: 0,
        backgroundColor: "transparent",
      }}
      onClick={handleClick}
    >
      {props.hiddenFormItems[props.listKey] ? (
        <ExpandMore sx={{ color: "darkgreen" }} />
      ) : (
        <ExpandLess />
      )}
    </LineIconButton>
  );
});
ExpandOrFoldObjectAttributes.displayName = "ExpandOrFoldObjectAttributes";

// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// let count = 0;

export function JzodElementEditor(props: JzodElementEditorProps): JSX.Element {
  // Start measuring render time
  const renderStartTime = performance.now();
  
  // count++;
  const [count, setCount] = useState(0);
  React.useEffect(() => {
    setCount((prevCount) => prevCount + 1);
  }, [props]);

  // Create a unique key for this component instance
  const componentKey = `JzodElementEditor-${props.rootLessListKey || 'ROOT'}`;

  const currentKeyMap = props.typeCheckKeyMap?.[props.rootLessListKey];
  // log.info(
  //   "JzodElementEditor",
  //   count,
  //   "Rendering JzodElementEditor for listKey",
  //   props.listKey,
  // );
  const {
    // general use
    context,
    // editor state
    formik,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    displayAsStructuredElement,
    setDisplayAsStructuredElement,
    currentValue,
    localResolvedElementJzodSchemaBasedOnValue,
    // unfoldedRawSchema,
    // recursivelyUnfoldedRawSchema,
    foreignKeyObjects,
    // Array / Object fold / unfold state
    hiddenFormItems,
    setHiddenFormItems,
    itemsOrder,
    stringSelectList,
    // object
    definedOptionalAttributes,
  } = useJzodElementEditorHooks(props, count, "JzodElementEditor");
  // } = measuredUseJzodElementEditorHooks(props, count, "JzodElementEditor");
  // } = measurePerformance("useJzodElementEditorHooks", useJzodElementEditorHooks)(props, count, "JzodElementEditor");
  
  // const localResolvedElementJzodSchemaBasedOnValue: JzodElement | undefined = 
  // // useMemo(() => {
  //   props.typeCheckKeyMap && props.typeCheckKeyMap[props.rootLessListKey]
  //     ? props.typeCheckKeyMap[props.rootLessListKey]?.resolvedSchema
  //     : undefined;
  //     // return result;
  // // }, [
  // //   props.typeCheckKeyMap,
  // //   props.rootLessListKey,
  // // ])
  // ;

  // Handle switch for structured element display
  const handleDisplayAsStructuredElementSwitchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      log.info(
        "handleDisplayAsStructuredElementSwitchChange",
        props.rootLessListKey,
        "Switching display mode to:",
        event.target.checked
      );
      if (event.target.checked) {
        try {
          const parsedCodeMirrorValue = JSON.parse(codeMirrorValue);
          log.info(
            "handleDisplayAsStructuredElementSwitchChange Parsed CodeMirror value for structured element display:",
            mStringify(parsedCodeMirrorValue, null, 2)
          );
          if (props.rootLessListKey && props.rootLessListKey.length > 0) {
            formik.setFieldValue(props.rootLessListKey, parsedCodeMirrorValue);
          } else {
            formik.setValues(parsedCodeMirrorValue);
          }
        } catch (e) {
          log.error("Failed to parse JSON in switch handler:", e);
          // Keep display mode as is in case of error
          return;
        }
      } else {
        // if switching to code editor, reset the codeMirrorValue to the current value
        setCodeMirrorValue(safeStringify(currentValue));
      }
      setDisplayAsStructuredElement(event.target.checked);
    },
    [
      currentValue,
      codeMirrorValue,
      formik,
      props.rootLessListKey,
      setCodeMirrorValue,
      setDisplayAsStructuredElement,
    ]
  );
  
  // Determine if the element is an object, array or any type
  const objectOrArrayOrAny = useMemo(() => 
    !localResolvedElementJzodSchemaBasedOnValue || ["any", "object", "record", "array", "tuple"].includes(
      localResolvedElementJzodSchemaBasedOnValue.type
    ), [localResolvedElementJzodSchemaBasedOnValue]
  );
  
  // Switches for display mode
  const displayAsStructuredElementSwitch: JSX.Element = useMemo(
    () => (
      <>
        {objectOrArrayOrAny ? (
          <Switch
            checked={displayAsStructuredElement}
            id={`displayAsStructuredElementSwitch-${props.rootLessListKey}`}
            name={`displayAsStructuredElementSwitch-${props.rootLessListKey}`}
            onChange={handleDisplayAsStructuredElementSwitchChange}
            inputProps={{ "aria-label": `Display as structured element` }}
            disabled={!codeMirrorIsValidJson}
          />
        ) : (
          <></>
        )}
      </>
    ),
    [
      objectOrArrayOrAny,
      displayAsStructuredElement,
      handleDisplayAsStructuredElementSwitchChange,
      codeMirrorIsValidJson,
    ]
  );
  const displayCodeEditor =
    props.hasTypeError ||
    !localResolvedElementJzodSchemaBasedOnValue || // same as props.hasTypeError?
    !displayAsStructuredElement ||
    currentKeyMap?.rawSchema?.type == "any" ||
    ["undefined", "any"].includes(localResolvedElementJzodSchemaBasedOnValue.type);

  const hideSubJzodEditor = useMemo(() => 
    props.hidden || props.insideAny || displayCodeEditor, 
    [props.hidden, props.insideAny, props.hasTypeError]
  );


  // log.info("JzodElementEditor",
  //   count,
  //   "Rendering JzodElementEditor for listKey",
  //   props.listKey,
  //   "objectOrArrayOrAny",
  //   objectOrArrayOrAny,
  //   "displayAsStructuredElement",
  //   displayAsStructuredElement,
  //   "hideSubJzodEditor",
  //   hideSubJzodEditor,
  //   "displayCodeEditor",
  //   displayCodeEditor,
  //   "currentValue",
  //   currentValue,
  //   "localResolvedElementJzodSchemaBasedOnValue",
  //   localResolvedElementJzodSchemaBasedOnValue,
  // )

  // Check if we should show code editor
  const shouldShowCodeEditor = useMemo(() => 
    !isUnderTest &&
    displayCodeEditor &&
    (
      props.resolvedElementJzodSchema?.type == "object" ||
      props.resolvedElementJzodSchema?.type == "record" ||
      props.resolvedElementJzodSchema?.type == "array" ||
      props.resolvedElementJzodSchema?.type == "tuple" ||
      props.resolvedElementJzodSchema?.type == "any"
    ),
    [
      isUnderTest,
      displayCodeEditor,
      props.resolvedElementJzodSchema?.type
    ]
  );

  // Define Prettier-like colors for nested structures
  const prettierColors = useMemo(() => [
    "#f8f8f8", // Light gray
    "#f0f0f0", // Slightly darker gray
    "#e8e8e8"  // Even darker gray
  ], []);

  // Get appropriate background color based on indent level
  const bgColor = useMemo(() => 
    prettierColors[(props.indentLevel || 0) % 3],
    [prettierColors, props.indentLevel]
  );


  // Create the main element based on the schema type
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const mainElement = useMemo(() => {
    try {
      if (props.returnsEmptyElement || props.hidden) {
        return null;
      }

      // if (!localResolvedElementJzodSchemaBasedOnValue || !props.rawJzodSchema) {
      if (!localResolvedElementJzodSchemaBasedOnValue) {
        return (
          <div>
            Could not find schema for element: {props.rootLessListKey}
            <br />
            {/* value {formik.values[props.rootLessListKey]} */}
            {/* value <pre>{safeStringify(currentValue, 500)}</pre> */}
            value <pre>{JSON.stringify(currentValue)}</pre>
            <br />
            raw Jzod schema: {safeStringify(currentKeyMap?.rawSchema, 500)}
            <br />
            resolved schema: {safeStringify(localResolvedElementJzodSchemaBasedOnValue, 500)}
          </div>
        );
      }

      // Handle "any" type
      if (currentKeyMap?.rawSchema?.type === "any" && !props.insideAny) {
        return (
          <JzodAnyEditor
            name={props.name}
            labelElement={props.labelElement}
            listKey={props.listKey}
            rootLessListKey={props.rootLessListKey}
            rootLessListKeyArray={props.rootLessListKeyArray}
            // localRootLessListKeyMap={props.localRootLessListKeyMap}
            // rawJzodSchema={props.rawJzodSchema}
            currentDeploymentUuid={props.currentDeploymentUuid}
            currentApplicationSection={props.currentApplicationSection}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            typeCheckKeyMap={ props.typeCheckKeyMap }
            foreignKeyObjects={props.foreignKeyObjects}
          />
        );
      }
      // log.info(
      //   "JzodElementEditor",
      //   count,
      //   "Rendering main element for listKey",
      //   props.listKey,
      //   "with value",
      //   currentValue,
      //   "and resolved schema",
      //   localResolvedElementJzodSchemaBasedOnValue,
      //   // JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2),
      //   // "and props.localRootLessListKeyMap",
      //   // JSON.stringify(props.localRootLessListKeyMap, null, 2)
      // );
      // Generate element based on schema type
      switch (localResolvedElementJzodSchemaBasedOnValue.type) {
        case "object": {
          return (
            <JzodObjectEditor
              name={props.name}
              labelElement={props.labelElement}
              listKey={props.listKey}
              indentLevel={props.indentLevel + 1}
              rootLessListKey={props.rootLessListKey}
              rootLessListKeyArray={props.rootLessListKeyArray}
              // rawJzodSchema={props.rawJzodSchema}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              currentDeploymentUuid={props.currentDeploymentUuid}
              currentApplicationSection={props.currentApplicationSection}
              foreignKeyObjects={foreignKeyObjects}
              hidden={hideSubJzodEditor}
              displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
              // parentType={props.parentType} // used to control the parent type of the element, used for record elements
              deleteButtonElement={props.deleteButtonElement}
            />
          );
        }
        case "tuple":
        case "array": {
          return (
            <JzodArrayEditor
              // {...props}
              listKey={props.listKey}
              name={props.name}
              labelElement={props.labelElement}
              key={props.rootLessListKey}
              rootLessListKeyArray={props.rootLessListKeyArray}
              rootLessListKey={props.rootLessListKey}
              // localRootLessListKeyMap={props.localRootLessListKeyMap}
              // rawJzodSchema={props.rawJzodSchema}
              // unfoldedRawSchema={unfoldedRawSchema as any}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              indentLevel={props.indentLevel + 1}
              itemsOrder={itemsOrder}
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              currentApplicationSection={props.currentApplicationSection}
              currentDeploymentUuid={props.currentDeploymentUuid}
              foreignKeyObjects={props.foreignKeyObjects}
              insideAny={props.insideAny}
              hidden={hideSubJzodEditor}
              displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
              // parentType={props.parentType} // used to control the parent type of the element, used for record elements
              deleteButtonElement={props.deleteButtonElement}
            />
          );
          break;
        }
        case "boolean": {
          const fieldProps = formik.getFieldProps(props.rootLessListKey);
          return (
            LabeledEditor({
              labelElement: props.labelElement ?? <></>,
              editor: (
                <Switch
                  id={props.rootLessListKey}
                  key={props.rootLessListKey}
                  aria-label={props.rootLessListKey}
                  {...fieldProps}
                  name={props.rootLessListKey}
                  checked={fieldProps.value}
                  onChange={(e) => {
                    formik.setFieldValue(props.rootLessListKey, e.target.checked);
                  }}
                />
              ),
            })
          );
        }
        case "number": {
          return LabeledEditor({
            labelElement: props.labelElement ?? <></>,
            editor: (
              <TextField
                variant="standard"
                data-testid="miroirInput"
                id={props.rootLessListKey}
                key={props.rootLessListKey}
                type="number"
                role="textbox"
                style={{ width: "100%" }}
                {...formik.getFieldProps(props.rootLessListKey)}
                name={props.rootLessListKey}
              />
            ),
          });
        }
        case "bigint": {
          return LabeledEditor({
            labelElement: props.labelElement ?? <></>,
            editor: (
              <TextField
                variant="standard"
                data-testid="miroirInput"
                id={props.rootLessListKey}
                key={props.rootLessListKey}
                type="text"
                role="textbox"
                style={{ width: "100%" }}
                {...formik.getFieldProps(props.rootLessListKey)}
                value={currentValue.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue(props.rootLessListKey, value ? BigInt(value) : BigInt(0));
                }}
                name={props.rootLessListKey}
              />
            )
          });
        }
        case "string": {
          return (
            <LabeledEditor
              labelElement={props.labelElement ?? <></>}
              editor={
                <TextField
                  variant="standard"
                  data-testid="miroirInput"
                  id={props.rootLessListKey}
                  key={props.rootLessListKey}
                  {...formik.getFieldProps(props.rootLessListKey)}
                  name={props.rootLessListKey}
                />
              }
            />
          );
        }
        case "uuid": {
          if (localResolvedElementJzodSchemaBasedOnValue.tag?.value?.targetEntity) {
            return LabeledEditor({
              labelElement: props.labelElement ?? <></>,
              editor: (
                <StyledSelect
                  id={props.rootLessListKey}
                  key={props.rootLessListKey}
                  data-testid="miroirInput"
                  aria-label={props.rootLessListKey}
                  labelId="demo-simple-select-label"
                  variant="standard"
                  style={{ 
                    width: "auto",
                    minWidth: "200px",
                    maxWidth: "400px"
                  }}
                  role="textbox"
                  {...formik.getFieldProps(props.rootLessListKey)}
                  name={props.rootLessListKey}
                >
                  {stringSelectList.map((e: [string, EntityInstance], index: number) => (
                    <MenuItem
                      id={props.rootLessListKey + "." + index}
                      key={e[1].uuid}
                      value={e[1].uuid}
                    >
                      {(e[1] as EntityInstanceWithName).name}
                    </MenuItem>
                  ))}
                </StyledSelect>
              ),
            });
          } else {
              const currentUuidValue = formik.values[props.rootLessListKey] || "";
              const estimatedWidth = Math.max(200, Math.min(400, currentUuidValue.length * 8 + 40));
              
              return LabeledEditor({
                labelElement: props.labelElement ?? <></>,
                editor: (
                  <TextField
                    variant="standard"
                    data-testid="miroirInput"
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    aria-label={props.rootLessListKey}
                    type="text"
                    style={{
                      width: `${estimatedWidth}px`,
                      minWidth: "200px",
                      maxWidth: "400px",
                      boxSizing: "border-box",
                    }}
                    {...formik.getFieldProps(props.rootLessListKey)}
                    name={props.rootLessListKey}
                  />
                ),
              });
          }
        }
        case "literal": {
          return (
              <JzodLiteralEditor
                name={props.name}
                key={props.rootLessListKey}
                labelElement={props.labelElement}
                currentApplicationSection={props.currentApplicationSection}
                currentDeploymentUuid={props.currentDeploymentUuid}
                listKey={props.listKey}
                rootLessListKey={props.rootLessListKey}
                rootLessListKeyArray={props.rootLessListKeyArray}
                foreignKeyObjects={props.foreignKeyObjects}
                // rawJzodSchema={props.rawJzodSchema as JzodLiteral}
                resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
                typeCheckKeyMap={ props.typeCheckKeyMap }
                // localRootLessListKeyMap={props.localRootLessListKeyMap}
                insideAny={props.insideAny}
              />
            // </div>
          );
        }
        case "enum": {
          const enumValues: string[] =
            (localResolvedElementJzodSchemaBasedOnValue &&
              localResolvedElementJzodSchemaBasedOnValue.definition) ||
            (currentKeyMap?.rawSchema && ((currentKeyMap.rawSchema as any).definition ?? [])) ||
            [];
          return (
            // <div style={{ width: "100%" }}>
              <JzodEnumEditor
                name={props.name}
                labelElement={props.labelElement}
                key={props.rootLessListKey}
                listKey={props.listKey}
                rootLessListKey={props.rootLessListKey}
                rootLessListKeyArray={props.rootLessListKeyArray}
                // rawJzodSchema={props.rawJzodSchema as any}
                resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
                typeCheckKeyMap={ props.typeCheckKeyMap }
                // localRootLessListKeyMap={props.localRootLessListKeyMap}
                foreignKeyObjects={props.foreignKeyObjects}
                currentApplicationSection={props.currentApplicationSection}
                currentDeploymentUuid={props.currentDeploymentUuid}
                enumValues={enumValues}
                forceTestingMode={props.forceTestingMode}
                insideAny={props.insideAny}
              />
            // </div>
          );
        }
        case "undefined":
        case "any": {
          return (
            <JzodAnyEditor
              name={props.name}
              labelElement={props.labelElement}
              key={props.rootLessListKey}
              listKey={props.listKey}
              rootLessListKey={props.rootLessListKey}
              rootLessListKeyArray={props.rootLessListKeyArray}
              foreignKeyObjects={props.foreignKeyObjects}
              currentApplicationSection={props.currentApplicationSection}
              currentDeploymentUuid={props.currentDeploymentUuid}
              // rawJzodSchema={props.rawJzodSchema as JzodLiteral}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              // parentType={props.parentType}
            />
          );
        }
        case "date": {
          // log.info(
          //   "JzodElementEditor: Rendering date input for listKey",
          //   props.listKey,
          //   "with value",
          //   currentValue
          // );
          
          // Convert string to Date if needed or use existing Date
          const dateValue = typeof currentValue === 'string' 
            ? new Date(currentValue) 
            : (currentValue instanceof Date ? currentValue : null);
          
          // Format the date as YYYY-MM-DD for the input
          const formattedDate = dateValue && !isNaN(dateValue.getTime())
            ? dateValue.toISOString().split("T")[0]
            : "";
          return LabeledEditor({
            labelElement: props.labelElement ?? <></>,
            editor: (
              <input
                type="date"
                id={props.rootLessListKey}
                key={props.rootLessListKey}
                role="textbox"
                style={{ width: "100%" }}
                {...formik.getFieldProps(props.rootLessListKey)}
                value={formattedDate}
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue(props.rootLessListKey, value ? new Date(value) : null);
                }}
              />
            ),
          });
          // return (
          //   <span>
          //     {props.labelElement}
          //     <input
          //       type="date"
          //       id={props.rootLessListKey}
          //       key={props.rootLessListKey}
          //       role="textbox"
          //       style={{ width: "100%" }}
          //       {...formik.getFieldProps(props.rootLessListKey)}
          //       value={formattedDate}
          //       onChange={(e) => {
          //         const value = e.target.value;
          //         formik.setFieldValue(props.rootLessListKey, value ? new Date(value) : null);
          //       }}
          //     />
          //   </span>
          // );
        }
        case "record":
        case "union": {
          throw new Error(
            `JzodElementEditor: Unsupported type ${localResolvedElementJzodSchemaBasedOnValue.type} for listKey ${props.listKey}. This is a bug. Records must be resolved to Objects and Unions must be unfolded.`
          );
        }
        case "function":
        case "never":
        case "null":
        case "unknown":
        case "void":
        case "lazy":
        case "intersection":
        case "map":
        case "promise":
        case "schemaReference":
        case "set":
        default: {
          return (
            <span>
              default case: {localResolvedElementJzodSchemaBasedOnValue.type}, for {props.listKey}
              values
              <pre>{safeStringify(currentValue, 500)}</pre>
              <br />
              <pre>
                resolved Jzod schema: {safeStringify(localResolvedElementJzodSchemaBasedOnValue, 500)}
              </pre>
              <pre>raw Jzod schema: {safeStringify(currentKeyMap?.rawSchema, 500)}</pre>
            </span>
          );
        }
      }
    } catch (error) {
      // Return error element if mainElement creation fails
      return (
        <ErrorFallbackComponent
          error={error as Error}
          context={{
            origin: "JzodElementEditor-mainElement",
            objectType: "element",
            rootLessListKey: props.rootLessListKey,
            currentValue,
            formikValues: formik.values,
            // rawJzodSchema: props.rawJzodSchema,
            // unfoldedJzodSchema: unfoldedRawSchema,
            localResolvedElementJzodSchemaBasedOnValue,
          }}
        />
      );
    }
  }, [
    props,
    localResolvedElementJzodSchemaBasedOnValue, 
    formik, 
    currentValue, 
    foreignKeyObjects,
    hideSubJzodEditor,
    displayAsStructuredElementSwitch,
    hiddenFormItems,
    setHiddenFormItems,
    itemsOrder,
    stringSelectList
  ]);
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################

  if (props.returnsEmptyElement || props.hidden) {
    return <></>;
  }

  // useEffect(() => {
  //     // Track render performance at the end of render
  //   const renderEndTime = performance.now();
  //   const renderDuration = renderEndTime - renderStartTime;
  //   const currentMetrics = trackRenderPerformance(componentKey, renderDuration);

  //   // Log performance every 50 renders or if render took longer than 10ms
  //   if (currentMetrics.renderCount % 50 === 0 || renderDuration > 10) {
  //     log.info(
  //       `JzodElementEditor render performance - ${componentKey}: ` +
  //       `#${currentMetrics.renderCount} renders, ` +
  //       `Current: ${renderDuration.toFixed(2)}ms, ` +
  //       `Total: ${currentMetrics.totalRenderTime.toFixed(2)}ms, ` +
  //       `Avg: ${currentMetrics.averageRenderTime.toFixed(2)}ms, ` +
  //       `Min/Max: ${currentMetrics.minRenderTime.toFixed(2)}ms/${currentMetrics.maxRenderTime.toFixed(2)}ms`
  //     );
  //   }
  // });

  return (
    <span>
      {props.rootLessListKey === "" && (
        <RenderPerformanceMetrics.RenderPerformanceDisplay
          componentKey={componentKey}
          indentLevel={props.indentLevel}
        />
      )}
      {objectOrArrayOrAny ? (
        <Card
          id={props.rootLessListKey}
          key={props.rootLessListKey}
          style={{
            padding: "1px",
            width: "calc(100% - 10px)",
            margin: "5px 10px 5px 0",
            position: "relative",
            backgroundColor: bgColor,
            border: "1px solid #ddd",
            justifyContent: "space-between",
            boxShadow: "none",
          }}
        >
          <CardContent>
            <div>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{props.submitButton}</span>
              </span>
              <span>
                <span style={{ display: "flex" }}>
                  <span
                    style={{
                      display: !displayCodeEditor ? "none" : "inline-block",
                    }}
                  >
                    code editor:
                    {shouldShowCodeEditor && (
                      <JzodElementEditorReactCodeMirror
                        initialValue={safeStringify(currentValue)}
                        codeMirrorValue={codeMirrorValue}
                        setCodeMirrorValue={setCodeMirrorValue}
                        codeMirrorIsValidJson={codeMirrorIsValidJson}
                        setCodeMirrorIsValidJson={setCodeMirrorIsValidJson}
                        rootLessListKey={props.rootLessListKey}
                        rootLessListKeyArray={props.rootLessListKeyArray}
                        hidden={!displayCodeEditor}
                        insideAny={props.insideAny}
                        isUnderTest={isUnderTest}
                        displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
                      />
                    )}
                  </span>
                </span>
                <span
                  style={{
                    display: hideSubJzodEditor ? "none" : "block",
                    margin: "2px 5px 5px 5px",
                    width: "calc(100% - 15px)",
                    flexGrow: 1,
                  }}
                >
                  {mainElement}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        // simple type value / attribute
        <span
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          <span>{props.deleteButtonElement ?? <></>}</span>
          {/* {props.labelElement} */}
          <span
            style={{
              // display: !hideSubJzodEditor ? "none" : "inline-block",
              display: !displayCodeEditor ? "none" : "inline-block",
              flexGrow: 1,
            }}
          >
            code editor
            {/* {props.labelElement} */}
            {shouldShowCodeEditor && (
              <JzodElementEditorReactCodeMirror
                initialValue={safeStringify(currentValue)}
                codeMirrorValue={codeMirrorValue}
                setCodeMirrorValue={setCodeMirrorValue}
                codeMirrorIsValidJson={codeMirrorIsValidJson}
                setCodeMirrorIsValidJson={setCodeMirrorIsValidJson}
                rootLessListKey={props.rootLessListKey}
                rootLessListKeyArray={props.rootLessListKeyArray}
                hidden={!displayCodeEditor}
                insideAny={props.insideAny}
                isUnderTest={isUnderTest}
                displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
              />
            )}
          </span>
          <span
            style={{
              display: hideSubJzodEditor ? "none" : "inline-block",
              margin: "2px 0 2px 0",
              flexGrow: 1,
            }}
          >
            {mainElement}
          </span>
        </span>
      )}
      {/* <div>{count}</div> */}
    </span>
  );
}
