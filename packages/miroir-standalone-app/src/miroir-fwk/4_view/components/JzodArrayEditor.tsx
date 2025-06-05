import { adminConfigurationDeploymentMiroir, JzodArray, JzodElement, LoggerInterface, MetaModel, MiroirLoggerFactory, resolvePathOnObject, unfoldJzodSchemaOnce } from "miroir-core";
import React from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { useMiroirContextformHelperState, useMiroirContextService } from "../MiroirContextReactProvider";
import { useCurrentModel } from "../ReduxHooks";
import { ExpandOrFoldObjectAttributes, JzodElementEditor } from "./JzodElementEditor";
import { JzodArrayEditorProps } from "./JzodElementEditorInterface";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

export const indentShift = "1em + 4px"; // TODO: centralize style

let jzodArrayEditorRenderCount: number = 0;
export const JzodArrayEditor: React.FC<JzodArrayEditorProps> = (
  // props: JzodArrayEditorProps
  {
    name,
    label,
    listKey,
    rootLesslistKey,
    rootLesslistKeyArray,
    formik, // ??
    // formState,
    setFormState,
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
    handleChange,
  }
) => {
  // log.info("############################################### JzodArrayEditor array rootLesslistKey", props.rootLesslistKey, "values", props.formik.values);
  jzodArrayEditorRenderCount++;
  const context = useMiroirContextService();

  log.info(
    "JzodArrayEditor render",
    jzodArrayEditorRenderCount,
    "name",
    name,
    "listKey",
    listKey,
    "itemsOrder",
    itemsOrder,
    // // "context",
    // // context,
    // // "attribute",
    // // attribute[0],
    // // "attributeListkey",
    // // attributeListKey,
    // "rawJzodSchema",
    // rawJzodSchema,
    // "resolvedJzodSchema",
    // resolvedElementJzodSchema, //TODO
    // // "unfoldedRawSchema"
    // // unfoldedRawSchema
    // // "currentAttributeDefinition",
    // // currentAttributeDefinition,
    // // "attributeRawJzodSchema",
    // // attributeRawJzodSchema,
    // // "currentAttributeRawDefinition",
    // // currentAttributeRawDefinition.element
  );

  const currentModel: MetaModel = useCurrentModel(currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();
  // const [hiddenFormItems, setHiddenFormItems] = useState<{ [k: string]: boolean }>({});
  const usedIndentLevel: number = indentLevel ?? 0;

  const arrayValueObject = resolvePathOnObject(
    formik.values,
    // formState,
    rootLesslistKeyArray
  );
  // log.info("array",arrayValueObject, "resolvedJzodSchema",props.resolvedJzodSchema);

  return (
    // <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
    // <div style={{ marginLeft: `calc(${indentShift})` }}>
    <>
    <div>{label}:</div>
    <span>
      {" ["}{" "}
      <ExpandOrFoldObjectAttributes
        hiddenFormItems={hiddenFormItems}
        setHiddenFormItems={setHiddenFormItems}
        listKey={listKey}
      ></ExpandOrFoldObjectAttributes>
      {/* <div>itemsOrder {JSON.stringify(itemsOrder)}</div> */}
      <div id={listKey + ".inner"} style={{ display: hiddenFormItems[listKey] ? "none" : "block" }}>
        {/* {props.initialValuesObject.map((attribute: JzodElement, index: number) => { */}
        {(itemsOrder as number[])
          .map((i: number): [number, JzodElement] => [i, arrayValueObject[i]])
          .map((attributeParam: [number, JzodElement]) => {
            const index: number = attributeParam[0];
            const attribute = attributeParam[1];
            // HACK HACK HACK
            // TODO: allow individualized schmema resolution for items of an array, in case the definition of the array schema is a union type
            // resulting type of an array type would be a tuple type.

            // const currentAttributeJzodSchema: JzodElement = props.resolvedJzodSchema.definition
            log.info(
              "JzodArrayEditor array attribute",
              index,
              "attribute",
              attribute,
            );
            const currentArrayElementRawDefinition = context.miroirFundamentalJzodSchema
              ? unfoldJzodSchemaOnce(
                  context.miroirFundamentalJzodSchema,
                  rawJzodSchema.definition,
                  currentModel,
                  miroirMetaModel
                )
              : undefined;
            if (
              !currentArrayElementRawDefinition ||
              currentArrayElementRawDefinition.status != "ok"
            ) {
              throw new Error(
                "JzodArrayEditor could not unfold jzod schema: " +
                  JSON.stringify(currentArrayElementRawDefinition, null, 2)
              );
            }

            // log.info(
            //   "array [",
            //   index,
            //   "]",
            //   attribute,
            //   "type",
            //   attribute.type,
            //   "found schema",
            //   props.resolvedJzodSchema
            // );
            return (
              <div
                key={listKey + "." + index}
                // style={{ marginLeft: `calc((${usedIndentLevel})*(${indentShift}))` }}
                style={{ marginLeft: `calc(${indentShift})` }}
              >
                <button
                  style={{ border: 0, backgroundColor: "transparent" }}
                  role={listKey + ".button.down"}
                  disabled={index == itemsOrder.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const currentItemIndex: number = index;
                    let newItemsOrder = itemsOrder.slice();
                    const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
                    newItemsOrder.splice(currentItemIndex + 1, 0, cutOut);
                    setformHelperState(
                      Object.assign(formHelperState, { [listKey]: newItemsOrder })
                    );
                    log.info(
                      "JzodArrayEditor array moving down item",
                      currentItemIndex,
                      "in object with items",
                      itemsOrder,
                      "cutOut",
                      cutOut,
                      "new order",
                      newItemsOrder
                    );
                    setItemsOrder(newItemsOrder);
                  }}
                >
                  {"v"}
                </button>
                <button
                  style={{ border: 0, backgroundColor: "transparent" }}
                  disabled={index == 0}
                  role={listKey + ".button.up"}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const currentItemIndex: number = index;
                    let newItemsOrder = itemsOrder.slice();
                    const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
                    newItemsOrder.splice(currentItemIndex - 1, 0, cutOut);
                    setformHelperState(
                      Object.assign(formHelperState, { [listKey]: newItemsOrder })
                    );
                    log.info(
                      "JzodArrayEditor array moving up item",
                      currentItemIndex,
                      "in object with items",
                      itemsOrder,
                      "cutOut",
                      cutOut,
                      "new order",
                      newItemsOrder
                    );
                    setItemsOrder(newItemsOrder);
                  }}
                >
                  {"^"}
                </button>
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
                    (resolvedElementJzodSchema as JzodArray)?.definition as any
                  } // TODO: wrong type seen for props.resolvedJzodSchema! (cannot be undefined, really)
                  foreignKeyObjects={foreignKeyObjects}
                  handleChange={handleChange}
                  formik={formik}
                  setFormState={setFormState}
                  // formState={formState}
                />
              </div>
            );
          })}
      </div>
      <div style={{ marginLeft: `calc(${indentShift})` }}>{"]"}</div>
    </span>
    </>
  );
};
