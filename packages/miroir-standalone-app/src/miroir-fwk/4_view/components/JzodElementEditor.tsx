import { withErrorBoundary } from "react-error-boundary";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Clear from "@mui/icons-material/Clear";
import Checkbox from "@mui/material/Checkbox";

import {
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  JzodLiteral,
  LoggerInterface,
  MiroirLoggerFactory,
  mStringify,
  resolvePathOnObject
} from "miroir-core";

import { Card, MenuItem, Switch } from "@mui/material";
import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import { JzodAnyEditor } from "./JzodAnyEditor.js";
import { JzodArrayEditor } from "./JzodArrayEditor.js";
import { getJzodElementEditorHooks } from "./JzodElementEditorHooks.js";
import { JzodElementEditorProps } from "./JzodElementEditorInterface.js";
import { JzodElementEditorReactCodeMirror } from "./JzodElementEditorReactCodeMirror.js";
import { JzodEnumEditor } from "./JzodEnumEditor.js";
import { JzodLiteralEditor } from "./JzodLiteralEditor.js";
import { JzodObjectEditor } from "./JzodObjectEditor.js";
import {
  LineIconButton,
  SmallIconButton,
  StyledSelect
} from "./Style.js";
import { useCallback } from "react";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

// const isUnderTest = true;
let isUnderTest = false;
if ((import.meta as any).env?.VITE_TEST_MODE) {
  isUnderTest = true;
  log.info("############################### JzodElementEditor is under test mode #########################################");
} else {
  log.info("############################### JzodElementEditor is NOT under test mode #########################################");
}
// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

// ################################################################################################
export const ExpandOrFoldObjectAttributes = (props: {
  hiddenFormItems: { [k: string]: boolean };
  // setHiddenFormItems: any,
  setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  listKey: string;
}): JSX.Element => {
  return (
    <LineIconButton
      style={{
        border: 0,
        backgroundColor: "transparent",
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        props.setHiddenFormItems({
          ...props.hiddenFormItems,
          [props.listKey]: props.hiddenFormItems[props.listKey] ? false : true,
        });
      }}
    >
      {props.hiddenFormItems[props.listKey] ? (
        <ExpandMore sx={{ color: "darkgreen" }} />
      ) : (
        // <ExpandMore sx={{ color: "darkred",maxWidth: "15px", maxHeight: "15px" }} />
        // <ExpandLess sx={{ maxWidth: "15px", maxHeight: "15px" }} />
        <ExpandLess />
      )}
    </LineIconButton>
  );
};

// // #####################################################################################################
// function Fallback({ error, resetErrorBoundary }: any) {
//   // Call resetErrorBoundary() to reset the error boundary and retry the render.

//   return (
//     <div role="alert">
//       <p>Something went wrong:</p>
//       <pre style={{ color: "red" }}>{error.message}</pre>
//     </div>
//   );
// }

// #####################################################################################################
const objectTypes: string[] = ["record", "object", "union"];
const enumTypes: string[] = ["enum", "literal"];





// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
let count = 0;

