import { useCallback, useMemo, useState } from "react";
import { ErrorBoundary, withErrorBoundary } from "react-error-boundary";

import Clear from "@mui/icons-material/Clear";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Checkbox from "@mui/material/Checkbox";

// import { FieldValues, UseFormRegister, UseFormSetValue, useFormContext } from "react-hook-form";

import {
  DeploymentEntityState,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  JzodObject,
  JzodRecord,
  JzodUnion_RecursivelyUnfold_ReturnType,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ResolvedJzodSchemaReturnType,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  adminConfigurationDeploymentMiroir,
  alterObjectAtPath,
  deleteObjectAtPath,
  dummyDomainManyQueryWithDeploymentUuid,
  getApplicationSection,
  getDefaultValueForJzodSchemaWithResolution,
  getQueryRunnerParamsForDeploymentEntityState,
  jzodTypeCheck,
  jzodUnion_recursivelyUnfold,
  mStringify,
  resolvePathOnObject,
  unfoldJzodSchemaOnce
} from "miroir-core";

import { MenuItem } from "@mui/material";
import { useFormikContext } from "formik";
import { getMemoizedDeploymentEntityStateSelectorMap } from "miroir-localcache-redux";
import { packageName } from "../../../constants.js";
import { getUnionInformation } from "../1-core/getUnionInformation.js";
import { cleanLevel } from "../constants.js";
import {
  useMiroirContextService
} from "../MiroirContextReactProvider.js";
import {
  useCurrentModel,
  useDeploymentEntityStateQuerySelectorForCleanedResult,
} from "../ReduxHooks.js";
import { JzodArrayEditor, indentShift } from "./JzodArrayEditor.js";
import { JzodElementEditorProps } from "./JzodElementEditorInterface.js";
import { JzodEnumEditor } from "./JzodEnumEditor.js";
import { JzodLiteralEditor } from "./JzodLiteralEditor.js";
import { LineIconButton, SizedAddBox, SizedButton, SmallIconButton, StyledSelect, getItemsOrder } from "./Style.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

export const noValue = {
  uuid: "31f3a03a-f150-416d-9315-d3a752cb4eb4",
  name: "no value",
  parentUuid: "",
} as EntityInstance;

// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}


// ################################################################################################
// ################################################################################################
// #####################################################################################################
// const SizedButton = styled(Button)(({ theme }) => ({
//   height: "1em",
//   width: "auto",
//   padding: "0px",
// }));
// const SizedAddBox = styled(AddBox)(({ theme }) => ({ height: "1em", width: "1em" }));
// const SizedIcon = styled(Icon)(({ theme }) => ({ height: "1em", width: "1em" }));
// const SmallIconButton = styled(IconButton)(({ theme }) => ({ size: "small" }));
// // const LineIconButton = styled(IconButton)(({ theme }) => ({ maxHeight: "1em", transform: {scale: 1.5} }));
// const LineIconButton = styled(IconButton)(({ theme }) => ({
//   padding: 0,
//   // boxSizing: "border-box",
//   maxHeight: "1em",
//   // transform: "scale(1.5)",
// }));
// const StyledSelect = styled(Select)(({ theme }) => ({
//   // backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
//   // ...theme.typography.body2,
//   // padding: theme.spacing(1),
//   // textAlign: "left",
//   // display: "flex",
//   maxHeight: "1.5em",
//   // height: '80vh',
//   // color: theme.palette.text.secondary,
// }));

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

// const labelStyle = {
//   paddingRight: "10px",
// };

// const StyledLabel = styled("label")(({ theme }) => ({
//   ...theme,
//   paddingRight: "10px",
// }));


// ################################################################################################
export const ExpandOrFoldObjectAttributes = (props: {
  hiddenFormItems: { [k: string]: boolean };
  // setHiddenFormItems: any,
  setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  listKey: string;
}): JSX.Element => {
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
        backgroundColor: "transparent",
      }}
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
      ) : (
        // <ExpandMore sx={{ color: "darkred",maxWidth: "15px", maxHeight: "15px" }} />
        // <ExpandLess sx={{ maxWidth: "15px", maxHeight: "15px" }} />
        <ExpandLess />
      )}
    </LineIconButton>
  );
};


// // #####################################################################################################
// function Fallback({ error, resetErrorBoundary }: any) {
//   // Call resetErrorBoundary() to reset the error boundary and retry the render.

//   return (
//     <div role="alert">
//       <p>Something went wrong:</p>
//       <pre style={{ color: "red" }}>{error.message}</pre>
//     </div>
//   );
// }

// #####################################################################################################
const objectTypes: string[] = ["record", "object", "union"];
const enumTypes: string[] = ["enum", "literal"];



// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
let count = 0;

