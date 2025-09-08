import React, { useCallback, useEffect, useMemo, useState } from "react";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import UnfoldLess from "@mui/icons-material/UnfoldLess";
import UnfoldMore from "@mui/icons-material/UnfoldMore";
import KeyboardDoubleArrowUp from "@mui/icons-material/KeyboardDoubleArrowUp";
import KeyboardDoubleArrowDown from "@mui/icons-material/KeyboardDoubleArrowDown";

import {
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  LoggerInterface,
  MiroirLoggerFactory,
  mStringify
} from "miroir-core";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import {
  useMiroirNestingBorderColor,
  useMiroirNestingColor
} from "../../contexts/MiroirThemeContext.js";
import { RenderPerformanceMetrics } from "../../tools/renderPerformanceMeasure.js";
import { ErrorFallbackComponent } from "../ErrorFallbackComponent.js";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedLabeledEditor,
  ThemedLineIconButton,
  ThemedSelect,
  ThemedSwitch,
  ThemedTextEditor,
  ThemedDisplayValue
} from "../Themes/index"
import { JzodAnyEditor } from "./JzodAnyEditor.js";
import { JzodArrayEditor } from "./JzodArrayEditor.js";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks.js";
import { JzodElementEditorProps } from "./JzodElementEditorInterface.js";
import { JzodElementEditorReactCodeMirror } from "./JzodElementEditorReactCodeMirror.js";
import { JzodEnumEditor } from "./JzodEnumEditor.js";
import { JzodLiteralEditor } from "./JzodLiteralEditor.js";
import { JzodObjectEditor } from "./JzodObjectEditor.js";




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
export const FoldUnfoldObjectOrArray = (props: {
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  listKey: string;
  currentValue: EntityInstance | Array<any>;
  unfoldingDepth?: number; // Optional depth limit for unfolding (default: no limit)
}): JSX.Element => {
  /**
   * Handles the click event for folding or unfolding an object attribute or array item in a hierarchical editor.
   *
   * This function manages the folding state of a tree-like structure, allowing users to expand or collapse nodes
   * (object attributes or array items) with support for unfolding to a specific depth. The folding state is tracked
   * in a map where keys represent the hierarchical path (listKey) of each node.
   *
   * Behavior:
   * - If folding (collapsing a node):
   *   - With `unfoldingDepth === Infinity`: Sets the folding state for the current node to `true` and removes the folding state for all descendants.
   *   - With `unfoldingDepth !== Infinity`: Sets the folding state for the current node to `true` and leaves the folding state for all descendants unchanged.
   * - If unfolding (expanding a node):
   *   - With `unfoldingDepth === Infinity`: Removes the folding state for the current node and all its descendants.
   *   - With `unfoldingDepth !== Infinity`: Removes the folding state for the current node. For direct children, if they have no folding state for any of their children, sets their folding state to `true`; otherwise, leaves them unchanged.
   *
   * The function also logs actions for debugging purposes.
   *
   * @param e - The React mouse event triggered by the user interaction.
   */
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const isCurrentlyFolded =
        (props.foldedObjectAttributeOrArrayItems &&
          props.foldedObjectAttributeOrArrayItems[props.listKey]) ||
        false;
      // log.info(
      //   "FoldUnfoldObjectOrArray",
      //   props.listKey,
      //   "isCurrentlyFolded",
      //   isCurrentlyFolded,
      //   "unfoldingDepth",
      //   props.unfoldingDepth,
      //   "foldedObjectAttributeOrArrayItems",
      //   props.foldedObjectAttributeOrArrayItems
      // );
      if (isCurrentlyFolded) {
        // Unfolding
        props.setFoldedObjectAttributeOrArrayItems((prev) => {
          const newState = { ...prev };
          delete newState[props.listKey];

          if (props.unfoldingDepth === Infinity) {
            // Remove folding state for all descendants
            Object.keys(prev).forEach((key) => {
              if (key.startsWith(props.listKey + ".")) {
                delete newState[key];
              }
            });
          } else {
            const prevKeys = Object.keys(prev);
            // For finite depth, only unfold current item (children remain as is)
            // If currentValue is an array, we can fold all items
            if (Array.isArray(props.currentValue)) {
              props.currentValue.forEach((_, index) => {
                const childKey = `${props.listKey}.${index}`;
                if (!prevKeys.some((key) => key.startsWith(childKey))) {
                  // Only fold if it has no children already folded
                  newState[childKey] = true; // unfold this item
                }
              });
            } else {
              // If currentValue is an object, fold all attributes
              Object.keys(props.currentValue).forEach((attributeName) => {
                const childKey = `${props.listKey}.${attributeName}`;
                if (!prevKeys.some((key) => key.startsWith(childKey))) {
                  // Only fold if it has no children already folded
                  newState[childKey] = true; // unfold this attribute
                }
              });
            }
          }

          // For finite depth, only unfold current item (children remain as is)
          return newState;
        });
      } else {
        // Folding
        props.setFoldedObjectAttributeOrArrayItems((prev) => {
          const newState = { ...prev };
          newState[props.listKey] = true;
          if (props.unfoldingDepth === Infinity) {
            // Remove folding state for all descendants
            Object.keys(prev).forEach((key) => {
              if (key.startsWith(props.listKey + ".")) {
                delete newState[key];
              }
            });
          }
          return newState;
        });
      }
    },
    [
      props.listKey,
      props.foldedObjectAttributeOrArrayItems,
      props.setFoldedObjectAttributeOrArrayItems,
      props.unfoldingDepth,
    ]
  );

  const isFolded = props.foldedObjectAttributeOrArrayItems && props.foldedObjectAttributeOrArrayItems[props.listKey];
  const isInfiniteDepth = props.unfoldingDepth === Infinity;

  return (
    <ThemedLineIconButton
      onClick={handleClick}
    >
      {isFolded ? (
        isInfiniteDepth ? (
          <KeyboardDoubleArrowDown sx={{ color: "darkgreen" }} />
        ) : (
          <ExpandMore sx={{ color: "darkgreen" }} />
        )
      ) : (
        isInfiniteDepth ? (
          <KeyboardDoubleArrowUp />
        ) : (
          <ExpandLess />
        )
      )}
    </ThemedLineIconButton>
  );
};
FoldUnfoldObjectOrArray.displayName = "FoldUnfoldObjectOrArray";

