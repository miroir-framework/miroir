import React, { useCallback, useMemo } from "react";

import {
  ExpandLess,
  ExpandMore,
  KeyboardDoubleArrowDown,
  KeyboardDoubleArrowUp,
  UnfoldLess,
  UnfoldMore
} from "../Themes/MaterialSymbolWrappers";

import { MenuItem } from "@mui/material";

import {
  defaultMiroirModelEnvironment,
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  LoggerInterface,
  MiroirLoggerFactory,
  mStringify,
  transformer_extended_apply_wrapper,
  type TransformerForBuildPlusRuntime,
  type TransformerReturnType
} from "miroir-core";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import {
  useMiroirNestingBorderColor,
  useMiroirNestingColor
} from "../../contexts/MiroirThemeContext.js";
import { useMiroirContextService } from "../../MiroirContextReactProvider.js";
import { RenderPerformanceMetrics } from "../../tools/renderPerformanceMeasure.js";
import { ErrorFallbackComponent } from "../ErrorFallbackComponent.js";
import { DebugHelper } from "../Page/DebugHelper.js";
import { useReportPageContext } from "../Reports/ReportPageContext.js";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedDisplayValue,
  ThemedLabeledEditor,
  ThemedLineIconButton,
  ThemedMUISelect,
  ThemedSelectWithPortal,
  ThemedStackedLabeledEditor,
  ThemedSwitch,
  ThemedTextEditor
} from "../Themes/index";
import { JzodAnyEditor } from "./JzodAnyEditor.js";
import { JzodArrayEditor } from "./JzodArrayEditor.js";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks.js";
import { JzodElementEditorProps } from "./JzodElementEditorInterface.js";
import { JzodElementEditorReactCodeMirror } from "./JzodElementEditorReactCodeMirror.js";
import { JzodElementStringEditor } from "./JzodElementStringEditor.js";
import { JzodEnumEditor } from "./JzodEnumEditor.js";
import { JzodLiteralEditor } from "./JzodLiteralEditor.js";
import { JzodObjectEditor } from "./JzodObjectEditor.js";