// export const JzodElementEditor = (props: JzodObjectEditorProps): JSX.Element => {
export function JzodElementEditor(props: JzodElementEditorProps): JSX.Element {
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
    // current value and schema
    currentValue,
    localResolvedElementJzodSchemaBasedOnValue,
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
  } = getJzodElementEditorHooks(props, count, "JzodElementEditor");
  
  // Function to remove an optional attribute
  const removeOptionalAttribute = useCallback(() => {
    if (props.rootLesslistKey) {
      const newFormState = { ...formik.values };
      delete newFormState[props.rootLesslistKey];
      formik.setValues(newFormState);
      log.info("Removed optional attribute:", props.rootLesslistKey);
    }
  }, [formik, props.rootLesslistKey]);

  // const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;
  // const usedIndentLevel: number = props.indentLevel ? props.indentLevel : 0;
  // let result: JSX.Element = <></>;

  // log.info("#####################################################################################");
  // log.info(
  //   "JzodElementEditor rendering for",
  //   props.listKey,
  //   "count",
  //   count,
  //   "formik.values",
  //   formik.values,
  //   // JSON.stringify(formik.values, null, 2),
  //   "props.rawJzodSchema",
  //   props.rawJzodSchema,
  //   // JSON.stringify(props.rawJzodSchema, null, 2),
  // );

  // const currentValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);

  // ##############################################################################################

  if (props.returnsEmptyElement || props.hidden) {
    return <></>;
  }

  // ##############################################################################################
  const handleDisplayAsStructuredElementSwitchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // log.info(
      //   "handleDisplayAsStructuredElementSwitchChange",
      //   "event.target.checked",
      //   event.target.checked,
      //   "props.rootLesslistKey",
      //   props.rootLesslistKey,
      //   "codeMirrorValue",
      //   codeMirrorValue,
      //   "formik.values",
      //   formik.values,
      //   "currentValue",
      //   currentValue
      // );
      if (event.target.checked) {
        const parsedCodeMirrorValue = JSON.parse(codeMirrorValue); // set the value to the current codeMirrorValue
        // log.info(
        //   "handleDisplayAsStructuredElementSwitchChange",
        //   "parsedCodeMirrorValue",
        //   parsedCodeMirrorValue,
        // );
        if (props.rootLesslistKey && props.rootLesslistKey.length > 0) {
          // log.info(
          //   "handleDisplayAsStructuredElementSwitchChange",
          //   "setting formik.setFieldValue",
          //   "props.rootLesslistKey",
          //   props.rootLesslistKey,
          //   "parsedCodeMirrorValue",
          //   parsedCodeMirrorValue
          // );
          formik.setFieldValue(props.rootLesslistKey, parsedCodeMirrorValue);
        } else {
          // log.info(
          //   "handleDisplayAsStructuredElementSwitchChange",
          //   "setting formik.setFormikState",
          //   "parsedCodeMirrorValue",
          //   parsedCodeMirrorValue
          // );
          formik.setValues(parsedCodeMirrorValue); // set the value to the current codeMirrorValue
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
    
    // ##############################################################################################
    // const handleDisplayEditorSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //   setDisplayEditor(event.target.checked);
    // };
  
  const objectOrArrayOrAny = ["any", "object", "record", "array", "tuple"].includes(
    localResolvedElementJzodSchemaBasedOnValue.type
  );
  const objectOrArraySwitches: JSX.Element = (
    <>
      {/* <label htmlFor="displayAsStructuredElementSwitch">Display {props.rawJzodSchema?.type? props.rawJzodSchema?.type+ " ":""}as structured element:</label> */}
      { objectOrArrayOrAny ? (
        <Switch
          checked={displayAsStructuredElement}
          id="displayAsStructuredElementSwitch"
          onChange={handleDisplayAsStructuredElementSwitchChange}
          inputProps={{ "aria-label": `Display as structured element` }}
          disabled={!codeMirrorIsValidJson}
        />
      ): <></>
      }
      {/* <label htmlFor="displayEditorSwitch">Display editor:</label> */}
      {/* <Switch
        checked={displayEditor}
        id="displayEditorSwitch"
        onChange={handleDisplayEditorSwitchChange}
        inputProps={{ "aria-label": "Edit" }}
      /> */}
    </>
  );
  const codeEditor: JSX.Element = !isUnderTest ? (
    <JzodElementEditorReactCodeMirror
      codeMirrorValue={codeMirrorValue}
      setCodeMirrorValue={setCodeMirrorValue}
      codeMirrorIsValidJson={codeMirrorIsValidJson}
      setCodeMirrorIsValidJson={setCodeMirrorIsValidJson}
      rootLesslistKey={props.rootLesslistKey}
      rootLesslistKeyArray={props.rootLesslistKeyArray}
      hidden={props.hidden || displayAsStructuredElement} // hidden if this JzodElementEditor is hidden or displayAsCode is false
      insideAny={props.insideAny}
      initialValue={currentValue}
      isUnderTest={isUnderTest}
    />
  ) : (
    <></>
  );

  let mainElement: JSX.Element | undefined = undefined;
  const hideSubJzodEditor = props.hidden || props.insideAny || !displayAsStructuredElement;

  if (localResolvedElementJzodSchemaBasedOnValue && props.rawJzodSchema) {
    if (
      props.rawJzodSchema?.type != "any" &&
      localResolvedElementJzodSchemaBasedOnValue.type != props.rawJzodSchema?.type &&
      ((localResolvedElementJzodSchemaBasedOnValue.type == "object" &&
        !objectTypes.includes(props.rawJzodSchema.type)) ||
        (props.rawJzodSchema.type == "enum" &&
          // !enumTypes.includes(localResolvedElementJzodSchema.type)))
          !enumTypes.includes(localResolvedElementJzodSchemaBasedOnValue.type)))
    ) {
      throw new Error(
        "JzodElementEditor mismatching jzod schemas, resolved schema " +
          JSON.stringify(props.resolvedElementJzodSchema, null, 2) +
          " raw schema " +
          JSON.stringify(props.rawJzodSchema, null, 2)
      );
    }

    if (recursivelyUnfoldedRawSchema && recursivelyUnfoldedRawSchema.status == "error") {
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

    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    if (props.rawJzodSchema?.type == "any" && !props.insideAny) {
      return (
        <span key={props.rootLesslistKey}>
          {codeEditor}
          <JzodAnyEditor
            name={props.name}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            rawJzodSchema={props.rawJzodSchema}
            currentDeploymentUuid={props.currentDeploymentUuid}
            currentApplicationSection={props.currentApplicationSection}
            unionInformation={unionInformation}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            label={props.label}
            foreignKeyObjects={props.foreignKeyObjects}
          ></JzodAnyEditor>
        </span>
      );
    }

    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    switch (localResolvedElementJzodSchemaBasedOnValue.type) {
      case "object": {
        mainElement = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            <JzodObjectEditor
              name={props.name}
              label={props.label}
              listKey={props.listKey}
              rootLesslistKey={props.rootLesslistKey}
              rootLesslistKeyArray={props.rootLesslistKeyArray}
              rawJzodSchema={props.rawJzodSchema}
              currentDeploymentUuid={props.currentDeploymentUuid}
              currentApplicationSection={props.currentApplicationSection}
              unionInformation={unionInformation}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              foreignKeyObjects={foreignKeyObjects}
              hidden={hideSubJzodEditor}
              switches={objectOrArraySwitches}
            ></JzodObjectEditor>
          </span>
        );
        break;
      }
      case "tuple":
      case "array": {
        mainElement = (
          <span key={props.rootLesslistKey}>
            <JzodArrayEditor
              {...props}
              key={props.rootLesslistKey}
              rootLesslistKeyArray={props.rootLesslistKeyArray}
              rootLesslistKey={props.rootLesslistKey}
              rawJzodSchema={props.rawJzodSchema as any}
              itemsOrder={itemsOrder}
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              currentApplicationSection={props.currentApplicationSection}
              currentDeploymentUuid={props.currentDeploymentUuid}
              foreignKeyObjects={props.foreignKeyObjects}
              unionInformation={props.unionInformation}
              insideAny={props.insideAny}
              hidden={hideSubJzodEditor}
              switches={objectOrArraySwitches}
            ></JzodArrayEditor>
          </span>
        );
        break;
      }
      case "boolean": {
        log.info(
          "JzodElementEditor boolean!",
          props.listKey,
          "formik.getFieldProps",
          mStringify(formik.getFieldProps(props.rootLesslistKey)),
          "formik.values[props.rootLesslistKey]",
          formik.values[props.rootLesslistKey]
        );
        const fieldProps = formik.getFieldProps(props.rootLesslistKey);
        mainElement = (
          // result = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            <span
              style={{
                display: hideSubJzodEditor
                  ? "none" // control visibility
                  : "inline-block",
              }}
            >
              {/* {props.label && <label htmlFor={props.rootLesslistKey}>{props.label}: </label>} */}
              <Checkbox
                // defaultChecked={formik.values[props.rootLesslistKey]}
                id={props.rootLesslistKey}
                key={props.rootLesslistKey}
                aria-label={props.rootLesslistKey}
                {...fieldProps}
                name={props.rootLesslistKey}
                checked={fieldProps.value}
              />
            </span>
          </span>
        );
        break;
      }
      case "number": {
        // log.info("JzodElementEditor number!", props.listKey, "formState", props.formState);
        mainElement = (
          // result = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            {/* {codeEditor} */}
            <span
              style={{
                display: hideSubJzodEditor
                  ? "none" // control visibility
                  : "inline-block",
              }}
            >
              <input
                type="number"
                id={props.rootLesslistKey}
                key={props.rootLesslistKey}
                role="textbox"
                style={{ width: "100%" }}
                {...formik.getFieldProps(props.rootLesslistKey)}
              />
            </span>
          </span>
        );
        break;
      }
      case "bigint": {
        mainElement = (
          // result = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            {/* {codeEditor} */}
            <span
              style={{
                display: hideSubJzodEditor
                  ? "none" // control visibility
                  : "inline-block",
              }}
            >
              <input
                type="text"
                id={props.rootLesslistKey}
                key={props.rootLesslistKey}
                role="textbox"
                style={{ width: "100%" }}
                {...formik.getFieldProps(props.rootLesslistKey)}
                value={currentValue.toString()} // Convert bigint to string
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue(props.rootLesslistKey, value ? BigInt(value) : BigInt(0)); // Convert string back to bigint
                }}
              />
            </span>
          </span>
        );
        break;
      }
      case "string": {
        mainElement = (
          // result = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            {/* {codeEditor} */}
            <span
              style={{
                display: hideSubJzodEditor
                  ? "none" // control visibility
                  : "inline-block",
              }}
            >
              <input
                type="text"
                role="textbox"
                id={props.rootLesslistKey}
                key={props.rootLesslistKey}
                style={{ width: "100%" }}
                {...formik.getFieldProps(props.rootLesslistKey)}
              />
            </span>
          </span>
        );
        break;
      }
      case "uuid": {
        mainElement = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            {/* {codeEditor} */}
            <span
              style={{
                display: hideSubJzodEditor
                  ? "none" // control visibility
                  : "inline-block",
              }}
            >
              {localResolvedElementJzodSchemaBasedOnValue.tag?.value?.targetEntity ? (
                <StyledSelect
                  id={props.rootLesslistKey}
                  key={props.rootLesslistKey}
                  aria-label={props.rootLesslistKey}
                  labelId="demo-simple-select-label"
                  variant="standard"
                  style={{ width: "100%" }}
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
              ) : (
                <input
                  type="text"
                  id={props.rootLesslistKey}
                  key={props.rootLesslistKey}
                  role="textbox"
                  style={{ width: "100%" }}
                  {...formik.getFieldProps(props.rootLesslistKey)}
                />
              )}
            </span>
          </span>
        );
        break;
      }
      // DONE
      case "literal": {
        mainElement = (
          // result = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            {/* {codeEditor} */}
            <span
              style={{
                display: hideSubJzodEditor
                  ? "none" // control visibility
                  : "inline-block",
              }}
            >
              <div style={{ width: "100%" }}>
                <JzodLiteralEditor
                  name={props.name}
                  key={props.rootLesslistKey}
                  label={props.label}
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
                  // setParentResolvedElementJzodSchema={setLocalResolvedElementJzodSchema}
                />
              </div>
            </span>
          </span>
        );
        break;
      }
      // DONE
      case "enum": {
        const enumValues: string[] =
          // (localResolvedElementJzodSchema && localResolvedElementJzodSchema.definition) ||
          (localResolvedElementJzodSchemaBasedOnValue &&
            localResolvedElementJzodSchemaBasedOnValue.definition) ||
          (props.rawJzodSchema && ((props.rawJzodSchema as any).definition ?? [])) ||
          [];
        mainElement = (
          // result = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            {/* {codeEditor} */}
            <span
              style={{
                display: hideSubJzodEditor
                  ? "none" // control visibility
                  : "inline-block",
              }}
            >
              <div style={{ width: "100%" }}>
                <JzodEnumEditor
                  name={props.name}
                  label={props.label}
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
              </div>
            </span>
          </span>
        );
        break;
      }
      case "undefined":
      case "any": {
        mainElement = (
          <span key={props.rootLesslistKey} id={props.rootLesslistKey}>
            <span
              style={{
                display: "inline-block",
                // display: hideSubJzodEditor
                //   ? "none" // control visibility
                //   : "inline-block",
              }}
            >
              <JzodAnyEditor
                name={props.name}
                label={props.label}
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
                // insideAny={props.insideAny}
              />
            </span>
          </span>
        );
        break;
      }
      case "function":
      case "lazy":
      case "intersection":
      case "map":
      case "promise":
      case "record":
      case "schemaReference":
      case "set":
      case "union":
      case "never":
      case "null":
      case "unknown":
      case "void":
      case "date":
      default: {
        mainElement = (
          <span>
            default case: {localResolvedElementJzodSchemaBasedOnValue.type}, for {props.listKey} 
            values 
            <pre>{JSON.stringify(currentValue, null, 2)}</pre>
            <br />
            <pre>
              resolved Jzod schema: {JSON.stringify(props.resolvedElementJzodSchema, null, 2)}
            </pre>
            <pre>raw Jzod schema: {JSON.stringify(props.rawJzodSchema, null, 2)}</pre>
            {/* <div>
              found schema: {JSON.stringify(props.resolvedJzodSchema, null, 2)}
            </div>
            <div>
              for object: {JSON.stringify(props.initialValuesObject, null, 2)}
            </div> */}
          </span>
        );
        break;
      }
    }
  } else {
    mainElement = (
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
  }  // Check if this attribute is optional and can be removed
  // const isOptionalAttribute = props.rootLesslistKey && definedOptionalAttributes?.has(props.name);
  // const isOptionalAttribute = localResolvedElementJzodSchemaBasedOnValue?.optional;
  
  // Create the clear button for optional attributes
  // const clearButton = props.optional ? (
  const clearButton = (
    <SmallIconButton
      onClick={removeOptionalAttribute}
      style={{ padding: 0, visibility: props.optional ? "visible" : "hidden" }}
    >
      <Clear />
    </SmallIconButton>
  );

  const mainElementBlock: JSX.Element = (
    <span
      style={{
        display: hideSubJzodEditor ? "none" : "inline-block",
        margin: "10px 0 10px 0",
      }}
    >
      {mainElement}
    </span>
  );
  return (
    <span>
      {objectOrArrayOrAny ? (
        <Card
          id={props.rootLesslistKey}
          key={props.rootLesslistKey}
          style={{ padding: "1px", margin: "1px 0", position: "relative" }}
        >
          {/* Top-right info icon with tooltip */}
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              zIndex: 2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              // title={JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2)}
              title={JSON.stringify(props.rawJzodSchema, null, 2)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "#888",
                background: "#fff",
                borderRadius: "50%",
                padding: "2px",
                border: "1px solid #ddd",
                fontSize: "18px",
                width: "24px",
                height: "24px",
                justifyContent: "center",
              }}
            >
              {/* Use MUI InfoOutlined icon for info */}
              <span style={{ display: "flex", alignItems: "center" }}>
                <InfoOutlined fontSize="small" sx={{ color: "#888" }} />
              </span>
            </span>
          </span>
          <div>
            {props.submitButton}
            <span
              style={{
                display: !hideSubJzodEditor ? "none" : "inline-block",
              }}
            >
              {objectOrArraySwitches}
            </span>
          </div>
          <span
            style={{
              display:
                !hideSubJzodEditor ||
                (props.rawJzodSchema?.type == "any" &&
                  ["undefined", "any"].includes(localResolvedElementJzodSchemaBasedOnValue.type))
                  ? "none"
                  : "inline-block",
            }}
          >
            {codeEditor}
          </span>
          <span
            style={{
              display: hideSubJzodEditor ? "none" : "inline-block",
              margin: "10px 0 10px 0",
            }}
          >
            {mainElement}
          </span>
        </Card>
      ) : (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          {clearButton}
          <label
            style={{
              minWidth: "120px",
              flexShrink: 0,
              marginRight: "10px",
              textAlign: "left", // Left-align the label
              justifyContent: "flex-start",
              display: "flex",
            }}
          >
            {props.label}:
          </label>
          <span
            style={{
              display: !hideSubJzodEditor ? "none" : "inline-block",
              flexGrow: 1,
            }}
          >
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
    </span>
  );
}

export const JzodObjectEditorWithErrorBoundary = withErrorBoundary(JzodElementEditor, {
  fallback: <div>Something went wrong</div>,
  onError(error, info) {
    log.error("JzodElementEditor error", error);
    // Do something with the error
    // E.g. log to an error logging client here
  },
});
