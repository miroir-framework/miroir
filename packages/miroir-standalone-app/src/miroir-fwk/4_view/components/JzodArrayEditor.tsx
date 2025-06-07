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
  const isDisabled = direction === "up" 
    ? index === 0 
    : index === itemsOrder.length - 1;
  
  const handleClick = (e: React.MouseEvent) => {
    const currentItemIndex: number = index;
    let newItemsOrder = itemsOrder.slice();
    const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
    
    // Insert at new position based on direction
    const newPosition = direction === "up" 
      ? currentItemIndex - 1 
      : currentItemIndex + 1;
    
    newItemsOrder.splice(newPosition, 0, cutOut);
    
    setformHelperState(
      Object.assign(formHelperState, { [listKey]: newItemsOrder })
    );
    
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
    // handleChange,
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
  // );

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

            // log.info(
            //   "JzodArrayEditor array attribute",
            //   index,
            //   "attribute",
            //   attribute,
            // );
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
                    (resolvedElementJzodSchema as JzodArray)?.definition as any
                  } // TODO: wrong type seen for props.resolvedJzodSchema! (cannot be undefined, really)
                  foreignKeyObjects={foreignKeyObjects}
                  // handleChange={handleChange}
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
