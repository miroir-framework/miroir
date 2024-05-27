import styled from "@emotion/styled";
import AddBoxIcon from '@mui/icons-material/AddBox';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Button, Checkbox, MenuItem, Select } from "@mui/material";

import { useCallback, useMemo, useState } from "react";

// import { FieldValues, UseFormRegister, UseFormSetValue, useFormContext } from "react-hook-form";


import {
  ApplicationSection,
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ResolvedJzodSchemaReturnType,
  Uuid,
  adminConfigurationDeploymentMiroir,
  alterObject,
  getDefaultValueForJzodSchema,
  getLoggerName,
  resolveReferencesForJzodSchemaAndValueObject,
  unfoldJzodSchemaOnce
} from "miroir-core";

import { JzodUnion } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
import { packageName } from "../../../constants";
import { useMiroirContextService, useMiroirContextformHelperState } from "../MiroirContextReactProvider";
import { useCurrentModel } from '../ReduxHooks';
import { cleanLevel } from "../constants";


const loggerName: string = getLoggerName(packageName, cleanLevel,"JzodElementEditor");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const noValue = { uuid: "31f3a03a-f150-416d-9315-d3a752cb4eb4", name: "no value", parentUuid: "" } as EntityInstance;


// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JzodElementEditorProps {
  label?: string;
  name: string,
  listKey: string,
  rootLesslistKey: string,
  rootLesslistKeyArray: string[],
  indentLevel?:number,
  unresolvedJzodSchema?: JzodElement | undefined,
  unionInformation?: {
    jzodSchema: JzodUnion,
    discriminator: string,
    discriminatorValues: string[],
    subDiscriminator?: string,
    subDiscriminatorValues?: string[],
    setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
  } | undefined,
  rawJzodSchema: JzodElement | undefined,
  resolvedJzodSchema: JzodElement | undefined,
  foreignKeyObjects: Record<string,EntityInstancesUuidIndex>,
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection,
  formik: any,
  setFormState: React.Dispatch<React.SetStateAction<{
    [k: string]: any;
  }>>,
  formState: any,
}

// export interface JzodElementEditorWithButtonPropsFormik extends JzodElementFormEditorCorePropsFormik {
//   showButton: true;
// }

// export interface JzodElementEditorWithoutButtonPropsFormik extends JzodElementFormEditorCorePropsFormik {
//   showButton: false;
// }

// export type JzodElementEditorProps = JzodElementFormEditorCoreProps

// // ################################################################################################
// export function getUnionDiscriminantValues(
//   jzodUnion:JzodUnion, 
//   rootJzodSchema:JzodObject, 
//   currentModel:MetaModel,
//   miroirFundamentalJzodSchema: JzodSchema,
// ) {
//   return jzodUnion.discriminator
//     ? {
//         [jzodUnion.discriminator]:jzodUnion.definition.map(
//           (e: JzodElement) => {
//             const resolvedSchema =
//               e.type == "schemaReference" ? resolveJzodSchemaReference(miroirFundamentalJzodSchema, e, currentModel, rootJzodSchema) : e;
//             return e.type;
//           }
//         )
//       }
//     : {};
// }

// ################################################################################################
export const ExpandOrFold = (
  props: {
    hiddenFormItems: {[k: string]: boolean},
    // setHiddenFormItems: any,
    setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
    >,
    listKey: string,
  }
): JSX.Element => {
  return (
    <button
      // style={{maxHeight:"20px",maxWidth:"20px"}}
      // style={{display:"inline-flex"}}
      style={{ border: 0, backgroundColor: "transparent" }}
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
        <ExpandMore sx={{ maxWidth: "15px", maxHeight: "15px" }} />
      ) : (
        <ExpandLess sx={{ maxWidth: "15px", maxHeight: "15px" }} />
      )}
    </button>
  );
}

// ################################################################################################
function getValue(valueObject:any, path: string[]) {
    // log.info("getValue called with", valueObject, "path", path)
    return path.reduce((acc, curr, index) => {
      if (index == path.length && (acc == undefined || acc[curr] == undefined)) {
        throw new Error(
          "getValue value object=" +
            valueObject +
            ", path=" +
            path +
            " either attribute " +
            curr +
            " not found in " +
            acc +
            " or not last in path but leading to undefined " +
            curr[acc]
        );
      } else {
        return acc[curr];
      }
    }, valueObject);
}

// #####################################################################################################
const SizedButton = styled(Button)(({ theme }) => ({height: "1em", width: "auto", padding: "0px"}));
const SizedAddBoxIcon = styled(AddBoxIcon)(({ theme }) => ({height: "1em", width: "1em"}));

// const Item = styled(Paper)(({ theme }) => ({
//   backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
//   ...theme.typography.body2,
//   padding: theme.spacing(1),
//   textAlign: "left",
//   display: "flex",
//   maxHeight: "50vh",
//   // height: '80vh',
//   color: theme.palette.text.secondary,
// }));

