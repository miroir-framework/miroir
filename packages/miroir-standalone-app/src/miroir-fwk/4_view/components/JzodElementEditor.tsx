import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { ErrorBoundary, withErrorBoundary } from "react-error-boundary";

import styled from "@emotion/styled";
import AddBox from "@mui/icons-material/AddBox";
import Clear from "@mui/icons-material/Clear";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";

// import { FieldValues, UseFormRegister, UseFormSetValue, useFormContext } from "react-hook-form";

import {
  ApplicationSection,
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
  JzodSchema,
  JzodUnion,
  JzodUnion_RecursivelyUnfold_ReturnType,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ResolvedJzodSchemaReturnType,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  Uuid,
  adminConfigurationDeploymentMiroir,
  alterObjectAtPath,
  deleteObjectAtPath,
  dummyDomainManyQueryWithDeploymentUuid,
  getApplicationSection,
  getDefaultValueForJzodSchema,
  getDefaultValueForJzodSchemaWithResolution,
  getQueryRunnerParamsForDeploymentEntityState,
  jzodTypeCheck,
  jzodUnion_recursivelyUnfold,
  mStringify,
  resolvePathOnObject,
  unfoldJzodSchemaOnce
} from "miroir-core";

import { FormikProps, useFormikContext } from "formik";
import { getMemoizedDeploymentEntityStateSelectorMap } from "miroir-localcache-redux";
import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  useMiroirContextService
} from "../MiroirContextReactProvider.js";
import {
  useCurrentModel,
  useDeploymentEntityStateQuerySelectorForCleanedResult,
} from "../ReduxHooks.js";
import { JzodArrayEditor, indentShift } from "./JzodArrayEditor.js";
import { JzodEnumEditor } from "./JzodEnumEditor.js";
import { JzodLiteralEditor } from "./JzodLiteralEditor.js";
import { MenuItem } from "@mui/material";
import { JzodElementEditorProps } from "./JzodElementEditorInterface.js";
import { getItemsOrder, LineIconButton, SizedAddBox, SizedButton, SmallIconButton, StyledSelect } from "./Style.js";

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
function getObjectUniondiscriminatorValuesFromResolvedSchema(
  resolvedElementJzodSchema: JzodElement | undefined, // is it needed?
  unfoldedRawSchema: JzodElement | undefined, // is it needed?
  recursivelyUnfoldedRawSchemaList: JzodElement[],
  recursivelyUnfoldedRawSchemaDiscriminator?: (string | string[]) | undefined
) {
  if (
    resolvedElementJzodSchema?.type == "object" &&
    // recursivelyUnfoldedRawSchema &&
    recursivelyUnfoldedRawSchemaDiscriminator
  ) {
    const discriminator = (unfoldedRawSchema as any).discriminator;
    const result = [
      ...new Set(
        // recursivelyUnfoldedRawSchema.result.flatMap((branch: any /** JzodObject */) => {
        recursivelyUnfoldedRawSchemaList.flatMap((branch: any /** JzodObject */) => {
          // return (a.definition as any)[(unfoldedRawSchema as any).discriminator].definition}
          switch (
            typeof branch.definition[discriminator] == "string"
              ? "literal"
              : branch.definition[discriminator]?.type
          ) {
            case "literal": {
              return branch.definition[discriminator].definition;
              break;
            }
            case "enum": {
              return branch.definition[discriminator].definition;
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
                  branch.definition[discriminator]?.type +
                  " discriminator " +
                  JSON.stringify(branch.definition[discriminator]) +
                  " for union " +
                  JSON.stringify(recursivelyUnfoldedRawSchemaList, null, 2)
              );
              // return [];
              break;
            }
          }
        })
      ),
    ];
    log.info("objectUniondiscriminatorValues found ", result);
    return result;
  } else {
    return [];
  }
}

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

  // const currentValue = resolvePathOnObject(props.formik.values, props.rootLesslistKeyArray);
  const currentValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);
  log.info("#####################################################################################");
  log.info("JzodElementEditor rendering for", props.listKey, "count", count, "currentValue", currentValue, "rawJzodSchema", props.rawJzodSchema?.type, props.rawJzodSchema);
  // log.info("JzodElementEditor", props.listKey, "count", count, "resolvedJzodSchema", props.resolvedJzodSchema);
  // log.info("JzodElementEditor", props.listKey, "count", count, "rawJzodSchema", props.rawJzodSchema?.type, props.rawJzodSchema);

  const [itemsOrder, setItemsOrder] = useState<any[]>(
    getItemsOrder(currentValue, props.resolvedElementJzodSchema)
  );

  const [localResolvedElementJzodSchema, setLocalResolvedElementJzodSchema] = useState<
    JzodElement | undefined
  >(() => props.resolvedElementJzodSchema);
  // log.info(
  //   "rendering",
  //   props.listKey,
  //   "itemsOrder",
  //   itemsOrder,
  // );
  if ((props.rawJzodSchema as any as string) == "never") {
    log.warn("found never for props.rawJzodSchema! key", props.listKey, "count", count);
  }

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

  if (localResolvedElementJzodSchema && props.rawJzodSchema) {
    if (
      localResolvedElementJzodSchema.type != props.rawJzodSchema?.type &&
      ((localResolvedElementJzodSchema.type == "object" &&
        !objectTypes.includes(props.rawJzodSchema.type)) ||
        (props.rawJzodSchema.type == "enum" &&
          !enumTypes.includes(localResolvedElementJzodSchema.type)))
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
    // ######################### unions #########################
    const objectUniondiscriminatorValues: string[] = useMemo(() => {
      return getObjectUniondiscriminatorValuesFromResolvedSchema(
        // props.resolvedElementJzodSchema,
        localResolvedElementJzodSchema,
        unfoldedRawSchema,
        recursivelyUnfoldedRawSchema?.result ?? [],
        recursivelyUnfoldedRawSchema?.discriminator
      );
    }, [localResolvedElementJzodSchema, unfoldedRawSchema, recursivelyUnfoldedRawSchema]);
    // }, [props.resolvedElementJzodSchema, unfoldedRawSchema, recursivelyUnfoldedRawSchema]);

    const unionInformation = useMemo(() => {
      return unfoldedRawSchema.type == "union" && recursivelyUnfoldedRawSchema && recursivelyUnfoldedRawSchema.status == "ok"
        ? {
            jzodSchema: unfoldedRawSchema,
            objectBranches: recursivelyUnfoldedRawSchema.result,
            discriminator: recursivelyUnfoldedRawSchema.discriminator as string,
            discriminatorValues: objectUniondiscriminatorValues,
            setItemsOrder: setItemsOrder,
          }
        : undefined;
    }, [unfoldedRawSchema, objectUniondiscriminatorValues]);
    // const unionInformation = useMemo(() => {
    //   return unfoldedRawSchema.type == "union"
    //     ? {
    //         jzodSchema: unfoldedRawSchema,
    //         discriminator: unfoldedRawSchema.discriminator as string,
    //         discriminatorValues: objectUniondiscriminatorValues,
    //         setItemsOrder: setItemsOrder,
    //       }
    //     : undefined;
    // }, [unfoldedRawSchema, objectUniondiscriminatorValues]);

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
        localResolvedElementJzodSchema?.type == "uuid" &&
        localResolvedElementJzodSchema.tag?.value?.targetEntity
        // props.resolvedElementJzodSchema?.type == "uuid" &&
        // props.resolvedElementJzodSchema.tag?.value?.targetEntity
      ) {
        return [
          [noValue.uuid, noValue] as [string, EntityInstance],
          ...Object.entries(
            foreignKeyObjects[localResolvedElementJzodSchema.tag.value?.targetEntity] ?? {}
            // foreignKeyObjects[props.resolvedElementJzodSchema.tag.value?.targetEntity] ?? {}
          ),
        ];
      }
      return [];
    }, [localResolvedElementJzodSchema, foreignKeyObjectsFetchQueryParams]);
    // }, [props.resolvedElementJzodSchema, foreignKeyObjectsFetchQueryParams]);

    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // uses setFormState to update the formik state
    // const handleSelectValueChange = useCallback(
    //   (event: any) => {
    //     // const parentPath = props.rootLesslistKeyArray.slice(0,props.rootLesslistKeyArray.length - 1)
    //     // identical to handleSelectEnumChange?
    //     const newFormState: any = alterObjectAtPath(
    //       formik.values,
    //       props.rootLesslistKeyArray,
    //       event.target.value
    //     );
    //     log.info(
    //       "handleSelectValueChange called with event",
    //       event,
    //       "current Value",
    //       formik.values,
    //       "newFormState",
    //       newFormState
    //     );
    //     // props.setFormState(newFormState);
    //     // formik.setFormState(newFormState);
    //     formik.setFormikState(newFormState);
    //   },
    //   [formik, props.rootLesslistKeyArray]
    // );

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
    // const handleAttributeNameChange = useCallback(
    // uses setFormState to update the formik state
    const handleAttributeNameChange = (event: any, attributeRootLessListKeyArray: string[]) => {
      // const parentPath = props.rootLesslistKeyArray.slice(0,props.rootLesslistKeyArray.length - 1)
      // identical to handleSelectEnumChange?
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
        // const parentItemsOrder = props.parentObjectItemsOrder;
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
          "new itemsOrder",
          localItemsOrder
        );
        setItemsOrder(localItemsOrder);
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
    // uses setFormState to update the formik state
    const handleSelectLiteralChange = (event: any) => {
      // TODO: avoid side-effects!!! So ugly, I'll be hanged for this.

      // if (!props.unionInformation) {
      //   throw new Error(
      //     "handleSelectLiteralChange called but current object does not have information about the discriminated union type it must be part of!"
      //   );
      // }
      // if (!props.unionInformation.jzodSchema.discriminator) {
      //   throw new Error(
      //     "handleSelectLiteralChange called but current object does not have a discriminated union type!"
      //   );
      // }

      const parentPath = props.rootLesslistKeyArray.slice(0, props.rootLesslistKeyArray.length - 1);
      
      if (props.unionInformation && props.unionInformation.jzodSchema.discriminator) {
        const currentAttributeName =
          props.rootLesslistKeyArray[props.rootLesslistKeyArray.length - 1];
  
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
          formik.values,
          "props.rootLesslistKeyArray",
          props.rootLesslistKeyArray
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
              a.definition[(props.unionInformation as any).jzodSchema.discriminator].type ==
                "literal" &&
              (a.definition[(props.unionInformation as any).jzodSchema.discriminator] as JzodLiteral)
                .definition == event.target.value
          );
        if (!newJzodSchema) {
          throw new Error(
            "handleSelectLiteralChange could not find union branch for discriminator " +
              props.unionInformation.discriminator +
              " in " +
              JSON.stringify(props.unionInformation.jzodSchema)
          );
        }
        const newJzodSchemaWithOptional = props.unionInformation.jzodSchema.optional
          ? {
              ...newJzodSchema,
              optional: true,
            }
          : newJzodSchema;
        log.info("handleSelectLiteralChange newJzodSchemaWithOptional", newJzodSchemaWithOptional);
  
        const defaultValue = currentMiroirFundamentalJzodSchema
          ? getDefaultValueForJzodSchemaWithResolution(
              newJzodSchemaWithOptional,
              currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel
            )
          : undefined;
        log.info("handleSelectLiteralChange defaultValue", defaultValue);
        // const newFormState: any = alterObjectAtPath(props.formik.values, parentPath, {type: "B", b: "Test!!"}) ;
        const newFormState: any = alterObjectAtPath(formik.values, parentPath, defaultValue);
        log.info("handleSelectLiteralChange newFormState", newFormState);
        // props.setFormState(newFormState);
        formik.setFormikState(newFormState);
        const currentParentValue = resolvePathOnObject(newFormState, parentPath);
        log.info(
          "handleSelectLiteralChange props.resolvedJzodSchema",
          props.resolvedElementJzodSchema,
          "currentParentValue",
          currentParentValue
        );
        log.info(
          "handleSelectLiteralChange props.unionInformation?.jzodSchema",
          props.unionInformation?.jzodSchema
        );
  
        const newResolvedJzodSchema = currentMiroirFundamentalJzodSchema
          ? jzodTypeCheck(
              props.unionInformation?.jzodSchema as any, // not undefined here!
              currentParentValue,
              [], // currentValuePath
              [], // currentTypePath
              currentMiroirFundamentalJzodSchema, //context.miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
              {}
            )
          : undefined;
  
        if (!newResolvedJzodSchema || newResolvedJzodSchema.status != "ok") {
          throw new Error(
            "handleSelectLiteralChange could not resolve schema " +
              JSON.stringify(props.unionInformation?.jzodSchema) +
              " value " +
              JSON.stringify(newFormState)
          );
        }
  
        log.info("handleSelectLiteralChange newResolvedJzodSchema", newResolvedJzodSchema);
  
        const newItemsOrder = getItemsOrder(currentParentValue, newResolvedJzodSchema.element);
        log.info("handleSelectLiteralChange newItemsOrder", newItemsOrder);
        props.unionInformation.setItemsOrder(newItemsOrder);
      } else {
        log.info("handleSelectLiteralChange parentPath", parentPath);
        log.info("handleSelectLiteralChange event.target.value", event.target.value);
        const newFormState: any = alterObjectAtPath(formik.values, parentPath, event.target.value); ;
        // const newFormState: any = alterObjectAtPath(props.formik.values, parentPath, defaultValue);
        log.info("handleSelectLiteralChange newFormState", newFormState);
        // props.setFormState(newFormState);
        formik.setFormikState(newFormState);
        // const currentParentValue = resolvePathOnObject(newFormState, parentPath);
        // log.info(
        //   "handleSelectLiteralChange props.resolvedJzodSchema",
        //   props.resolvedElementJzodSchema,
        //   "currentParentValue",
        //   currentParentValue
        // );
        // log.info(
        //   "handleSelectLiteralChange props.unionInformation?.jzodSchema",
        //   props.unionInformation?.jzodSchema
        // );
      }
      // changing the current Jzod Schema for the whole object (at ROOT! Redraw / recreate everything!)
    };

    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // switch (props.resolvedElementJzodSchema.type) {
    switch (localResolvedElementJzodSchema.type) {
      case "object": {
        // #######################
        // uses setFormState to update the formik state
        const addExtraRecordEntry = useCallback(async () => {
          log.info(
            "addExtraRecordEntry clicked!",
            props.rootLesslistKey,
            itemsOrder,
            // Object.keys(resolvedElementJzodSchema.definition),
            Object.keys(localResolvedElementJzodSchema.definition),
            // "formState",
            // props.formState,
            "formik",
            formik.values
          );
          if (unfoldedRawSchema.type != "record" || props.rawJzodSchema?.type != "record") {
            throw "addExtraRecordEntry called for non-record type: " + unfoldedRawSchema.type;
          }

          // const newAttributeType: JzodElement = resolvePathOnObject(props.rawJzodSchema, ["definition"]);
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
          setItemsOrder(getItemsOrder(newRecordValue, props.rawJzodSchema));

          if (!currentMiroirFundamentalJzodSchema) {
            throw new Error(
              "addExtraRecordEntry called without currentMiroirFundamentalJzodSchema! This should not happen!"
            );
          }

          const newRecordResolvedElementJzodSchema = jzodTypeCheck(
            newAttributeType,
            newAttributeValue,
            [], // currentValuePath
            [], // currentTypePath
            currentMiroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            {}
          );
          if (
            !newRecordResolvedElementJzodSchema ||
            newRecordResolvedElementJzodSchema.status != "ok"
          ) {
            throw new Error(
              "addExtraRecordEntry could not resolve schema " +
                JSON.stringify(newAttributeType, null, 2) +
                " value " +
                JSON.stringify(newRecordValue, null, 2)
            );
          }

          setLocalResolvedElementJzodSchema({
            ...localResolvedElementJzodSchema,
            definition: {
              ...localResolvedElementJzodSchema.definition,
              newRecordEntry: newRecordResolvedElementJzodSchema.element,
              // [undefinedOptionalAttributes[0]]: resolvePathOnObject(props.rawJzodSchema, ["definition",undefinedOptionalAttributes[0]])
            },
          });
          log.info(
            "addExtraRecordEntry clicked2!",
            props.listKey,
            itemsOrder,
            Object.keys(localResolvedElementJzodSchema.definition),
            // Object.keys(resolvedElementJzodSchema.definition),
            // "formState",
            // props.formState,
            "formik",
            formik.values
          );
        }, [props, itemsOrder, localResolvedElementJzodSchema]);

        // #######################
        // #######################
        // #######################
        const addObjectOptionalAttribute = useCallback(async () => {
          log.info(
            "addObjectOptionalAttribute clicked!",
            props.listKey,
            itemsOrder,
            Object.keys(localResolvedElementJzodSchema.definition),
            // Object.keys(resolvedElementJzodSchema.definition),
            // "formState",
            // props.formState,
            "formik",
            formik.values,
            "props.rawJzodSchema",
            JSON.stringify(props.rawJzodSchema, null, 2),
            "undefinedOptionalAttributes",
            undefinedOptionalAttributes
          );
          // const newFormState: any =
          //   undefinedOptionalAttributes.length > 0
          //     ? { ...formik.values, [undefinedOptionalAttributes[0]]: "test!" }
          //     : formik.values;
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

          // props.setFormState(newFormState);
          // formik.setFormikState(newFormState);
          formik.setFieldValue(props.rootLesslistKey, newObjectValue, false);
          setItemsOrder(newItemsOrder);

          // update localResolvedElementJzodSchema
          setLocalResolvedElementJzodSchema({
            ...localResolvedElementJzodSchema,
            definition: {
              ...localResolvedElementJzodSchema.definition,
              [undefinedOptionalAttributes[0]]: newAttributeType,
              // [undefinedOptionalAttributes[0]]: resolvePathOnObject(props.rawJzodSchema, ["definition",undefinedOptionalAttributes[0]])
            },
          });
          log.info(
            "addObjectOptionalAttribute clicked2!",
            props.listKey,
            itemsOrder,
            Object.keys(localResolvedElementJzodSchema.definition),
            // Object.keys(resolvedElementJzodSchema.definition),
            "newObjectValue",
            newObjectValue,
            "newItemsOrder",
            newItemsOrder,
            "localResolvedElementJzodSchema",
            JSON.stringify(localResolvedElementJzodSchema, null, 2),
            // "props.resolvedElementJzodSchema",
            // JSON.stringify(props.resolvedElementJzodSchema, null, 2),
            "props.rawJzodSchema",
            JSON.stringify(props.rawJzodSchema, null, 2)
          );
        }, [props, itemsOrder, localResolvedElementJzodSchema]);
        // }, [props, itemsOrder, resolvedElementJzodSchema]);
        // #######################
        // #######################
        // #######################
        const removeOptionalAttribute = useCallback(
          (listKey: string) => {
            log.info(
              "removeOptionalAttribute clicked!",
              listKey,
              itemsOrder,
              // Object.keys(resolvedElementJzodSchema.definition),
              Object.keys(localResolvedElementJzodSchema.definition),
              // "formState",
              // props.formState,
              "formik",
              formik.values
            );
            const newFormState: any = { ...formik.values };
            delete newFormState[listKey];
            formik.setFormikState(newFormState);
            const currentValue = resolvePathOnObject(newFormState, props.rootLesslistKeyArray);
            // setItemsOrder(getItemsOrder(currentValue, props.resolvedElementJzodSchema));
            setItemsOrder(getItemsOrder(currentValue, props.rawJzodSchema));
            // // await props.setFormState({"deploymentUuid2": "test!"});
            // // await props.formik.setFieldValue("deploymentUuid2", "test!");
            log.info(
              "clicked2!",
              listKey,
              itemsOrder,
              // Object.keys(resolvedElementJzodSchema.definition),
              Object.keys(localResolvedElementJzodSchema.definition),
              // "formState",
              // props.formState,
              "formik",
              formik.values
            );
          },
          // [props, itemsOrder, resolvedElementJzodSchema]
          [props, itemsOrder, localResolvedElementJzodSchema]
        );
        // ########################################################################################
        // const allSchemaObjectAttributes = unfoldedRawSchema.type == "record"?["ANY"]:
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
                {/* {resolvedElementJzodSchema.type} {unfoldedRawSchema.type} */}
                {localResolvedElementJzodSchema.type} {unfoldedRawSchema.type}
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
                      {/* <SizedIcon>addBox</SizedIcon> */}
                      {/* <Icon>add</Icon> */}
                      {/* <AddBox/> */}
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
                      localResolvedElementJzodSchema.definition[attribute[0]];
                    // resolvedElementJzodSchema.definition[attribute[0]];
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
                        // const possibleObjectTypes = unfoldedRawSchema.definition.filter(
                        //   (a: any) =>
                        //     a.type == "object"
                        // );

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
                                localResolvedElementJzodSchema
                              // props.resolvedElementJzodSchema
                              // JSON.stringify(props.resolvedJzodSchema, null, 2)
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
                              // " discriminator " +
                              // discriminator +
                              // " discriminatorValue " +
                              // discriminatorValue +
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
                                  resolved type {JSON.stringify(localResolvedElementJzodSchema)}
                                  {/* resolved type {JSON.stringify(resolvedElementJzodSchema)} */}
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
                            // handleChange={props.handleChange}
                            // formik={props.formik}
                            // setFormState={props.setFormState}
                            // formState={props.formState}
                            unionInformation={unionInformation}
                            handleSelectLiteralChange={handleSelectLiteralChange}
                            parentObjectItemsOrder={itemsOrder}
                            parentObjectSetItemsOrder={setItemsOrder}
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
            setItemsOrder={setItemsOrder}
            hiddenFormItems={hiddenFormItems}
            setHiddenFormItems={setHiddenFormItems}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            paramMiroirFundamentalJzodSchema={props.paramMiroirFundamentalJzodSchema}
            foreignKeyObjects={props.foreignKeyObjects}
            // setFormState={props.setFormState}
            // formik={props.formik}
            unionInformation={props.unionInformation}
            handleSelectLiteralChange={props.handleSelectLiteralChange}
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
        return (
          <Checkbox
            defaultChecked={formik.values[props.rootLesslistKey]}
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            // name={props.listKey}
            {...formik.getFieldProps(props.rootLesslistKey)}
            // checked={formik.values[props.rootLesslistKey]}
            checked={currentValue}
            // onChange={handleSelectValueChange}
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
        return localResolvedElementJzodSchema.tag?.value?.targetEntity ? (
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
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            onChange={handleSelectLiteralChange}
            label={props.label}
            unionInformation={props.unionInformation}
            handleSelectLiteralChange={props.handleSelectLiteralChange}
          />
        );
      }
      // DONE
      case "enum": {
        // const handleSelectEnumChange = (event: any) => {
        // const handleSelectEnumChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        // const handleSelectEnumChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // const handleSelectEnumChange = (event: SelectChangeEvent<any>) => {
        //   // TODO: avoid side-effects!!! SO UGLY, I'LL BE HANGED FOR THIS.

        //   if (
        //     //????
        //     props.unionInformation?.discriminator &&
        //     props.unionInformation?.discriminatorValues &&
        //     props.name == props.unionInformation?.discriminator
        //   ) {
        //     // handle union discriminator change if needed
        //     // ...existing code for union discriminator handling...
        //     handleSelectLiteralChange(event);
        //   } else {
        //     const newFormState: any = alterObjectAtPath(
        //       props.formik.values,
        //       props.rootLesslistKeyArray,
        //       event.target.value
        //     );
        //     props.setFormState(newFormState);
        //   }
        // }; // end handleSelectEnumChange
        // Get enum values from resolvedJzodSchema or rawJzodSchema
        // if (props.resolvedElementJzodSchema?.type !== "enum") {
        //   return (
        //     <span>
        //       JzodElementEditor failed: expected enum type, got {props.resolvedElementJzodSchema?.type} for{" "}
        //       {props.listKey}
        //     </span>
        //   );
        // }
        const enumValues: string[] =
          // (props.resolvedElementJzodSchema && props.resolvedElementJzodSchema.definition) ||
          (localResolvedElementJzodSchema && localResolvedElementJzodSchema.definition) ||
          (props.rawJzodSchema && ((props.rawJzodSchema as any).definition ?? [])) ||
          [];
        return (
          <JzodEnumEditor
            name={props.name}
            key={props.rootLesslistKey}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            enumValues={enumValues}
            // onChange={handleSelectEnumChange}
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
            {/* default case: {props.resolvedElementJzodSchema.type}, for {props.listKey} values{" "} */}
            default case: {localResolvedElementJzodSchema.type}, for {props.listKey} values{" "}
            {/* {JSON.stringify(formik.values[props.rootLesslistKey], null, 2)} */}
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
        {/* resolved schema: {JSON.stringify(props.resolvedElementJzodSchema)} */}
        resolved schema: {JSON.stringify(localResolvedElementJzodSchema)}
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
