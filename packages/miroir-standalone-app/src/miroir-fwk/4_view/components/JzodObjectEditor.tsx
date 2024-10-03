import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { ErrorBoundary, withErrorBoundary } from 'react-error-boundary';

import styled from "@emotion/styled";
import { AddBox, Clear, ExpandLess, ExpandMore } from "@mui/icons-material";
import { Button, Checkbox, Icon, IconButton, MenuItem, Select } from "@mui/material";


// import { FieldValues, UseFormRegister, UseFormSetValue, useFormContext } from "react-hook-form";


import {
  ApplicationSection,
  DeploymentEntityState,
  DomainElement,
  ExtractorTemplateForRecordOfExtractors,
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  EntityInstancesUuidIndex,
  JzodArray,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  JzodObject,
  JzodSchema,
  JzodUnion,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  SyncExtractorTemplateRunner,
  SyncExtractorTemplateRunnerMap,
  SyncExtractorTemplateRunnerParams,
  ResolvedJzodSchemaReturnType,
  Uuid,
  adminConfigurationDeploymentMiroir,
  alterObjectAtPath,
  deleteObjectAtPath,
  dummyDomainManyQueriesWithDeploymentUuid,
  getApplicationSection,
  getDefaultValueForJzodSchemaWithResolution,
  getDeploymentEntityStateSelectorTemplateParams,
  getLoggerName,
  resolveReferencesForJzodSchemaAndValueObject,
  unfoldJzodSchemaOnce,
  getValue
} from "miroir-core";

import { getMemoizedDeploymentEntityStateSelectorForTemplateMap } from "miroir-localcache-redux";
import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import { useMiroirContextService, useMiroirContextformHelperState } from "../MiroirContextReactProvider.js";
import { useCurrentModel, useDeploymentEntityStateQueryTemplateSelectorForCleanedResult } from '../ReduxHooks.js';


const loggerName: string = getLoggerName(packageName, cleanLevel,"JzodObjectEditor");
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

export interface JzodObjectEditorProps {
  forceTestingMode?: boolean,
  label?: string;
  name: string,
  listKey: string,
  rootLesslistKey: string,
  rootLesslistKeyArray: string[],
  indentLevel?:number,
  unresolvedJzodSchema?: JzodElement | undefined,
  paramMiroirFundamentalJzodSchema?: JzodSchema, //used only for testing, trouble with using MiroirContextReactProvider
  unionInformation?: {
    jzodSchema: JzodUnion,
    discriminator: string,
    discriminatorValues: string[],
    // subDiscriminator?: string,
    // subDiscriminatorValues?: string[],
    setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
  } | undefined,
  rawJzodSchema: JzodElement | undefined,
  resolvedJzodSchema: JzodElement | undefined,
  foreignKeyObjects: Record<string,EntityInstancesUuidIndex>,
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection,
  formik: any,
  handleChange: (e: ChangeEvent<any>) => Promise<void>,
  setFormState: React.Dispatch<React.SetStateAction<{
    [k: string]: any;
  }>>,
  parentObjectSetItemsOrder?: React.Dispatch<React.SetStateAction<any[]>>,
  parentObjectItemsOrder?: any[],
  formState: any,
}

// ################################################################################################
// ################################################################################################
// #####################################################################################################
const SizedButton = styled(Button)(({ theme }) => ({height: "1em", width: "auto", padding: "0px"}));
const SizedAddBox = styled(AddBox)(({ theme }) => ({height: "1em", width: "1em"}));
const SizedIcon = styled(Icon)(({ theme }) => ({height: "1em", width: "1em"}));
// const SizedIcon = styled(Icon)(({ theme }) => ({height: "0.5em", width: "0.5em", padding: 0, boxSizing:"border-box"}));
// const SizedIcon = styled(Icon)(({ theme }) => ({sx: { }, fontSize:"small", padding: 0, boxSizing:"border-box"}));
// const SizedIcon = styled(Icon)(({ theme }) => ({height: 0.5, width: 0.5, padding: 0, }));
// const SizedIcon = styled(Icon)(({ theme }) => ({ fontSize:"inherit" }));
const SmallIconButton = styled(IconButton)(({ theme }) => ({ size: "small" }));
// const LineIconButton = styled(IconButton)(({ theme }) => ({ maxHeight: "1em", transform: {scale: 1.5} }));
const LineIconButton = styled(IconButton)(({ theme }) => ({
  padding: 0,
  // boxSizing: "border-box",
  maxHeight: "1em",
  // transform: "scale(1.5)",
}));
// const SizedIcon = styled(Clear)(({ theme }) => ({height: "10px", width: "10px"}));
// const SizedIcon = styled(Clear)(({ theme }) => ({size:}));
const StyledSelect = styled(Select)(({ theme }) => ({
  // backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  // ...theme.typography.body2,
  // padding: theme.spacing(1),
  // textAlign: "left",
  // display: "flex",
  maxHeight: "1.5em",
  // height: '80vh',
  // color: theme.palette.text.secondary,
}));

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



// ################################################################################################
export const ExpandOrFoldObjectAttributes = (
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
    <LineIconButton
      // style={{maxHeight:"20px",maxWidth:"20px"}}
      // style={{display:"inline-flex"}}
      // sx={{ 
      //   // maxWidth: "1rem", 
      //   // maxHeight: "1rem", 
      //   transform: {scale: 1.5} 
      // }}

      style={{ 
        border: 0, 
        backgroundColor: "transparent" }}
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
        // <ExpandMore sx={{ color: "darkred",maxWidth: "15px", maxHeight: "15px" }} />
      ) : (
        // <ExpandLess sx={{ maxWidth: "15px", maxHeight: "15px" }} />
        <ExpandLess/>
      )}
    </LineIconButton>
  );
}



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
function Fallback({ error, resetErrorBoundary }:any) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
}


// #####################################################################################################
const objectTypes: string[] = ["record", "object", "union"];
const enumTypes: string[] = ["enum", "literal"]; 

let count = 0;
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################


