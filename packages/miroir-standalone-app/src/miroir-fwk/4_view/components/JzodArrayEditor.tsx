import {
  adminConfigurationDeploymentMiroir,
  getDefaultValueForJzodSchema,
  JzodArray,
  JzodElement,
  JzodTuple,
  JzodUnion_RecursivelyUnfold_ReturnType,
  JzodUnion_RecursivelyUnfold_ReturnTypeOK,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ResolvedJzodSchemaReturnType,
  resolvePathOnObject,
  unfoldJzodSchemaOnce,
  UnfoldJzodSchemaOnceReturnType,
  UnfoldJzodSchemaOnceReturnTypeOK,
} from "miroir-core";
import React, { useCallback } from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import {
  useMiroirContextformHelperState,
  useMiroirContextService,
} from "../MiroirContextReactProvider";
import { useCurrentModel } from "../ReduxHooks";
import { ExpandOrFoldObjectAttributes, JzodElementEditor } from "./JzodElementEditor";
import { JzodArrayEditorProps } from "./JzodElementEditorInterface";
import { useFormikContext } from "formik";
import { getItemsOrder, SizedAddBox, SizedButton } from "./Style";

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
  setItemsOrder: React.Dispatch<React.SetStateAction<number[]>>;
  formHelperState: any;
  setformHelperState: (state: any) => void;
}