// export const JzodElementEditor = (props: JzodObjectEditorProps): JSX.Element => {
export function JzodElementEditor(props: JzodElementEditorProps): JSX.Element {
  count++;
  const context = useMiroirContextService();
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> =
    useMemo(() => getMemoizedDeploymentEntityStateSelectorMap(), []);

  // const [selectedOption, setSelectedOption] = useState({label:props.name,value:props.initialValuesObject});
  const currentMiroirFundamentalJzodSchema =
    props.paramMiroirFundamentalJzodSchema ?? context.miroirFundamentalJzodSchema;
  // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const formik = useFormikContext<Record<string, any>>();

  const [hiddenFormItems, setHiddenFormItems] = useState<{ [k: string]: boolean }>({});

  const currentModel: MetaModel = useCurrentModel(props.currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const displayedLabel: string = props.label ?? props.name;

  const usedIndentLevel: number = props.indentLevel ? props.indentLevel : 0;

  // log.info(
  //   "JzodElementEditor render",
  //   count,
  //   "name",
  //   name,
  //   "listKey",
  //   props.listKey,
  //   "resolvedElementJzodSchema",
  //   props.resolvedElementJzodSchema,
  // );
  log.info("#####################################################################################");
  log.info(
    "JzodElementEditor rendering for",
    props.listKey,
    "count",
    count,
    "formik.values",
    JSON.stringify(formik.values, null, 2),
  );

  const currentValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);

  const returnedLocalResolvedElementJzodSchemaBasedOnValue: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
    const newRecordResolvedElementJzodSchema = props.rawJzodSchema && currentMiroirFundamentalJzodSchema?jzodTypeCheck(
      props.rawJzodSchema,
      currentValue,
      [], // currentValuePath
      [], // currentTypePath
      currentMiroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      {}
    ): undefined;
    return newRecordResolvedElementJzodSchema;
  }, [currentValue, props.rawJzodSchema, currentMiroirFundamentalJzodSchema]); // this does not depend on props.resolvedElementJzodSchema, which  but on props.rawJzodSchema and currentValue

  log.info(
    "JzodElementEditor rendering for",
    props.listKey,
    "count",
    count,
    "returnedLocalResolvedElementJzodSchemaBasedOnValue",
    JSON.stringify(returnedLocalResolvedElementJzodSchemaBasedOnValue, null, 2),
    "props.rawJzodSchema",
    JSON.stringify(props.rawJzodSchema, null, 2),
  );

  if (!returnedLocalResolvedElementJzodSchemaBasedOnValue || returnedLocalResolvedElementJzodSchemaBasedOnValue.status == "error") {
    throw new Error(
      "JzodElementEditor could not resolve jzod schema for " +
        props.listKey +
        " count " +
        count +
        " currentValue " +
        JSON.stringify(currentValue, null, 2) +
        " rawJzodSchema " +
        JSON.stringify(props.rawJzodSchema, null, 2) +
        " returnedLocalResolvedElementJzodSchemaBasedOnValue " +
        JSON.stringify(returnedLocalResolvedElementJzodSchemaBasedOnValue, null, 2)
    );
    // return (
    //   <div>
    //     <p>
    //       Error resolving jzod schema for {props.listKey} {count}:
    //     </p>
    //     <pre style={{ color: "red" }}>
    //       {JSON.stringify(returnedLocalResolvedElementJzodSchemaBasedOnValue, null, 2)}
    //     </pre>
    //     jzod schema:{" "}
    //     <pre style={{ color: "red" }}>
    //       {JSON.stringify(props.rawJzodSchema, null, 2)}
    //     </pre>
    //   </div>
    // );
  }
  const localResolvedElementJzodSchemaBasedOnValue: JzodElement = returnedLocalResolvedElementJzodSchemaBasedOnValue.element;
  const itemsOrder: any[] = useMemo(
    () => getItemsOrder(currentValue, localResolvedElementJzodSchemaBasedOnValue),
    [localResolvedElementJzodSchemaBasedOnValue, currentValue]
  );

  // object or schemaReference unfolding
  let unfoldedRawSchemaReturnType: ResolvedJzodSchemaReturnType | undefined;
  try {
    unfoldedRawSchemaReturnType = useMemo(() => {
      const result = currentMiroirFundamentalJzodSchema
        ? unfoldJzodSchemaOnce(
            currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
            props.rawJzodSchema,
            currentModel,
            miroirMetaModel
          )
        : undefined;
      return {
        ...result,
        valuePath: [],
        typePath: [],
      } as any;
    }, [
      props.rawJzodSchema,
      props.listKey,
      currentMiroirFundamentalJzodSchema /*context.miroirFundamentalJzodSchema,*/,
      currentModel,
      miroirMetaModel,
    ]);
  } catch (e) {
    log.error(
      "caught error upon calling unfoldJzodSchemaOnce! count",
      count,
      "key",
      props.rootLesslistKey,
      "error",
      e
    );
  }

  if (!unfoldedRawSchemaReturnType || unfoldedRawSchemaReturnType.status == "error") {
    throw new Error(
      "JzodElementEditor could not unfold raw schema " +
        JSON.stringify(props.rawJzodSchema, null, 2) +
        // props.rawJzodSchema +
        " count " +
        count +
        " result " +
        // JSON.stringify(unfoldedRawSchemaReturnType, null, 2) +
        unfoldedRawSchemaReturnType +
        " miroirFundamentalJzodSchema " +
        currentMiroirFundamentalJzodSchema
      // JSON.stringify(currentMiroirFundamentalJzodSchema, null, 2)
    );
  }
  const unfoldedRawSchema: JzodElement = unfoldedRawSchemaReturnType.element;
  // log.info(
  //   "JzodElementEditor",
  //   props.listKey,
  //   "rawJzodSchema",
  //   props.rawJzodSchema,
  //   "unfoldedRawSchema",
  //   unfoldedRawSchema,
  // );

  if (localResolvedElementJzodSchemaBasedOnValue && props.rawJzodSchema) {
    if (
      localResolvedElementJzodSchemaBasedOnValue.type != props.rawJzodSchema?.type &&
      ((localResolvedElementJzodSchemaBasedOnValue.type == "object" &&
        !objectTypes.includes(props.rawJzodSchema.type)) ||
        (props.rawJzodSchema.type == "enum" &&
          // !enumTypes.includes(localResolvedElementJzodSchema.type)))
          !enumTypes.includes(localResolvedElementJzodSchemaBasedOnValue.type)))
    ) {
      throw new Error(
        "JzodElementEditor mismatching jzod schemas, resolved schema " +
          JSON.stringify(props.resolvedElementJzodSchema, null, 2) +
          " raw schema " +
          JSON.stringify(props.rawJzodSchema, null, 2)
      );
    }
  // if (props.resolvedElementJzodSchema && props.rawJzodSchema) {
  //   if (
  //     props.resolvedElementJzodSchema.type != props.rawJzodSchema?.type &&
  //     ((props.resolvedElementJzodSchema.type == "object" &&
  //       !objectTypes.includes(props.rawJzodSchema.type)) ||
  //       (props.rawJzodSchema.type == "enum" &&
  //         !enumTypes.includes(props.resolvedElementJzodSchema.type)))
  //   ) {
  //     throw new Error(
  //       "JzodElementEditor mismatching jzod schemas, resolved schema " +
  //         JSON.stringify(props.resolvedElementJzodSchema, null, 2) +
  //         " raw schema " +
  //         JSON.stringify(props.rawJzodSchema, null, 2)
  //     );
  //   }

    const recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnType | undefined = useMemo(() => {
      if (
        unfoldedRawSchema.type == "union" && currentMiroirFundamentalJzodSchema
      ) {
        const result = jzodUnion_recursivelyUnfold(
          unfoldedRawSchema,
          new Set(),
          currentMiroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel,
          {},// relativeReferenceJzodContext
        );
        return result;
      } else {
        return undefined;
      }
    }, [unfoldedRawSchema, currentMiroirFundamentalJzodSchema, currentModel, miroirMetaModel]);

    if (
      recursivelyUnfoldedRawSchema && recursivelyUnfoldedRawSchema.status == "error"
    ) {
      return (
        <div>
          <p>
            Error unfolding union schema {props.listKey} {count}:
          </p>
          <pre style={{ color: "red" }}>
            {JSON.stringify(recursivelyUnfoldedRawSchema, null, 2)}
          </pre>
        </div>
      )
    }

    // ########################## unionInformation #########################
    const unionInformation = useMemo(() => {
      return unfoldedRawSchema.type == "union" &&
        recursivelyUnfoldedRawSchema &&
        recursivelyUnfoldedRawSchema.status == "ok"
        ? getUnionInformation(
            unfoldedRawSchema,
            localResolvedElementJzodSchemaBasedOnValue,
            recursivelyUnfoldedRawSchema,
          )
        : undefined;
    }, [unfoldedRawSchema, localResolvedElementJzodSchemaBasedOnValue, recursivelyUnfoldedRawSchema]);

    // ######################### foreignKeyObjects #########################
    const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerParams<DeploymentEntityState> = useMemo(
      () =>
        getQueryRunnerParamsForDeploymentEntityState(
          props.currentDeploymentUuid &&
            unfoldedRawSchema.type == "uuid" &&
            unfoldedRawSchema.tag?.value?.targetEntity
            ? {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                deploymentUuid: props.currentDeploymentUuid,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                extractors: {
                  [unfoldedRawSchema.tag?.value?.targetEntity]: {
                    extractorOrCombinerType: "extractorByEntityReturningObjectList",
                    applicationSection: getApplicationSection(
                      props.currentDeploymentUuid,
                      unfoldedRawSchema.tag?.value?.targetEntity
                    ),
                    parentName: "",
                    parentUuid: unfoldedRawSchema.tag?.value?.targetEntity,
                  },
                },
              }
            : dummyDomainManyQueryWithDeploymentUuid,
          deploymentEntityStateSelectorMap
        ),
      [deploymentEntityStateSelectorMap, props.currentDeploymentUuid, unfoldedRawSchema]
    );

    const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
      useDeploymentEntityStateQuerySelectorForCleanedResult(
        deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
          DeploymentEntityState,
          Domain2QueryReturnType<DomainElementSuccess>
        >,
        foreignKeyObjectsFetchQueryParams
      );

    // log.info(
    //   "JzodElementEditor",
    //   props.listKey,
    //   "count",
    //   count,
    //     // "foreignKeyObjectsFetchQueryParams",
    //     // JSON.stringify(foreignKeyObjectsFetchQueryParams, null, 2),
    //     // "foreignKeyObjects",
    //     // JSON.stringify(foreignKeyObjects, null, 2),
    // );

    // ################################# objects ###################################
    const undefinedOptionalAttributes: string[] = useMemo(() => {
      if (props.resolvedElementJzodSchema?.type == "object" && unfoldedRawSchema.type == "object") {
        const currentObjectAttributes = Object.keys(currentValue);
        return Object.entries(unfoldedRawSchema.definition)
          .filter((a) => a[1].optional)
          .filter((a) => !currentObjectAttributes.includes(a[0]))
          .map((a) => a[0]);
      }
      return [];
    }, [unfoldedRawSchema, currentValue]);

    const definedOptionalAttributes: Set<string> = useMemo(() => {
      if (props.resolvedElementJzodSchema?.type == "object" && unfoldedRawSchema.type == "object") {
        const currentObjectAttributes = Object.keys(currentValue);
        return new Set(
          Object.entries(unfoldedRawSchema.definition)
            .filter((a) => a[1].optional)
            .filter((a) => currentObjectAttributes.includes(a[0]))
            .map((a) => a[0])
        );
      }
      return new Set();
    }, [unfoldedRawSchema, currentValue]);


    const stringSelectList = useMemo(() => {
      if (
        localResolvedElementJzodSchemaBasedOnValue?.type == "uuid" &&
        localResolvedElementJzodSchemaBasedOnValue.tag?.value?.targetEntity
      ) {
        return [
          [noValue.uuid, noValue] as [string, EntityInstance],
          ...Object.entries(
            foreignKeyObjects[localResolvedElementJzodSchemaBasedOnValue.tag.value?.targetEntity] ?? {}
          ),
        ];
      }
      return [];
    }, [localResolvedElementJzodSchemaBasedOnValue, foreignKeyObjectsFetchQueryParams]);


    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // uses setFormState to update the formik state
    const handleAttributeNameChange = (event: any, attributeRootLessListKeyArray: string[]) => {
      const localAttributeRootLessListKeyArray: string[] = attributeRootLessListKeyArray.slice();
      const newAttributeName = event.target.value;
      const oldAttributeName =
        localAttributeRootLessListKeyArray[localAttributeRootLessListKeyArray.length - 1];
      log.info(
        "handleAttributeNameChange renaming attribute",
        oldAttributeName,
        "into",
        newAttributeName,
        "called with event",
        event,
        "current Value",
        formik.values,
        "props.rootLesslistKey",
        props.rootLesslistKey,
        "attributeRootLessListKeyArray",
        attributeRootLessListKeyArray,
        attributeRootLessListKeyArray.length,
        // "localAttributeRootLessListKeyArray",
        // localAttributeRootLessListKeyArray,
        // localAttributeRootLessListKeyArray.length,
        "props.resolvedJzodSchema",
        props.resolvedElementJzodSchema
      );
      const subObject = resolvePathOnObject(
        formik.values,
        localAttributeRootLessListKeyArray
      );
      const newFormState1: any = deleteObjectAtPath(
        formik.values,
        localAttributeRootLessListKeyArray
      );
      log.info(
        "handleAttributeNameChange newFormState1",
        newFormState1,
        localAttributeRootLessListKeyArray
      );
      // const newPath = attributeRootLessListKeyArray.slice(0,attributeRootLessListKeyArray.length-1);
      const parentPath = localAttributeRootLessListKeyArray.slice(
        0,
        localAttributeRootLessListKeyArray.length - 1
      );
      const newPath = localAttributeRootLessListKeyArray.slice(
        0,
        localAttributeRootLessListKeyArray.length - 1
      );
      log.info(
        "handleAttributeNameChange newPath before push",
        newPath,
        localAttributeRootLessListKeyArray
      );
      newPath.push(newAttributeName);
      log.info("handleAttributeNameChange newPath", newPath);
      const newFormState2: any = alterObjectAtPath(newFormState1, newPath, subObject);
      log.info("handleAttributeNameChange newFormState2", newFormState2);

      // log.info("handleSelectValueChange called with event", event, "current Value",props.formik.values,"newFormState", newFormState)
      // props.setFormState(newFormState2);
      formik.setFormikState(newFormState2);
      if (itemsOrder) {
        log.info(
          "handleAttributeNameChange reading path",
          props.rootLesslistKey,
          "from currentParentValue",
          newFormState2,
          "itemsOrder",
          itemsOrder
        );
        const localItemsOrder = itemsOrder.slice();
        const attributePosition = localItemsOrder?.indexOf(oldAttributeName);
        // const newItemsOrder = parentItemsOrder?.splice(uuidPosition,1)
        if (attributePosition != -1) {
          localItemsOrder[attributePosition] = newAttributeName;
        }
        log.info(
          "handleAttributeNameChange for path",
          props.rootLesslistKey,
          "new itemsOrder to be computed should be",
          localItemsOrder
        );
        // setItemsOrder(localItemsOrder);
      } else {
        log.warn("handleAttributeNameChange reading path", parentPath, "itemsOrder is undefined!");
      }
      // log.info(
      //   "handleAttributeNameChange new parent object items order",
      //   parentItemsOrder,
      // );
      // const currentParentValue = resolvePathOnObject(newFormState2,parentPath);
    };


    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    switch (localResolvedElementJzodSchemaBasedOnValue.type) {
      case "object": {
        // #######################
        // uses setFormState to update the formik state
        const addExtraRecordEntry = useCallback(async () => {
          log.info(
            "addExtraRecordEntry clicked!",
            props.rootLesslistKey,
            itemsOrder,
            Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
            "formik",
            formik.values
          );
          if (unfoldedRawSchema.type != "record" || props.rawJzodSchema?.type != "record") {
            throw "addExtraRecordEntry called for non-record type: " + unfoldedRawSchema.type;
          }

          const newAttributeType: JzodElement = (props.rawJzodSchema as JzodRecord)?.definition;
          log.info(
            "addExtraRecordEntry newAttributeType",
            JSON.stringify(newAttributeType, null, 2)
          );
          const newAttributeValue = currentMiroirFundamentalJzodSchema
            ? getDefaultValueForJzodSchemaWithResolution(
                unfoldedRawSchema.definition,
                currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
                currentModel,
                miroirMetaModel
              )
            : undefined;

          const currentValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);
          const newRecordValue: any = { ["newRecordEntry"]: newAttributeValue, ...currentValue };
          log.info("addExtraRecordEntry", "newValue", newRecordValue);

          const newItemsOrder = getItemsOrder(newRecordValue, props.rawJzodSchema);
          log.info("addExtraRecordEntry", "itemsOrder", itemsOrder, "newItemsOrder", newItemsOrder);

          formik.setFieldValue(props.rootLesslistKey, newRecordValue);
          log.info(
            "addExtraRecordEntry clicked2!",
            props.listKey,
            itemsOrder,
            Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
            // Object.keys(resolvedElementJzodSchema.definition),
            // "formState",
            // props.formState,
            "formik",
            formik.values
          );
        }, [props, itemsOrder, localResolvedElementJzodSchemaBasedOnValue]);

        // #######################
        // #######################
        // #######################
        const addObjectOptionalAttribute = useCallback(async () => {
          log.info(
            "addObjectOptionalAttribute clicked!",
            props.listKey,
            itemsOrder,
            Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
            "formik",
            formik.values,
            "props.rawJzodSchema",
            JSON.stringify(props.rawJzodSchema, null, 2),
            "undefinedOptionalAttributes",
            undefinedOptionalAttributes
          );
          const currentObjectValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);
          const newAttributeType: JzodElement = resolvePathOnObject(props.rawJzodSchema, [
            "definition",
            undefinedOptionalAttributes[0],
          ]);
          // const newAttributeValue = getDefaultValueForJzodSchema(newAttributeType)
          const newAttributeValue = currentMiroirFundamentalJzodSchema
            ? getDefaultValueForJzodSchemaWithResolution(
                newAttributeType,
                currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
                currentModel,
                miroirMetaModel
              )
            : undefined;

          const newObjectValue = {
            ...currentObjectValue,
            [undefinedOptionalAttributes[0]]: newAttributeValue,
          };
          const newItemsOrder = getItemsOrder(newObjectValue, props.rawJzodSchema);

          formik.setFieldValue(props.rootLesslistKey, newObjectValue, false);

          log.info(
            "addObjectOptionalAttribute clicked2!",
            props.listKey,
            itemsOrder,
            Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
            // Object.keys(localResolvedElementJzodSchema.definition),
            "newObjectValue",
            newObjectValue,
            "newItemsOrder",
            newItemsOrder,
            "localResolvedElementJzodSchemaBasedOnValue",
            JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2),
            // "props.resolvedElementJzodSchema",
            // JSON.stringify(props.resolvedElementJzodSchema, null, 2),
            "props.rawJzodSchema",
            JSON.stringify(props.rawJzodSchema, null, 2)
          );
        }, [props, itemsOrder, localResolvedElementJzodSchemaBasedOnValue]);
        // #######################
        // #######################
        // #######################
        const removeOptionalAttribute = useCallback(
          (listKey: string) => {
            log.info(
              "removeOptionalAttribute clicked!",
              listKey,
              itemsOrder,
              Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
              "formik",
              formik.values
            );
            const newFormState: any = { ...formik.values };
            delete newFormState[listKey];
            formik.setFormikState(newFormState);
            const currentValue = resolvePathOnObject(newFormState, props.rootLesslistKeyArray);
            log.info(
              "clicked2!",
              listKey,
              itemsOrder,
              Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
              "formik",
              formik.values
            );
          },
          [props, itemsOrder, localResolvedElementJzodSchemaBasedOnValue]
        );
        // ########################################################################################
        return (
          <div id={props.rootLesslistKey} key={props.rootLesslistKey}>
            <span id={props.rootLesslistKey} key={props.rootLesslistKey + "head"}>
              <span>
                {"{"}
                <ExpandOrFoldObjectAttributes
                  hiddenFormItems={hiddenFormItems}
                  setHiddenFormItems={setHiddenFormItems}
                  listKey={props.listKey}
                ></ExpandOrFoldObjectAttributes>
                {localResolvedElementJzodSchemaBasedOnValue.type} {unfoldedRawSchema.type}
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
                {unfoldedRawSchema.type == "record" ? (
                  <div>
                    <SizedButton
                      variant="text"
                      aria-label={props.rootLesslistKey + ".addRecordAttribute"}
                      onClick={addExtraRecordEntry}
                    >
                      <SizedAddBox />
                    </SizedButton>
                    add new record:
                  </div>
                ) : (
                  <></>
                )}
                {itemsOrder
                  .map((i): [string, JzodElement] => [
                    i,
                    formik.values[
                      props.rootLesslistKey.length > 0 ? props.rootLesslistKey + "." + i[0] : i[0]
                    ],
                  ])
                  .map((attribute: [string, JzodElement], attributeNumber: number) => {
                    const currentAttributeDefinition =
                      localResolvedElementJzodSchemaBasedOnValue.definition[attribute[0]];
                    const attributeListKey = props.listKey + "." + attribute[0];
                    const attributeRootLessListKey =
                      props.rootLesslistKey.length > 0
                        ? props.rootLesslistKey + "." + attribute[0]
                        : attribute[0];
                    const attributeRootLessListKeyArray =
                      props.rootLesslistKeyArray.length > 0
                        ? [...props.rootLesslistKeyArray, attribute[0]]
                        : [attribute[0]];

                    let attributeRawJzodSchema: JzodElement;

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
                        // const subDiscriminator: string = (unfoldedRawSchema as any).subDiscriminator;
                        // log.info(
                        //   "JzodElementEditor object with discrimitated union:",
                        //   props.listKey,
                        //   "attribute",
                        //   attribute[0],
                        //   "attributeListkey",
                        //   attributeListKey,
                        //   "currentValue",
                        //   currentValue,
                        //   // JSON.stringify(currentValue, null, 2),
                        //   "resolvedElementJzodSchema",
                        //   props.resolvedElementJzodSchema,
                        //   "rawJzodSchema",
                        //   props.rawJzodSchema,
                        // );
                        let concreteObjectRawJzodSchema: JzodObject | undefined;
                        let resolvedConcreteObjectJzodSchema: JzodObject | undefined;

                        const possibleObjectTypes =
                          unionInformation?.objectBranches.filter((a: any) => a.type == "object") ??
                          []; // useless??

                        if (possibleObjectTypes.length == 0) {
                          return (
                            <div key={attributeListKey}>
                              <span>
                                {attributeDisplayedLabel}{" "}
                                <span className="error">no object type found in union</span>
                              </span>
                            </div>
                          );
                        }

                        if (possibleObjectTypes.length > 1) {
                          if (!unfoldedRawSchema.discriminator) {
                            throw new Error(
                              "no discriminator found, could not choose branch of union type for object " +
                                // JSON.stringify(unfoldedRawSchema, null, 2) +
                                unfoldedRawSchema +
                                " " +
                                localResolvedElementJzodSchemaBasedOnValue
                            );
                          }
                          const discriminator: string = (unfoldedRawSchema as any).discriminator;
                          const discriminatorValue = currentValue[discriminator];
                          // log.info(
                          //   "############### discriminator",
                          //   discriminator,
                          //   "discriminatorValue",
                          //   discriminatorValue,
                          //   "possibleObjectTypes",
                          //   JSON.stringify(possibleObjectTypes, null, 2),
                          //   "attribute",
                          //   JSON.stringify(attribute, null, 2),
                          // );
                          // discriminator only
                          // TODO: remove duplication from JzodUnfoldSchemaForValue. This is a core functionality, finding the concrete type for a value in a union.
                          if (discriminator && discriminatorValue) {
                            concreteObjectRawJzodSchema = possibleObjectTypes.find(
                              (a: any) =>
                                (a.type == "object" &&
                                  a.definition[discriminator].type == "literal" &&
                                  (a.definition[discriminator] as JzodLiteral).definition ==
                                    discriminatorValue) ||
                                (a.type == "object" &&
                                  a.definition[discriminator].type == "enum" &&
                                  (a.definition[discriminator] as JzodEnum).definition.includes(
                                    discriminatorValue
                                  ))
                            ) as any;
                          } else {
                            return (
                              <div key={attributeListKey}>
                                <span>
                                  {attributeDisplayedLabel}{" "}
                                  <span className="error">
                                    no discriminator value found in union for object {props.listKey}{" "}
                                    attribute {attribute[0]} attributeListKey {attributeListKey}
                                  </span>
                                </span>
                              </div>
                            );
                          }
                        } else {
                          // possibleObjectTypes.length == 1
                          concreteObjectRawJzodSchema = possibleObjectTypes[0] as JzodObject;
                        }
                        if (!concreteObjectRawJzodSchema) {
                          throw new Error(
                            "JzodElementEditor could not find concrete raw schema for " +
                              props.listKey +
                              " attribute " +
                              attribute[0] +
                              " listKey " +
                              attributeListKey +
                              " unfoldedRawSchema " +
                              JSON.stringify(unfoldedRawSchema, null, 2)
                          );
                        }
                        if (
                          concreteObjectRawJzodSchema.type == "object" &&
                          concreteObjectRawJzodSchema.extend
                        ) {
                          const resolvedConcreteObjectJzodSchemaTmp =
                            currentMiroirFundamentalJzodSchema
                              ? unfoldJzodSchemaOnce(
                                  currentMiroirFundamentalJzodSchema,
                                  concreteObjectRawJzodSchema,
                                  currentModel,
                                  miroirMetaModel
                                )
                              : undefined;

                          if (
                            !resolvedConcreteObjectJzodSchemaTmp ||
                            resolvedConcreteObjectJzodSchemaTmp.status != "ok"
                          ) {
                            throw new Error(
                              "JzodElementEditor resolve 'extend' clause for concrete raw schema for " +
                                props.listKey +
                                " attribute " +
                                attribute[0] +
                                " listKey " +
                                attributeListKey +
                                " concreteObjectRawJzodSchema " +
                                JSON.stringify(concreteObjectRawJzodSchema) +
                                " error " +
                                resolvedConcreteObjectJzodSchemaTmp?.error
                            );
                          }
                          resolvedConcreteObjectJzodSchema =
                            resolvedConcreteObjectJzodSchemaTmp.element as JzodObject;
                        } else {
                          resolvedConcreteObjectJzodSchema = concreteObjectRawJzodSchema;
                        }

                        // if (attribute[0] == discriminator) {
                        //   attributeRawJzodSchema =
                        //     currentAttributeDefinition.type == "enum"
                        //       ? currentAttributeDefinition
                        //       : { type: "literal", definition: "literal" }; // definition is not taken into account, possible values come from unionInformation
                        // } else {
                        attributeRawJzodSchema =
                          resolvedConcreteObjectJzodSchema.definition[attribute[0]];
                        // }

                        // log.info(
                        //   "JzodElementEditor attribute for object",
                        //   currentValue,
                        //   "listKey",
                        //   props.listKey,
                        //   "attribute",
                        //   attribute[0],
                        //   "attributeListkey",
                        //   attributeListKey,
                        //   "props.resolvedElementJzodSchema",
                        //   props.resolvedElementJzodSchema,
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
                          "JzodElementEditor unfoldedRawSchema.type incorrect for object " +
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
                    //   "JzodElementEditor resolved for object",
                    //   props.listKey,
                    //   "attribute",
                    //   attribute[0],
                    //   "attributeListkey",
                    //   attributeListKey,
                    //   "currentValue",
                    //   currentValue,
                    //   // JSON.stringify(currentValue, null, 2),
                    //   "resolvedElementJzodSchema",
                    //   props.resolvedElementJzodSchema,
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
                    const attributeCanBeRemoved = definedOptionalAttributes.has(attribute[0])
                      ? "visible"
                      : "hidden";
                    return (
                      <div
                        // key={attributeListKey}
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
                        {unfoldedRawSchema?.type == "record" ? (
                          <>
                            <input
                              id={attributeListKey + "Name"}
                              key={attributeListKey + "Name"}
                              // name={attributeListKey + "Name"}
                              name={attributeRootLessListKey + "Name"}
                              onChange={(e) =>
                                handleAttributeNameChange(e, attributeRootLessListKeyArray.slice())
                              }
                              defaultValue={attribute[0]}
                            />
                            {/* attributeName for {attributeRootLessListKeyArray} */}
                          </>
                        ) : (
                          <label htmlFor={attributeListKey}>{attributeDisplayedLabel}:</label>
                        )}
                        {/* {attributeDisplayedLabel} */}
                        {/* </Box> */}
                        {/* <Box gridColumn="3" gridRow={attributeNumber} justifySelf="start"> */}
                        <ErrorBoundary
                          // FallbackComponent={Fallback}
                          FallbackComponent={({ error, resetErrorBoundary }: any) => {
                            // Call resetErrorBoundary() to reset the error boundary and retry the render.
                            log.error(
                              "Object errorboundary for",
                              attributeListKey,
                              "currentValue",
                              currentValue
                            );
                            return (
                              <div role="alert">
                                <p>Something went wrong:</p>
                                <div style={{ color: "red" }}>
                                  <div key="1">object {props.listKey}</div>
                                  <div key="2">attribute {attributeListKey}</div>
                                  value {JSON.stringify(currentValue)}
                                  <div key="3"></div>
                                  resolved type {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue)}
                                  {/* resolved type {JSON.stringify(localResolvedElementJzodSchema)} */}
                                  <div key="4">error {error.message}</div>
                                </div>
                              </div>
                            );
                          }}
                          // onReset={(details:any) => {
                          //   // Reset the state of your app so the error doesn't happen again
                          // }}
                        >
                          <JzodElementEditor
                            name={attribute[0]}
                            key={attribute[0]}
                            listKey={attributeListKey}
                            rootLesslistKey={attributeRootLessListKey}
                            rootLesslistKeyArray={[...props.rootLesslistKeyArray, attribute[0]]}
                            indentLevel={usedIndentLevel + 1}
                            label={currentAttributeDefinition?.tag?.value?.defaultLabel}
                            paramMiroirFundamentalJzodSchema={
                              props.paramMiroirFundamentalJzodSchema
                            }
                            currentDeploymentUuid={props.currentDeploymentUuid}
                            rawJzodSchema={attributeRawJzodSchema}
                            currentApplicationSection={props.currentApplicationSection}
                            resolvedElementJzodSchema={currentAttributeDefinition}
                            foreignKeyObjects={props.foreignKeyObjects}
                            unionInformation={unionInformation}
                          />
                        </ErrorBoundary>
                      </div>
                    );
                  })}
                {/* </Box> */}
                {unfoldedRawSchema.type != "record" && undefinedOptionalAttributes.length > 0 ? (
                  // <div style={{ marginLeft: `calc(${indentShift})` }}>
                  <div>
                    <SizedButton
                      variant="text"
                      aria-label={props.rootLesslistKey + ".addObjectOptionalAttribute"}
                      onClick={addObjectOptionalAttribute}
                    >
                      <SizedAddBox />
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
          </div>
        );
        break;
      }
      // DONE
      case "tuple":
      case "array": {
        return (
          <JzodArrayEditor
            {...props}
            key={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            rootLesslistKey={props.rootLesslistKey}
            rawJzodSchema={props.rawJzodSchema as any}
            itemsOrder={itemsOrder}
            hiddenFormItems={hiddenFormItems}
            setHiddenFormItems={setHiddenFormItems}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            paramMiroirFundamentalJzodSchema={props.paramMiroirFundamentalJzodSchema}
            foreignKeyObjects={props.foreignKeyObjects}
            unionInformation={props.unionInformation}
          ></JzodArrayEditor>
        );
      }
      case "boolean": {
        log.info(
          "JzodElementEditor boolean!",
          props.listKey,
          "formik.getFieldProps",
          mStringify(formik.getFieldProps(props.rootLesslistKey)),
          "formik.values[props.rootLesslistKey]",
          formik.values[props.rootLesslistKey]
        );
        const fieldProps = formik.getFieldProps(props.rootLesslistKey);
        return (
          <Checkbox
            // defaultChecked={formik.values[props.rootLesslistKey]}
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            aria-label={props.rootLesslistKey}
            {...fieldProps}
            name={props.rootLesslistKey}
            checked={fieldProps.value}
          />
        );
        break;
      }
      case "number": {
        // log.info("JzodElementEditor number!", props.listKey, "formState", props.formState);
        return (
          <input
            type="number"
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            role="textbox"
            {...formik.getFieldProps(props.rootLesslistKey)}
          />
        );
        break;
      }
      case "bigint": {
        return (
          <input
            type="text"
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            role="textbox"
            {...formik.getFieldProps(props.rootLesslistKey)}
            value={currentValue.toString()} // Convert bigint to string
            onChange={(e) => {
              const value = e.target.value;
              formik.setFieldValue(props.rootLesslistKey, value ? BigInt(value) : BigInt(0)); // Convert string back to bigint
            }}
          />
        );
        break;
      }
      case "string": {
        return (
          <input
            type="text"
            role="textbox"
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            {...formik.getFieldProps(props.rootLesslistKey)}
          />
        );
        break;
      }
      case "uuid": {
        return localResolvedElementJzodSchemaBasedOnValue.tag?.value?.targetEntity ? (
          <StyledSelect
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            aria-label={props.rootLesslistKey}
            labelId="demo-simple-select-label"
            variant="standard"
            {...formik.getFieldProps(props.rootLesslistKey)}
            name={props.rootLesslistKey}
          >
            {stringSelectList.map((e: [string, EntityInstance], index: number) => (
              <MenuItem id={props.rootLesslistKey + "." + index} key={e[1].uuid} value={e[1].uuid}>
                {(e[1] as EntityInstanceWithName).name}
              </MenuItem>
            ))}
          </StyledSelect>
        ) : (
          <input
            type="text"
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            role="textbox"
            {...formik.getFieldProps(props.rootLesslistKey)}
          />
        );
        break;
      }
      // DONE
      case "literal": {
        return (
          <JzodLiteralEditor
            name={props.name}
            key={props.rootLesslistKey}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            label={props.label}
            unionInformation={props.unionInformation}
            // setParentResolvedElementJzodSchema={setLocalResolvedElementJzodSchema}
          />
        );
      }
      // DONE
      case "enum": {
        const enumValues: string[] =
          // (localResolvedElementJzodSchema && localResolvedElementJzodSchema.definition) ||
          (localResolvedElementJzodSchemaBasedOnValue && localResolvedElementJzodSchemaBasedOnValue.definition) ||
          (props.rawJzodSchema && ((props.rawJzodSchema as any).definition ?? [])) ||
          [];
        return (
          <JzodEnumEditor
            name={props.name}
            key={props.rootLesslistKey}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            enumValues={enumValues}
            label={props.label}
            unionInformation={unionInformation}
            forceTestingMode={props.forceTestingMode}
            rawJzodSchema={props.rawJzodSchema as any}
          />
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
      case "union":
      // case "tuple":
      default: {
        return (
          <span>
            default case: {localResolvedElementJzodSchemaBasedOnValue.type}, for {props.listKey} values{" "}
            {/* default case: {localResolvedElementJzodSchema.type}, for {props.listKey} values{" "} */}
            <pre>{JSON.stringify(currentValue, null, 2)}</pre>
            <br />
            <pre>
              resolved Jzod schema: {JSON.stringify(props.resolvedElementJzodSchema, null, 2)}
            </pre>
            <pre>raw Jzod schema: {JSON.stringify(props.rawJzodSchema, null, 2)}</pre>
            {/* <div>
              found schema: {JSON.stringify(props.resolvedJzodSchema, null, 2)}
            </div>
            <div>
              for object: {JSON.stringify(props.initialValuesObject, null, 2)}
            </div> */}
          </span>
        );
        break;
      }
    }
  } else {
    return (
      <div>
        Could not find schema for item: {props.rootLesslistKey}
        <br />
        value {formik.values[props.rootLesslistKey]}
        <br />
        raw Jzod schema: {JSON.stringify(props.rawJzodSchema)}
        <br />
        resolved schema: {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue)}
      </div>
    );
  }
}

export const JzodObjectEditorWithErrorBoundary = withErrorBoundary(JzodElementEditor, {
  fallback: <div>Something went wrong</div>,
  onError(error, info) {
    log.error("JzodElementEditor error", error);
    // Do something with the error
    // E.g. log to an error logging client here
  },
});