export const JzodObjectEditor = (
  props: JzodObjectEditorProps
): JSX.Element => {
  count++;
  const context = useMiroirContextService();
  const deploymentEntityStateSelectorMap: SyncExtractorTemplateRunnerMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorForTemplateMap(),
    []
  );

  const currentMiroirFundamentalJzodSchema = props.paramMiroirFundamentalJzodSchema??context.miroirFundamentalJzodSchema;
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
  // log.info("#####################################################################################");
  // log.info("JzodObjectEditor", props.listKey, "count", count, "currentValue", currentValue);
  // log.info("JzodObjectEditor", props.listKey, "count", count, "resolvedJzodSchema", props.resolvedJzodSchema);
  // log.info("JzodObjectEditor", props.listKey, "count", count, "rawJzodSchema", props.rawJzodSchema?.type, props.rawJzodSchema);

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
    log.warn("found never for props.rawJzodSchema! key", props.listKey, "count", count)
  }
  let unfoldedRawSchemaReturnType:ResolvedJzodSchemaReturnType | undefined
  try {
    unfoldedRawSchemaReturnType = useMemo(
      () => {
          log.info("unfolding rawJzodSchema for", props.listKey, "count", count, "rawJzodSchema", props.rawJzodSchema)
          const result = unfoldJzodSchemaOnce(
            currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
            // props.rawJzodSchema?.type == "object"?props.rawJzodSchema.definition[attribute[0]]:props.rawJzodSchema?.definition as any,
            props.rawJzodSchema,
            currentModel,
            miroirMetaModel
          );
          log.info("unfolded rawJzodSchema for", props.listKey, "count", count, "props.rawJzodSchema", props.rawJzodSchema, "result", result)
        return result;
      }, [
        // props,
        props.rawJzodSchema,
        props.listKey,
        currentMiroirFundamentalJzodSchema, /*context.miroirFundamentalJzodSchema,*/ 
        currentModel,
        miroirMetaModel,
      ]
    );
  } catch (e) {
    log.error("caught error upon calling ufoldJzodSchemaOnce! count", count, "key", props.rootLesslistKey, "error", e)
  }

  if (!unfoldedRawSchemaReturnType || unfoldedRawSchemaReturnType.status == "error") {
    throw new Error(
      "JzodObjectEditor could not unfold raw schema " +
        JSON.stringify(props.rawJzodSchema, null, 2) +
        // props.rawJzodSchema +
        " count " + count +
        " result " +
        // JSON.stringify(unfoldedRawSchemaReturnType, null, 2) + 
        unfoldedRawSchemaReturnType + 
        " miroirFundamentalJzodSchema " +
        currentMiroirFundamentalJzodSchema
        // JSON.stringify(currentMiroirFundamentalJzodSchema, null, 2)
    );
  }
  const unfoldedRawSchema:JzodElement = unfoldedRawSchemaReturnType.element
  // log.info(
  //   "JzodObjectEditor",
  //   props.listKey,
  //   "rawJzodSchema",
  //   props.rawJzodSchema,
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
        const discriminator = (unfoldedRawSchema as any).discriminator;
        const result = [
          ...new Set(
            unfoldedRawSchema.definition.flatMap(
              (a: any /** JzodObject */) => {
                // return (a.definition as any)[(unfoldedRawSchema as any).discriminator].definition}
                switch (a.definition[discriminator]?.type) {
                  case "literal": {
                    return a.definition[discriminator].definition
                    break;
                  }
                  case "enum": {
                    return a.definition[discriminator].definition
                  }
                  case "object":
                  case "string":
                  case "number":
                  case "bigint":
                  case "boolean":
                  case "undefined":
                  case "function":
                  case "array":
                  // case "simpleType":
                  case "any":
                  case "date":
                  case "never":
                  case "null":
                  case "uuid":
                  case "unknown":
                  case "void":
                  case "lazy":
                  case "intersection":
                  case "map":
                  case "promise":
                  case "record":
                  case "schemaReference": 
                  case "set":
                  case "tuple":
                  case "union":
                  default: {
                    throw new Error(
                      "objectUniondiscriminatorValues could not handle union branch object: discriminator type " +
                        a.definition[discriminator]?.type +
                        " discriminator " +
                        JSON.stringify(a.definition[discriminator]) +
                        " for union " +
                        JSON.stringify(unfoldedRawSchema)
                    );
                    // return [];
                    break;
                  }
                }
              }
            )
          ),
        ];
        log.info("objectUniondiscriminatorValues found ", result);
        return result;
      } else {
        return []
      }      
    },
    [props.resolvedJzodSchema, unfoldedRawSchema]
  );

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
        "JzodObjectEditor mismatching jzod schemas, resolved schema " + 
        JSON.stringify(props.resolvedJzodSchema, null, 2) +
        " raw schema " +
        JSON.stringify(props.rawJzodSchema, null, 2)
      );
    }


    // ############################################################################################
    // finding foreign objects for uuid schema with targetEntity estra
    const foreignKeyObjectsFetchQueryParams: SyncExtractorTemplateRunnerParams<
      ExtractorTemplateForRecordOfExtractors,
      DeploymentEntityState
    > = useMemo(
      () =>
        getDeploymentEntityStateSelectorTemplateParams<ExtractorTemplateForRecordOfExtractors>(
          props.currentDeploymentUuid &&
          unfoldedRawSchema.type == "uuid" &&
          unfoldedRawSchema.tag?.value?.targetEntity
          ?
          {
            queryType: "extractorTemplateForRecordOfExtractors",
            deploymentUuid: props.currentDeploymentUuid,
            // applicationSection: props.applicationSection,
            // pageParams: props.paramsAsdomainElements,
            pageParams: {},
            queryParams: {},
            contextResults: {},
            // pageParams: { elementType: "object", elementValue: {} },
            // queryParams: { elementType: "object", elementValue: {} },
            // contextResults: { elementType: "object", elementValue: {} },
            extractorTemplates: {
              [unfoldedRawSchema.tag?.value?.targetEntity]:
              {
                queryType: "queryTemplateExtractObjectListByEntity",
                applicationSection: getApplicationSection(props.currentDeploymentUuid,unfoldedRawSchema.tag?.value?.targetEntity),
                parentName: "",
                parentUuid: {
                  templateType: "constantUuid",
                  constantUuidValue: unfoldedRawSchema.tag?.value?.targetEntity,
                },
              }
            }
          }
          :
          dummyDomainManyQueriesWithDeploymentUuid
          ,
          deploymentEntityStateSelectorMap
        ),
      [
        deploymentEntityStateSelectorMap,
        props.currentDeploymentUuid,
        unfoldedRawSchema,
      ]
    );

    // log.info(
    //   "foreignKeyObjectsFetchQueryParams",
    //   foreignKeyObjectsFetchQueryParams,
    //   "props.currentDeploymentUuid",
    //   props.currentDeploymentUuid,
    //   "unfoldedRawSchema",
    //   unfoldedRawSchema
    // )

    // const foreignKeyObjects:  = useDeploymentEntityStateQueryTemplateSelectorForCleanedResult(
    const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
      useDeploymentEntityStateQueryTemplateSelectorForCleanedResult(
        deploymentEntityStateSelectorMap.extractWithManyExtractorTemplates as SyncExtractorTemplateRunner<
          ExtractorTemplateForRecordOfExtractors,
          DeploymentEntityState,
          DomainElement
        >,
        foreignKeyObjectsFetchQueryParams
      );

    // if (unfoldedRawSchema.type == "uuid") {
    //   log.info(
    //     "JzodObjectEditor computed foreign keys for uuid schema:",
    //     props.listKey,
    //     "currentValue",
    //     currentValue,
    //     "foreignKeyObjectsFetchQueryParams",
    //     foreignKeyObjectsFetchQueryParams,
    //     "props.currentDeploymentUuid",
    //     props.currentDeploymentUuid,
    //     "unfoldedRawSchema",
    //     unfoldedRawSchema,
    //     "foreignKeyObjects", foreignKeyObjects
    //   )
      
    // }


    // ############################################################################################
    const undefinedOptionalAttributes: string[] = useMemo(
      () => {
        if (props.resolvedJzodSchema?.type == "object" && unfoldedRawSchema.type == "object") {
          const currentObjectAttributes = Object.keys(currentValue);
          return Object.entries(unfoldedRawSchema.definition).filter(a => a[1].optional).filter(a => !currentObjectAttributes.includes(a[0])).map(a => a[0]);
        }
        return [];
      },
      [unfoldedRawSchema, currentValue]
    )

    const definedOptionalAttributes: Set<string> = useMemo(
      () => {
        if (props.resolvedJzodSchema?.type == "object" && unfoldedRawSchema.type == "object") {
          const currentObjectAttributes = Object.keys(currentValue);
          return new Set(Object.entries(unfoldedRawSchema.definition).filter(a => a[1].optional).filter(a => currentObjectAttributes.includes(a[0])).map(a => a[0]));
        }
        return new Set();
      },
      [unfoldedRawSchema, currentValue]
    )

    const unionInformation = useMemo(
      () => {
        return unfoldedRawSchema.type == "union"
          ? {
              jzodSchema: unfoldedRawSchema,
              discriminator: unfoldedRawSchema.discriminator as string,
              discriminatorValues: objectUniondiscriminatorValues,
              setItemsOrder: setItemsOrder
            }
          : undefined;
      },
      [unfoldedRawSchema, objectUniondiscriminatorValues]
    )

    const stringSelectList = useMemo(
      () => {
        if (
          props.resolvedJzodSchema?.type == "uuid" &&
          props.resolvedJzodSchema.tag?.value?.targetEntity
        ) {
          return [
            [noValue.uuid, noValue] as [string, EntityInstance],
            ...(Object.entries(foreignKeyObjects[props.resolvedJzodSchema.tag.value?.targetEntity] ?? {}))
          ]
        }
        return []
      },
      [props.resolvedJzodSchema, foreignKeyObjectsFetchQueryParams]
    );

    const handleSelectValueChange = useCallback(
        (event: any) => {
        // const parentPath = props.rootLesslistKeyArray.slice(0,props.rootLesslistKeyArray.length - 1)
        // identical to handleSelectEnumChange?
        const newFormState: any = alterObjectAtPath(props.formik.values, props.rootLesslistKeyArray, event.target.value);
        log.info("handleSelectValueChange called with event", event, "current Value",props.formik.values,"newFormState", newFormState)
        props.setFormState(newFormState);
      },
      [props.formik.values, props.rootLesslistKeyArray, props.setFormState]
    )

    // const handleAttributeNameChange = useCallback(
    const handleAttributeNameChange = (event: any, attributeRootLessListKeyArray: string[]) => {
        // const parentPath = props.rootLesslistKeyArray.slice(0,props.rootLesslistKeyArray.length - 1)
        // identical to handleSelectEnumChange?
        const localAttributeRootLessListKeyArray: string[] = attributeRootLessListKeyArray.slice();
        const newAttributeName = event.target.value;
        const oldAttributeName = localAttributeRootLessListKeyArray[localAttributeRootLessListKeyArray.length - 1];
        log.info(
          "handleAttributeNameChange renaming attribute",
          oldAttributeName,
          "into",
          newAttributeName,
          "called with event",
          event,
          "current Value",
          props.formik.values,
          "props.rootLesslistKey",
          props.rootLesslistKey,
          "attributeRootLessListKeyArray",
          attributeRootLessListKeyArray,
          attributeRootLessListKeyArray.length,
          // "localAttributeRootLessListKeyArray",
          // localAttributeRootLessListKeyArray,
          // localAttributeRootLessListKeyArray.length,
          "props.resolvedJzodSchema",
          props.resolvedJzodSchema,
        );
        const subObject = getValue(props.formik.values,localAttributeRootLessListKeyArray);
        const newFormState1: any = deleteObjectAtPath(props.formik.values, localAttributeRootLessListKeyArray);
        log.info("handleAttributeNameChange newFormState1",newFormState1, localAttributeRootLessListKeyArray)
        // const newPath = attributeRootLessListKeyArray.slice(0,attributeRootLessListKeyArray.length-1);
        const parentPath = localAttributeRootLessListKeyArray.slice(0,localAttributeRootLessListKeyArray.length -1);
        const newPath = localAttributeRootLessListKeyArray.slice(0,localAttributeRootLessListKeyArray.length -1);
        log.info("handleAttributeNameChange newPath before push",newPath, localAttributeRootLessListKeyArray);
        newPath.push(newAttributeName);
        log.info("handleAttributeNameChange newPath",newPath);
        const newFormState2: any = alterObjectAtPath(newFormState1, newPath, subObject);
        log.info("handleAttributeNameChange newFormState2",newFormState2);

        // log.info("handleSelectValueChange called with event", event, "current Value",props.formik.values,"newFormState", newFormState)
        props.setFormState(newFormState2);
        if (itemsOrder) {
          // const parentItemsOrder = props.parentObjectItemsOrder;
          log.info(
            "handleAttributeNameChange reading path",
            props.rootLesslistKey,
            "from currentParentValue", newFormState2,
            "itemsOrder", itemsOrder
          );
          const localItemsOrder = itemsOrder.slice();
          const attributePosition = localItemsOrder?.indexOf(oldAttributeName)
          // const newItemsOrder = parentItemsOrder?.splice(uuidPosition,1)
          if (attributePosition != -1) {
            localItemsOrder[attributePosition] = newAttributeName
          }
          log.info(
            "handleAttributeNameChange for path",
            props.rootLesslistKey,
            "new itemsOrder", localItemsOrder
          );
          setItemsOrder(localItemsOrder)
        } else {
          log.warn(
            "handleAttributeNameChange reading path",
            parentPath,
            "itemsOrder is undefined!"
          );
        }
        // log.info(
        //   "handleAttributeNameChange new parent object items order",
        //   parentItemsOrder,
        // );
        // const currentParentValue = getValue(newFormState2,parentPath);
    };
    //   [props.formik.values, props.setFormState ]
    // )

    // ############################################################################################
    const handleSelectLiteralChange = (event: any) => {
      // TODO: avoid side-effects!!! So ugly, I'll be hanged for this.

      // missingAttributes.length > 0
      //   ? { ...props.formik.values, [missingAttributes[0]]: "test!" }
      //   : props.formik.values;
      // const parentPath = props.rootLesslistKey.substring(0,props.rootLesslistKey.lastIndexOf("."))
      if (!props.unionInformation) {
        throw new Error(
          "handleSelectLiteralChange called but current object does not have information about the discriminated union type it must be part of!"
        );
      }
      if (!props.unionInformation.jzodSchema.discriminator) {
        throw new Error("handleSelectLiteralChange called but current object does not have a discriminated union type!");
      }

      const currentAttributeName = props.rootLesslistKeyArray[props.rootLesslistKeyArray.length - 1]

      const parentPath = props.rootLesslistKeyArray.slice(0,props.rootLesslistKeyArray.length - 1)
      log.info(
        "handleSelectLiteralChange event",
        event,
        "attribute",
        currentAttributeName,
        "props.name",
        props.name,
        "parentPath",
        parentPath,
        "props.unionInformation?.jzodSchema",
        props.unionInformation.jzodSchema,
        "jzodSchema.discriminator",
        "'" + (props.unionInformation as any).jzodSchema.discriminator + "'",
        "props.formik.values",
        props.formik.values,
        "props.rootLesslistKeyArray",
        props.rootLesslistKeyArray,
      );

      const newJzodSchema: JzodElement | undefined = // attribute is either discriminator or sub-discriminator
        // props.name == props.unionInformation.subDiscriminator
        //   ? // props.name == currentAttributeName == props.unionInformation.subDiscriminator?
        //     (props.unionInformation.jzodSchema.definition as JzodObject[]).find(
        //       (a: JzodObject) =>
        //         a.type == "object" &&
        //         a.definition[(props.unionInformation as any).jzodSchema.subDiscriminator].type == "literal" &&
        //         (a.definition[(props.unionInformation as any).jzodSchema.subDiscriminator] as JzodLiteral).definition ==
        //           event.target.value
        //     )
          // :
           (props.unionInformation.jzodSchema.definition as JzodObject[]).find(
              (a: JzodObject) =>
                a.type == "object" &&
                a.definition[(props.unionInformation as any).jzodSchema.discriminator].type == "literal" &&
                (a.definition[(props.unionInformation as any).jzodSchema.discriminator] as JzodLiteral).definition ==
                  event.target.value
            )
          ;

      if (!newJzodSchema) {
        throw new Error(
          "handleSelectLiteralChange could not find union branch for discriminator " +
            props.unionInformation.discriminator +
            " in " +
            JSON.stringify(props.unionInformation.jzodSchema)
        );
      }
      const newJzodSchemaWithOptional = props.unionInformation.jzodSchema.optional?{
        ...newJzodSchema,
        "optional": true
      }: newJzodSchema
      log.info(
        "handleSelectLiteralChange newJzodSchemaWithOptional",
        newJzodSchemaWithOptional
      );

      const defaultValue = getDefaultValueForJzodSchemaWithResolution(
        newJzodSchemaWithOptional,
        currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel
      );
      log.info(
        "handleSelectLiteralChange defaultValue",
        defaultValue
      );
      // const newFormState: any = alterObjectAtPath(props.formik.values, parentPath, {type: "B", b: "Test!!"}) ;
      const newFormState: any = alterObjectAtPath(props.formik.values, parentPath, defaultValue) ;
      log.info(
        "handleSelectLiteralChange newFormState",
        newFormState
      );
      props.setFormState(newFormState);
      const currentParentValue = getValue(newFormState,parentPath);
      log.info(
        "handleSelectLiteralChange props.resolvedJzodSchema",
        props.resolvedJzodSchema,
        "currentParentValue", currentParentValue
      );
      log.info(
        "handleSelectLiteralChange props.unionInformation?.jzodSchema",
        props.unionInformation?.jzodSchema
      );

      const newResolvedJzodSchema = resolveReferencesForJzodSchemaAndValueObject(
        currentMiroirFundamentalJzodSchema, //context.miroirFundamentalJzodSchema,
        props.unionInformation?.jzodSchema as any, // not undefined here!
        currentParentValue,
        currentModel,
        miroirMetaModel,
        {}
      )

      if (newResolvedJzodSchema.status != "ok") {
        throw new Error(
          "handleSelectLiteralChange could not resolve schema " +
            JSON.stringify(props.unionInformation?.jzodSchema) +
            " value " +
            JSON.stringify(newFormState)
        );
      }

      log.info(
        "handleSelectLiteralChange newResolvedJzodSchema",
        newResolvedJzodSchema
      );

      const newItemsOrder = getItemsOrder(currentParentValue, newResolvedJzodSchema.element);
      log.info(
        "handleSelectLiteralChange newItemsOrder",
        newItemsOrder
      );
      props.unionInformation.setItemsOrder(newItemsOrder)
      // changing the current Jzod Schema for the whole object (at ROOT! Redraw / recreate everything!)
    };

    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    switch (props.resolvedJzodSchema.type) {
      case "object": {
        let resolvedJzodSchema: JzodObject = props.resolvedJzodSchema;
        if (unfoldedRawSchema.type == "union" && !unfoldedRawSchema.discriminator) {
          throw new Error(
            "JzodObjectEditor could not compute allSchemaObjectAttributes, no discriminator found in " + 
            JSON.stringify(unfoldedRawSchema, null, 2)
          );
        }

        const addNewRecordAttribute = useCallback(
          async () => {
            log.info(
              "addMissingRecordAttribute clicked!",
              props.listKey,
              itemsOrder,
              Object.keys(resolvedJzodSchema.definition),
              "formState",
              props.formState,
              "formik",
              props.formik.values
            );
            if (unfoldedRawSchema.type != "record") {
              throw("addMissingRecordAttribute called for non-record type: " + unfoldedRawSchema.type)
            }
            const newAttributeValue = getDefaultValueForJzodSchemaWithResolution(
              unfoldedRawSchema.definition,
              currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel
            );

            const currentValue = getValue(props.formik.values,props.rootLesslistKeyArray);
            const newValue: any =
                { ["NEWATTRIBUTE"]: newAttributeValue, ...currentValue };
            log.info("addMissingRecordAttribute", "newValue", newValue)
            // setNestedObjectValues(props.listKey, e.target.value);
            const newFormValue = alterObjectAtPath(props.formik.values,props.rootLesslistKeyArray,newValue)
            log.info("addMissingRecordAttribute", "newFormValue", newFormValue)
            props.setFormState(newFormValue);
            setItemsOrder(getItemsOrder(newValue, props.resolvedJzodSchema))
            // await props.setFormState({"deploymentUuid2": "test!"});
            // await props.formik.setFieldValue("deploymentUuid2", "test!");
            log.info(
              "addMissingRecordAttribute clicked2!",
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
        const addMissingOptionalAttribute = useCallback(
          async () => {
            log.info(
              "addMissingOptionalAttribute clicked!",
              props.listKey,
              itemsOrder,
              Object.keys(resolvedJzodSchema.definition),
              "formState",
              props.formState,
              "formik",
              props.formik.values
            );
            const newFormState: any =
              undefinedOptionalAttributes.length > 0
                ? { ...props.formik.values, [undefinedOptionalAttributes[0]]: "test!" }
                : props.formik.values;
            props.setFormState(newFormState);
            const currentValue = getValue(newFormState,props.rootLesslistKeyArray);
            setItemsOrder(getItemsOrder(currentValue, props.resolvedJzodSchema))
            // await props.setFormState({"deploymentUuid2": "test!"});
            // await props.formik.setFieldValue("deploymentUuid2", "test!");
            log.info(
              "addMissingOptionalAttribute clicked2!",
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
        const removeOptionalAttribute = useCallback(
          (listKey: string) => {
            log.info(
              "removeOptionalAttribute clicked!",
              listKey,
              itemsOrder,
              Object.keys(resolvedJzodSchema.definition),
              "formState",
              props.formState,
              "formik",
              props.formik.values
            );
            const newFormState: any = {...props.formik.values};
            delete newFormState[listKey]
            props.setFormState(newFormState);
            const currentValue = getValue(newFormState,props.rootLesslistKeyArray);
            setItemsOrder(getItemsOrder(currentValue, props.resolvedJzodSchema))
            // // await props.setFormState({"deploymentUuid2": "test!"});
            // // await props.formik.setFieldValue("deploymentUuid2", "test!");
            log.info(
              "clicked2!",
              listKey,
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
          <>
            <span id={props.rootLesslistKey} key={props.rootLesslistKey + "head"}>
              <span>
                {"{"}
                <ExpandOrFoldObjectAttributes
                  hiddenFormItems={hiddenFormItems}
                  setHiddenFormItems={setHiddenFormItems}
                  listKey={props.listKey}
                ></ExpandOrFoldObjectAttributes>
                {resolvedJzodSchema.type} {unfoldedRawSchema.type}
              </span>
              {/* {" "}{count} */}
              {/* <br /> */}
              {/* itemsOrder: {JSON.stringify(itemsOrder)} */}
              <div
                id={props.listKey + ".inner"}
                style={{
                  marginLeft: `calc(${indentShift})`,
                  display: hiddenFormItems[props.listKey] ? "none" : "block",
                }}
                key={`${props.rootLesslistKey}|body`}
              >
                {
                  unfoldedRawSchema.type == "record"? (
                  <div>
                    <SizedButton variant="text" onClick={addNewRecordAttribute}>
                      {/* <SizedIcon>addBox</SizedIcon> */}
                      {/* <Icon>add</Icon> */}
                      {/* <AddBox/> */}
                      <SizedAddBox/>
                    </SizedButton>
                    add new record:
                  </div>
                  ): (
                    <></>
                  )
                }
                {itemsOrder
                  .map((i): [string, JzodElement] => [
                    i,
                    props.formik.values[props.rootLesslistKey.length > 0 ? props.rootLesslistKey + "." + i[0] : i[0]],
                  ])
                  .map((attribute: [string, JzodElement], attributeNumber: number) => {
                    const currentAttributeDefinition = resolvedJzodSchema.definition[attribute[0]];
                    const attributeListKey = props.listKey + "." + attribute[0];
                    const attributeRootLessListKey =
                      props.rootLesslistKey.length > 0 ? props.rootLesslistKey + "." + attribute[0] : attribute[0];
                    const attributeRootLessListKeyArray =
                      props.rootLesslistKeyArray.length > 0 ? [...props.rootLesslistKeyArray, attribute[0]] : [attribute[0]];

                    let attributeRawJzodSchema: JzodElement;

                    // switch (rawJzodSchema?.type) {
                    if (!unfoldedRawSchema) {
                      throw new Error(
                        "JzodObjectEditor unfoldedRawSchema undefined for object " +
                          props.listKey +
                          " attribute " +
                          attribute[0] +
                          " attributeListKey " +
                          attributeListKey
                      );
                    }

                    const attributeDisplayedLabel: string =
                      currentAttributeDefinition?.tag?.value?.defaultLabel ?? attribute[0];

                    // determine raw schema of attribute
                    switch (unfoldedRawSchema?.type) {
                      case "object": {
                        // jzodSchemaToUnfold = rawJzodSchema.definition[attribute[0]]
                        attributeRawJzodSchema = unfoldedRawSchema.definition[attribute[0]];
                        break;
                      }
                      case "record": {
                        // jzodSchemaToUnfold = rawJzodSchema.definition
                        attributeRawJzodSchema = unfoldedRawSchema.definition;
                        break;
                      }
                      case "union": {
                        // if (!rawJzodSchema.discriminator) {
                        if (!unfoldedRawSchema.discriminator) {
                          throw new Error(
                            "no discriminator found, could not choose branch of union type for object " +
                              // JSON.stringify(unfoldedRawSchema, null, 2) +
                              unfoldedRawSchema +
                              " " +
                              props.resolvedJzodSchema
                            // JSON.stringify(props.resolvedJzodSchema, null, 2)
                          );
                        }
                        // TODO: resolve using subDiscriminator
                        const discriminator: string = (unfoldedRawSchema as any).discriminator;
                        // const subDiscriminator: string = (unfoldedRawSchema as any).subDiscriminator;
                        // log.info(
                        //   "JzodObjectEditor object with discrimitated union:",
                        //   props.listKey,
                        //   "attribute",
                        //   attribute[0],
                        //   "attributeListkey",
                        //   attributeListKey,
                        //   "currentValue",
                        //   currentValue,
                        //   // JSON.stringify(currentValue, null, 2),
                        //   "resolvedJzodSchema",
                        //   props.resolvedJzodSchema,
                        //   "rawJzodSchema",
                        //   props.rawJzodSchema,
                        // );
                        let concreteObjectRawJzodSchema: JzodObject | undefined;
                        let resolvedConcreteObjectJzodSchema: JzodObject | undefined;
                        if (
                          attribute[0] == discriminator
                        ) {
                          attributeRawJzodSchema =
                            currentAttributeDefinition.type == "enum"
                              ? currentAttributeDefinition
                              : { type: "literal", definition: "literal" }; // definition is not taken into account, possible values come from unionInformation
                        } else {
                          const discriminatorValue = currentValue[discriminator];
                          // log.info(
                          //   "discriminator",
                          //   discriminator,
                          //   "discriminatorValue",
                          //   discriminatorValue,
                          // );
                          // discriminator only
                          // TODO: remove duplication from JzodUnfoldSchemaForValue. This is a core functionality, finding the concrete type for a value in a union.
                          if (discriminator && discriminatorValue) {
                            concreteObjectRawJzodSchema = unfoldedRawSchema.definition.find(
                              (a: any) =>
                                (a.type == "object" &&
                                  a.definition[discriminator].type == "literal" &&
                                  (a.definition[discriminator] as JzodLiteral).definition == discriminatorValue) ||
                                (a.type == "object" &&
                                  a.definition[discriminator].type == "enum" &&
                                  (a.definition[discriminator] as JzodEnum).definition.includes(discriminatorValue))
                            ) as any;
                          }
                          // }
                          if (!concreteObjectRawJzodSchema) {
                            throw new Error(
                              "JzodObjectEditor could not find concrete raw schema for " +
                                props.listKey +
                                " attribute " +
                                attribute[0] +
                                " listKey " +
                                attributeListKey + 
                                " discriminator " +
                                discriminator + 
                                " discriminatorValue " +
                                discriminatorValue +
                                " unfoldedRawSchema " +
                                JSON.stringify(unfoldedRawSchema, null, 2)
                            );
                          }
                          if (concreteObjectRawJzodSchema.type == "object" && concreteObjectRawJzodSchema.extend) {
                            const resolvedConcreteObjectJzodSchemaTmp = unfoldJzodSchemaOnce(
                              currentMiroirFundamentalJzodSchema,
                              concreteObjectRawJzodSchema,
                              currentModel,
                              miroirMetaModel
                            );

                            if (resolvedConcreteObjectJzodSchemaTmp.status != "ok") {
                              throw new Error(
                                "JzodObjectEditor resolve 'extend' clause for concrete raw schema for " +
                                  props.listKey +
                                  " attribute " +
                                  attribute[0] +
                                  " listKey " +
                                  attributeListKey +
                                  " concreteObjectRawJzodSchema " +
                                  JSON.stringify(concreteObjectRawJzodSchema) +
                                  " error " +
                                  resolvedConcreteObjectJzodSchemaTmp.error
                              );
                            }
                            resolvedConcreteObjectJzodSchema =
                              resolvedConcreteObjectJzodSchemaTmp.element as JzodObject;
                          } else {
                            resolvedConcreteObjectJzodSchema = concreteObjectRawJzodSchema;
                          }

                          attributeRawJzodSchema = resolvedConcreteObjectJzodSchema.definition[attribute[0]];
                        }
                        // log.info(
                        //   "JzodObjectEditor attribute for object",
                        //   currentValue,
                        //   "listKey",
                        //   props.listKey,
                        //   "attribute",
                        //   attribute[0],
                        //   "attributeListkey",
                        //   attributeListKey,
                        //   "props.resolvedJzodSchema",
                        //   props.resolvedJzodSchema,
                        //   "unfoldedRawSchema",
                        //   unfoldedRawSchema,
                        //   "resolvedConcreteObjectJzodSchema",
                        //   resolvedConcreteObjectJzodSchema,
                        //   "attributeRawJzodSchema",
                        //   attributeRawJzodSchema,
                        // );
                        // log.info("unfoldedRawSchema",unfoldedRawSchema,"attributeRawJzodSchema", attributeRawJzodSchema)
                        break;
                      }
                      default: {
                        throw new Error(
                          "JzodObjectEditor unfoldedRawSchema.type incorrect for object " +
                            props.listKey +
                            " attribute " +
                            attribute[0] +
                            " attributeListKey " +
                            attributeListKey
                        );
                        break;
                      }
                    }
                    // log.info(
                    //   "JzodObjectEditor resolved for object",
                    //   props.listKey,
                    //   "attribute",
                    //   attribute[0],
                    //   "attributeListkey",
                    //   attributeListKey,
                    //   "currentValue",
                    //   currentValue,
                    //   // JSON.stringify(currentValue, null, 2),
                    //   "resolvedJzodSchema",
                    //   props.resolvedJzodSchema,
                    //   "rawJzodSchema",
                    //   props.rawJzodSchema,
                    //   "unfoldedRawSchema",
                    //   // JSON.stringify(unfoldedRawSchema, null, 2),
                    //   unfoldedRawSchema,
                    //   "currentAttributeDefinition",
                    //   currentAttributeDefinition,
                    //   "attributeRawJzodSchema",
                    //   attributeRawJzodSchema,
                    //   // "currentAttributeRawDefinition",
                    //   // currentAttributeRawDefinition.element
                    // );
                    // const attributeCanBeRemoved = definedOptionalAttributes.has(attribute[0])?"inline":"none";
                    const attributeCanBeRemoved = definedOptionalAttributes.has(attribute[0]) ? "visible" : "hidden";
                    return (
                      <>
                        <div
                          key={attributeListKey}
                          // style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))`}}
                          // style={{ marginLeft: `calc(${indentShift})`}}
                        >
                          <SmallIconButton
                            onClick={() => removeOptionalAttribute(attributeRootLessListKey)}
                            // sx={{display: `calc(${attributeCanBeRemoved}`}}
                            // sx={{display: {attributeCanBeRemoved}}}
                            // style={{display: "none"}}
                            // style={{display: `calc(${attributeCanBeRemoved}`}}
                            // style={{display: attributeCanBeRemoved}}
                            style={{ visibility: attributeCanBeRemoved, padding: 0 }}
                            // sx={{visibility: `calc(${attributeCanBeRemoved}`}}
                          >
                            <Clear />
                          </SmallIconButton>
                          {
                            unfoldedRawSchema?.type == "record"?
                            <>
                            <input
                              id={attributeListKey+"Name"}
                              // form={"form." + props.name}
                              name={attributeListKey+"Name"}
                              // {...props.formik.getFieldProps(props.rootLesslistKey)}
                              onChange={(e)=>handleAttributeNameChange(e,attributeRootLessListKeyArray.slice())}
                              // defaultValue={Object.keys()}
                              defaultValue={attribute[0]}
                            /> 
                            attributeName for {attributeRootLessListKeyArray}
                            {/* attributeName for {attributeRootLessListKey} {JSON.stringify(currentValue)} */}
                            </>
                            :
                            <label htmlFor={attributeListKey}>{attributeDisplayedLabel}:</label>
                          }
                          {/* {attributeDisplayedLabel} */}
                          {/* </Box> */}
                          {/* <Box gridColumn="3" gridRow={attributeNumber} justifySelf="start"> */}
                          <ErrorBoundary
                            // FallbackComponent={Fallback}
                            FallbackComponent={({ error, resetErrorBoundary }: any) => {
                              // Call resetErrorBoundary() to reset the error boundary and retry the render.
                              log.error("Object errorboundary for", attributeListKey, "currentValue", currentValue);
                              return (
                                <div role="alert">
                                  <p>Something went wrong:</p>
                                  <div style={{ color: "red" }}>
                                    <div key="1">object {props.listKey}</div>
                                    <div key="2">attribute {attributeListKey}</div>
                                    value {JSON.stringify(currentValue)}
                                    <div key="3"></div>
                                    resolved type {JSON.stringify(resolvedJzodSchema)}
                                    <div key="4">error {error.message}</div>
                                  </div>
                                </div>
                              );
                            }}
                            // onReset={(details:any) => {
                            //   // Reset the state of your app so the error doesn't happen again
                            // }}
                          >
                            <JzodObjectEditor
                              name={attribute[0]}
                              listKey={attributeListKey}
                              rootLesslistKey={attributeRootLessListKey}
                              rootLesslistKeyArray={[...props.rootLesslistKeyArray, attribute[0]]}
                              indentLevel={usedIndentLevel + 1}
                              label={currentAttributeDefinition?.tag?.value?.defaultLabel}
                              paramMiroirFundamentalJzodSchema={props.paramMiroirFundamentalJzodSchema}
                              currentDeploymentUuid={props.currentDeploymentUuid}
                              rawJzodSchema={attributeRawJzodSchema}
                              unionInformation={unionInformation}
                              currentApplicationSection={props.currentApplicationSection}
                              resolvedJzodSchema={currentAttributeDefinition}
                              foreignKeyObjects={props.foreignKeyObjects}
                              handleChange={props.handleChange}
                              formik={props.formik}
                              setFormState={props.setFormState}
                              formState={props.formState}
                              parentObjectItemsOrder={itemsOrder}
                              parentObjectSetItemsOrder={setItemsOrder}
                            />
                          </ErrorBoundary>
                        </div>
                      </>
                    );
                  })}
                {/* </Box> */}
                {
                  unfoldedRawSchema.type != "record" && undefinedOptionalAttributes.length > 0 ? (
                  // <div style={{ marginLeft: `calc(${indentShift})` }}>
                  <div>
                    <SizedButton variant="text" onClick={addMissingOptionalAttribute}>
                      {/* <SizedIcon>addBox</SizedIcon> */}
                      {/* <Icon>add</Icon> */}
                      {/* <AddBox/> */}
                      <SizedAddBox/>
                    </SizedButton>{" "}
                    {JSON.stringify(undefinedOptionalAttributes)}
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </span>
            <br />
            {/* <div style={{ marginLeft: `calc((${usedIndentLevel})*(${indentShift}))`}}> */}
            <div style={{ marginLeft: `calc(${indentShift})` }}>
              {/* <div> */}
              {"}"}
            </div>
            {/* <p style={{}}/> */}
          </>
        );
        break;
      }
      case "array": {
        // log.info("############################################### JzodObjectEditor array rootLesslistKey", props.rootLesslistKey, "values", props.formik.values);
        log.info(
          "JzodObjectEditor for array",
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
                    throw new Error("JzodObjectEditor could not resolve jzod schema " + JSON.stringify(currentArrayElementRawDefinition, null, 2));
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
                          setformHelperState(Object.assign(formHelperState, { [props.listKey]: newItemsOrder }));
                          log.info(
                            "JzodObjectEditor array moving item",
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
                            "JzodObjectEditor array moving item",
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
                      <JzodObjectEditor
                        name={"" + index}
                        listKey={props.listKey + "." + index}
                        // currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                        indentLevel={usedIndentLevel + 1}
                        label={props.resolvedJzodSchema?.tag?.value?.defaultLabel}
                        paramMiroirFundamentalJzodSchema={props.paramMiroirFundamentalJzodSchema}
                        currentDeploymentUuid={props.currentDeploymentUuid}
                        currentApplicationSection={props.currentApplicationSection}
                        rootLesslistKey={props.rootLesslistKey.length > 0? (props.rootLesslistKey + "." + index):("" +index)}
                        rootLesslistKeyArray={[...props.rootLesslistKeyArray,""+index]}
                        rawJzodSchema={currentArrayElementRawDefinition.element}
                        resolvedJzodSchema={(props.resolvedJzodSchema as JzodArray)?.definition as any} // TODO: wrong type seen for props.resolvedJzodSchema! (cannot be undefined, really)
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
            <div style={{ marginLeft: `calc(${indentShift})`}}>
              {"]"}
            </div>
          </span>
        );
        break;

      }
      case "boolean":{
        // log.info("JzodObjectEditor boolean!",props.listKey,"formState",props.formState)
        return (
          <>
            <Checkbox 
              defaultChecked={props.formik.values[props.rootLesslistKey]}
              {...props.formik.getFieldProps(props.listKey)}
              name={props.listKey}
              id={props.listKey}
              onChange={handleSelectValueChange}
              // value={props.formik.values[props.rootLesslistKey]}
            />
          </>
        );
        break;
      }
      case "number":
      case "bigint":
      case "string":{
        // log.info("selectList for targetEntity", props.resolvedJzodSchema.tag?.value?.targetEntity, "value", selectList, "props.foreignKeyObjects", props.foreignKeyObjects);
        return (
          <>
            {/* <label htmlFor={props.listKey}>{displayedLabel}: </label> */}
            <input
              type="text"
              {...props.formik.getFieldProps(props.rootLesslistKey)}
              id={props.rootLesslistKey}
              name={props.name}
              role={props.listKey}
              onChange={handleSelectValueChange}
              value={currentValue}
            />
          </>
        );
        break;
      }
      case "uuid": {
        const handleSelectUuidChange = (event: any) => {
          // const parentPath = props.rootLesslistKeyArray.slice(0,props.rootLesslistKeyArray.length - 1)
          // identical to handleSelectEnumChange?
          const newFormState: any = alterObjectAtPath(props.formik.values, props.rootLesslistKeyArray, event.target.value);
          log.info("handleSelectUuidChange called with event", event, "current Value",props.formik.values,"newFormState", newFormState)
          props.setFormState(newFormState);
        }

        return props.resolvedJzodSchema.tag?.value?.targetEntity ? (
          <>
            {/* <label htmlFor={props.listKey}>{displayedLabel}: </label> */}
            <select
              id={props.rootLesslistKey}
              name={props.name}
              {...props.formik.getFieldProps(props.rootLesslistKey)}
              onChange={handleSelectUuidChange}
              value={currentValue}
            >
              {/* <option id={props.rootLesslistKey+".undefined"} value=""></option> */}
              {stringSelectList.map((e: [string, EntityInstance], index: number) => (
                <option id={props.rootLesslistKey + "." + index} key={e[1].uuid} value={e[1].uuid}>
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
            {/* <label htmlFor={props.listKey}>{displayedLabel}: </label> */}
            <input
              type="text"
              {...props.formik.getFieldProps(props.rootLesslistKey)}
              id={props.rootLesslistKey}
              name={props.name}
              role={props.listKey}
              onChange={props.handleChange}
              value={currentValue}
            />
          </>
        );
        break;
      }
      case "literal": {
        log.info(
          "rendering literal",
          props.listKey
        );

        if (props.unionInformation) {
          log.info(
            "literal with unionInformation",
            props.listKey,
            "discriminator=",
            props.unionInformation.discriminator,
            // "subDiscriminator=",
            // props.unionInformation.subDiscriminator,
            "unionInformation=",
            props.unionInformation
          );
        }
        return (
          <>
            {/* <label htmlFor={props.listKey}>{displayedLabel}: </label> */}
            {props.unionInformation ? (
              <>
                {
                props.unionInformation.discriminator &&
                  props.unionInformation.discriminatorValues &&
                  props.name == props.unionInformation.discriminator ? (
                    <>
                      <StyledSelect
                        variant="standard"
                        labelId="demo-simple-select-label"
                        id={props.listKey}
                        value={currentValue}
                        label={props.name}
                        onChange={handleSelectLiteralChange}
                      >
                        {props.unionInformation.discriminatorValues.map((v) => {
                          return (
                            <MenuItem key={v} value={v}>
                              {v}
                            </MenuItem>
                          );
                        })}
                      </StyledSelect> literal discriminator
                      {/* <div>
                        discriminator: {JSON.stringify(props.unionInformation.discriminatorValues)}
                      </div> */}
                    </>
                ) : (
                  <>
                    <input
                      id={props.listKey}
                      form={"form." + props.name}
                      name={props.name}
                      {...props.formik.getFieldProps(props.rootLesslistKey)}
                      onChange={props.handleChange}
                    />{" "}
                    {JSON.stringify(unfoldedRawSchema)} literal
                  </>
                )}
              </>
            ) : (
              <>
                <input
                  id={props.listKey}
                  form={"form." + props.name}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                />{" "}
                {JSON.stringify(unfoldedRawSchema)}
              </>
            )}
          </>
        );
      }
      case "enum": {
        const handleSelectEnumChange = (event: any) => {
          // TODO: avoid side-effects!!! So ugly, I'll be hanged for this.

          // log.info("handleSelectEnumChange called with event", event)
          const parentPath = props.rootLesslistKeyArray.slice(0,props.rootLesslistKeyArray.length - 1)
          // const currentParentValue = getValue(props.formik.values,parentPath);

          if (
            props.unionInformation?.discriminator &&
            props.unionInformation?.discriminatorValues &&
            props.name == props.unionInformation?.discriminator
          ) {
            // change of discriminator for union type, we must generate a new default value for the object
            // const newAttributeValue = getDefaultValueForJzodSchemaWithResolution(
            //   unfoldedRawSchema.definition,
            //   currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
            //   currentModel,
            //   miroirMetaModel
            // );
            handleSelectLiteralChange(event);
          } else {
            const newFormState: any = alterObjectAtPath(props.formik.values, props.rootLesslistKeyArray, event.target.value);
            log.info("handleSelectEnumChange called with event", event, "current Value",props.formik.values,"newFormState", newFormState)
            // log.info(
            //   "handleSelectChange newFormState",
            //   newFormState
            // );
            props.setFormState(newFormState);

          }
          // missingAttributes.length > 0
          //   ? { ...props.formik.values, [missingAttributes[0]]: "test!" }
          //   : props.formik.values;
          // const parentPath = props.rootLesslistKey.substring(0,props.rootLesslistKey.lastIndexOf("."))
          // if (!props.unionInformation) {
          //   throw new Error("handleSelectLiteralChange called but current object does not have information about the discriminated union type it must be part of!");
          // }
          // if (!props.unionInformation.jzodSchema.discriminator) {
          //   throw new Error("handleSelectLiteralChange called but current object does not have a discriminated union type!");
          // }
        }
        return (
          <>
          {/* <label htmlFor={props.listKey}>{displayedLabel}: </label> */}
          { props.unionInformation?.discriminator &&
            props.unionInformation?.discriminatorValues &&
            props.name == props.unionInformation?.discriminator ? (
              <>
                <StyledSelect
                  variant="standard"
                  labelId="demo-simple-select-label"
                  id={props.listKey}
                  value={currentValue}
                  label={props.name}
                  onChange={handleSelectEnumChange}
                >
                  {props.unionInformation?.discriminatorValues.map((v) => {
                    return (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    )
                  })}
                </StyledSelect> enum
                {/* <div>
                  subDiscriminator: {JSON.stringify(props.unionInformation.subDiscriminatorValues)}
                </div> */}
              </>
            ): (
              <>
                <StyledSelect
                  variant="standard"
                  labelId="demo-simple-select-label"
                  id={props.listKey}
                  role={props.listKey}
                  value={currentValue}
                  label={props.name}
                  onChange={handleSelectEnumChange}
                >
                  {
                    (props.rawJzodSchema as JzodEnum).definition.map((v) => {
                        return (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        );
                      }
                    )
                  }
                </StyledSelect>
              </>
            )
          }
          {
            props.forceTestingMode?
            <div>
              enumValues={JSON.stringify((props.rawJzodSchema as JzodEnum).definition)}
            </div>
            :
            <>
            </>
          }
          </>
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
      case "tuple":
      case "union":
      default: {
        return (
          <span>
            default case: {props.resolvedJzodSchema.type} {props.listKey} value {props.formik.values[props.rootLesslistKey]}
            {/* <div>
              found schema: {JSON.stringify(props.resolvedJzodSchema, null, 2)}
            </div>
            <div>
              for object: {JSON.stringify(props.initialValuesObject, null, 2)}
            </div> */}
          </span>
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
        raw Jzod schema: {JSON.stringify(props.rawJzodSchema)}
        <br />
        resolved schema: {JSON.stringify(props.resolvedJzodSchema)}
      </div>
    )
  }
}

export const JzodObjectEditorWithErrorBoundary = withErrorBoundary(JzodObjectEditor, {
  fallback: <div>Something went wrong</div>,
  onError(error, info) {
    log.error("JzodObjectEditor error", error)
    // Do something with the error
    // E.g. log to an error logging client here
  },
})