const labelStyle = {
  paddingRight: "10px"
}

const StyledLabel = styled('label')(
  ({ theme }) => ({
    ...theme,
    paddingRight: "10px"
  })
)

const indentShift =  "1em + 4px";

// #####################################################################################################
function getItemsOrder(currentValue:any, resolvedJzodSchema: JzodElement | undefined) {
  return resolvedJzodSchema?.type == "object" && typeof(currentValue) == "object" && currentValue !== null?
  Object.keys(currentValue)
:
  (
    Array.isArray(currentValue)?currentValue.map((e:any, k:number) => k):[]
  )
}

// #####################################################################################################
const objectTypes: string[] = ["record", "object", "union"];
const enumTypes: string[] = ["enum", "literal"]; 

let count = 0;
// #####################################################################################################
export const JzodElementEditor = (
  props: JzodElementEditorProps
): JSX.Element => {
  count++;
  // log.info("####### JzodElementEditor", props.listKey, "count", count, props.rawJzodSchema?.type, props.rawJzodSchema);
  const context = useMiroirContextService();

  // const [selectedOption, setSelectedOption] = useState({label:props.name,value:props.initialValuesObject});
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const [hiddenFormItems,setHiddenFormItems] = useState<{[k:string]:boolean}>({})

  const currentModel: MetaModel = useCurrentModel(props.currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const displayedLabel: string = props.label??props.name;

  const usedIndentLevel: number = props.indentLevel?props.indentLevel:0;
  // log.info(
  //   "rendering",
  //   props.listKey,
  //   "type=",
  //   props.resolvedJzodSchema?.type,
  //   "jzodSchema=",
  //   props.resolvedJzodSchema,
  //   "props=",
  //   props
  // );

  const currentValue = getValue(props.formState,props.rootLesslistKeyArray);
  // log.info(
  //   "rendering",
  //   props.listKey,
  //   "currentValue",
  //   currentValue,
  // );

  const [itemsOrder, setItemsOrder] = useState<any[]>(
    getItemsOrder(currentValue, props.resolvedJzodSchema)
  );

  // log.info(
  //   "rendering",
  //   props.listKey,
  //   "itemsOrder",
  //   itemsOrder,
  // );
  if (props.rawJzodSchema as any as string == "never") {
    log.warn("found never!", props.rootLesslistKey)
  }
  let unfoldedRawSchemaReturnType:ResolvedJzodSchemaReturnType | undefined
  try {
    unfoldedRawSchemaReturnType = useMemo(
      ()=> {
        log.info("unfolding rawJzodSchema for", props.listKey, "rawJzodSchema", props.rawJzodSchema)
        const result = unfoldJzodSchemaOnce(
          context.miroirFundamentalJzodSchema,
          // props.rawJzodSchema?.type == "object"?props.rawJzodSchema.definition[attribute[0]]:props.rawJzodSchema?.definition as any,
          props.rawJzodSchema,
          currentModel,
          miroirMetaModel
        );
        log.info("unfolded rawJzodSchema for", props.listKey, "props.rawJzodSchema", props.rawJzodSchema, "result", result)
        return result
      },
      [props.rawJzodSchema, props.listKey, context.miroirFundamentalJzodSchema, currentModel, miroirMetaModel]
    ) ;
  } catch (e) {
    log.info("found never!", props.rootLesslistKey)
  }

  if (!unfoldedRawSchemaReturnType || unfoldedRawSchemaReturnType.status == "error") {
    throw new Error(
      "JzodElementEditor could not unfold raw schema " +
        JSON.stringify(props.rawJzodSchema, null, 2) +
        " result " +
        JSON.stringify(unfoldedRawSchemaReturnType, null, 2)
    );
  }
  const unfoldedRawSchema:JzodElement = unfoldedRawSchemaReturnType.element
  // log.info(
  //   "JzodElementEditor",
  //   props.listKey,
  //   "rawJzodSchema",
  //   props.rawJzodSchema,
  //   "props.resolvedJzodSchema",
  //   props.resolvedJzodSchema,
  //   "unfoldedRawSchema",
  //   unfoldedRawSchema,
  // );
  const objectUniondiscriminatorValues:string[] = useMemo(
    () => {
      if (
        props.resolvedJzodSchema?.type == "object" &&
        unfoldedRawSchema &&
        unfoldedRawSchema.type == "union" &&
        unfoldedRawSchema.discriminator
      ) {
        return [
          ...new Set(
            unfoldedRawSchema.definition.map(
              (a) => (a.definition as any)[(unfoldedRawSchema as any).discriminator].definition
            )
          ),
        ]
      } else {
        return []
      }      
    },
    [props.resolvedJzodSchema, unfoldedRawSchema]
  );
  const objectUnionSubDiscriminatorValues:string[] = useMemo(
    () => {
      if (
        props.resolvedJzodSchema?.type == "object" &&
        unfoldedRawSchema &&
        unfoldedRawSchema.type == "union" &&
        unfoldedRawSchema.subDiscriminator
      ) {
        const subDiscriminator: string = (unfoldedRawSchema as any).subDiscriminator;
        return unfoldedRawSchema.definition
          .filter(
            (a) => typeof (a.definition as any)[subDiscriminator].definition == "string"
          ).map(
          (a) => (a.definition as any)[subDiscriminator].definition
        );
      } else {
        return []
      }      
    },
    [props.resolvedJzodSchema, unfoldedRawSchema]
  );

  // const unionPlainAttributeSchema:JzodElement = useMemo(
  //   () => {
  //     if (
  //       props.resolvedJzodSchema?.type == "object" &&
  //       unfoldedRawSchema &&
  //       unfoldedRawSchema.type == "union" &&
  //       unfoldedRawSchema.discriminator
  //     ) {
  //       return unfoldedRawSchema.definition.find(
  //         (a) => (a.definition as any)[(unfoldedRawSchema as any).discriminator].definition
  //       )
  //     }
  //   }
  // )

  if (props.resolvedJzodSchema && props.rawJzodSchema) {
    if (
      props.resolvedJzodSchema.type != props.rawJzodSchema?.type &&
      (
        (
          props.resolvedJzodSchema.type == "object" &&
          !objectTypes.includes(props.rawJzodSchema.type)
        )
        ||
        (
          props.rawJzodSchema.type == "enum" &&
          !enumTypes.includes(props.resolvedJzodSchema.type)
        )
      )
    ) {
      throw new Error(
        "JzodElementEditor mismatching jzod schemas, resolved schema " + 
        JSON.stringify(props.resolvedJzodSchema, null, 2) +
        " raw schema " +
        JSON.stringify(props.rawJzodSchema, null, 2)
      );
    }

    const allObjectUnionAttributes: string[] = useMemo(
      () => {
        if (props.resolvedJzodSchema?.type == "object") {
          switch (unfoldedRawSchema.type) {
            case "record": {
              return ["ANY"]
              break;
            }
            case "union": {
              return unfoldedRawSchema.definition.map(
                (a: any) => a.definition[(unfoldedRawSchema as any).discriminator as string].definition
              );
              break;
            }
            case "object": {
              return Object.keys(unfoldedRawSchema.definition);
              break;
            }
            case "function":
            case "array":
            case "simpleType":
            case "enum":
            case "lazy":
            case "literal":
            case "intersection":
            case "map":
            case "promise":
            case "schemaReference":
            case "set":
            case "tuple":
            default: {
              return Object.keys(unfoldedRawSchema.definition) // really???
              break;
            }
          }
        } else {
          return []
        }
      },
      [props.resolvedJzodSchema, unfoldedRawSchema]
    )

    const missingAttributes: string[] = useMemo(
      () => {
        if (props.resolvedJzodSchema?.type == "object" && unfoldedRawSchema.type == "object") {
          const currentObjectAttributes = Object.keys(currentValue);
          return Object.entries(unfoldedRawSchema.definition).filter(a => a[1].optional).filter(a => !currentObjectAttributes.includes(a[0])).map(a => a[0]);
        }
        return [];
      },
      [unfoldedRawSchema, currentValue]
    )

    const unionInformation=useMemo(
      () => {
        return unfoldedRawSchema.type == "union"
          ? {
              jzodSchema: unfoldedRawSchema,
              discriminator: unfoldedRawSchema.discriminator as string,
              subDiscriminator: unfoldedRawSchema.subDiscriminator as string,
              discriminatorValues: objectUniondiscriminatorValues,
              subDiscriminatorValues: objectUnionSubDiscriminatorValues,
              setItemsOrder: setItemsOrder
            }
          : undefined;
      },
      [unfoldedRawSchema, objectUniondiscriminatorValues, objectUnionSubDiscriminatorValues]
    )

    const stringSelectList = useMemo(
      () => {
        if (
          props.resolvedJzodSchema?.type == "simpleType" &&
          props.resolvedJzodSchema.extra?.targetEntity
        ) {
          return [
            [noValue.uuid, noValue] as [string, EntityInstance],
            ...(Object.entries(props.foreignKeyObjects[props.resolvedJzodSchema.extra.targetEntity] ?? {}))
          ]
        }
        return []
      },
      [props.resolvedJzodSchema, ]
    );

    // ############################################################################################
    switch (props.resolvedJzodSchema.type) {
      case "object": {
        let resolvedJzodSchema: JzodObject = props.resolvedJzodSchema;
        if (unfoldedRawSchema.type == "union" && !unfoldedRawSchema.discriminator) {
          throw new Error(
            "JzodElementEditor could not compute allSchemaObjectAttributes, no discriminator found in " + 
            JSON.stringify(unfoldedRawSchema, null, 2)
          );
        }

        const onClick = useCallback(
          async () => {
            log.info(
              "clicked!",
              props.listKey,
              itemsOrder,
              Object.keys(resolvedJzodSchema.definition),
              "formState",
              props.formState,
              "formik",
              props.formik.values
            );
            const defaultValue = getDefaultValueForJzodSchema(
              {
                type: "simpleType",
                definition: "string"
              }
            );
            // useEffect(()=>props.setFormState({...props.formik.values, "deploymentUuid2": "test!"}))
            const newFormState: any =
              missingAttributes.length > 0
                ? { ...props.formik.values, [missingAttributes[0]]: "test!" }
                : props.formik.values;
            props.setFormState(newFormState);
            const currentValue = getValue(newFormState,props.rootLesslistKeyArray);
            setItemsOrder(getItemsOrder(currentValue, props.resolvedJzodSchema))
            // await props.setFormState({"deploymentUuid2": "test!"});
            // await props.formik.setFieldValue("deploymentUuid2", "test!");
            log.info(
              "clicked2!",
              props.listKey,
              itemsOrder,
              Object.keys(resolvedJzodSchema.definition),
              "formState",
              props.formState,
              "formik",
              props.formik.values
            );
          },
          [ props, itemsOrder, resolvedJzodSchema ]
        )
        // ########################################################################################
        // const allSchemaObjectAttributes = unfoldedRawSchema.type == "record"?["ANY"]:
        return (
          <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
            {/* <div>
            JzodElementEditor rendered! {count}
            </div> */}
            {/* {props.listKey}:{'\{'} */}
            {displayedLabel}:{" {"}
            {/* <SizedButton variant="text" onClick={onClick}>
              <SizedAddBoxIcon/>
            </SizedButton> */}
            {/* {" "}{props.listKey} */}
            {" "}{count}
            {/* <br />
            {" unfoldedRawSchema:"} {JSON.stringify(unfoldedRawSchema)} 
            <br />
            {"resolvedSchema:"} {JSON.stringify(props.resolvedJzodSchema)} 
            <br />
            itemsOrder: {JSON.stringify(itemsOrder)} */}
            {/* {" "} {JSON.stringify(allSchemaObjectAttributes)} {JSON.stringify(missingAttributes)} */}
            <ExpandOrFold
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              listKey={props.listKey}
            ></ExpandOrFold>
            <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
              <div>
                {
                  itemsOrder
                    .map((i): [string, JzodElement] => [i, props.formik.values[props.rootLesslistKey.length > 0? (props.rootLesslistKey + "." + i[0]):i[0]]])
                    .map((attribute: [string, JzodElement]) => {
                      const currentAttributeDefinition = resolvedJzodSchema.definition[attribute[0]];
                      const attributeListKey = props.listKey + "." + attribute[0]
                      let attributeRawJzodSchema: JzodElement

                      // switch (rawJzodSchema?.type) {
                      if (!unfoldedRawSchema) {
                        throw new Error(
                          "JzodElementEditor unfoldedRawSchema undefined for object " +
                            props.listKey +
                            " attribute " +
                            attribute[0] +
                            " attributeListKey " +
                            attributeListKey
                        );
                      }
                      // determine raw schema of attribute
                      switch (unfoldedRawSchema?.type) {
                        case "object": {
                          // jzodSchemaToUnfold = rawJzodSchema.definition[attribute[0]]
                          attributeRawJzodSchema = unfoldedRawSchema.definition[attribute[0]]
                          break;
                        }
                        case "record": {
                          // jzodSchemaToUnfold = rawJzodSchema.definition
                          attributeRawJzodSchema = unfoldedRawSchema.definition
                          break;
                        }
                        case "union": {
                          // if (!rawJzodSchema.discriminator) {
                          if (!unfoldedRawSchema.discriminator) {
                            throw new Error(
                              "no discriminator found, could not choose branch of union type for object " +
                                JSON.stringify(unfoldedRawSchema, null, 2) +
                                " " +
                                JSON.stringify(props.resolvedJzodSchema, null, 2)
                            );
                          }
                          // TODO: resolve using subDiscriminator
                          const discriminator: string = (unfoldedRawSchema as any).discriminator
                          const subDiscriminator: string = (unfoldedRawSchema as any).subDiscriminator
                          let concreteObjectRawJzodSchema: JzodObject | undefined
                          if (attribute[0] == discriminator || (currentValue[discriminator] == "simpleType" && attribute[0] == subDiscriminator)) {
                            attributeRawJzodSchema = { type: "literal", definition: "literal"}; // definition is not taken into account, possible values come from unionInformation
                          } else {
                            const discriminatorValue = (props.resolvedJzodSchema?.definition as any)[discriminator].definition;
                            const subDiscriminatorValue = (props.resolvedJzodSchema?.definition as any)[subDiscriminator].definition;
                            // const compareValue = attribute[0] == discriminator?(props.resolvedJzodSchema?.definition as any)[discriminator].definition:
                            // (props.resolvedJzodSchema?.definition as any)[discriminator].definition

                            
                            // (props.resolvedJzodSchema?.definition as any)[attribute[0]][discriminator]
                            // (props.resolvedJzodSchema?.definition as any)[discriminator]
                            //   .definition
                            if (subDiscriminator) {
                              concreteObjectRawJzodSchema = unfoldedRawSchema.definition.find(
                                (a) => (a.definition as any)[discriminator].definition == discriminatorValue && (a.definition as any)[subDiscriminator].definition == subDiscriminatorValue
                              ) as any;
                            } else {
                              // discriminator only
                              concreteObjectRawJzodSchema = unfoldedRawSchema.definition.find(
                                (a) => (a.definition as any)[discriminator].definition == discriminatorValue
                              ) as any;
                            }
                            if (!concreteObjectRawJzodSchema) {
                              throw new Error("JzodElementEditor could not find concrete raw schema for " + props.listKey + " attribute " + attribute[0] + " listKey " + attributeListKey);
                            }
                            attributeRawJzodSchema = concreteObjectRawJzodSchema.definition[attribute[0]]
                          }
                          log.info(
                            "JzodElementEditor attribute for object",
                            currentValue,
                            "listKey",
                            props.listKey,
                            "attribute",
                            attribute[0],
                            "attributeListkey",
                            attributeListKey,
                            "props.resolvedJzodSchema",
                            props.resolvedJzodSchema,
                            "unfoldedRawSchema",
                            unfoldedRawSchema,
                            "concreteObjectRawJzodSchema",
                            concreteObjectRawJzodSchema,
                            "attributeRawJzodSchema",
                            attributeRawJzodSchema,
                          );
                          // log.info("unfoldedRawSchema",unfoldedRawSchema,"attributeRawJzodSchema", attributeRawJzodSchema)
                          break;
                        }
                        default: {
                          throw new Error(
                            "JzodElementEditor unfoldedRawSchema.type incorrect for object " +
                              props.listKey +
                              " attribute " +
                              attribute[0] +
                              " attributeListKey " +
                              attributeListKey
                          );
                          
                          // jzodSchemaToUnfold = props.rawJzodSchema as any // linter complains about props.rawJzodSchema being potentially undefined in spite of test above
                          attributeRawJzodSchema = unfoldedRawSchema // linter complains about props.rawJzodSchema being potentially undefined in spite of test above
                          break;
                        }
                      }
                      log.info(
                        "JzodElementEditor resolved for object",
                        props.listKey,
                        "attribute",
                        attribute[0],
                        "attributeListkey",
                        attributeListKey,
                        "resolvedJzodSchema",
                        props.resolvedJzodSchema,
                        "rawJzodSchema",
                        props.rawJzodSchema,
                        "unfoldedRawSchema",
                        unfoldedRawSchema,
                        "currentAttributeDefinition",
                        currentAttributeDefinition,
                        "attributeRawJzodSchema",
                        attributeRawJzodSchema,
                        // "currentAttributeRawDefinition",
                        // currentAttributeRawDefinition.element
                      );
                      return (
                        <div key={attributeListKey} style={{ marginLeft: `calc((${usedIndentLevel} + 1)*(${indentShift}))` }}>
                          <div>
                            <JzodElementEditor
                              name={attribute[0]}
                              listKey={props.listKey + "." + attribute[0]}
                              rootLesslistKey={
                                props.rootLesslistKey.length > 0
                                  ? props.rootLesslistKey + "." + attribute[0]
                                  : attribute[0]
                              }
                              rootLesslistKeyArray={[...props.rootLesslistKeyArray, attribute[0]]}
                              indentLevel={usedIndentLevel}
                              label={currentAttributeDefinition?.extra?.defaultLabel}
                              currentDeploymentUuid={props.currentDeploymentUuid}
                              rawJzodSchema={attributeRawJzodSchema}
                              unionInformation={unionInformation}
                              currentApplicationSection={props.currentApplicationSection}
                              resolvedJzodSchema={currentAttributeDefinition}
                              foreignKeyObjects={props.foreignKeyObjects}
                              formik={props.formik}
                              setFormState={props.setFormState}
                              formState={props.formState}
                            />
                          </div>
                        </div>
                      );
                    }
                  )
                }
              </div>
              {
                missingAttributes.length > 0 ?
                (
                  <div style={{ marginLeft: `calc(${indentShift})` }}>
                  <SizedButton variant="text" onClick={onClick}>
                    <SizedAddBoxIcon/>
                  </SizedButton> {JSON.stringify(missingAttributes)}
                  </div>
                )
                : <></>
              }
              </div>
            {"}"} 
          </div>
        );
        break;
      }
      case "array": {
        // log.info("############################################### JzodElementEditor array rootLesslistKey", props.rootLesslistKey, "values", props.formik.values);
        log.info(
          "JzodElementEditor for array",
          props.listKey,
          // "attribute",
          // attribute[0],
          // "attributeListkey",
          // attributeListKey,
          "resolvedJzodSchema",
          props.resolvedJzodSchema,
          "rawJzodSchema",
          props.rawJzodSchema,
          "unfoldedRawSchema",
          unfoldedRawSchema,
          // "currentAttributeDefinition",
          // currentAttributeDefinition,
          // "attributeRawJzodSchema",
          // attributeRawJzodSchema,
          // "currentAttributeRawDefinition",
          // currentAttributeRawDefinition.element
        );
        const arrayValueObject = getValue(props.formik.values,props.rootLesslistKeyArray);
        // log.info("array",arrayValueObject, "resolvedJzodSchema",props.resolvedJzodSchema);

        
        return (
          <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
            {displayedLabel}:{" ["}{" "}
            <ExpandOrFold
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              listKey={props.listKey}
            ></ExpandOrFold>
            {/* <div>itemsOrder {JSON.stringify(itemsOrder)}</div> */}
            <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
              {/* {props.initialValuesObject.map((attribute: JzodElement, index: number) => { */}
              {(itemsOrder as number[])
                .map((i: number):[number, JzodElement] => [i, arrayValueObject[i]])
                .map((attributeParam: [number, JzodElement]) => {
                  const index: number = attributeParam[0];
                  const attribute = attributeParam[1];
                  // HACK HACK HACK
                  // TODO: allow individualized schmema resolution for items of an array, in case the definition of the array schema is a union type
                  // resulting type of an array type would be a tuple type.

                  // const currentAttributeJzodSchema: JzodElement = props.resolvedJzodSchema.definition
                  const currentArrayElementRawDefinition = unfoldJzodSchemaOnce(
                    context.miroirFundamentalJzodSchema,
                    (props as any).rawJzodSchema.definition,
                    currentModel,
                    miroirMetaModel
                  );
                  if (currentArrayElementRawDefinition.status != "ok") {
                    throw new Error("JzodElementEditor could not resolve jzod schema " + JSON.stringify(currentArrayElementRawDefinition, null, 2));
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
                      style={{ marginLeft: `calc((${usedIndentLevel} + 1)*(${indentShift}))` }}
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
                          setformHelperState(Object.assign(formHelperState, { [props.listKey]: newItemsOrder }));
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
                          setformHelperState(Object.assign(formHelperState, { [props.listKey]: newItemsOrder }));
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
                        indentLevel={usedIndentLevel}
                        label={props.resolvedJzodSchema?.extra?.defaultLabel}
                        currentDeploymentUuid={props.currentDeploymentUuid}
                        currentApplicationSection={props.currentApplicationSection}
                        rootLesslistKey={props.rootLesslistKey.length > 0? (props.rootLesslistKey + "." + index):("" +index)}
                        rootLesslistKeyArray={[...props.rootLesslistKeyArray,""+index]}
                        rawJzodSchema={currentArrayElementRawDefinition.element}
                        resolvedJzodSchema={props.resolvedJzodSchema?.definition as any} // TODO: wrong type seen for props.resolvedJzodSchema! (cannot be undefined, really)
                        foreignKeyObjects={props.foreignKeyObjects}
                        formik={props.formik}
                        setFormState={props.setFormState}
                        formState={props.formState}
                      />
                    </div>
                  );
                })}
            </div>
            {"]"}
          </div>
        );
        break;

      }
      case "simpleType": {
        switch (props.resolvedJzodSchema.definition) {
          case "string":{
            // log.info("selectList for targetEntity", props.resolvedJzodSchema.extra?.targetEntity, "value", selectList, "props.foreignKeyObjects", props.foreignKeyObjects);

            return props.resolvedJzodSchema.extra?.targetEntity ? (
              <>
                <label htmlFor={props.listKey}>{props.listKey} {displayedLabel}: </label>
                <select
                  id={props.rootLesslistKey}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                  onChange={props.formik.handleChange}
                  value={currentValue}
                >
                  {/* <option id={props.rootLesslistKey+".undefined"} value=""></option> */}
                  {stringSelectList.map((e: [string, EntityInstance], index: number) => (
                    <option id={props.rootLesslistKey + "." + index} value={e[1].uuid}>
                      {(e[1] as EntityInstanceWithName).name}
                    </option>
                  ))}
                  {/* <option value="red">Red</option>
                 <option value="green">Green</option>
                 <option value="blue">Blue</option> */}
                </select>
              </>
            ) : (
              <>
                <label htmlFor={props.listKey}>{displayedLabel}: </label>
                <input
                  type="text"
                  id={props.rootLesslistKey}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                  onChange={props.formik.handleChange}
                  value={currentValue}
                />
              </>
            );
            break;
          }
          case "boolean":{
            // log.info("JzodElementEditor boolean!",props.listKey,"formState",props.formState)
            return (
              <>
              <table>
                <tbody>
                  <tr>
                    <td>
                    {displayedLabel}:{" "} 
                    </td>
                    <td>
                      <Checkbox 
                        // {...register(props.listKey)}
                        name={props.listKey}
                        id={props.listKey}
                        defaultChecked={props.formik.values[props.rootLesslistKey]}
                        // defaultChecked={props.initialValuesObject}
                        {...props.formik.getFieldProps(props.listKey)}
                        // onChange={props.formik.handleChange}
                        // value={props.formik.values[props.rootLesslistKey]}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              </>
            );
            break;
          }
          case "number": {
            // const defaultValue:number | undefined=props.initialValuesObject?(props.initialValuesObject as any as number):undefined;
            // log.info("JzodElementEditor number!",props.listKey,"props.initialValuesObject",props.initialValuesObject)
            return (
              <>
                {/* {props.listKey} - {label}:{" "} */}
                {displayedLabel}:{" "}
                <input
                  form={"form." + props.name}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                  // onChange={props.formik.handleChange}
                  // value={props.formik.values[props.rootLesslistKey]}
                  // onChange={(e) => {
                  //   log.info("JzodElementEditor number onChange!", props.name, e.target.value);
                  // }}
                  // defaultValue={defaultValue}
                />
              </>
            );
            break;
          }
          case "any":
          case "uuid":
          default: {
            // const defaultValue=formState.defaultValues?formState.defaultValues[props.name]:'no value found!'
            // const defaultValue:number | undefined=props.initialValuesObject?(props.initialValuesObject as any as number):undefined;
            return (
              <>
                <label htmlFor={props.listKey}>{displayedLabel}: </label>
                <input
                  id={props.listKey}
                  form={"form." + props.name}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                  // value={props.formik.values[props.rootLesslistKey]}
                  // onChange={(e) => {
                  //   log.info("JzodElementEditor number onChange!", props.name, e.target.value);
                  //   // setValue(props.listKey, e.target.value);
                  // }}
                  // defaultValue={defaultValue}
                />
              </>
            );
          // throw new Error("JzodElementEditor could not handle jzodSchema type:",elementJzodSchema?.type,elementJzodSchema.definition);
            break;
          }
        }
        break;
      }
      case "literal": {
        const handleSelectChange = (event: any) => {
          // TODO: avoid side-effects!!! So ugly, I'll be hanged for this.

          // missingAttributes.length > 0
          //   ? { ...props.formik.values, [missingAttributes[0]]: "test!" }
          //   : props.formik.values;
          // const parentPath = props.rootLesslistKey.substring(0,props.rootLesslistKey.lastIndexOf("."))
          if (!props.unionInformation) {
            throw new Error("handleSelectChange called but current object does not have information about the discriminated union type it must be part of!");
          }
          if (!props.unionInformation.jzodSchema.discriminator) {
            throw new Error("handleSelectChange called but current object does not have a discriminated union type!");
          }

          const parentPath = props.rootLesslistKeyArray.slice(0,props.rootLesslistKeyArray.length - 1)
          log.info(
            "handleSelectChange event",
            event,
            "parentPath",
            parentPath,
            "props.unionInformation?.jzodSchema",
            props.unionInformation.jzodSchema,
            "jzodSchema.discriminator",
            (props.unionInformation as any).jzodSchema.discriminator,
            "props.formik.values",
            props.formik.values,
            "props.rootLesslistKeyArray",
            props.rootLesslistKeyArray,
          );

          const newJzodSchema: JzodElement | undefined = (
            props.unionInformation.jzodSchema.definition as JzodObject[]
          ).find(
            (a: JzodObject) =>
              a.type == "object" &&
              a.definition[(props.unionInformation as any).jzodSchema.discriminator].type == "literal" &&
              a.definition[(props.unionInformation as any).jzodSchema.discriminator].definition == event.target.value
          );

          if (!newJzodSchema) {
            throw new Error(
              "handleSelectChange could not find union branch for discriminator " +
                props.unionInformation.discriminator +
                " in " +
                JSON.stringify(props.unionInformation.jzodSchema)
            );
          }
          // log.info(
          //   "handleSelectChange newJzodSchema",
          //   newJzodSchema
          // );

          const defaultValue = getDefaultValueForJzodSchema(newJzodSchema)
          // log.info(
          //   "handleSelectChange defaultValue",
          //   defaultValue
          // );
          // const newFormState: any = alterObject(props.formik.values, parentPath, {type: "B", b: "Test!!"}) ;
          const newFormState: any = alterObject(props.formik.values, parentPath, defaultValue) ;
          // log.info(
          //   "handleSelectChange newFormState",
          //   newFormState
          // );
          props.setFormState(newFormState);
          const currentParentValue = getValue(newFormState,parentPath);
          // log.info(
          //   "handleSelectChange props.resolvedJzodSchema",
          //   props.resolvedJzodSchema,
          //   "currentParentValue", currentParentValue
          // );
          // log.info(
          //   "handleSelectChange props.unionInformation?.jzodSchema",
          //   props.unionInformation?.jzodSchema
          // );

          const newResolvedJzodSchema = resolveReferencesForJzodSchemaAndValueObject(
            context.miroirFundamentalJzodSchema,
            props.unionInformation?.jzodSchema as any, // not undefined here!
            currentParentValue
          )

          if (newResolvedJzodSchema.status != "ok") {
            throw new Error(
              "handleSelectChange could not resolve schema " +
                JSON.stringify(props.unionInformation?.jzodSchema) +
                " value " +
                JSON.stringify(newFormState)
            );
          }

          // log.info(
          //   "handleSelectChange newResolvedJzodSchema",
          //   newResolvedJzodSchema
          // );

          const newItemsOrder = getItemsOrder(currentParentValue, newResolvedJzodSchema.element);
          // log.info(
          //   "handleSelectChange newItemsOrder",
          //   newItemsOrder
          // );
          props.unionInformation.setItemsOrder(newItemsOrder)
          // changing the current Jzod Schema for the whole object (at ROOT! Redraw / recreate everything!)
        };
        if (props.unionInformation) {
          log.info(
            "literal with unionInformation",
            props.listKey,
            "discriminator=",
            props.unionInformation.discriminator,
            "subDiscriminator=",
            props.unionInformation.subDiscriminator,
            "unionInformation=",
            props.unionInformation
          );
        }
        return (
          <>
            <label htmlFor={props.listKey}>{displayedLabel}: </label>
            {
              props.unionInformation?
              (
                <>
                  {
                    props.unionInformation.subDiscriminator && props.unionInformation.subDiscriminatorValues && props.name == props.unionInformation.subDiscriminator?
                    (
                      <>
                        <Select
                          labelId="demo-simple-select-label"
                          id={props.listKey}
                          value={currentValue}
                          label={props.name}
                          onChange={handleSelectChange}
                        >
                          {props.unionInformation.subDiscriminatorValues.map((v) => {
                            return (
                              <MenuItem key={v} value={v}>
                                {v}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </>
                    )
                    :
                    props.unionInformation.discriminator && props.unionInformation.discriminatorValues && props.name == props.unionInformation.discriminator?
                    (
                      <Select
                      labelId="demo-simple-select-label"
                      id={props.listKey}
                      value={currentValue}
                      label={props.name}
                      onChange={handleSelectChange}
                    >
                      {props.unionInformation.discriminatorValues.map((v) => {
                        return (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    )
                    :
                    <>
                      <input
                        id={props.listKey}
                        form={"form." + props.name}
                        name={props.name}
                        {...props.formik.getFieldProps(props.rootLesslistKey)}
                      /> {JSON.stringify(unfoldedRawSchema)}
                    </>
                  }
                </>
              )
              :
              (
                <>
                  <input
                    id={props.listKey}
                    form={"form." + props.name}
                    name={props.name}
                    {...props.formik.getFieldProps(props.rootLesslistKey)}
                  /> {JSON.stringify(unfoldedRawSchema)}
                </>
              )
            }
          </>
        );
      }
      case "enum":
      case "function":
      case "lazy":
      case "intersection":
      case "map":
      case "promise":
      case "record":
      case "schemaReference":
      case "set":
      case "tuple":
      case "union": {
        return (
          <div>
            default case: {props.resolvedJzodSchema.type} {props.listKey} value {props.formik.values[props.rootLesslistKey]}
            {/* <div>
              found schema: {JSON.stringify(props.resolvedJzodSchema, null, 2)}
            </div>
            <div>
              for object: {JSON.stringify(props.initialValuesObject, null, 2)}
            </div> */}
          </div>
        )
        break;
      }
    }
  } else {
    return (
      <div>
        Could not find schema for item: {props.rootLesslistKey} 
        <br />
        value {props.formik.values[props.rootLesslistKey]} 
        <br />
        raw schema {JSON.stringify(props.rawJzodSchema)}
        <br />
        schema {JSON.stringify(props.resolvedJzodSchema)}
      </div>
    )
  }
}
