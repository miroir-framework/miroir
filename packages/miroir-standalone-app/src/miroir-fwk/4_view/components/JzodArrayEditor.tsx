import { FormikContextType, useFormikContext } from "formik";
import {
  adminConfigurationDeploymentMiroir,
  getDefaultValueForJzodSchema,
  JzodArray,
  JzodElement,
  JzodTuple,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  resolvePathOnObject,
  unfoldJzodSchemaOnce,
  UnfoldJzodSchemaOnceReturnType,
  UnfoldJzodSchemaOnceReturnTypeOK
} from "miroir-core";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import {
  useMiroirContextService
} from "../MiroirContextReactProvider";
import { useCurrentModel } from "../ReduxHooks";
import { ExpandOrFoldObjectAttributes, JzodElementEditor } from "./JzodElementEditor";
import { JzodArrayEditorProps } from "./JzodElementEditorInterface";
import { SizedAddBox, SizedButton } from "./Style";
import { J } from "vitest/dist/chunks/environment.LoooBwUu";
import { JzodUnion } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

export const indentShift = "1em + 4px"; // TODO: centralize style

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
      "formik.values",
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
  currentArrayElementRawDefinition: UnfoldJzodSchemaOnceReturnTypeOK;
  resolvedElementJzodSchema: JzodElement | undefined;
  usedIndentLevel: number;
  currentDeploymentUuid: string | undefined;
  currentApplicationSection: string | undefined;
  localRootLessListKeyMap: any;
  foreignKeyObjects: any;
  insideAny: boolean | undefined;
  parentUnfoldedRawSchema: any;
  itemsOrder: number[];
  formik: FormikContextType<Record<string, any>>;
  currentValue: any;
}