export const JzodArrayEditorMoveButton: React.FC<JzodArrayMoveButtonProps> = ({
  direction,
  index,
  itemsOrder,
  listKey,
  setItemsOrder,
  formHelperState,
  setformHelperState,
}) => {
  const isDisabled = direction === "up" ? index === 0 : index === itemsOrder.length - 1;

  const handleClick = (e: React.MouseEvent) => {
    const currentItemIndex: number = index;
    let newItemsOrder = itemsOrder.slice();
    const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];

    // Insert at new position based on direction
    const newPosition = direction === "up" ? currentItemIndex - 1 : currentItemIndex + 1;

    newItemsOrder.splice(newPosition, 0, cutOut);

    setformHelperState(Object.assign(formHelperState, { [listKey]: newItemsOrder }));

    log.info(
      `JzodArrayMoveButton array moving ${direction} item`,
      currentItemIndex,
      "in object with items",
      itemsOrder,
      "cutOut",
      cutOut,
      "new order",
      newItemsOrder
    );

    setItemsOrder(newItemsOrder);
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

let jzodArrayEditorRenderCount: number = 0;
export const JzodArrayEditor: React.FC<JzodArrayEditorProps> = (
  // props: JzodArrayEditorProps
  {
    name,
    label,
    listKey,
    rootLesslistKey,
    rootLesslistKeyArray,
    rawJzodSchema,
    resolvedElementJzodSchema,
    paramMiroirFundamentalJzodSchema,
    currentDeploymentUuid,
    currentApplicationSection,
    indentLevel,
    foreignKeyObjects,
    hiddenFormItems,
    setHiddenFormItems,
    itemsOrder,
    setItemsOrder,
  }
) => {
  // log.info("############################################### JzodArrayEditor array rootLesslistKey", props.rootLesslistKey, "values", props.formik.values);
  jzodArrayEditorRenderCount++;
  const context = useMiroirContextService();

  // log.info(
  //   "JzodArrayEditor render",
  //   jzodArrayEditorRenderCount,
  //   "name",
  //   name,
  //   "listKey",
  //   listKey,
  //   "itemsOrder",
  //   itemsOrder,
  //   "resolvedElementJzodSchema",
  //   resolvedElementJzodSchema,
  // );

  const currentModel: MetaModel = useCurrentModel(currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const formik = useFormikContext<Record<string, any>>();
  // ??
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();
  const usedIndentLevel: number = indentLevel ?? 0;

  const arrayValueObject = resolvePathOnObject(formik.values, rootLesslistKeyArray);
  // log.info("array",arrayValueObject, "resolvedJzodSchema",props.resolvedJzodSchema);

  // const addNewArrayItem = useCallback(
  //   async (newItem: any) => {
  //     if (!rawJzodSchema || rawJzodSchema.type != "array") {
  //       throw new Error(
  //         "JzodArrayEditor addNewArrayItem called with a non-array schema: " +
  //           JSON.stringify(rawJzodSchema, null, 2)
  //       );
  //     }
  //     const newArrayValue = [
  //       ...arrayValueObject,
  //       getDefaultValueForJzodSchema(rawJzodSchema.definition),
  //     ];

  //     const newAttributeValue = {
  //       [rootLesslistKey]: newArrayValue,
  //     };
  //     log.info(
  //       "JzodArrayEditor addNewArrayItem",
  //       "listKey",
  //       listKey,
  //       "rootLesslistKey",
  //       rootLesslistKey,
  //       "rootLesslistKeyArray",
  //       rootLesslistKeyArray,
  //       // "newItem",
  //       // newItem,
  //       "rawJzodSchema",
  //       rawJzodSchema,
  //       "newAttributeValue",
  //       JSON.stringify(newAttributeValue, null, 2),
  //       "arrayValueObject",
  //       JSON.stringify(arrayValueObject, null, 2),
  //       "formik.values",
  //       JSON.stringify(formik.values, null, 2),
  //       "itemsOrder",
  //       JSON.stringify(itemsOrder, null, 2)
  //       // `"${newItemValue}"`,
  //     );
  //     // formik.setFieldValue(
  //     //   rootLesslistKey,
  //     //   [...arrayValueObject, newItemValue],
  //     //   // [...formik.values[rootLesslistKey], newItemValue],
  //     //   false // do not validate
  //     // );
  //     formik.setValues({
  //       ...formik.values,
  //       // [rootLesslistKey]: newArrayValue,
  //       ...newAttributeValue,
  //       // newArrayValue
  //       // [rootLesslistKey]: [...formik.values[rootLesslistKey], newItemValue],
  //     });
  //     setItemsOrder(getItemsOrder(newArrayValue, resolvedElementJzodSchema));

  //     // log.info(
  //     //   "JzodArrayEditor addNewArrayItem after setValues",
  //     //   "formik.values",
  //     //   JSON.stringify(formik.values, null, 2),
  //     // );
  //     setTimeout(() => {
  //       log.info("Updated formik.values:", JSON.stringify(formik.values, null, 2));
  //       log.info("Updated itemsOrder:", JSON.stringify(itemsOrder, null, 2));
  //     }, 0);
  //   },
  //   [
  //     rawJzodSchema,
  //     listKey,
  //     rootLesslistKey,
  //     rootLesslistKeyArray,
  //     formik.values,
  //     arrayValueObject,
  //     itemsOrder,
  //   ]
  // );
  const addNewArrayItem = useCallback(
    async () => {
      if (!rawJzodSchema || rawJzodSchema.type !== "array") {
        throw new Error(
          "JzodArrayEditor addNewArrayItem called with a non-array schema: " +
            JSON.stringify(rawJzodSchema, null, 2)
        );
      }

      const newItem = getDefaultValueForJzodSchema(rawJzodSchema.definition)
      // log.info(
      //   "JzodArrayEditor addNewArrayItem",
      //   "newItem",
      //   JSON.stringify(newItem, null, 2),
      // );
      // Create the new array value
      const newArrayValue = [
        ...arrayValueObject,
        newItem,
        // "value4",
        // "",
      ];

      // log.info(
      //   "JzodArrayEditor addNewArrayItem",
      //   "listKey",
      //   listKey,
      //   "rootLesslistKey",
      //   rootLesslistKey,
      //   "rootLesslistKeyArray",
      //   rootLesslistKeyArray,
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
      formik.setFieldValue("fieldName", newArrayValue, false); // Disable validation

      // Update the items order
      setItemsOrder(getItemsOrder(newArrayValue, resolvedElementJzodSchema));
    },
    [
      formik,
      rawJzodSchema,
      arrayValueObject,
      resolvedElementJzodSchema,
      setItemsOrder,
    ]
  );
  return (
    // <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
    // <div style={{ marginLeft: `calc(${indentShift})` }}>
    <div id={rootLesslistKey} key={rootLesslistKey}>
      <div>
        {label}:
        {rawJzodSchema.type == "array" ? (
          <div>
            {/* <SizedButton variant="text" name={listKey + ".add"} onClick={addNewArrayItem}> */}
            <SizedButton variant="text" aria-label={listKey + ".add"} onClick={addNewArrayItem}>
              <SizedAddBox />
            </SizedButton>
            add new item:
          </div>
        ) : (
          <div>JzodArrayEditor not an array! {JSON.stringify(rawJzodSchema)}</div>
        )}
      </div>
      <span>
        {" ["}{" "}
        <ExpandOrFoldObjectAttributes
          hiddenFormItems={hiddenFormItems}
          setHiddenFormItems={setHiddenFormItems}
          listKey={listKey}
        ></ExpandOrFoldObjectAttributes>
        <div
          id={listKey + ".inner"}
          key={listKey + ".inner"}
          style={{ display: hiddenFormItems[listKey] ? "none" : "block" }}
        >
          {(itemsOrder as number[])
            .map((i: number): [number, JzodElement] => [i, arrayValueObject[i]])
            .map((attributeParam: [number, JzodElement]) => {
              const index: number = attributeParam[0];
              // const attribute = attributeParam[1];
              // HACK HACK HACK
              // TODO: allow individualized schmema resolution for items of an array, in case the definition of the array schema is a union type
              // resulting type of an array type would be a tuple type.

              // log.info(
              //   "JzodArrayEditor array attribute",
              //   index,
              //   "attribute",
              //   attribute,
              // );
              const currentArrayElementRawDefinition: UnfoldJzodSchemaOnceReturnType | undefined =
                context.miroirFundamentalJzodSchema
                  ? // const currentArrayElementRawDefinition= context.miroirFundamentalJzodSchema
                    rawJzodSchema.type == "array"
                    ? unfoldJzodSchemaOnce(
                        context.miroirFundamentalJzodSchema,
                        rawJzodSchema.definition,
                        currentModel,
                        miroirMetaModel
                      )
                    : rawJzodSchema.type == "tuple"
                    ? unfoldJzodSchemaOnce(
                        context.miroirFundamentalJzodSchema as any, // OK: dereferencing prevents correct type-checking.
                        rawJzodSchema.definition[index],
                        currentModel,
                        miroirMetaModel
                      )
                    : undefined
                  : undefined;
              const resolutionError =
                currentArrayElementRawDefinition && currentArrayElementRawDefinition.status != "ok";
              // currentArrayElementRawDefinition.find((e) => e.status != "ok");
              if (!currentArrayElementRawDefinition || resolutionError) {
                throw new Error(
                  "JzodArrayEditor could not unfold jzod schema: " +
                    // JSON.stringify(currentArrayElementRawDefinition, null, 2)
                    JSON.stringify(currentArrayElementRawDefinition, null, 2) +
                    " at " +
                    JSON.stringify(resolutionError, null, 2)
                );
              }

              // log.info(
              //   "array [",
              //   index,
              //   "]",
              //   "found schema",
              //   JSON.stringify(currentArrayElementRawDefinition, null, 2),
              //   "for value",
              //   JSON.stringify(attributeParam[1], null, 2)
              // );
              return (
                <div key={rootLesslistKey + "." + index}>
                  {/* <div>
                    <pre>
                      JzodArray: {JSON.stringify(resolvedElementJzodSchema, null, 2)}
                    </pre>
                  </div> */}
                  <div
                    key={listKey + "." + index}
                    // style={{ marginLeft: `calc((${usedIndentLevel})*(${indentShift}))` }}
                    style={{ marginLeft: `calc(${indentShift})` }}
                  >
                    <JzodArrayEditorMoveButton
                      direction="down"
                      index={index}
                      itemsOrder={itemsOrder as number[]}
                      listKey={listKey}
                      setItemsOrder={setItemsOrder}
                      formHelperState={formHelperState}
                      setformHelperState={setformHelperState}
                    />
                    <JzodArrayEditorMoveButton
                      direction="up"
                      index={index}
                      itemsOrder={itemsOrder as number[]}
                      listKey={listKey}
                      setItemsOrder={setItemsOrder}
                      formHelperState={formHelperState}
                      setformHelperState={setformHelperState}
                    />
                    <JzodElementEditor
                      name={"" + index}
                      listKey={listKey + "." + index}
                      // currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                      indentLevel={usedIndentLevel + 1}
                      label={resolvedElementJzodSchema?.tag?.value?.defaultLabel}
                      paramMiroirFundamentalJzodSchema={paramMiroirFundamentalJzodSchema}
                      currentDeploymentUuid={currentDeploymentUuid}
                      currentApplicationSection={currentApplicationSection}
                      rootLesslistKey={
                        rootLesslistKey.length > 0 ? rootLesslistKey + "." + index : "" + index
                      }
                      rootLesslistKeyArray={[...rootLesslistKeyArray, "" + index]}
                      rawJzodSchema={currentArrayElementRawDefinition.element}
                      resolvedElementJzodSchema={
                        resolvedElementJzodSchema?.type == "array"
                          ? ((resolvedElementJzodSchema as JzodArray)?.definition as any)
                          : ((resolvedElementJzodSchema as JzodTuple).definition[
                              index
                            ] as JzodElement)
                      } // TODO: wrong type seen for props.resolvedJzodSchema! (cannot be undefined, really)
                      foreignKeyObjects={foreignKeyObjects}
                    />
                  </div>
                </div>
              );
            })}
        </div>
        <div style={{ marginLeft: `calc(${indentShift})` }}>{"]"}</div>
      </span>
    </div>
  );
};
