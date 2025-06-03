import { LoggerInterface, MiroirLoggerFactory, resolvePathOnObject, JzodElement, unfoldJzodSchemaOnce, JzodArray } from "miroir-core";
import React from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { ExpandOrFoldObjectAttributes, JzodElementEditor } from "./JzodElementEditor";
import { useMiroirContextService } from "../MiroirContextReactProvider";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface JzodLiteralEditorProps {
  name: string;
  listKey: string;
  rootLesslistKey: string;
  value: any;
  formik: any; // Replace with appropriate type for formik
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

export const JzodArrayEditor: React.FC<JzodLiteralEditorProps> = (
  props: JzodLiteralEditorProps
//   {
//   name,
//   listKey,
//   rootLesslistKey,
//   formik,
//   value,
//   onChange,
//   label,
// }
) => {
        // log.info("############################################### JzodElementEditor array rootLesslistKey", props.rootLesslistKey, "values", props.formik.values);
  const context = useMiroirContextService();
        
        log.info(
          "JzodElementEditor for array",
          props.listKey,
          // "attribute",
          // attribute[0],
          // "attributeListkey",
          // attributeListKey,
          "resolvedJzodSchema",
          props.resolvedElementJzodSchema,
          "rawJzodSchema",
          props.rawJzodSchema,
          "unfoldedRawSchema",
          unfoldedRawSchema
          // "currentAttributeDefinition",
          // currentAttributeDefinition,
          // "attributeRawJzodSchema",
          // attributeRawJzodSchema,
          // "currentAttributeRawDefinition",
          // currentAttributeRawDefinition.element
        );
        const arrayValueObject = resolvePathOnObject(
          props.formik.values,
          props.rootLesslistKeyArray
        );
        // log.info("array",arrayValueObject, "resolvedJzodSchema",props.resolvedJzodSchema);

        return (
          // <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
          // <div style={{ marginLeft: `calc(${indentShift})` }}>
          <span>
            {" ["}{" "}
            <ExpandOrFoldObjectAttributes
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              listKey={props.listKey}
            ></ExpandOrFoldObjectAttributes>
            {/* <div>itemsOrder {JSON.stringify(itemsOrder)}</div> */}
            <div
              id={props.listKey + ".inner"}
              style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}
            >
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
                  const currentArrayElementRawDefinition = context.miroirFundamentalJzodSchema
                    ? unfoldJzodSchemaOnce(
                        context.miroirFundamentalJzodSchema,
                        (props as any).rawJzodSchema.definition,
                        currentModel,
                        miroirMetaModel
                      )
                    : undefined;
                  if (
                    !currentArrayElementRawDefinition ||
                    currentArrayElementRawDefinition.status != "ok"
                  ) {
                    throw new Error(
                      "JzodElementEditor could not resolve jzod schema " +
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
                      key={props.listKey + "." + index}
                      // style={{ marginLeft: `calc((${usedIndentLevel})*(${indentShift}))` }}
                      style={{ marginLeft: `calc(${indentShift})` }}
                    >
                      <button
                        style={{ border: 0, backgroundColor: "transparent" }}
                        disabled={index == itemsOrder.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();

                          const currentItemIndex: number = index;
                          let newItemsOrder = itemsOrder.slice();
                          const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
                          newItemsOrder.splice(currentItemIndex + 1, 0, cutOut);
                          setformHelperState(
                            Object.assign(formHelperState, { [props.listKey]: newItemsOrder })
                          );
                          log.info(
                            "JzodElementEditor array moving item",
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
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();

                          const currentItemIndex: number = index;
                          let newItemsOrder = itemsOrder.slice();
                          const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
                          newItemsOrder.splice(currentItemIndex - 1, 0, cutOut);
                          setformHelperState(
                            Object.assign(formHelperState, { [props.listKey]: newItemsOrder })
                          );
                          log.info(
                            "JzodElementEditor array moving item",
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
                        listKey={props.listKey + "." + index}
                        // currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                        indentLevel={usedIndentLevel + 1}
                        label={props.resolvedElementJzodSchema?.tag?.value?.defaultLabel}
                        paramMiroirFundamentalJzodSchema={props.paramMiroirFundamentalJzodSchema}
                        currentDeploymentUuid={props.currentDeploymentUuid}
                        currentApplicationSection={props.currentApplicationSection}
                        rootLesslistKey={
                          props.rootLesslistKey.length > 0
                            ? props.rootLesslistKey + "." + index
                            : "" + index
                        }
                        rootLesslistKeyArray={[...props.rootLesslistKeyArray, "" + index]}
                        rawJzodSchema={currentArrayElementRawDefinition.element}
                        resolvedElementJzodSchema={
                          (props.resolvedElementJzodSchema as JzodArray)?.definition as any
                        } // TODO: wrong type seen for props.resolvedJzodSchema! (cannot be undefined, really)
                        foreignKeyObjects={props.foreignKeyObjects}
                        handleChange={props.handleChange}
                        formik={props.formik}
                        setFormState={props.setFormState}
                        formState={props.formState}
                      />
                    </div>
                  );
                })}
            </div>
            <div style={{ marginLeft: `calc(${indentShift})` }}>{"]"}</div>
          </span>
        );
      };