// ################################################################################################
export const FoldUnfoldAllObjectAttributesOrArrayItems = (props: {
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  listKey: string;
  itemsOrder: Array<string>;
  maxDepth?: number; // Optional: how many levels deep to unfold (default: 1)
}): JSX.Element => {
  const maxDepthToUnfold = props.maxDepth ?? 1;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // Generate list keys for all child attributes at the first level
      const childKeys = props.itemsOrder.map(
        (attributeName) => `${props.listKey}.${attributeName}`
      );

      // Check if any child is currently unfolded (visible)
      const hasUnfoldedChildren = childKeys.some(
        (key) =>
          !props.foldedObjectAttributeOrArrayItems || !props.foldedObjectAttributeOrArrayItems[key]
      );

      // If any child is unfolded, fold all; otherwise unfold to the specified depth
      const shouldFoldAll = hasUnfoldedChildren;

      props.setFoldedObjectAttributeOrArrayItems((prev) => {
        const newState = { ...prev };
        
        if (shouldFoldAll) {
          // Fold all children
          childKeys.forEach((key) => {
            newState[key] = true;
          });
        } else {
          // Unfold to the specified depth (only first level for now)
          // TODO: Implement proper recursive unfolding by inspecting actual data structure
          childKeys.forEach((key) => {
            newState[key] = false; // Unfold this level
          });
        }
        
        return newState;
      });
    },
    [
      props.listKey,
      props.itemsOrder,
      props.foldedObjectAttributeOrArrayItems,
      props.setFoldedObjectAttributeOrArrayItems,
      maxDepthToUnfold,
    ]
  );

  // Check if all children are folded
  const childKeys = props.itemsOrder.map(attributeName => `${props.listKey}.${attributeName}`);
  const allChildrenFolded =
    childKeys.length > 0 &&
    childKeys.every(
      (key) =>
        props.foldedObjectAttributeOrArrayItems && props.foldedObjectAttributeOrArrayItems[key]
    );

  const title = allChildrenFolded 
    ? `Unfold all attributes (${maxDepthToUnfold} level${maxDepthToUnfold !== 1 ? 's' : ''})` 
    : "Fold all attributes";

  return (
    <ThemedLineIconButton
      onClick={handleClick}
      title={title}
    >
      {allChildrenFolded ? (
        <UnfoldMore sx={{ color: "darkblue" }} />
      ) : (
        <UnfoldLess sx={{ color: "darkorange" }} />
      )}
    </ThemedLineIconButton>
  );
};
FoldUnfoldAllObjectAttributesOrArrayItems.displayName = "FoldUnfoldAllObjectAttributesOrArrayItems";

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
    foreignKeyObjects,
    itemsOrder,
    stringSelectList,
  } = useJzodElementEditorHooks(props, count, "JzodElementEditor");
  
  // Extract hiddenFormItems and setHiddenFormItems from props
  const { foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems } = props;
  
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
        // setCodeMirrorValue(safeStringify(currentValue));
        setCodeMirrorValue(JSON.stringify(currentValue, null, 2));
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
        {!props.readOnly && objectOrArrayOrAny ? (
          <ThemedSwitch
            checked={displayAsStructuredElement}
            id={`displayAsStructuredElementSwitch-${props.rootLessListKey}`}
            name={`displayAsStructuredElementSwitch-${props.rootLessListKey}`}
            onChange={handleDisplayAsStructuredElementSwitchChange}
            disabled={!codeMirrorIsValidJson}
          />
        ) : (
          <></>
        )}
      </>
    ),
    [
      props.readOnly,
      objectOrArrayOrAny,
      displayAsStructuredElement,
      handleDisplayAsStructuredElementSwitchChange,
      codeMirrorIsValidJson,
    ]
  );
  // const displayCodeEditor = true;
  const displayCodeEditor =
    !props.typeCheckKeyMap ||
    !currentKeyMap ||
    !localResolvedElementJzodSchemaBasedOnValue || // same as props.hasTypeError?
    !displayAsStructuredElement ||
    currentKeyMap?.rawSchema?.type == "any" ||
    ["undefined", "any"].includes(localResolvedElementJzodSchemaBasedOnValue.type);

  // const hideSubJzodEditor = false; 
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
  //   "props.typeCheckKeyMap",
  //   props.typeCheckKeyMap, 
  //   "localResolvedElementJzodSchemaBasedOnValue",
  //   localResolvedElementJzodSchemaBasedOnValue,
  // )

  // Check if we should show code editor
  const shouldShowCodeEditor = useMemo(() => 
    !isUnderTest &&
    displayCodeEditor
    // (
    //   currentKeyMap?.resolvedSchema?.type == "object" ||
    //   currentKeyMap?.resolvedSchema?.type == "record" ||
    //   currentKeyMap?.resolvedSchema?.type == "array" ||
    //   currentKeyMap?.resolvedSchema?.type == "tuple" ||
    //   currentKeyMap?.resolvedSchema?.type == "any"
    // )
    ,
    [
      isUnderTest,
      displayCodeEditor,
      currentKeyMap?.resolvedSchema?.type,
      // props.resolvedElementJzodSchema?.type
    ]
  );

  // Check if this element type supports nesting (should have alternating background)
  // These are the container types that can hold other JzodElements
  const isNestableType = useMemo(() => {
    const elementType = localResolvedElementJzodSchemaBasedOnValue?.type;
    return elementType === "object" || 
           elementType === "record" || 
           elementType === "array" || 
           elementType === "tuple";
  }, [localResolvedElementJzodSchemaBasedOnValue?.type]);

  // Check if this element should be highlighted due to an error
  const hasPathError = useMemo(() => {
    if (!props.displayError || props.displayError.errorPath.length === 0) {
      return false;
    }
    // Check if current path matches the error path
    const currentPath = props.rootLessListKeyArray || [];
    if (currentPath.length !== props.displayError.errorPath.length) {
      return false;
    }
    return currentPath.every((segment, index) => 
      String(segment) === String(props.displayError!.errorPath[index])
    );
  }, [props.displayError, props.rootLessListKeyArray]);

  // Enhanced label element with error tooltip for simple types
  const enhancedLabelElement = useMemo(() => {
    if (!props.labelElement || !hasPathError || !props.displayError) {
      return props.labelElement ?? <></>;
    }
    
    // For simple types, wrap the label with a span that has a title attribute
    return (
      <span title={props.displayError.errorMessage}>
        {props.labelElement}
      </span>
    );
  }, [props.labelElement, hasPathError, props.displayError]);

  // Get appropriate background and border colors for nested containers
  // This creates a Prettier-like visual effect where nested structures have alternating shades
  // The colors cycle through 3 levels: A -> B -> C -> A -> B -> C...
  // Override with error colors if this element has a path error
  const backgroundColor = useMiroirNestingColor(isNestableType ? props.indentLevel || 0 : 0);
  const normalBorderColor = useMiroirNestingBorderColor(props.indentLevel || 0);
  const normalLeftBorderColor = useMiroirNestingBorderColor((props.indentLevel || 0) + 1);
  
  // Use error colors if this element has a path error
  const errorBorderColor = "#f44336"; // Red color from theme for errors
  const borderColor = hasPathError ? errorBorderColor : normalBorderColor;
  const leftBorderColor = hasPathError ? errorBorderColor : normalLeftBorderColor;

    log.info(
    "JzodElementEditor",
    count,
    "Rendering JzodElementEditor for rootLessListKeyArray",
    JSON.stringify(props.rootLessListKeyArray),
    "displayError",
    JSON.stringify(props.displayError),
    "hasPathError",
    hasPathError,
    "borderColor", borderColor,
    "leftBorderColor",
    leftBorderColor,
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

      // DEBUG: Log for boolean fields specifically
      // if (
      //     props.rootLessListKey.includes("foldSubLevels") &&
      //     (currentValue === true || currentValue === false ||
      //     localResolvedElementJzodSchemaBasedOnValue?.type === "boolean")) {
      //   console.log("=== BOOLEAN DEBUG ===");
      //   console.log("rootLessListKey:", props.rootLessListKey);
      //   console.log("currentValue:", currentValue, "type:", typeof currentValue);
      //   console.log("localResolvedElementJzodSchemaBasedOnValue:", localResolvedElementJzodSchemaBasedOnValue);
      //   console.log("currentKeyMap:", currentKeyMap);
      //   // console.log("isSimpleType:", isSimpleType);
      //   // console.log("shouldShowCodeEditorForThisElement:", shouldShowCodeEditorForThisElement);
      //   console.log("hideSubJzodEditor:", hideSubJzodEditor);
      //   console.log("===================");
      // }

      // if (!localResolvedElementJzodSchemaBasedOnValue || !props.rawJzodSchema) {
      if (!localResolvedElementJzodSchemaBasedOnValue) {
        return (
          <div>
            Could not find schema for element: {props.rootLessListKey}
            <br />
            {/* value {formik.values[props.rootLessListKey]} */}
            {/* value <pre>{safeStringify(currentValue, 500)}</pre> */}
            {/* value <pre>{JSON.stringify(currentValue)}</pre> */}
            <br />
            {/* raw Jzod schema: {safeStringify(currentKeyMap?.rawSchema, 500)} */}
            raw Jzod schema: {JSON.stringify(currentKeyMap?.rawSchema, undefined, 2)}
            <br />
            {/* resolved schema: {safeStringify(localResolvedElementJzodSchemaBasedOnValue, 500)} */}
            resolved schema: {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, undefined, 2)}
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
              foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
              setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
              currentDeploymentUuid={props.currentDeploymentUuid}
              currentApplicationSection={props.currentApplicationSection}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              foreignKeyObjects={props.foreignKeyObjects}
              readOnly={props.readOnly}
              displayError={props.displayError}
            />
        );
      }
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
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              currentDeploymentUuid={props.currentDeploymentUuid}
              currentApplicationSection={props.currentApplicationSection}
              foreignKeyObjects={foreignKeyObjects}
              hidden={hideSubJzodEditor}
              displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
              foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
              setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
              deleteButtonElement={props.deleteButtonElement}
              maxRenderDepth={props.maxRenderDepth}
              readOnly={props.readOnly}
              displayError={props.displayError}
            />
          );
        }
        case "tuple":
        case "array": {
          return (
            <JzodArrayEditor
              listKey={props.listKey}
              name={props.name}
              labelElement={props.labelElement}
              key={props.rootLessListKey}
              rootLessListKeyArray={props.rootLessListKeyArray}
              rootLessListKey={props.rootLessListKey}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              indentLevel={props.indentLevel + 1}
              itemsOrder={itemsOrder}
              foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
              setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
              currentApplicationSection={props.currentApplicationSection}
              currentDeploymentUuid={props.currentDeploymentUuid}
              foreignKeyObjects={props.foreignKeyObjects}
              insideAny={props.insideAny}
              hidden={hideSubJzodEditor}
              displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
              deleteButtonElement={props.deleteButtonElement}
              maxRenderDepth={props.maxRenderDepth}
              readOnly={props.readOnly}
              displayError={props.displayError}
            />
          );
          break;
        }
        case "boolean": {
          const fieldProps = formik.getFieldProps(props.rootLessListKey);
          return (
            <ThemedLabeledEditor
              labelElement={enhancedLabelElement}
              editor={
                props.readOnly ? (
                  <ThemedDisplayValue value={currentValue} type="boolean" />
                ) : (
                  <ThemedSwitch
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    aria-label={props.rootLessListKey}
                    {...fieldProps}
                    name={props.rootLessListKey}
                    checked={currentValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      formik.setFieldValue(props.rootLessListKey, e.target.checked);
                    }}
                    // error={hasPathError}
                  />
                )
              }
            />
          );
        }
        case "number": {
          return (
            <ThemedLabeledEditor
              labelElement={enhancedLabelElement}
              editor={
                props.readOnly ? (
                  <ThemedDisplayValue value={currentValue} type="number" />
                ) : (
                  <ThemedTextEditor
                    variant="standard"
                    data-testid="miroirInput"
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    type="number"
                    role="textbox"
                    fullWidth={true}
                    {...formik.getFieldProps(props.rootLessListKey)}
                    name={props.rootLessListKey}
                    error={hasPathError}
                  />
                )
              }
            />
          );
        }
        case "bigint": {
          return (
            <ThemedLabeledEditor
              labelElement={enhancedLabelElement}
              editor={
                props.readOnly ? (
                  <ThemedDisplayValue value={currentValue} type="bigint" />
                ) : (
                  <ThemedTextEditor
                    variant="standard"
                    data-testid="miroirInput"
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    type="text"
                    role="textbox"
                    fullWidth={true}
                    {...formik.getFieldProps(props.rootLessListKey)}
                    value={currentValue.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      formik.setFieldValue(props.rootLessListKey, value ? BigInt(value) : BigInt(0));
                    }}
                    name={props.rootLessListKey}
                    error={hasPathError}
                  />
                )
              }
            />
          );
        }
        case "string": {
          return (
            <ThemedLabeledEditor
              labelElement={enhancedLabelElement}
              editor={
                props.readOnly ? (
                  <ThemedDisplayValue value={currentValue} type="string" />
                ) : (
                  <ThemedTextEditor
                    variant="standard"
                    data-testid="miroirInput"
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    {...formik.getFieldProps(props.rootLessListKey)}
                    name={props.rootLessListKey}
                    error={hasPathError}
                  />
                )
              }
            />
          );
        }
        case "uuid": {
          // log.info(
          //   "JzodElementEditor: Rendering UUID input for listKey",
          //   props.listKey,
          //   "with value",
          //   currentValue,
          //   "MLS tag",
          //   localResolvedElementJzodSchemaBasedOnValue.tag,
          //   "foreignKeyObjects",
          //   foreignKeyObjects
          // );
          if (localResolvedElementJzodSchemaBasedOnValue.tag?.value?.selectorParams?.targetEntity) {
            // Convert stringSelectList to options format for ThemedSelect
            const selectOptions = stringSelectList.map((e: [string, EntityInstance]) => ({
              value: e[1].uuid,
              label: (e[1] as any).description || (e[1] as any).defaultLabel || (e[1] as EntityInstanceWithName).name || e[1].uuid
            }));

            return (
              <ThemedLabeledEditor
                labelElement={enhancedLabelElement}
                editor={
                  props.readOnly ? (
                    <ThemedDisplayValue value={currentValue} type="uuid" />
                  ) : (
                    <ThemedSelect
                      id={props.rootLessListKey}
                      key={props.rootLessListKey}
                      data-testid="miroirInput"
                      aria-label={props.rootLessListKey}
                      variant="standard"
                      minWidth="200px"
                      maxWidth="400px"
                      filterable={true}
                      options={selectOptions}
                      placeholder="Select an option..."
                      filterPlaceholder="Type to filter..."
                      value={currentValue || ""}
                      onChange={(e) => {
                        formik.setFieldValue(props.rootLessListKey, e.target.value);
                      }}
                      name={props.rootLessListKey}
                      // error={hasPathError}
                    />
                  )
                }
              />
            );
          } else {
              const currentUuidValue = formik.values[props.rootLessListKey] || "";
              const estimatedWidth = Math.max(200, Math.min(400, currentUuidValue.length * 8 + 40));
              
              return (
                <ThemedLabeledEditor
                  labelElement={enhancedLabelElement}
                  editor={
                    props.readOnly ? (
                      <ThemedDisplayValue value={currentValue} type="uuid" />
                    ) : (
                      <ThemedTextEditor
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
                        error={hasPathError}
                      />
                    )
                  }
                />
              );
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
                readOnly={props.readOnly}
                displayError={props.displayError}
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
                readOnly={props.readOnly}
                displayError={props.displayError}
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
              foldedObjectAttributeOrArrayItems={props.foldedObjectAttributeOrArrayItems}
              setFoldedObjectAttributeOrArrayItems={props.setFoldedObjectAttributeOrArrayItems}
              resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              readOnly={props.readOnly}
              displayError={props.displayError}
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
          return (
            <ThemedLabeledEditor
              labelElement={enhancedLabelElement}
              editor={
                props.readOnly ? (
                  <ThemedDisplayValue value={currentValue} type="date" />
                ) : (
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
                )
              }
            />
          );
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
    foldedObjectAttributeOrArrayItems,
    setFoldedObjectAttributeOrArrayItems,
    itemsOrder,
    stringSelectList,
    enhancedLabelElement
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
    <div>
      <span>
        {props.rootLessListKey === "" && (
          <RenderPerformanceMetrics.RenderPerformanceDisplay
            componentKey={componentKey}
            indentLevel={props.indentLevel}
          />
        )}
        {objectOrArrayOrAny ? (
          <ThemedCard
            id={props.rootLessListKey}
            key={props.rootLessListKey}
            title={hasPathError && props.displayError ? props.displayError.errorMessage : undefined}
            style={{
              padding: "1px",
              width: "calc(100% - 10px)",
              // margin: !props.isTopLevel?"5px 10px 5px 0": undefined,
              margin: "5px 10px 5px 0",
              position: "relative",
              // Apply nesting background colors for visual hierarchy (Prettier-like effect)
              backgroundColor: backgroundColor,
              border: `1px solid ${borderColor}`,
              // Enhanced left border for nested containers to show depth
              borderLeft: isNestableType
                ? `3px solid ${leftBorderColor}`
                : `1px solid ${borderColor}`,
              justifyContent: "space-between",
              boxShadow: "none",
            }}
          >
            <ThemedCardContent
              style={{
                // Pass the background color to the content component to ensure it's visible
                backgroundColor: backgroundColor,
              }}
            >
              {/* <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span> */}
                  {props.submitButton}
                  {/* </span>
              </span> */}
              {/* <span style={{ display: "flex" }}> */}
                <span
                  style={{
                    display: !displayCodeEditor ? "none" : "inline-block",
                  }}
                >
                  {shouldShowCodeEditor && (
                    <JzodElementEditorReactCodeMirror
                      initialValue={JSON.stringify(currentValue, null, 2)}
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
                  display: hideSubJzodEditor ? "none" : "block",
                  margin: "2px 5px 5px 5px",
                  width: "calc(100% - 15px)",
                  flexGrow: 1,
                }}
              >
                {mainElement}
              </span>
            </ThemedCardContent>
          </ThemedCard>
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
            <span
              style={{
                // display: !hideSubJzodEditor ? "none" : "inline-block",
                display: !displayCodeEditor ? "none" : "inline-block",
                flexGrow: 1,
              }}
            >
              {/* code editor */}
              {props.labelElement}
              {shouldShowCodeEditor && (
                <JzodElementEditorReactCodeMirror
                  initialValue={JSON.stringify(currentValue, null, 2)}
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
    </div>
  );
}