let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor"), "UI",
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
  listKey: string;
  rootLessListKeyArray: (string | number)[];
  currentValue: EntityInstance | Array<any>;
  unfoldingDepth?: number; // Optional depth limit for unfolding (default: no limit)
}): JSX.Element => {
  const context = useMiroirContextService();
  const reportContext = useReportPageContext();
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

      // log.info("FoldUnfoldObjectOrArray handleClick", props.listKey, "unfoldingDepth", props.unfoldingDepth);
      // Use the provided rootLessListKeyArray
      const pathArray = props.rootLessListKeyArray;
      const isCurrentlyFolded = reportContext.isNodeFolded(pathArray);
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
      // Convert the string key to a path array
      // const pathArray = props.listKey.split('.').filter(Boolean);
      
      if (isCurrentlyFolded) {
        // Unfolding
        reportContext.setNodeFolded(pathArray, "unfold");
        
        // Handle infinite depth unfolding
        if (props.unfoldingDepth === Infinity) {
          // Nothing else needed - setNodeFolded will remove the node and children
        } else {
          // For finite depth unfolding - fold the immediate children
          // If currentValue is an array, fold all items
          if (Array.isArray(props.currentValue)) {
            const childIndices = props.currentValue.map((_, index) => index);
            reportContext.foldAllChildren(pathArray, childIndices);
          } else if (typeof props.currentValue === 'object' && props.currentValue !== null) {
            // If currentValue is an object, fold all attributes
            const childKeys = Object.keys(props.currentValue);
            reportContext.foldAllChildren(pathArray, childKeys);
          }
        }
      } else {
        // Folding
        reportContext.setNodeFolded(pathArray, "fold");
      }
    },
    [
      props.listKey,
      props.unfoldingDepth,
      props.currentValue,
      reportContext.isNodeFolded,
      reportContext.setNodeFolded,
      reportContext.foldAllChildren
    ]
  );

  const isFolded = reportContext.isNodeFolded(props.rootLessListKeyArray);
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
  listKey: string;
  rootLessListKeyArray?: (string | number)[]; // Added root-less list key array
  itemsOrder: Array<string>;
  maxDepth?: number; // Optional: how many levels deep to unfold (default: 1)
}): JSX.Element => {
  const maxDepthToUnfold = props.maxDepth ?? 1;
  const context = useMiroirContextService();
  const reportContext = useReportPageContext();
  // log.info("FoldUnfoldAllObjectAttributesOrArrayItems listKey", props.listKey, "maxDepthToUnfold", maxDepthToUnfold);
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // // Generate list keys for all child attributes at the first level
      // const childKeys = props.itemsOrder.map(
      //   (attributeName) => `${props.listKey}.${attributeName}`
      // );

      // Use rootLessListKeyArray if available, otherwise fall back to split path
      const pathArray = props.rootLessListKeyArray || props.listKey.split('.').filter(Boolean);
      const childKeysAsArrays = props.itemsOrder.map(attributeName => attributeName);
      
      // Check if any child is currently unfolded (visible)
      const hasUnfoldedChildren = childKeysAsArrays.some(
        (attributeName) => !reportContext.isNodeFolded([...pathArray, attributeName])
      );

      // If any child is unfolded, fold all; otherwise unfold to the specified depth
      if (hasUnfoldedChildren) {
        // Fold all children
        reportContext.foldAllChildren(pathArray, childKeysAsArrays);
      } else {
        // Unfold all children
        reportContext.unfoldAllChildren(pathArray, childKeysAsArrays);
      }
    },
    [
      props.listKey,
      props.rootLessListKeyArray,
      props.itemsOrder,
      reportContext.isNodeFolded,
      reportContext.foldAllChildren,
      reportContext.unfoldAllChildren,
      maxDepthToUnfold,
    ]
  );

  // Check if all children are folded
  const pathArray = props.rootLessListKeyArray || props.listKey.split('.').filter(Boolean);
  const allChildrenFolded =
    props.itemsOrder.length > 0 &&
    props.itemsOrder.every(
      (attributeName) => reportContext.isNodeFolded([...pathArray, attributeName])
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
let count = 0;


export function JzodElementEditor(props: JzodElementEditorProps): JSX.Element {
  const renderStartTime = performance.now();
  // const context = useMiroirContextService();
  count++;

  const existingObject = props.existingObject ?? true;
  // Create a getUniqueValues key for this component instance
  const componentKey = `JzodElementEditor-${props.rootLessListKey || 'ROOT'}`;

  const currentKeyMap = props.typeCheckKeyMap?.[props.rootLessListKey];
  const {
    // general use
    context,
    // editor state
    formik,
    formikRootLessListKey,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    displayAsStructuredElement,
    setDisplayAsStructuredElement,
    currentValueObjectAtKey,
    localResolvedElementJzodSchemaBasedOnValue,
    foreignKeyObjects,
    itemsOrder,
    stringSelectList,
    // } = useJzodElementEditorHooks(props, count, "JzodElementEditor");
  } = useJzodElementEditorHooks(
    props.rootLessListKey,
    props.rootLessListKeyArray,
    props.reportSectionPathAsString,
    props.typeCheckKeyMap,
    props.currentApplication,
    props.applicationDeploymentMap,
    props.currentDeploymentUuid,
    count,
    "JzodElementEditor"
  );


  // Extract hiddenFormItems and setHiddenFormItems from props
  // const reportContext = useReportPageContext();

  // ##############################################################################################
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
          // if (props.rootLessListKey && props.rootLessListKey.length > 0) {
            // Invoke onChangeVector callback if registered for this field
            const onChangeCallback = props.onChangeVector?.[props.rootLessListKey];
            if (onChangeCallback) {
              onChangeCallback(parsedCodeMirrorValue, props.rootLessListKey);
            }
            formik.setFieldValue(formikRootLessListKey, parsedCodeMirrorValue);
          // } else {
          //   formik.setValues(parsedCodeMirrorValue);
          // }
        } catch (e) {
          log.error("Failed to parse JSON in switch handler:", e);
          // Keep display mode as is in case of error
          return;
        }
      } else {
        // if switching to code editor, reset the codeMirrorValue to the current value
        // setCodeMirrorValue(safeStringify(currentValue));
        setCodeMirrorValue(JSON.stringify(currentValueObjectAtKey, null, 2));
      }
      setDisplayAsStructuredElement(event.target.checked);
    },
    [
      currentValueObjectAtKey,
      codeMirrorValue,
      formik,
      props.rootLessListKey,
      setCodeMirrorValue,
      setDisplayAsStructuredElement,
    ]
  );
  
  // ##############################################################################################
  // Determine if the element is an object, array or any type
  const resolvedTypeIsObjectOrArrayOrAny = useMemo(() => 
    !localResolvedElementJzodSchemaBasedOnValue || ["any", "object", "record", "array", "tuple"].includes(
      localResolvedElementJzodSchemaBasedOnValue.type
    ), [localResolvedElementJzodSchemaBasedOnValue]
  );
  
  // Switches for display mode
  const displayAsStructuredElementSwitch: JSX.Element = useMemo(
    () => (
      <>
        {!props.readOnly && resolvedTypeIsObjectOrArrayOrAny ? (
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
      resolvedTypeIsObjectOrArrayOrAny,
      displayAsStructuredElement,
      handleDisplayAsStructuredElementSwitchChange,
      codeMirrorIsValidJson,
    ]
  );
  // const displayCodeEditor = true;
  const displayAsCodeEditor =
    !displayAsStructuredElement ||
    !props.typeCheckKeyMap ||
    !currentKeyMap ||
    !localResolvedElementJzodSchemaBasedOnValue || // same as props.hasTypeError?
    !displayAsStructuredElement
    // ||
    // localResolvedElementJzodSchemaBasedOnValue?.type == "any"
  ;

  // const hideSubJzodEditor = false; 
  const hideSubJzodEditor = useMemo(
    () => props.hidden || props.insideAny || displayAsCodeEditor,
    [props.hidden, props.insideAny, displayAsCodeEditor]
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

  // Check if we should display without frame (ThemedCard)
  const displayWithoutFrame = useMemo(
    () => currentKeyMap?.resolvedSchema?.tag?.value?.display?.objectOrArrayWithoutFrame === true,
    [currentKeyMap?.resolvedSchema?.tag?.value?.display?.objectOrArrayWithoutFrame]
  );


  // Create the main element based on the schema type
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const mainElement: JSX.Element = useMemo(() => {
    try {
      if (props.returnsEmptyElement || props.hidden) {
        return <></>;
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

      // HANDLE MISSING SCHEMA
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

      // HIDDEN ELEMENT
      if (localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.hidden) {
        const hidden: TransformerForBuildPlusRuntime = localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.hidden;
        if (typeof hidden === "boolean" && hidden === true) {
          return <></>;
        }
        const newContext = {
          valueObject: currentValueObjectAtKey,
          rootValueObject: formik.values[props.reportSectionPathAsString],
        }; // contextResults - pass the instance to transform

        const hiddenTransformerResult: TransformerReturnType<any> =
          transformer_extended_apply_wrapper(
            context.miroirContext.miroirActivityTracker, // activityTracker
            "runtime", // step
            [], // transformerPath
            (hidden as any)?.label ?? "evaluation of hidden property", // label
            hidden, // transformer
            defaultMiroirModelEnvironment, // TODO: use the real environment
            {}, // queryParams
            newContext, // contextResults - pass the instance to transform
            "value" // resolveBuildTransformersTo
          );
        if (hiddenTransformerResult === true) {
          log.info("JzodElementEditor Hiding element due to hidden transformer result:", props.rootLessListKey, hidden, newContext);
          return <></>;
        }
      }
      // Handle RAW "any" type
      if (
        (
          currentKeyMap?.rawSchema?.type === "any" ||
          localResolvedElementJzodSchemaBasedOnValue.type === "any"
        ) &&
        !props.insideAny
      ) {
        return (
          <>
            <DebugHelper
              componentName="JzodElementEditor"
              elements={[
                {
                  label: `rendering JzodAnyEditor for 'any' type at ${props.rootLessListKey || "ROOT"}`,
                  data: props.rootLessListKey,
                },
              ]}
            />
            <JzodAnyEditor
              valueObjectEditMode={props.valueObjectEditMode}
              name={props.name}
              labelElement={props.labelElement}
              listKey={props.listKey}
              rootLessListKey={props.rootLessListKey}
              rootLessListKeyArray={props.rootLessListKeyArray}
              reportSectionPathAsString={props.reportSectionPathAsString}
              currentApplication={props.currentApplication}
              applicationDeploymentMap={props.applicationDeploymentMap}
              currentDeploymentUuid={props.currentDeploymentUuid}
              currentApplicationSection={props.currentApplicationSection}
              resolvedElementJzodSchemaDEFUNCT={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={props.typeCheckKeyMap}
              foreignKeyObjects={props.foreignKeyObjects}
              submitButton={props.submitButton}
              readOnly={props.readOnly}
              insideAny={props.insideAny}
              displayError={props.displayError}
              onChangeVector={props.onChangeVector}
            />
          </>
        );
      }
      if (displayAsCodeEditor) {
        return <div>displaying code editor for {props.rootLessListKey || "ROOT"}</div>;
      }

      const localReadOnly =
        props.readOnly ||
        localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.editable === false ||
        (props.valueObjectEditMode == "update" &&
          localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.modifiable === false);
        // (existingObject === true &&
        //   localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.modifiable === false);
      // Generate element based on schema type 
      // log.info(
      //   "JzodElementEditor",
      //   count,
      //   "rootLessListKey:", props.rootLessListKey,
      //   "Rendering element of type:",
      //   localResolvedElementJzodSchemaBasedOnValue.type,
      //   "props.valueObjectEditMode",
      //   props.valueObjectEditMode,
      //   "localReadOnly:", localReadOnly,
      //   "existingObject:", existingObject,
      //   "localResolvedElementJzodSchemaBasedOnValue.tag?.value",
      //   localResolvedElementJzodSchemaBasedOnValue.tag?.value
      // );
      switch (localResolvedElementJzodSchemaBasedOnValue.type) {
        case "object": {
          return (
            <JzodObjectEditor
              valueObjectEditMode={props.valueObjectEditMode}
              name={props.name}
              isTopLevel={props.isTopLevel}
              labelElement={props.labelElement}
              listKey={props.listKey}
              indentLevel={props.indentLevel + 1}
              rootLessListKey={props.rootLessListKey}
              rootLessListKeyArray={props.rootLessListKeyArray}
              reportSectionPathAsString={props.reportSectionPathAsString}
              resolvedElementJzodSchemaDEFUNCT={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              currentApplication={props.currentApplication}
              applicationDeploymentMap={props.applicationDeploymentMap}
              currentDeploymentUuid={props.currentDeploymentUuid}
              currentApplicationSection={props.currentApplicationSection}
              foreignKeyObjects={foreignKeyObjects}
              hidden={hideSubJzodEditor}
              displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
              deleteButtonElement={props.deleteButtonElement}
              maxRenderDepth={props.maxRenderDepth}
              readOnly={props.readOnly}
              insideAny={props.insideAny}
              extraToolsButtons={props.extraToolsButtons}
              displayError={props.displayError}
              onChangeVector={props.onChangeVector}
            />
          );
        }
        case "tuple":
        case "array": {
          return (
            <JzodArrayEditor
              valueObjectEditMode={props.valueObjectEditMode}
              listKey={props.listKey}
              name={props.name}
              labelElement={props.labelElement}
              key={props.rootLessListKey}
              rootLessListKeyArray={props.rootLessListKeyArray}
              rootLessListKey={props.rootLessListKey}
              reportSectionPathAsString={props.reportSectionPathAsString}
              resolvedElementJzodSchemaDEFUNCT={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              indentLevel={props.indentLevel + 1}
              itemsOrder={itemsOrder}
              currentApplication={props.currentApplication}
              applicationDeploymentMap={props.applicationDeploymentMap}
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
              onChangeVector={props.onChangeVector}
            />
          );
          break;
        }
        case "boolean": {
          const fieldProps = formik.getFieldProps(formikRootLessListKey);
          return (
            <ThemedLabeledEditor
              labelElement={enhancedLabelElement}
              editor={
                localReadOnly ? (
                  <ThemedDisplayValue value={currentValueObjectAtKey} type="boolean" />
                ) : (
                  <ThemedSwitch
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    aria-label={props.rootLessListKey}
                    {...fieldProps}
                    // name={props.rootLessListKey}
                    checked={currentValueObjectAtKey} // TODO: get other fieldProps: name, checked, onChange, onBlur
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      // Invoke onChangeVector callback if registered for this field
                      const callback = props.onChangeVector?.[props.rootLessListKey];
                      if (callback) {
                        callback(e.target.checked, props.rootLessListKey);
                      }
                      formik.setFieldValue(formikRootLessListKey, e.target.checked);
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
                  <ThemedDisplayValue value={currentValueObjectAtKey} type="number" />
                ) : (
                  <ThemedTextEditor
                    variant="standard"
                    data-testid="miroirInput"
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    type="number"
                    role="textbox"
                    fullWidth={true}
                    {...formik.getFieldProps(formikRootLessListKey)}
                    // value={currentValue} // TODO: get other formik.getFieldProps: name, value, onChange, onBlur
                    // name={props.rootLessListKey}
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
                  <ThemedDisplayValue value={currentValueObjectAtKey} type="bigint" />
                ) : (
                  <ThemedTextEditor
                    variant="standard"
                    data-testid="miroirInput"
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    type="text"
                    role="textbox"
                    fullWidth={true}
                    // {...formik.getFieldProps(formikRootLessListKey)}
                    value={currentValueObjectAtKey.toString()}
                    name={formikRootLessListKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      const newValue = value ? BigInt(value) : BigInt(0);
                      // Invoke onChangeVector callback if registered for this field
                      const callback = props.onChangeVector?.[props.rootLessListKey];
                      if (callback) {
                        callback(newValue, props.rootLessListKey);
                      }
                      formik.setFieldValue(formikRootLessListKey, newValue);
                    }}
                    // name={props.rootLessListKey}
                    error={hasPathError}
                  />
                )
              }
            />
          );
        }
        case "string": {
          // Get display configuration from schema tag
          const stringDisplay = localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.string;
          
          return (
            <>
            {/* <ThemedOnScreenDebug
              label={`Rendering JzodElementStringEditor for string type at ${props.rootLessListKey || "ROOT"}`}
              data={{
                rootLessListKey: props.rootLessListKey,
                // rawSchema: currentKeyMap?.rawSchema,
                localResolvedElementJzodSchemaBasedOnValue,
                stringDisplay: stringDisplay,
                currentValueObjectAtKey,
              }}
            /> */}
            <JzodElementStringEditor
              {...props}
              formik={formik}
              formikRootLessListKey={formikRootLessListKey}
              currentValueObjectAtKey={currentValueObjectAtKey}
              localReadOnly={localReadOnly}
              enhancedLabelElement={enhancedLabelElement}
              hasPathError={hasPathError}
              stringDisplay={stringDisplay}
            />
            </>
          );
        }
        case "uuid": {
          // log.info(
          //   "JzodElementEditor: Rendering UUID input for rootLessListKey",
          //   props.rootLessListKey,
          //   "currentValueObjectAtKey",
          //   currentValueObjectAtKey,
          //   "formik.values",
          //   formik.values,
          //   "MLS tag",
          //   localResolvedElementJzodSchemaBasedOnValue.tag,
          //   "foreignKeyObjects",
          //   foreignKeyObjects,
          //   "stringSelectList",
          //   stringSelectList
          // );
          // if (props.readOnly || !localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.editable) {
          //   return (
          //     // <ThemedDisplayValue value={currentValueObjectAtKey} type="uuid" />
          //     <ThemedLabeledEditor
          //       labelElement={enhancedLabelElement}
          //       editor={
          //         <ThemedDisplayValue value={currentValueObjectAtKey} type="uuid" />
          //       }
          //     />
          //   );
          // }
          if (localResolvedElementJzodSchemaBasedOnValue.tag?.value?.foreignKeyParams?.targetEntity) {
            // Convert stringSelectList to options for selectors
            const selectOptions = stringSelectList.map((e: [string, EntityInstance]) => ({
              value: e[1].uuid,
              label:
                (e[1] as any).defaultLabel ||
                (e[1] as EntityInstanceWithName).name ||
                (e[1] as any).description ||
                e[1].uuid,
            }));

            const editor = localReadOnly ? (
              <ThemedDisplayValue value={currentValueObjectAtKey} type="uuid" />
            ) : !localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.uuid?.selector ||
              localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.uuid?.selector ==
                "portalSelector" ? (
              <ThemedSelectWithPortal
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
                // {...formik.getFieldProps(formikRootLessListKey)}
                value={currentValueObjectAtKey === undefined ? "" : currentValueObjectAtKey}
                onChange={(e) => {
                  const newValue = e.target.value === "" ? undefined : e.target.value;
                  // log.info(
                  //   "JzodElementEditor UUID selector onChange",
                  //   formikRootLessListKey,
                  //   "newValue",
                  //   newValue,
                  //   "callback",
                  //   !!callback,
                  //   "props.onChangeVector",
                  //   JSON.stringify(Object.keys(props.onChangeVector || {}))
                  // );
                  // Invoke onChangeVector callback if registered for this field
                  const callback = props.onChangeVector?.[props.rootLessListKey];
                  if (callback) {
                    callback(newValue, props.rootLessListKey);
                  }
                  formik.setFieldValue(formikRootLessListKey, newValue);
                }}
                name={formikRootLessListKey}
                // error={hasPathError}
              />
            ) : localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.uuid?.selector ==
              "muiSelector" ? (
              <ThemedMUISelect
                labelId={`${props.rootLessListKey}-label`}
                label={localResolvedElementJzodSchemaBasedOnValue.tag?.value?.defaultLabel || props.rootLessListKey}
                id={props.rootLessListKey}
                key={props.rootLessListKey}
                data-testid="miroirInput"
                aria-label={props.rootLessListKey}
                variant="outlined"
                value={currentValueObjectAtKey === undefined ? "" : currentValueObjectAtKey}
                onChange={(e) => {
                  const newValue = e.target.value === "" ? undefined : e.target.value;
                  // log.info(
                  //   "JzodElementEditor UUID selector onChange",
                  //   formikRootLessListKey,
                  //   "newValue",
                  //   newValue,
                  //   "callback",
                  //   !!callback,
                  //   "props.onChangeVector",
                  //   JSON.stringify(Object.keys(props.onChangeVector || {}))
                  // );
                  // Invoke onChangeVector callback if registered for this field
                  const callback = props.onChangeVector?.[props.rootLessListKey];
                  if (callback) {
                    callback(newValue, props.rootLessListKey);
                  }
                  formik.setFieldValue(formikRootLessListKey, newValue);
                }}
                name={formikRootLessListKey}
                fullWidth
              >
                {selectOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </ThemedMUISelect>
            ) : (
              <div>
                unknown value for
                localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.uuid?.selector:{" "}
                {localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.uuid?.selector}
              </div>
            );
            ;
            switch (
              localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display
                ?.objectUuidAttributeLabelPosition
            ) {
              case "hidden":
                return <ThemedLabeledEditor labelElement={<></>} editor={editor} />;
              case "stacked":
                return (
                  <ThemedStackedLabeledEditor labelElement={enhancedLabelElement} editor={editor} />
                );
              case "left":
              case undefined:
              default: {
                return <ThemedLabeledEditor labelElement={enhancedLabelElement} editor={editor} />;
              }
            }
          } else {
              // const currentUuidValue = formik.values[props.rootLessListKey] || "";
              // const currentUuidValue = currentValueObjectAtKey[props.rootLessListKey] || "";
              const currentUuidValue = currentValueObjectAtKey || "";
              const estimatedWidth = Math.max(200, Math.min(400, currentUuidValue.length * 8 + 40));
              
              return (
                <>
                  {/* <ThemedOnScreenHelper
                    label={`Uuid: ${props.rootLessListKey}`}
                    data={localResolvedElementJzodSchemaBasedOnValue}
                  /> */}
                  <ThemedLabeledEditor
                    labelElement={enhancedLabelElement}
                    editor={
                      props.readOnly ||
                      localResolvedElementJzodSchemaBasedOnValue.tag?.value?.display?.editable ===
                        false ? (
                        <ThemedDisplayValue value={currentValueObjectAtKey} type="uuid" />
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
                          {...formik.getFieldProps(formikRootLessListKey)}
                          // value={currentValue} // TODO: get other formik.getFieldProps: name, value, onChange, onBlur
                          // name={formikRootLessListKey}
                          error={hasPathError}
                        />
                      )
                    }
                  />
                </>
              );
          }
        }
        case "literal": {
          return (
              <JzodLiteralEditor
                valueObjectEditMode={props.valueObjectEditMode}
                name={props.name}
                labelElement={props.labelElement}
                key={props.rootLessListKey}
                listKey={props.listKey}
                rootLessListKey={props.rootLessListKey}
                rootLessListKeyArray={props.rootLessListKeyArray}
                currentApplication={props.currentApplication}
                applicationDeploymentMap={props.applicationDeploymentMap}
                currentApplicationSection={props.currentApplicationSection}
                currentDeploymentUuid={props.currentDeploymentUuid}
                reportSectionPathAsString={props.reportSectionPathAsString}
                foreignKeyObjects={props.foreignKeyObjects}
                // rawJzodSchema={props.rawJzodSchema as JzodLiteral}
                resolvedElementJzodSchemaDEFUNCT={localResolvedElementJzodSchemaBasedOnValue}
                typeCheckKeyMap={ props.typeCheckKeyMap }
                // localRootLessListKeyMap={props.localRootLessListKeyMap}
                insideAny={props.insideAny}
                readOnly={props.readOnly}
                displayError={props.displayError}
                onChangeVector={props.onChangeVector}
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
                valueObjectEditMode={props.valueObjectEditMode}
                name={props.name}
                labelElement={props.labelElement}
                key={props.rootLessListKey}
                listKey={props.listKey}
                rootLessListKey={props.rootLessListKey}
                rootLessListKeyArray={props.rootLessListKeyArray}
                reportSectionPathAsString={props.reportSectionPathAsString}
                // rawJzodSchema={props.rawJzodSchema as any}
                resolvedElementJzodSchemaDEFUNCT={localResolvedElementJzodSchemaBasedOnValue}
                typeCheckKeyMap={ props.typeCheckKeyMap }
                // localRootLessListKeyMap={props.localRootLessListKeyMap}
                foreignKeyObjects={props.foreignKeyObjects}
                currentApplication={props.currentApplication}
                applicationDeploymentMap={props.applicationDeploymentMap}
                currentApplicationSection={props.currentApplicationSection}
                currentDeploymentUuid={props.currentDeploymentUuid}
                enumValues={enumValues}
                forceTestingMode={props.forceTestingMode}
                insideAny={props.insideAny}
                readOnly={props.readOnly}
                displayError={props.displayError}
                onChangeVector={props.onChangeVector}
              />
            // </div>
          );
        }
        case "undefined":
        case "any": { // NOT REACHABLE ? JUST IN THE UNDEFINED CASE ?
          return (
            <>
            {/* <ThemedOnScreenHelper
              label={`This field allows any type of value. ${props.rootLessListKey}`}
              data={(props.typeCheckKeyMap as any)?.[props.rootLessListKey]}
            /> */}
            <JzodAnyEditor
              valueObjectEditMode={props.valueObjectEditMode}
              name={props.name}
              labelElement={props.labelElement}
              key={props.rootLessListKey}
              listKey={props.listKey}
              rootLessListKey={props.rootLessListKey}
              rootLessListKeyArray={props.rootLessListKeyArray}
              reportSectionPathAsString={props.reportSectionPathAsString}
              foreignKeyObjects={props.foreignKeyObjects}
              currentApplication={props.currentApplication}
              applicationDeploymentMap={props.applicationDeploymentMap}
              currentApplicationSection={props.currentApplicationSection}
              currentDeploymentUuid={props.currentDeploymentUuid}
              resolvedElementJzodSchemaDEFUNCT={localResolvedElementJzodSchemaBasedOnValue}
              typeCheckKeyMap={ props.typeCheckKeyMap }
              insideAny={props.insideAny}
              readOnly={props.readOnly}
              displayError={props.displayError}
              onChangeVector={props.onChangeVector}
            />
            </>
          );
        }
        case "date": {
          // log.info(
          //   "JzodElementEditor: Rendering date input for listKey",
          //   props.listKey,
          //   "with value",
          //   currentValue
          // );
          
          // Convert to Date for display, handling various input formats
          let dateValue: Date | null = null;
          if (currentValueObjectAtKey) {
            if (typeof currentValueObjectAtKey === 'string') {
              dateValue = new Date(currentValueObjectAtKey);
            } else if (currentValueObjectAtKey instanceof Date) {
              dateValue = currentValueObjectAtKey;
            } else if (typeof currentValueObjectAtKey === 'object') {
              // Handle serialized Date objects or other formats
              try {
                dateValue = new Date(currentValueObjectAtKey);
              } catch (e) {
                dateValue = null;
              }
            }
          }
          
          // Format the date as YYYY-MM-DD for the input
          const formattedDate = dateValue && !isNaN(dateValue.getTime())
            ? dateValue.toISOString().split("T")[0]
            : "";
          return (
            <ThemedLabeledEditor
              labelElement={enhancedLabelElement}
              editor={
                localReadOnly ? (
                  <ThemedDisplayValue value={currentValueObjectAtKey} type="date" />
                ) : (
                  <input
                    type="date"
                    id={props.rootLessListKey}
                    key={props.rootLessListKey}
                    role="textbox"
                    style={{ width: "100%" }}
                    {...formik.getFieldProps(formikRootLessListKey)}
                    value={formattedDate}
                    onChange={(e) => {
                      const value: string = e.target.value;
                      // Store as ISO string for JSON serialization, or undefined if empty
                      const newValue = value ? new Date(value).toISOString() : undefined;
                      
                      // Invoke onChangeVector callback if registered for this field
                      const callback = props.onChangeVector?.[props.rootLessListKey];
                      if (callback) {
                        callback(newValue, props.rootLessListKey);
                      }
                      formik.setFieldValue(formikRootLessListKey, newValue);
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
        // case "null":
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
              <pre>{safeStringify(currentValueObjectAtKey, 500)}</pre>
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
            currentValue: currentValueObjectAtKey,
            formikValues: formik.values,
            // rawJzodSchema: props.rawJzodSchema,
            // unfoldedJzodSchema: unfoldedRawSchema,
            localResolvedElementJzodSchemaBasedOnValue,
          }}
        />
      );
    }
  }, [
    // Individual primitive props only
    props.returnsEmptyElement,
    props.hidden,
    props.rootLessListKey,
    props.reportSectionPathAsString,
    props.insideAny,
    props.valueObjectEditMode,
    props.name,
    props.labelElement,
    props.listKey,
    // props.rootLessListKeyArray - array, unstable reference, passed to children
    props.currentApplication,
    props.applicationDeploymentMap,
    props.currentDeploymentUuid,
    props.currentApplicationSection,
    props.typeCheckKeyMap,
    props.foreignKeyObjects,
    props.readOnly,
    props.displayError,
    // props.onChangeVector - removed, passed to children but doesn't affect mainElement render logic
    props.isTopLevel,
    props.indentLevel,
    props.deleteButtonElement,
    props.maxRenderDepth,
    props.extraToolsButtons,
    // Computed values that affect rendering (all properly memoized)
    localResolvedElementJzodSchemaBasedOnValue, 
    currentValueObjectAtKey, 
    hideSubJzodEditor,
    itemsOrder,
    stringSelectList,
    enhancedLabelElement,
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

//   // Track render performance at the end of render
//  useEffect(() => {
//       // Track render performance at the end of render
//     if (context.showPerformanceDisplay) {
//       const renderEndTime = performance.now();
//       const renderDuration = renderEndTime - renderStartTime;
//       const currentMetrics = RenderPerformanceMetrics.trackRenderPerformance(componentKey, renderDuration);

//       // Log performance every 50 renders or if render took longer than 10ms
//       if (currentMetrics.renderCount % 50 === 0 || renderDuration > 10) {
//         log.info(
//           `JzodElementEditor render performance - ${componentKey}: ` +
//           `#${currentMetrics.renderCount} renders, ` +
//           `Current: ${renderDuration.toFixed(2)}ms, ` +
//           `Total: ${currentMetrics.totalRenderTime.toFixed(2)}ms, ` +
//           `Avg: ${currentMetrics.averageRenderTime.toFixed(2)}ms, ` +
//           `Min/Max: ${currentMetrics.minRenderTime.toFixed(2)}ms/${currentMetrics.maxRenderTime.toFixed(2)}ms`
//         );
//       }
//     }
//   });

  const codeEditorWithButtonOrMainElement: JSX.Element =
    resolvedTypeIsObjectOrArrayOrAny?
     displayAsCodeEditor ? (
      <>
        {/* {props.submitButton}
        JzodElementEditor rendering as JzodElementEditorReactCodeMirror 1 */}
        <JzodElementEditorReactCodeMirror
          formikRootLessListKey={formikRootLessListKey}
          initialValue={JSON.stringify(currentValueObjectAtKey, null, 2)}
          codeMirrorValue={codeMirrorValue}
          setCodeMirrorValue={setCodeMirrorValue}
          codeMirrorIsValidJson={codeMirrorIsValidJson}
          setCodeMirrorIsValidJson={setCodeMirrorIsValidJson}
          rootLessListKey={props.rootLessListKey}
          rootLessListKeyArray={props.rootLessListKeyArray}
          hidden={!displayAsCodeEditor}
          insideAny={props.insideAny}
          isUnderTest={isUnderTest}
          displayAsStructuredElementSwitch={displayAsStructuredElementSwitch}
        />
      </>
    ) : displayWithoutFrame ? (
      <>
      {mainElement}
      </>
    ) : (
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
    ): (<></>);
  return (
    <>
      {props.isTopLevel && (
        <>
          <DebugHelper
            componentName="JzodElementEditor"
            elements={[
              {
                label: `key "${formikRootLessListKey}" of type ${localResolvedElementJzodSchemaBasedOnValue?.type}`,
                data: {
                  existingObject,
                  itemsOrder,
                  localResolvedElementJzodSchemaBasedOnValue,
                },
                initiallyUnfolded: false,
                copyButton: true,
                useCodeBlock: true,
              },
              ...(currentKeyMap?.rawSchema?.type === "any" ? [{
                label: `rendering JzodElementEditor for 'any' at ${props.rootLessListKey || "ROOT"}, objectOrArrayOrAny=${resolvedTypeIsObjectOrArrayOrAny}, displayAsCodeEditor=${displayAsCodeEditor}`,
                data: {
                  localResolvedElementJzodSchemaBasedOnValue,
                  currentValueObjectAtKey,
                  currentKeyMap,
                },
                useCodeBlock: true as const,
              }] : []),
            ]}
          />
          {props.submitButton ?? <></>}
        </>
      )}
      <div>
        {props.rootLessListKey === "" && (
          <RenderPerformanceMetrics.RenderPerformanceDisplay
            componentKey={componentKey}
            indentLevel={props.indentLevel}
          />
        )}
        {!resolvedTypeIsObjectOrArrayOrAny ? (
          // simple type value / object attribute
          <span
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            {!localResolvedElementJzodSchemaBasedOnValue?.tag?.value?.display
              ?.objectHideDeleteButton && props.deleteButtonElement}
            {mainElement}
          </span>
        ) : displayWithoutFrame ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            {codeEditorWithButtonOrMainElement}
          </div>
        ) : (
          // Render with ThemedCard frame (original behavior)
          <ThemedCard
            id={props.rootLessListKey}
            key={props.rootLessListKey}
            title={hasPathError && props.displayError ? props.displayError.errorMessage : undefined}
            style={{
              padding: "1px",
              width: "calc(100% - 10px)",
              margin: "5px 10px 5px 0",
              position: "relative",
              backgroundColor: backgroundColor,
              border: `1px solid ${borderColor}`,
              borderLeft: isNestableType
                ? `3px solid ${leftBorderColor}`
                : `1px solid ${borderColor}`,
              justifyContent: "space-between",
              boxShadow: "none",
            }}
          >
            <ThemedCardContent
              style={{
                backgroundColor: backgroundColor,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {codeEditorWithButtonOrMainElement}
            </ThemedCardContent>
          </ThemedCard>
        )}
        {/* <div>{count}</div> */}
      </div>
    </>
  );
}
