import { FormikContextType, useFormikContext } from "formik";
import { ErrorBoundary } from "react-error-boundary";
import {
  adminConfigurationDeploymentMiroir,
  getDefaultValueForJzodSchema,
  getDefaultValueForJzodSchemaWithResolution,
  JzodArray,
  JzodElement,
  JzodTuple,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  resolvePathOnObject,
  // unfoldJzodSchemaOnce,
  // UnfoldJzodSchemaOnceReturnType,
  // UnfoldJzodSchemaOnceReturnTypeOK
} from "miroir-core";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import {
  useMiroirContextService
} from "../MiroirContextReactProvider";
import { useCurrentModel } from "../ReduxHooks";
import { FoldUnfoldObjectOrArray, JzodElementEditor } from "./JzodElementEditor";
import { JzodArrayEditorProps } from "./JzodElementEditorInterface";
import { ErrorFallbackComponent } from "./ErrorFallbackComponent";
import { SizedAddBox, SizedButton } from "./Style";
// import { JzodUnion } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

// export const indentShift = "1em + 4px"; // TODO: centralize style
export const indentShift = "4px"; // TODO: centralize style

interface JzodArrayMoveButtonProps {
  direction: "up" | "down";
  index: number;
  itemsOrder: number[];
  listKey: string;
  rootLessListKey: string;
  formik: FormikContextType<Record<string, any>>; // useFormikContext<Record<string, any>>()
  currentValue: any;
  // setItemsOrder: React.Dispatch<React.SetStateAction<number[]>>;
  // formHelperState: any;
  // setformHelperState: (state: any) => void;
}

