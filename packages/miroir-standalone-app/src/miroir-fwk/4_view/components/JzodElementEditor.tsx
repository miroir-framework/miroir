import React, { useCallback, useMemo } from "react";
import { ErrorBoundary, withErrorBoundary } from "react-error-boundary";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Card, CardContent, MenuItem, Switch } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import TextField from '@mui/material/TextField';

import {
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  JzodLiteral,
  LoggerInterface,
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
import { L } from "vitest/dist/chunks/reporters.D7Jzd9GS.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

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
let count = 0;

function JzodElementEditorComponent(props: JzodElementEditorProps): JSX.Element {
  count++;
  const {
    // general use
    context,
    // currentModel,
    // deploymentEntityStateSelectorMap,
    // editor state
    formik,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    displayAsStructuredElement,
    setDisplayAsStructuredElement,
    // displayEditor,
    // setDisplayEditor,
    // current value and schema ##########################
    currentValue,
    localResolvedElementJzodSchemaBasedOnValue,
    unfoldedRawSchema,
    // miroirMetaModel,
    recursivelyUnfoldedRawSchema,
    // unfoldedRawSchema,
    // uuid
    foreignKeyObjects,
    // union
    unionInformation,
    // Array / Object fold / unfold state
    hiddenFormItems,
    setHiddenFormItems,
    itemsOrder,
    stringSelectList,
    // object
    definedOptionalAttributes,
  } = useJzodElementEditorHooks(props, count, "JzodElementEditor");
  

  // Handle switch for structured element display
  const handleDisplayAsStructuredElementSwitchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      log.info(
        "handleDisplayAsStructuredElementSwitchChange",
        props.rootLesslistKey,
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
          if (props.rootLesslistKey && props.rootLesslistKey.length > 0) {
            formik.setFieldValue(props.rootLesslistKey, parsedCodeMirrorValue);
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
        setCodeMirrorValue(JSON.stringify(currentValue, null, 2));
      }
      setDisplayAsStructuredElement(event.target.checked);
    },
    [
      currentValue,
      codeMirrorValue,
      formik,
      props.rootLesslistKey,
      setCodeMirrorValue,
      setDisplayAsStructuredElement,
    ]
  );
  
  // Determine if the element is an object, array or any type
  const objectOrArrayOrAny = useMemo(() => 
    ["any", "object", "record", "array", "tuple"].includes(
      localResolvedElementJzodSchemaBasedOnValue.type
    ), [localResolvedElementJzodSchemaBasedOnValue.type]
  );
  
  // Switches for display mode
  const displayAsStructuredElementSwitch: JSX.Element = useMemo(
    () => (
      <>
        {objectOrArrayOrAny ? (
          <Switch
            checked={displayAsStructuredElement}
            id={`displayAsStructuredElementSwitch-${props.rootLesslistKey}`}
            name={`displayAsStructuredElementSwitch-${props.rootLesslistKey}`}
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

  const hideSubJzodEditor = useMemo(() => 
    props.hidden || props.insideAny || !displayAsStructuredElement, 
    [props.hidden, props.insideAny, displayAsStructuredElement]
  );



  // Code editor element
  const codeEditor: JSX.Element = useMemo(
    () =>
      !isUnderTest ? (
        <JzodElementEditorReactCodeMirror
          initialValue={JSON.stringify(currentValue, null, 2)}
          codeMirrorValue={codeMirrorValue}
          setCodeMirrorValue={setCodeMirrorValue}
          codeMirrorIsValidJson={codeMirrorIsValidJson}
          setCodeMirrorIsValidJson={setCodeMirrorIsValidJson}
          rootLesslistKey={props.rootLesslistKey}
          rootLesslistKeyArray={props.rootLesslistKeyArray}
          hidden={props.hidden || displayAsStructuredElement}
          insideAny={props.insideAny}
          isUnderTest={isUnderTest}
          displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
          // jzodSchemaTooltip={JzodSchemaTooltip}
        />
      ) : (
        <></>
      ),
    [
      isUnderTest,
      // JzodSchemaTooltip,
      codeMirrorValue,
      setCodeMirrorValue,
      codeMirrorIsValidJson,
      setCodeMirrorIsValidJson,
      props.rootLesslistKey,
      props.rootLesslistKeyArray,
      props.hidden,
      displayAsStructuredElement,
      props.insideAny,
      currentValue,
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
    if (props.returnsEmptyElement || props.hidden) {
      return null;
    }

    if (!localResolvedElementJzodSchemaBasedOnValue || !props.rawJzodSchema) {
      return (
        <div>
          Could not find schema for item: {props.rootLesslistKey}
          <br />
          value {formik.values[props.rootLesslistKey]}
          <br />
          raw Jzod schema: {JSON.stringify(props.rawJzodSchema)}
          <br />
          resolved schema: {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue)}
        </div>
      );
    }

    if (props.rawJzodSchema.type !== "any" &&
      localResolvedElementJzodSchemaBasedOnValue.type !== props.rawJzodSchema.type &&
      ((localResolvedElementJzodSchemaBasedOnValue.type === "object" &&
        !objectTypes.includes(props.rawJzodSchema.type)) ||
        (props.rawJzodSchema.type === "enum" &&
          !enumTypes.includes(localResolvedElementJzodSchemaBasedOnValue.type)))
    ) {
      throw new Error(
        "JzodElementEditor mismatching jzod schemas, resolved schema " +
          JSON.stringify(props.resolvedElementJzodSchema, null, 2) +
          " raw schema " +
          JSON.stringify(props.rawJzodSchema, null, 2)
      );
    }

    if (recursivelyUnfoldedRawSchema && recursivelyUnfoldedRawSchema.status === "error") {
      return (
        <div>
          <p>
            Error unfolding union schema {props.listKey} {count}:
          </p>
          <pre style={{ color: "red" }}>
            {JSON.stringify(recursivelyUnfoldedRawSchema, null, 2)}
          </pre>
        </div>
      );
    }

    // Handle "any" type
    if (props.rawJzodSchema?.type === "any" && !props.insideAny) {
      return (
        <JzodAnyEditor
          name={props.name}
          labelElement={props.labelElement}
          listKey={props.listKey}
          rootLesslistKey={props.rootLesslistKey}
          rootLesslistKeyArray={props.rootLesslistKeyArray}
          rawJzodSchema={props.rawJzodSchema}
          currentDeploymentUuid={props.currentDeploymentUuid}
          currentApplicationSection={props.currentApplicationSection}
          unionInformation={unionInformation}
          resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
          foreignKeyObjects={props.foreignKeyObjects}
        />
      );
    }
    log.info(
      "JzodElementEditorComponent",
      count,
      "Rendering main element for listKey",
      props.listKey,
      "with value",
      currentValue,
      "and schema",
      localResolvedElementJzodSchemaBasedOnValue
    );
    // Generate element based on schema type
    switch (localResolvedElementJzodSchemaBasedOnValue.type) {
      case "object": {
        return (
          <JzodObjectEditor
            name={props.name}
            labelElement={props.labelElement}
            listKey={props.listKey}
            indentLevel={props.indentLevel + 1}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            rawJzodSchema={props.rawJzodSchema}
            currentDeploymentUuid={props.currentDeploymentUuid}
            currentApplicationSection={props.currentApplicationSection}
            unionInformation={unionInformation}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            foreignKeyObjects={foreignKeyObjects}
            hidden={hideSubJzodEditor}
            displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
            // jzodSchemaTooltip={JzodSchemaTooltip}
            parentType={props.parentType} // used to control the parent type of the element, used for record elements
            deleteButtonElement={props.deleteButtonElement}
          />
        );
      }
      case "tuple":
      case "array": {
        return (
          <JzodArrayEditor
            {...props}
            key={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            rootLesslistKey={props.rootLesslistKey}
            rawJzodSchema={props.rawJzodSchema}
            unfoldedRawSchema={unfoldedRawSchema as any}
            indentLevel={props.indentLevel + 1}
            itemsOrder={itemsOrder}
            hiddenFormItems={hiddenFormItems}
            setHiddenFormItems={setHiddenFormItems}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            foreignKeyObjects={props.foreignKeyObjects}
            unionInformation={props.unionInformation}
            insideAny={props.insideAny}
            hidden={hideSubJzodEditor}
            displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
            parentType={props.parentType} // used to control the parent type of the element, used for record elements
            deleteButtonElement={props.deleteButtonElement}
          />
        );
      }
      case "boolean": {
        const fieldProps = formik.getFieldProps(props.rootLesslistKey);
        return (
          LabeledEditor({
            labelElement: props.labelElement ?? <></>,
            editor: (
              <Switch
                id={props.rootLesslistKey}
                key={props.rootLesslistKey}
                aria-label={props.rootLesslistKey}
                {...fieldProps}
                name={props.rootLesslistKey}
                checked={fieldProps.value}
                onChange={(e) => {
                  formik.setFieldValue(props.rootLesslistKey, e.target.checked);
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
              label="miroirInput"
              id={props.rootLesslistKey}
              key={props.rootLesslistKey}
              type="number"
              role="textbox"
              style={{ width: "100%" }}
              {...formik.getFieldProps(props.rootLesslistKey)}
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
              label="miroirInput"
              id={props.rootLesslistKey}
              key={props.rootLesslistKey}
              type="text"
              role="textbox"
              style={{ width: "100%" }}
              {...formik.getFieldProps(props.rootLesslistKey)}
              value={currentValue.toString()}
              onChange={(e) => {
                const value = e.target.value;
                formik.setFieldValue(props.rootLesslistKey, value ? BigInt(value) : BigInt(0));
              }}
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
                label="miroirInput"
                id={props.rootLesslistKey}
                key={props.rootLesslistKey}
                {...formik.getFieldProps(props.rootLesslistKey)}
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
                id={props.rootLesslistKey}
                key={props.rootLesslistKey}
                aria-label={props.rootLesslistKey}
                labelId="demo-simple-select-label"
                variant="standard"
                style={{ width: "100%" }}
                role="textbox"
                {...formik.getFieldProps(props.rootLesslistKey)}
                name={props.rootLesslistKey}
              >
                {stringSelectList.map((e: [string, EntityInstance], index: number) => (
                  <MenuItem
                    id={props.rootLesslistKey + "." + index}
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
          return LabeledEditor({
            labelElement: props.labelElement ?? <></>,
            editor: (
              <TextField
                variant="standard"
                label="miroirInput"
                id={props.rootLesslistKey}
                key={props.rootLesslistKey}
                type="text"
                role="textbox"
                style={{
                  minWidth: "100px",
                  boxSizing: "border-box",
                }}
                {...formik.getFieldProps(props.rootLesslistKey)}
              />
            ),
          });
        }
      }
      case "literal": {
        return (
            <JzodLiteralEditor
              name={props.name}
              key={props.rootLesslistKey}
              labelElement={props.labelElement}
              currentApplicationSection={props.currentApplicationSection}
              currentDeploymentUuid={props.currentDeploymentUuid}
              listKey={props.listKey}
              rootLesslistKey={props.rootLesslistKey}
              rootLesslistKeyArray={props.rootLesslistKeyArray}
              foreignKeyObjects={props.foreignKeyObjects}
              rawJzodSchema={props.rawJzodSchema as JzodLiteral}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              unionInformation={props.unionInformation}
              insideAny={props.insideAny}
            />
          // </div>
        );
      }
      case "enum": {
        const enumValues: string[] =
          (localResolvedElementJzodSchemaBasedOnValue &&
            localResolvedElementJzodSchemaBasedOnValue.definition) ||
          (props.rawJzodSchema && ((props.rawJzodSchema as any).definition ?? [])) ||
          [];
        return (
          // <div style={{ width: "100%" }}>
            <JzodEnumEditor
              name={props.name}
              labelElement={props.labelElement}
              key={props.rootLesslistKey}
              listKey={props.listKey}
              rootLesslistKey={props.rootLesslistKey}
              rootLesslistKeyArray={props.rootLesslistKeyArray}
              rawJzodSchema={props.rawJzodSchema as any}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              foreignKeyObjects={props.foreignKeyObjects}
              currentApplicationSection={props.currentApplicationSection}
              currentDeploymentUuid={props.currentDeploymentUuid}
              enumValues={enumValues}
              unionInformation={props.unionInformation}
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
            key={props.rootLesslistKey}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            foreignKeyObjects={props.foreignKeyObjects}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            rawJzodSchema={props.rawJzodSchema as JzodLiteral}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            unionInformation={props.unionInformation}
            parentType={props.parentType}
          />
        );
      }
      case "date": {
        log.info(
          "JzodElementEditorComponent: Rendering date input for listKey",
          props.listKey,
          "with value",
          currentValue
        );
        
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
              id={props.rootLesslistKey}
              key={props.rootLesslistKey}
              role="textbox"
              style={{ width: "100%" }}
              {...formik.getFieldProps(props.rootLesslistKey)}
              value={formattedDate}
              onChange={(e) => {
                const value = e.target.value;
                formik.setFieldValue(props.rootLesslistKey, value ? new Date(value) : null);
              }}
            />
          ),
        });
        // return (
        //   <span>
        //     {props.labelElement}
        //     <input
        //       type="date"
        //       id={props.rootLesslistKey}
        //       key={props.rootLesslistKey}
        //       role="textbox"
        //       style={{ width: "100%" }}
        //       {...formik.getFieldProps(props.rootLesslistKey)}
        //       value={formattedDate}
        //       onChange={(e) => {
        //         const value = e.target.value;
        //         formik.setFieldValue(props.rootLesslistKey, value ? new Date(value) : null);
        //       }}
        //     />
        //   </span>
        // );
      }
      case "record":
      case "union": {
        throw new Error(
          `JzodElementEditorComponent: Unsupported type ${localResolvedElementJzodSchemaBasedOnValue.type} for listKey ${props.listKey}. This is a bug. Records must be resolved to Objects and Unions must be unfolded.`
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
            <pre>{JSON.stringify(currentValue, null, 2)}</pre>
            <br />
            <pre>
              resolved Jzod schema: {JSON.stringify(props.resolvedElementJzodSchema, null, 2)}
            </pre>
            <pre>raw Jzod schema: {JSON.stringify(props.rawJzodSchema, null, 2)}</pre>
          </span>
        );
      }
    }
  }, [
    props, 
    localResolvedElementJzodSchemaBasedOnValue, 
    formik, 
    currentValue, 
    recursivelyUnfoldedRawSchema,
    unionInformation,
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

  return (
    <span>
      <ErrorBoundary
        FallbackComponent={({ error, resetErrorBoundary }) => (
          <ErrorFallbackComponent
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          context={{
              origin: "JzodElementEditor",
              objectType: "object",
              rootLesslistKey: props.rootLesslistKey,
              // attributeRootLessListKeyArray: p,
              // attributeName: attribute[0],
              // attributeListKey,
              currentValue,
              formikValues: formik.values,
              rawJzodSchema: props.rawJzodSchema,
              localResolvedElementJzodSchemaBasedOnValue,
            }}
          />
        )}
      >
        {/* <span>
          {props.rootLesslistKey}: {localResolvedElementJzodSchemaBasedOnValue.type}
        </span> */}
        {objectOrArrayOrAny ? (
          <Card
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
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
                  <span>
                    {props.submitButton}
                  </span>
                </span>
                <span>
                  <span style={{ display: "flex" }}>
                    <span
                      style={{
                        display:
                          !hideSubJzodEditor ||
                          (props.rawJzodSchema?.type == "any" &&
                            ["undefined", "any"].includes(
                              localResolvedElementJzodSchemaBasedOnValue.type
                            ))
                            ? "none"
                            : "inline-block",
                      }}
                    >
                      {codeEditor}
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
                display: !hideSubJzodEditor ? "none" : "inline-block",
                flexGrow: 1,
              }}
            >
              {/* {props.labelElement} */}
              {codeEditor}
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
      </ErrorBoundary>
      {/* <div>{count}</div> */}
    </span>
  );
}

// Use React.memo to prevent unnecessary re-renders
export const JzodElementEditor = React.memo(JzodElementEditorComponent);

export const JzodObjectEditorWithErrorBoundary = withErrorBoundary(JzodElementEditor, {
  fallback: <div>Something went wrong</div>,
  onError(error, info) {
    log.error("JzodElementEditor error", error);
  },
});