const ProgressiveArrayItem: React.FC<ProgressiveArrayItemProps> = ({
  index,
  listKey,
  rootLessListKey,
  rootLessListKeyArray,
  currentArrayElementRawDefinition,
  resolvedElementJzodSchema,
  usedIndentLevel,
  currentDeploymentUuid,
  currentApplicationSection,
  localRootLessListKeyMap,
  foreignKeyObjects,
  insideAny,
  parentUnfoldedRawSchema,
  itemsOrder,
  formik,
  currentValue,
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
              rawJzodSchema={currentArrayElementRawDefinition.element}
              resolvedElementJzodSchema={
                resolvedElementJzodSchema?.type == "array"
                  ? ((resolvedElementJzodSchema as JzodArray)?.definition as any)
                  : ((resolvedElementJzodSchema as JzodTuple).definition[index] as JzodElement)
              }
              localRootLessListKeyMap={localRootLessListKeyMap}
              foreignKeyObjects={foreignKeyObjects}
              insideAny={insideAny}
              parentType={parentUnfoldedRawSchema.type}
            />
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
    rawJzodSchema,
    unfoldedRawSchema: parentUnfoldedRawSchema,
    resolvedElementJzodSchema,
    localRootLessListKeyMap,
    // paramMiroirFundamentalJzodSchema,
    currentDeploymentUuid,
    currentApplicationSection,
    indentLevel,
    foreignKeyObjects,
    hiddenFormItems,
    setHiddenFormItems,
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

  const currentModel: MetaModel = useCurrentModel(currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  // ??
  const usedIndentLevel: number = indentLevel ?? 0;

  const arrayValueObject = resolvePathOnObject(formik.values, rootLessListKeyArray);


  // ##############################################################################################
  const addNewArrayItem = useCallback(
    async () => {
      if (!rawJzodSchema || rawJzodSchema.type !== "array") {
        throw new Error(
          "JzodArrayEditor addNewArrayItem called with a non-array schema: " +
            JSON.stringify(rawJzodSchema, null, 2)
        );
      }

      // const newItem = getDefaultValueForJzodSchema(rawJzodSchema.definition)
      const newItem = getDefaultValueForJzodSchema(parentUnfoldedRawSchema.definition)
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
        JSON.stringify(rawJzodSchema, null, 2),
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
      rawJzodSchema,
      arrayValueObject,
      // resolvedElementJzodSchema,
      parentUnfoldedRawSchema,
    ]
  );
  // ##############################################################################################
  const arrayItems: JSX.Element = useMemo(()=>(
  // const arrayItems: JSX.Element = (
    <div
      id={listKey + ".inner"}
      key={listKey + ".inner"}
      style={{ display: hiddenFormItems[listKey] ? "none" : "block" }}
    >
      {(itemsOrder as number[])
        .map((i: number): [number, JzodElement] => [i, arrayValueObject[i]])
        .map((attributeParam: [number, JzodElement]) => {
          const index: number = attributeParam[0];
          // HACK HACK HACK
          // TODO: allow individualized schmema resolution for items of an array, in case the definition of the array schema is a union type
          // resulting type of an array type would be a tuple type.

          // log.info(
          //   "JzodArrayEditor array attribute",
          //   index,
          //   "attribute",
          //   attribute,
          // );
          // const currentArrayElementRawDefinition: JzodElement | undefined =
          const currentArrayElementRawDefinition: UnfoldJzodSchemaOnceReturnType | undefined =
            // useMemo(
              (() => {
                if (!context.miroirFundamentalJzodSchema) {
                  return undefined;
                }
                switch (rawJzodSchema?.type) {
                  case "array": {
                    return unfoldJzodSchemaOnce(
                      context.miroirFundamentalJzodSchema,
                      rawJzodSchema.definition,
                      [], // path
                      [], // unfoldingReference
                      rawJzodSchema, // rootSchema
                      0,
                      currentModel,
                      miroirMetaModel
                    );
                  }
                  case "tuple": {
                    return unfoldJzodSchemaOnce(
                      context.miroirFundamentalJzodSchema as any,
                      rawJzodSchema.definition[index],
                      [], // path
                      [], // unfoldingReference
                      rawJzodSchema, // rootSchema
                      0,
                      currentModel,
                      miroirMetaModel
                    );
                  }
                  case "union": {
                    const findFirstArrayInUnion = (union: JzodUnion): JzodArray | undefined => {
                      const topLevelArray = union.definition.find(e => e.type === "array");
                      if (topLevelArray) {
                        return topLevelArray as JzodArray;
                      }
                      for (const e of union.definition) {
                        if (e.type === "union") {
                          const found = findFirstArrayInUnion(e as JzodUnion);
                          if (found) {
                            return found;
                          }
                        }
                      }
                      return undefined;
                      // throw new Error(
                      //   "JzodArrayEditor could not find an array in union schema " +
                      //     JSON.stringify(union, null, 2)
                      // );
                    }
                    const arraySchema = findFirstArrayInUnion(rawJzodSchema as JzodUnion);
                    if (!arraySchema) {
                      return undefined;
                      // throw new Error(
                      //   "JzodArrayEditor could not find an array in union schema " +
                      //     JSON.stringify(rawJzodSchema, null, 2)
                      // );
                      // return {
                      //   status: "error",
                      //   element: undefined,
                      //   error: new Error(
                      //     "JzodArrayEditor could not find an array in union schema " +
                      //       JSON.stringify(rawJzodSchema, null, 2)
                      //   )
                      // }
                    }
                    return unfoldJzodSchemaOnce(
                      context.miroirFundamentalJzodSchema as any,
                      arraySchema.definition,
                      [], // path
                      [], // unfoldingReference
                      rawJzodSchema, // rootSchema
                      0,
                      currentModel,
                      miroirMetaModel
                    );
                  }
                  default:
                    return undefined;
                }
              })();
              // },
              // [rawJzodSchema, currentModel, miroirMetaModel]
            // );
          const resolutionError =
            currentArrayElementRawDefinition && currentArrayElementRawDefinition.status != "ok";
          if (!currentArrayElementRawDefinition || resolutionError) {
            // throw new Error(
            //   "JzodArrayEditor could not unfold jzod schema for " +
            //     rootLessListKey +
            //     " index " +
            //     index +
            //     " context.miroirFundamentalSchema is defined " +
            //     !!context.miroirFundamentalJzodSchema +
            //     " with rawJzodSchema " +
            //     JSON.stringify(rawJzodSchema, null, 2) +
            //     " and currentArrayElementRawDefinition " +
            //     JSON.stringify(currentArrayElementRawDefinition, null, 2) +
            //     " at " +
            //     JSON.stringify(resolutionError, null, 2)
            // );
            return (
              <div key={rootLessListKey + "." + index}>
                <span>
                  JzodArrayEditor: Error unfolding Jzod schema for {rootLessListKey} index {index}:
                  <br />
                  {currentArrayElementRawDefinition?.error ||
                    "Unknown error unfolding Jzod schema for " + rootLessListKey + " index " + index}
                  <br />
                  <span style={{ color: "red" }}>
                    {JSON.stringify(currentArrayElementRawDefinition, null, 2)}
                  </span>
                </span>
              </div>

            )
          }

          // log.info(
          //   "JzodArrayEditor array attribute",
          //   "rootLessListKey",
          //   rootLessListKey,
          //   "array [",
          //   index,
          //   "]",
          //   "found raw schema",
          //   // JSON.stringify(currentArrayElementRawDefinition, null, 2),
          //   currentArrayElementRawDefinition,
          //   "for rawJzodSchema",
          //   rawJzodSchema,
          //   "for value",
          //   attributeParam[1],
          //   // JSON.stringify(attributeParam[1], null, 2)
          // );
          return (
            <ProgressiveArrayItem
              key={rootLessListKey + "." + index}
              index={index}
              listKey={listKey}
              rootLessListKey={rootLessListKey}
              rootLessListKeyArray={rootLessListKeyArray}
              currentArrayElementRawDefinition={currentArrayElementRawDefinition}
              resolvedElementJzodSchema={resolvedElementJzodSchema}
              usedIndentLevel={usedIndentLevel}
              currentDeploymentUuid={currentDeploymentUuid}
              currentApplicationSection={currentApplicationSection}
              localRootLessListKeyMap={localRootLessListKeyMap}
              foreignKeyObjects={foreignKeyObjects}
              insideAny={insideAny}
              parentUnfoldedRawSchema={parentUnfoldedRawSchema}
              itemsOrder={itemsOrder}
              formik={formik}
              currentValue={currentValue}
            />
          );
        })}
    </div>
  )
  // );
  , [
    // listKey,
    rootLessListKey,
    // rootLessListKeyArray,
    rawJzodSchema,
    parentUnfoldedRawSchema,
    formik.values,
    resolvedElementJzodSchema,
    localRootLessListKeyMap,
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
      <span>
        {label}
        <span>
          {/* add new item: */}
          {" ["}
          <ExpandOrFoldObjectAttributes
            hiddenFormItems={hiddenFormItems}
            setHiddenFormItems={setHiddenFormItems}
            listKey={listKey}
          ></ExpandOrFoldObjectAttributes>
          {displayAsStructuredElementSwitch}
          <SizedButton
            variant="text"
            aria-label={rootLessListKey + ".add"}
            onClick={addNewArrayItem}
          >
            <SizedAddBox />
          </SizedButton>
        </span>
        {arrayItems}
        <div>{"]"}</div>
      </span>
    </div>
  );
};