// ################################################################################################
export const JzodArrayEditorMoveButton: React.FC<JzodArrayMoveButtonProps> = ({
  direction,
  index,
  itemsOrder,
  listKey,
  formik,
  currentValue,
  rootLessListKey
}) => {
  const isDisabled = direction === "up" ? index === 0 : index === itemsOrder.length - 1;

  const handleClick = (e: React.MouseEvent) => {
    const currentItemIndex: number = index;

    const newList: any[] = currentValue.slice();
    const movedItem = newList.splice(currentItemIndex, 1)[0];
    const insertAt = direction === "up" ? currentItemIndex - 1 : currentItemIndex + 1;
    newList.splice(insertAt, 0, movedItem);

    log.info(
      `JzodArrayMoveButton array moving ${direction} item`,
      currentItemIndex,
      "in object with items",
      itemsOrder,
      "newlist",
      JSON.stringify(newList, null, 2),
      "old formik.values",
      JSON.stringify(formik.values, null, 2),
    );

    formik.setFieldValue(rootLessListKey, newList, true); // validate to trigger re-renders
  };

  return (
    <button
      style={{ border: 0, backgroundColor: "transparent" }}
      type="button"
      role={`${listKey}.button.${direction}`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {direction === "up" ? "^" : "v"}
    </button>
  );
};

// ################################################################################################
// Progressive Array Item Component
// ################################################################################################
interface ProgressiveArrayItemProps {
  index: number;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: (string | number)[];
  // currentArrayElementRawDefinition: UnfoldJzodSchemaOnceReturnTypeOK;
  currentArrayElementRawDefinition: JzodElement | undefined;
  resolvedElementJzodSchema: JzodElement | undefined;
  typeCheckKeyMap?: Record<string, { rawSchema: JzodElement; resolvedSchema: JzodElement }>;
  usedIndentLevel: number;
  currentDeploymentUuid: string | undefined;
  currentApplicationSection: string | undefined;
  // localRootLessListKeyMap: any;
  foreignKeyObjects: any;
  insideAny: boolean | undefined;
  // parentUnfoldedRawSchema: any;
  itemsOrder: number[];
  formik: FormikContextType<Record<string, any>>;
  currentValue: any;
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<React.SetStateAction<{ [k: string]: boolean }>>;
}

const ProgressiveArrayItem: React.FC<ProgressiveArrayItemProps> = ({
  index,
  listKey,
  rootLessListKey,
  rootLessListKeyArray,
  currentArrayElementRawDefinition,
  resolvedElementJzodSchema,
  typeCheckKeyMap,
  usedIndentLevel,
  currentDeploymentUuid,
  currentApplicationSection,
  // localRootLessListKeyMap,
  foreignKeyObjects,
  insideAny,
  // parentUnfoldedRawSchema,
  itemsOrder,
  formik,
  currentValue,
  foldedObjectAttributeOrArrayItems: hiddenFormItems,
  setFoldedObjectAttributeOrArrayItems: setHiddenFormItems,
}) => {
  const isTestMode = process.env.VITE_TEST_MODE === 'true';
  // const [isRendered, setIsRendered] = useState(false);
  const [isRendered, setIsRendered] = useState(isTestMode);


  useEffect(() => {
    // Skip progressive rendering in test mode
    if (isTestMode) {
      // setIsRendered(true);
      return;
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    const scheduleRender = () => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => setIsRendered(true), { timeout: 100 });
      } else {
        setTimeout(() => setIsRendered(true), 0);
      }
    };

    scheduleRender();
  }, []);

  return (
    <div key={rootLessListKey + "." + index}>
      <div key={listKey + "." + index} style={{ marginLeft: `calc(${indentShift})` }}>
        {!isRendered ? (
          <div style={{ fontStyle: 'italic', color: '#666', padding: '4px' }}>
            Loading array item {index}...
          </div>
        ) : (
          <>
            <JzodArrayEditorMoveButton
              direction="down"
              index={index}
              itemsOrder={itemsOrder as number[]}
              listKey={listKey}
              rootLessListKey={rootLessListKey}
              formik={formik}
              currentValue={currentValue}
            />
            <JzodArrayEditorMoveButton
              direction="up"
              index={index}
              itemsOrder={itemsOrder as number[]}
              listKey={listKey}
              rootLessListKey={rootLessListKey}
              formik={formik}
              currentValue={currentValue}
            />
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }) => (
                <ErrorFallbackComponent
                  error={error}
                  resetErrorBoundary={resetErrorBoundary}
                  context={{
                    origin: "JzodArrayEditor",
                    objectType: "array",
                    rootLessListKey: rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index,
                    attributeRootLessListKeyArray: [...rootLessListKeyArray, "" + index],
                    attributeName: "" + index,
                    attributeListKey: listKey + "." + index,
                    currentValue: currentValue,
                    formikValues: formik.values,
                    // rawJzodSchema: currentArrayElementRawDefinition.element,
                    rawJzodSchema: currentArrayElementRawDefinition,
                    localResolvedElementJzodSchemaBasedOnValue: resolvedElementJzodSchema?.type == "array"
                      ? ((resolvedElementJzodSchema as JzodArray)?.definition as any)
                      : ((resolvedElementJzodSchema as JzodTuple).definition[index] as JzodElement),
                  }}
                />
              )}
            >
              <JzodElementEditor
                name={"" + index}
                listKey={listKey + "." + index}
                indentLevel={usedIndentLevel + 1}
                labelElement={<></>}
                currentDeploymentUuid={currentDeploymentUuid}
                currentApplicationSection={currentApplicationSection as any}
                rootLessListKey={
                  rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index
                }
                rootLessListKeyArray={[...rootLessListKeyArray, "" + index]}
                // rawJzodSchema={currentArrayElementRawDefinition.element}
                // rawJzodSchema={currentArrayElementRawDefinition}
                resolvedElementJzodSchema={
                  resolvedElementJzodSchema?.type == "array"
                    ? ((resolvedElementJzodSchema as JzodArray)?.definition as any)
                    : ((resolvedElementJzodSchema as JzodTuple).definition[index] as JzodElement)
                }
                typeCheckKeyMap={ typeCheckKeyMap }
                // localRootLessListKeyMap={localRootLessListKeyMap}
                foreignKeyObjects={foreignKeyObjects}
                foldedObjectAttributeOrArrayItems={hiddenFormItems}
                setFoldedObjectAttributeOrArrayItems={setHiddenFormItems}
                insideAny={insideAny}
                // parentType={parentUnfoldedRawSchema.type}
              />
            </ErrorBoundary>
          </>
        )}
      </div>
    </div>
  );
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
let jzodArrayEditorRenderCount: number = 0;
export const JzodArrayEditor: React.FC<JzodArrayEditorProps> = (
  // props: JzodArrayEditorProps
  {
    name,
    labelElement: label,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    resolvedElementJzodSchema,
    typeCheckKeyMap,
    currentDeploymentUuid,
    currentApplicationSection,
    indentLevel,
    foreignKeyObjects,
    foldedObjectAttributeOrArrayItems: hiddenFormItems,
    setFoldedObjectAttributeOrArrayItems: setHiddenFormItems,
    itemsOrder,
    insideAny,
    displayAsStructuredElementSwitch,
    // setItemsOrder,
  }
) => {
  // log.info("############################################### JzodArrayEditor array rootLessListKey", props.rootLessListKey, "values", props.formik.values);
  jzodArrayEditorRenderCount++;
  const context = useMiroirContextService();

  const formik = useFormikContext<Record<string, any>>();
  const currentValue = resolvePathOnObject(
    formik.values,
    rootLessListKeyArray
  );

  // log.info(
  //   "JzodArrayEditor render",
  //   jzodArrayEditorRenderCount,
  //   "name",
  //   name,
  //   "rootLessListKey",
  //   rootLessListKey,
  //   "itemsOrder",
  //   itemsOrder,
  //   "resolvedElementJzodSchema",
  //   // resolvedElementJzodSchema,
  //   JSON.stringify(resolvedElementJzodSchema, null, 2),
  //   "rawJzodSchema",
  //   JSON.stringify(rawJzodSchema, null, 2),
  // );

  // const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;
  const currentModel: MetaModel = useCurrentModel(currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  // ??
  const usedIndentLevel: number = indentLevel ?? 0;

  const arrayValueObject = resolvePathOnObject(formik.values, rootLessListKeyArray);

  const currentTypeCheckKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;
  const parentKey = rootLessListKey.includes(".")
    ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf("."))
    : "";
  const parentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;

  // ##############################################################################################
  const addNewArrayItem = useCallback(
    async () => {
      if (!currentTypeCheckKeyMap?.rawSchema || currentTypeCheckKeyMap.rawSchema.type !== "array") {
        throw new Error(
          "JzodArrayEditor addNewArrayItem called with a non-array schema: " +
            JSON.stringify(currentTypeCheckKeyMap?.rawSchema, null, 2)
        );
      }

      if (!context.miroirFundamentalJzodSchema) {
        throw new Error(
          "JzodArrayEditor addNewArrayItem called without miroirFundamentalJzodSchema: " +
            JSON.stringify(context.miroirFundamentalJzodSchema, null, 2)
        );
      }
      // const newItem = getDefaultValueForJzodSchema(rawJzodSchema.definition)
      // const newItem = getDefaultValueForJzodSchema(parentUnfoldedRawSchema.definition)
      // cases:
      // 1. array of primitives: e.g. ["value1", "value2", "value3"]
      // 2. array of objects: e.g. [{ key1: "value1", key2: "value2" }, { key1: "value3", key2: "value4" }]
      // 3. array of unions: e.g. [{ key1: "value1" }, "value2", { key1: "value3" }]
      // 4. array of references
      // 
      // array is in a union?
      const newItem = getDefaultValueForJzodSchemaWithResolution(
        currentTypeCheckKeyMap?.rawSchema.definition,
        false,
        context.miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel
      );
      // Create the new array value
      const newArrayValue = [
        ...arrayValueObject,
        newItem,
        // "value4",
        // "",
      ];
      log.info(
        "JzodArrayEditor addNewArrayItem",
        "rootLessListKey",
        rootLessListKey,
        "newItem",
        JSON.stringify(newItem, null, 2),
        "rawJzodSchema",
        JSON.stringify(currentTypeCheckKeyMap.rawSchema, null, 2),
        "formik.values",
        JSON.stringify(formik.values, null, 2),
        "newArrayValue",
        JSON.stringify(newArrayValue, null, 2),
      );

      // log.info(
      //   "JzodArrayEditor addNewArrayItem",
      //   "listKey",
      //   listKey,
      //   "rootLessListKey",
      //   rootLessListKey,
      //   "rootLessListKeyArray",
      //   rootLessListKeyArray,
      //   "rawJzodSchema",
      //   rawJzodSchema,
      //   "newArrayValue",
      //   JSON.stringify(newArrayValue, null, 2),
      //   "arrayValueObject",
      //   JSON.stringify(arrayValueObject, null, 2),
      //   "formik.values",
      //   JSON.stringify(formik.values, null, 2),
      //   "itemsOrder",
      //   JSON.stringify(itemsOrder, null, 2),
      //   "getItemsOrder(newArrayValue, resolvedElementJzodSchema)",
      //   JSON.stringify(getItemsOrder(newArrayValue, resolvedElementJzodSchema), null, 2)
      // );

      // Update the specific field in Formik state
      // formik.setFieldValue("testField", newArrayValue, false); // Disable validation
      formik.setFieldValue(rootLessListKey, newArrayValue, true); // enable validation / refresh of formik component

      // // Update the items order
      // setItemsOrder(getItemsOrder(newArrayValue, resolvedElementJzodSchema));
    },
    [
      formik,
      currentTypeCheckKeyMap?.rawSchema,
      arrayValueObject,
      // resolvedElementJzodSchema,
      // parentUnfoldedRawSchema,
    ]
  );
  // ##############################################################################################
  const arrayItems: JSX.Element = useMemo(()=>(
  // const arrayItems: JSX.Element = (
    <>
      {(itemsOrder as number[])
        .map((i: number): [number, JzodElement] => [i, arrayValueObject[i]])
        .map((attributeParam: [number, JzodElement]) => {
          const index: number = attributeParam[0];
          const attributeRootLessListKey: string = rootLessListKey.length > 0? rootLessListKey + "." + index : "" + index;
          const currentArrayElementRawDefinition: JzodElement | undefined =
            typeCheckKeyMap && typeCheckKeyMap[rootLessListKey].rawSchema.type !== "any"
              ? typeCheckKeyMap[attributeRootLessListKey].rawSchema
              : { type: "any" };
          // const attributeTypeCheckKeyMap = typeCheckKeyMap? typeCheckKeyMap[attributeRootLessListKey]: undefined;
          if (!currentArrayElementRawDefinition) {
            log.error(
              "JzodArrayEditor could not find typeCheckKeyMap for attribute",
              index,
              "in rootLessListKey",
              rootLessListKey,
              "with typeCheckKeyMap",
              typeCheckKeyMap,
              // typeCheckKeyMap?.[rootLessListKey],
              // JSON.stringify(typeCheckKeyMap, null, 2)
            );
            throw new Error(
              "JzodArrayEditor could not find typeCheckKeyMap for attribute " +
                index +
                " in rootLessListKey " +
                rootLessListKey
                // " with typeCheckKeyMap " +
                // JSON.stringify(typeCheckKeyMap, null, 2)
            );
          }
          // const currentArrayElementRawDefinition: JzodElement | undefined = attributeTypeCheckKeyMap.rawSchema;
          return (
            <ProgressiveArrayItem
              key={rootLessListKey + "." + index}
              index={index}
              listKey={listKey}
              rootLessListKey={rootLessListKey}
              rootLessListKeyArray={rootLessListKeyArray}
              // currentArrayElementRawDefinition={currentArrayElementRawDefinition}
              currentArrayElementRawDefinition={currentArrayElementRawDefinition}
              resolvedElementJzodSchema={resolvedElementJzodSchema}
              typeCheckKeyMap={typeCheckKeyMap}
              usedIndentLevel={usedIndentLevel}
              currentDeploymentUuid={currentDeploymentUuid}
              currentApplicationSection={currentApplicationSection}
              // localRootLessListKeyMap={localRootLessListKeyMap}
              foreignKeyObjects={foreignKeyObjects}
              insideAny={insideAny}
              // parentUnfoldedRawSchema={parentUnfoldedRawSchema}
              itemsOrder={itemsOrder}
              formik={formik}
              currentValue={currentValue}
              foldedObjectAttributeOrArrayItems={hiddenFormItems}
              setFoldedObjectAttributeOrArrayItems={setHiddenFormItems}
            />
          );
        })}
    </>
  )
  // );
  , [
    // listKey,
    rootLessListKey,
    // rootLessListKeyArray,
    // rawJzodSchema,
    // parentUnfoldedRawSchema,
    formik.values,
    resolvedElementJzodSchema,
    typeCheckKeyMap,
    // localRootLessListKeyMap,
    currentDeploymentUuid,
    currentApplicationSection,
    usedIndentLevel,
    foreignKeyObjects,
    // hiddenFormItems[listKey],
    hiddenFormItems,
    itemsOrder,
    insideAny,
    displayAsStructuredElementSwitch,
    // formik.values[rootLessListKey],
  ])
  ;
  // ##############################################################################################
  return (
    <div id={rootLessListKey} key={rootLessListKey}>
      <div>
        <span
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "start",
            alignItems: "center",
          }}
        >
          <span>
            <span
              style={{
                display: "flex",
                flexDirection: "row",
                alignContent: "start",
                alignItems: "center",
              }}
            >
              {label}
            </span>
          </span>
          <span id={rootLessListKey + "head"} key={rootLessListKey + "head"}>
            <FoldUnfoldObjectOrArray
              foldedObjectAttributeOrArrayItems={hiddenFormItems}
              setFoldedObjectAttributeOrArrayItems={setHiddenFormItems}
              listKey={listKey}
            ></FoldUnfoldObjectOrArray>
          </span>
          <span>
            <SizedButton
              variant="text"
              aria-label={rootLessListKey + ".add"}
              onClick={addNewArrayItem}
              title="Add new array item"
              style={{ 
                flexShrink: 0,
                marginLeft: "1em",
              }}
            >
              <SizedAddBox />
            </SizedButton>
          </span>
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
            {displayAsStructuredElementSwitch ?? <></>}
          </span>
        </span>
        <div
          id={listKey + ".inner"}
          style={{
            marginLeft: `calc(${indentShift})`,
            display: hiddenFormItems[listKey] ? "none" : "block",
          }}
          key={`${rootLessListKey}|body`}
        >
          {arrayItems}
        </div>
      </div>
    </div>
  );
};
