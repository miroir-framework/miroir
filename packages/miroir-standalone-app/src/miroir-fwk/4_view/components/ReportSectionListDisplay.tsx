import { ColDef } from "ag-grid-community";
import equal from "fast-deep-equal";
import { useCallback, useMemo, useState } from "react";
// import { SubmitHandler } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";


import {
  adminConfigurationDeploymentMiroir,
  ApplicationSection,
  applicationSection,
  DeploymentEntityState,
  domain2ElementObjectZodSchema,
  Domain2QueryReturnType,
  DomainControllerInterface,
  DomainElementSuccess,
  Entity,
  EntityDefinition,
  EntityInstancesUuidIndex,
  ExtendedTransformerForRuntime,
  ExtractorOrCombinerRecord,
  getApplicationSection,
  getQueryRunnerParamsForDeploymentEntityState,
  InstanceAction,
  JzodElement,
  JzodObject,
  jzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  objectListReportSection,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentConfiguration,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerParams
} from "miroir-core";

import AddBox from "@mui/icons-material/AddBox";
import { getMemoizedDeploymentEntityStateSelectorForTemplateMap } from "miroir-localcache-redux";
import { packageName } from "../../../constants.js";
import { deleteCascade } from "../scripts.js";
import {
  useDomainControllerService,
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
} from "../MiroirContextReactProvider.js";
import { useCurrentModel, useDeploymentEntityStateQuerySelectorForCleanedResult } from "../ReduxHooks.js";
import { cleanLevel } from "../constants.js";
import { getColumnDefinitionsFromEntityDefinitionJzodObjectSchema } from "../getColumnDefinitionsFromEntityAttributes.js";
import { analyzeForeignKeyAttributes, convertToLegacyFormat } from "../utils/foreignKeyAttributeAnalyzer.js";
import { JsonObjectEditFormDialog, JsonObjectEditFormDialogInputs } from "./JsonObjectEditFormDialog.js";
import { noValue } from "./JzodElementEditorInterface.js";
import { MTableComponent } from "./MTableComponent.js";
import { TableComponentType, TableComponentTypeSchema } from "./MTableComponentInterface.js";
import { useRenderTracker } from "../tools/renderCountTracker.js";
import { ThemedBox, ThemedButton, ThemedSpan } from "./ThemedComponents.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionListDisplay")
).then((logger: LoggerInterface) => {log = logger});



// ################################################################################################
export const ReportSectionDisplayCorePropsSchema = z.object({
  styles: z.any().optional(),
  label: z.string(),
  defaultlabel: z.string().optional(),
  displayedDeploymentDefinition: selfApplicationDeploymentConfiguration.optional(),
  section: objectListReportSection, // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  // domainElementObject: domainElementObject, // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  domainElementObject: domain2ElementObjectZodSchema, // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  fetchedDataJzodSchema: z.record(jzodObject.optional()).optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  chosenApplicationSection: applicationSection.optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  paramsAsdomainElements: domain2ElementObjectZodSchema,
});

export const ReportSectionDisplayEntityInstancePropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  chosenApplicationSection: applicationSection,
  deploymentUuid: z.string().uuid()
});

export const ReportSectionDisplayJsonArrayPropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  columnDefs: z.array(z.any()),
  rowData: z.array(z.any()),
});

// ##########################################################################################
export const ReportSectionDisplayPropsSchema = ReportSectionDisplayEntityInstancePropsSchema;
export type ReportComponentProps = z.infer<typeof ReportSectionDisplayPropsSchema>;

// ##########################################################################################
export function defaultFormValues(
  tableComponentType: TableComponentType,
  currentEntityJzodSchema: JzodObject,
  idList?:{id:number}[],
  currentMiroirEntity?: Entity,
  displayedDeploymentDefinition?: SelfApplicationDeploymentConfiguration,
):any {
  // log.info(
  //   "defaultFormValues called TableComponentType",
  //   tableComponentType,
  //   "currentMiroirEntity",
  //   currentMiroirEntity,
  //   "currentEntityJzodSchema",
  //   currentEntityJzodSchema
  // );

  let subresult
  switch (tableComponentType) {
    case "EntityInstance": {
      const attributeDefaultValue:any = {
        'uuid': uuidv4(),
        // 'id': 1,
        'parentName':currentMiroirEntity?.name,
        'parentUuid':currentMiroirEntity?.uuid,
        'conceptLevel':'Model',
        'selfApplication': displayedDeploymentDefinition?.selfApplication,
        'attributes': [],
      }
      log.info();
      
      const currentEditorAttributes = Object.entries(currentEntityJzodSchema?.definition??{}).reduce((acc,attributeJzodSchema)=>{
        let result
        if (attributeJzodSchema[1].tag?.value?.targetEntity) {
          result = Object.assign({},acc,{[attributeJzodSchema[0]]:noValue})
        } else {
          if (Object.keys(attributeDefaultValue).includes(attributeJzodSchema[0])) {
            result = Object.assign({},acc,{[attributeJzodSchema[0]]:attributeDefaultValue[attributeJzodSchema[0]]})
          } else {
            result = Object.assign({},acc,{[attributeJzodSchema[0]]:''})
          }
        }
        // log.info('ReportComponent defaultFormValues',tableComponentType,'EntityInstance setting default value for attribute',a.name,':',result);
        return result;
      },{});
      log.info('defaultFormValues return',currentEditorAttributes);
      // return currentEditorAttributes;
      subresult = currentEditorAttributes;
      break;
    }
    case "JSON_ARRAY": {
      const newId = idList? idList?.reduce((acc:number,curr:{id:number}) => Math.max(curr?.id,acc),0) + 1 : 1;
      const attributeDefaultValue:any = {
        'uuid': uuidv4(),
        'id': newId,
        'conceptLevel':'Model',
        // 'attributes': [],
      }
      // TODO: CORRECT THIS IT DOES NOT WORK!!!
      const currentEditorAttributes = Object.entries(currentEntityJzodSchema).reduce((acc,currentAttribute)=>{
        const attributeName = (currentAttribute[1] as any).name
        let result
        if (Object.keys(attributeDefaultValue).includes((currentAttribute[1] as any).name)) {
          result = Object.assign({},acc,{[attributeName]:attributeDefaultValue[attributeName]})
        } else {
          result = Object.assign({},acc,{[attributeName]:''})
        }
        log.info('ReportComponent defaultFormValues',tableComponentType,'setting default value for attribute',attributeName,':',result);
        return result;
      },{});
      log.info('defaultFormValues return',currentEditorAttributes);
      subresult = currentEditorAttributes;
      // return currentEditorAttributes;
      break;
    }
    default: {
      throw new Error("defaultFormValues could not handle tableComponentType " + tableComponentType);
      break;
    }
  }
  // return {ROOT: subresult}
  return subresult;
}

// ##########################################################################################
let prevProps = {};
let prevColumnDefs:{columnDefs: ColDef<any>[]} = {columnDefs:[]};
let prevJzodSchema;
let prevInstancesToDisplay:EntityInstancesUuidIndex | undefined;
let prevInstancesWithStringifiedJsonAttributes: { instancesWithStringifiedJsonAttributes: any[] };



// ##########################################################################################
// ##########################################################################################
// ##########################################################################################
// ##########################################################################################
export const ReportSectionListDisplay: React.FC<ReportComponentProps> = (
  props: ReportComponentProps
) => {
  prevProps = props;
  
  // Track render counts with centralized tracker
  const currentNavigationKey = `${props.deploymentUuid}-${props.chosenApplicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportSectionListDisplay", currentNavigationKey);
  
  // log.info('@@@@@@@@@@@@@@@@@@@@@@@ ReportSectionListDisplay',count,props === prevProps, equal(props,prevProps));
  log.info('@@@@@@@@@@@@@@@@@@@@@@@ ReportSectionListDisplay', 'navigationCount', navigationCount, 'totalCount', totalCount, 'props === prevProps', props === prevProps);
  const context = useMiroirContextService();
  
  // log.info('ReportSectionListDisplay props.domainElement',props.domainElement);
  // log.info('ReportSectionListDisplay props',props);

  // ##############################################################################################
  const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorForTemplateMap(),
    []
  )

  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentModel: MetaModel = useCurrentModel(props.deploymentUuid)

  // log.info("ReportSectionListDisplay props.deploymentUuid", props.deploymentUuid);

  const domainController: DomainControllerInterface = useDomainControllerService();

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    // return displayedDeploymentDefinition &&
    return props.deploymentUuid &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[props.deploymentUuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[props.deploymentUuid][
      // context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      // ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
        props.chosenApplicationSection
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [
    props.deploymentUuid,
    // displayedDeploymentDefinition,
    context.deploymentUuidToReportsEntitiesDefinitionsMapping,
    props.chosenApplicationSection,
  ]);
    
  // log.info("ReportSectionListDisplay availableReports",availableReports);

  const currentReportTargetEntity: Entity | undefined =
    props.section?.type === "objectListReportSection" 
      ? entities?.find(
          (e:Entity) =>
            e?.uuid === (props.section?.definition as any)["parentUuid"]
        )
      : undefined;
  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    entityDefinitions?.find((e:EntityDefinition) => e?.entityUuid === currentReportTargetEntity?.uuid);

  // TODO: AMBIGUOUS!! APPEARS ALSO IN THE Report DEFINITION. PROVIDE A DIRECT WAY TO DETERMINE THIS?
  // const currentApplicationSection = (props.section?.definition as any)["applicationSection"]??"data";
  const currentApplicationSection = props.chosenApplicationSection??"data";

  const instancesToDisplayJzodSchema: JzodObject | undefined = useMemo(
    () =>
      props.fetchedDataJzodSchema &&
      props.section.type == "objectListReportSection" &&
      props.section.definition.fetchedDataReference &&
      props.fetchedDataJzodSchema[props.section.definition.fetchedDataReference]
        ? props.fetchedDataJzodSchema[props.section.definition.fetchedDataReference]
        : currentReportTargetEntityDefinition?.jzodSchema,
    [props.fetchedDataJzodSchema, props.section, currentReportTargetEntityDefinition?.jzodSchema]
  );

  const instancesToDisplayViewAttributes: string[] | undefined = useMemo(()=>
    currentReportTargetEntityDefinition?.viewAttributes
    ,[currentReportTargetEntityDefinition]
  )

  const tableColumnDefs: { columnDefs: ColDef<any>[] } = useMemo(
    () => ({
      columnDefs: getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
        props.deploymentUuid,
        instancesToDisplayJzodSchema??{type:"object", definition:{}},
        instancesToDisplayViewAttributes,
        currentReportTargetEntityDefinition
      ),
    }),
    [props.deploymentUuid, instancesToDisplayJzodSchema, instancesToDisplayViewAttributes, currentReportTargetEntityDefinition]
  );
  // log.info(
  //   "ReportSectionListDisplay rendering",
  //   count,
  //   "instancesToDisplayViewAttributes",
  //   instancesToDisplayViewAttributes,
  //   "props.fetchedDataJzodSchema",
  //   props.fetchedDataJzodSchema,
  //   "props.section.definition.fetchedDataReference",
  //   props.section.definition.fetchedDataReference,
  //   "props.currentMiroirEntityDefinition?.jzodSchema",
  //   currentReportTargetEntityDefinition?.jzodSchema,
  //   "instancesToDisplayJzodSchema",
  //   instancesToDisplayJzodSchema,
  //   "tableColumnDefs",
  //   tableColumnDefs,
  //   prevColumnDefs === tableColumnDefs,
  //   equal(prevColumnDefs, tableColumnDefs)
  // );

  const foreignKeyObjectsAttributeDefinition:[string, JzodElement][] = useMemo(
    ()=> {
      if (props.tableComponentReportType !== TableComponentTypeSchema.enum.EntityInstance) {
        return [];
      }

      const foreignKeyAttributes = analyzeForeignKeyAttributes(
        currentReportTargetEntityDefinition,
        entityDefinitions,
        { includeTransitive: true, maxDepth: 5 }
      );

      return convertToLegacyFormat(foreignKeyAttributes);
    },
    [
      currentReportTargetEntityDefinition?.jzodSchema.definition,
      currentReportTargetEntityDefinition?.entityUuid,
      props.tableComponentReportType,
      entityDefinitions,
    ]
  );

  // log.info(
  //   "ReportSectionListDisplay foreignKeyObjectsAttributeDefinition",
  //   foreignKeyObjectsAttributeDefinition,
  //   foreignKeyObjectsAttributeDefinition.map((e) => e[1].tag?.value?.defaultLabel)
  // );
  const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerParams<
    DeploymentEntityState
  > = useMemo(
    () => {
      const extractors: ExtractorOrCombinerRecord = Object.fromEntries(
        foreignKeyObjectsAttributeDefinition.map((e) => [
          e[1].tag?.value?.targetEntity + "_extractor",
          {
            extractorOrCombinerType: "extractorByEntityReturningObjectList",
            label: "extractorForForeignKey_" + e[0],
            applicationSection: getApplicationSection(
              props.deploymentUuid,
              e[1].tag?.value?.targetEntity ?? "undefined"
            ),
            parentName: "",
            parentUuid: e[1].tag?.value?.targetEntity??"ERROR NO TARGET ENTITY FOR ATTRIBUTE " + e[0], // does not happen because of filter in foreignKeyObjectsAttributeDefinition
          },
        ])
      );
      const runtimeTransformers: {
        [x: string]: ExtendedTransformerForRuntime
      } = {
        ...Object.fromEntries(
          foreignKeyObjectsAttributeDefinition.map((e) => [
            e[1].tag?.value?.targetEntity,
            {
              transformerType: "listReducerToIndexObject",
              interpolation: "runtime",
              applyTo: {
                referenceType: "referencedTransformer",
                reference: {
                  transformerType: "contextReference",
                  interpolation: "runtime",
                  referenceName: e[1].tag?.value?.targetEntity + "_extractor",
                },
              },
              indexAttribute: "uuid",
            },
          ])
        ),
      };
      return getQueryRunnerParamsForDeploymentEntityState(
        {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          deploymentUuid: props.deploymentUuid,
          pageParams: props.paramsAsdomainElements,
          queryParams: {},
          contextResults: {},
          extractors,
          runtimeTransformers
        },
        deploymentEntityStateSelectorMap
      )
    },
    [
      foreignKeyObjectsAttributeDefinition,
      props.deploymentUuid,
      props.paramsAsdomainElements,
      deploymentEntityStateSelectorMap,
    ]
  );
  // log.info(
  //   "ReportSectionListDisplay foreignKeyObjectsFetchQueryParams",
  //   JSON.stringify(foreignKeyObjectsFetchQueryParams, null, 2)
  // );

  const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
  useDeploymentEntityStateQuerySelectorForCleanedResult(
    deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
      DeploymentEntityState,
      Domain2QueryReturnType<DomainElementSuccess>
    >,
    foreignKeyObjectsFetchQueryParams
  );

  // log.info("ReportSectionListDisplay foreignKeyObjects", Object.keys(foreignKeyObjects), foreignKeyObjects);

  // log.info(
  //   "foreignKeyObjectsAttributeDefinition",
  //   foreignKeyObjectsAttributeDefinition,
    
  // )

  // // ##############################################################################################
  // const onSubmitInnerFormDialog: SubmitHandler<JsonObjectEditFormDialogInputs> = useCallback(
  //   async (data,event) => {
  //     const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
  //     log.info('ReportComponent onSubmitFormDialog',buttonType,'received data',data,'props',props,'dialogFormObject',dialogOuterFormObject);
  //     // if (props.tableComponentReportType == 'JSON_ARRAY') {
  //     //   if (buttonType == 'InnerDialog') {
  //     //     const previousValue = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData;
  //     //     const newAttributesValue = previousValue.slice();
  //     //     newAttributesValue.push(data as EntityAttribute);
  //     //     const newObject = Object.assign({},dialogOuterFormObject?dialogOuterFormObject:{},{attributes:newAttributesValue});
  //     //     setdialogOuterFormObject(newObject); // TODO use Zod parse!
  //     //     log.info('ReportComponent onSubmitFormDialog dialogFormObject',dialogOuterFormObject,'newObject',newObject);
  //     //   } else {
  //     //     log.info('ReportComponent onSubmitFormDialog ignored event',buttonType);
  //     //   }
  //     // } else {
  //     //   log.warn('ReportComponent onSubmitFormDialog called with inapropriate report type:',props.tableComponentReportType)
  //     // }
  //   },[dialogOuterFormObject]
  // ) 

  const onCreateFormObject = useCallback(
    async (data:any) => {
      log.info('ReportComponent onEditFormObject called with new object value',data);
      
      if (props.displayedDeploymentDefinition && props.displayedDeploymentDefinition.uuid) {
        if (props.chosenApplicationSection == 'model') {
          await domainController.handleAction(
            {
              actionType: "transactionalInstanceAction",
              instanceAction: {
                actionType: "createInstance",
                deploymentUuid: props.displayedDeploymentDefinition.uuid,
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                payload: {
                  applicationSection: currentApplicationSection,
                  objects: [
                    {
                      parentName: data.name,
                      parentUuid: data.parentUuid,
                      applicationSection:'model',
                      instances: [
                        // newEntity 
                        data
                      ]
                    }
                  ],
                }
              }
            },props.tableComponentReportType == "EntityInstance"?currentModel:undefined
          );
        } else {
          const createAction: InstanceAction = {
            // actionType: "instanceAction",
            actionType: "createInstance",
            deploymentUuid: props.displayedDeploymentDefinition?.uuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              applicationSection: currentApplicationSection,
              objects: [
                {
                  parentName: data.name,
                  parentUuid: data.parentUuid,
                  applicationSection:currentApplicationSection,
                  instances: [
                    data 
                  ],
                },
              ],
            }
          };
          await domainController.handleAction(createAction);
        }
      } else {
        throw new Error('ReportComponent onSubmitOuterDialog props.displayedDeploymentDefinition is undefined.')
      }
    },
    [domainController, props.displayedDeploymentDefinition, props.chosenApplicationSection, props.tableComponentReportType, currentApplicationSection, currentModel]
  )

  // ##############################################################################################
  const onEditFormObject = useCallback(
    async (data:any) => {
      // const newEntity:EntityInstance = Object.assign({...data as EntityInstance},{attributes:dialogFormObject?dialogFormObject['attributes']:[]});
      log.info('ReportComponent onEditFormObject called with new object value',data);
      
      if (props.displayedDeploymentDefinition) {
        if (props.chosenApplicationSection == 'model') {
          await domainController.handleAction(
            {
              actionType: "transactionalInstanceAction",
              instanceAction: {
                // actionType: "instanceAction",
                actionType: "updateInstance",
                deploymentUuid: props.displayedDeploymentDefinition.uuid,
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                payload: {
                  applicationSection: "model",
                  objects: [
                    {
                      parentName: data.name,
                      parentUuid: data.parentUuid,
                      applicationSection:props.chosenApplicationSection,
                      instances: [
                        data 
                      ]
                    }
                  ],
                }
              }
            },props.tableComponentReportType == "EntityInstance"?currentModel:undefined
          );
        } else {
          const updateAction: InstanceAction = {
            // actionType: "instanceAction",
            actionType: "updateInstance",
            deploymentUuid: props.displayedDeploymentDefinition?.uuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              applicationSection: props.chosenApplicationSection?props.chosenApplicationSection:"data",
              objects: [
                {
                  parentName: data.name,
                  parentUuid: data.parentUuid,
                  applicationSection:props.chosenApplicationSection?props.chosenApplicationSection:"data",
                  instances: [
                    data 
                  ],
                },
              ],
            }
          };
          await domainController.handleAction(updateAction);
        }
      } else {
        throw new Error('ReportComponent onSubmitOuterDialog props.displayedDeploymentDefinition is undefined.')
      }
    },
    [domainController, props.displayedDeploymentDefinition, props.chosenApplicationSection, props.tableComponentReportType, currentModel]
  )


  // ##############################################################################################
  const onDeleteFormObject = useCallback(
    async (data:any) => {
      // const newEntity:EntityInstance = Object.assign({...data as EntityInstance},{attributes:dialogFormObject?dialogFormObject['attributes']:[]});
      log.info('onDeleteFormObject called with new object value',data);
      log.info('onDeleteFormObject called with props',props);
      
      if (props.displayedDeploymentDefinition) {
        // if (props.chosenApplicationSection == 'model') {
        //   await domainController.handleAction(
        //     {
        //       actionType: "transactionalInstanceAction",
        //       instanceAction: {
        //         actionType: "instanceAction",
        //         actionName: "deleteInstance",
        //         applicationSection: "model",
        //         deploymentUuid: props.displayedDeploymentDefinition.uuid,
        //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //         objects: [
        //           {
        //             parentName: data.name,
        //             parentUuid: data.parentUuid,
        //             applicationSection:props.chosenApplicationSection,
        //             instances: [
        //               data 
        //             ]
        //           }
        //         ],
        //       }
        //     },props.tableComponentReportType == "EntityInstance"?currentModel:undefined
        //   );
        // } else {
          if (!currentReportTargetEntityDefinition) {
           throw new Error("ReportSectionListDisplay onDeleteFormObject no EntityDefinition found for object to delete! " + currentReportTargetEntity?.name);
          }

          await deleteCascade(
            {
              applicationSection: props.chosenApplicationSection?props.chosenApplicationSection:"data" as ApplicationSection,
              deploymentUuid: props.displayedDeploymentDefinition?.uuid,
              domainController: domainController,
              entityDefinition: currentReportTargetEntityDefinition,
              entityDefinitions: currentModel.entityDefinitions,
              entityInstances: [data],
            }
          )
      //     // const updateAction: InstanceAction = {
      //     //   actionType: "instanceAction",
      //     //   actionName: "deleteInstanceWithCascade",
      //     //   applicationSection: props.chosenApplicationSection?props.chosenApplicationSection:"data",
      //     //   deploymentUuid: props.displayedDeploymentDefinition?.uuid,
      //     //   endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      //     //   objects: [
      //     //     {
      //     //       parentName: data.name,
      //     //       parentUuid: data.parentUuid,
      //     //       applicationSection:props.chosenApplicationSection?props.chosenApplicationSection:"data",
      //     //       instances: [
      //     //         data 
      //     //       ],
      //     //     },
      //     //   ],
      //     // };
      //     // log.info("onDeleteFormObject updateAction", updateAction);
      //     // await domainController.handleAction(updateAction);


      //   }
      // } else {
      //   throw new Error('ReportComponent onSubmitOuterDialog props.displayedDeploymentDefinition is undefined.')
      }
    },
    [domainController, props.displayedDeploymentDefinition, props.chosenApplicationSection, currentReportTargetEntityDefinition, currentModel]
  )

  
  // ##############################################################################################
  prevColumnDefs = tableColumnDefs;
  prevJzodSchema = currentReportTargetEntityDefinition?.jzodSchema;


  const instancesToDisplay: EntityInstancesUuidIndex = useMemo(() =>
    props.domainElementObject &&
    // props.domainElementObject.elementType == "object" &&
    props.section?.definition.fetchedDataReference &&
    props.domainElementObject[props.section.definition.fetchedDataReference]
      ? props.domainElementObject[props.section.definition.fetchedDataReference] as any as EntityInstancesUuidIndex
      : {}
    ,[props.domainElementObject, props.section?.definition.fetchedDataReference]
  );

  const defaultFormValuesObject = useMemo(
    () => currentReportTargetEntity && currentReportTargetEntityDefinition? defaultFormValues(
      props.tableComponentReportType,
      currentReportTargetEntityDefinition?.jzodSchema as JzodObject,
      [],
      currentReportTargetEntity,
      props.displayedDeploymentDefinition
    ):undefined, [currentReportTargetEntity, currentReportTargetEntityDefinition, props.tableComponentReportType, props.displayedDeploymentDefinition]
  )
  // log.info("calling JsonObjectEditFormDialog with defaultFormValuesObject", defaultFormValuesObject)

  // ##############################################################################################
  const onSubmitOuterDialog: (data: JsonObjectEditFormDialogInputs)=>void = useCallback(
    async (data) => {
      log.info('ReportComponent onSubmitOuterDialog','data',data);
      setAddObjectdialogFormIsOpen(false);

      // log.info('ReportComponent onSubmitOuterDialog','buttonType',buttonType,'data',data,'dialogFormObject',dialogOuterFormObject,buttonType,);
      // const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
      // log.info('ReportComponent onSubmitOuterDialog','buttonType',buttonType,'data',data,buttonType,);
      // if (buttonType == 'OuterDialog') {
      //   await onCreateFormObject(data);
      // } else {
      //   log.info('ReportComponent onSubmitOuterDialog ignoring event for',buttonType);
        
      // }
    },
    [setAddObjectdialogFormIsOpen]
  )

  // ##############################################################################################
  const handleAddObjectDialogFormButtonClick = useCallback((label: string  | undefined, a: any) => {
    log.info(
      "handleAddObjectDialogFormOpen",
      label,
      "called, props.formObject",
      defaultFormValuesObject,
      "passed value",
      a
    );

    setAddObjectdialogFormIsOpen(true);
    // reset(props.defaultFormValuesObject);
    setdialogOuterFormObject(a);
  },[defaultFormValuesObject, setAddObjectdialogFormIsOpen, setdialogOuterFormObject]);

  // ##############################################################################################
  const handleAddObjectDialogTableRowFormClose = useCallback((value?: string, event?:any) => {
    event?.stopPropagation();
    log.info('ReportComponent handleDialogTableRowFormClose',value);
    
    setAddObjectdialogFormIsOpen(false);
  },[setAddObjectdialogFormIsOpen]);


  // log.info("instancesToDisplay",instancesToDisplay);
  // log.info("currentApplicationSection",currentApplicationSection);
  // log.info("props.domainElementObject",props.domainElementObject);
  // log.info("props.currentMiroirEntity",currentReportTargetEntity);
  // log.info("tableColumnDefs",tableColumnDefs);
  
  return (
    <ThemedBox className="MiroirReport-global" display="block">
      {context.showPerformanceDisplay && (
        <div>
          {" "}
          ReportSectionListDisplay renders: {navigationCount} (total: {totalCount}) times.
        </div>
      )}
      {/* labelll:{props.select?.label?<span>{props.select?.label}</span>:<></>} */}
      {currentReportTargetEntity && currentReportTargetEntityDefinition ? (
        !!tableColumnDefs ? (
          // columnDefs?.length > 0
          // <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>
                {props.defaultlabel ??
                  currentReportTargetEntityDefinition?.name ??
                  "No Entity Found!"}
              </h3>
              <ThemedButton
                style={{
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                variant="secondary"
                onClick={() => {
                  handleAddObjectDialogFormButtonClick(
                    props.defaultlabel ??
                      currentReportTargetEntityDefinition?.name ??
                      "No Entity Found!",
                    defaultFormValuesObject
                  );
                }}
              >
                <AddBox style={{ fontSize: "1em", display: "block" }} />
              </ThemedButton>
            </div>
            {addObjectdialogFormIsOpen ? (
              <JsonObjectEditFormDialog
                showButton={false}
                isOpen={addObjectdialogFormIsOpen}
                onClose={handleAddObjectDialogTableRowFormClose}
                onCreateFormObject={onCreateFormObject}
                isAttributes={true}
                label={props.defaultlabel ?? currentReportTargetEntityDefinition?.name}
                entityDefinitionJzodSchema={
                  currentReportTargetEntityDefinition?.jzodSchema as JzodObject
                }
                foreignKeyObjects={foreignKeyObjects}
                currentDeploymentUuid={props.displayedDeploymentDefinition?.uuid}
                currentApplicationSection={props.chosenApplicationSection}
                defaultFormValuesObject={defaultFormValuesObject}
                currentAppModel={currentModel}
                currentMiroirModel={miroirMetaModel}
                addObjectdialogFormIsOpen={addObjectdialogFormIsOpen}
                setAddObjectdialogFormIsOpen={setAddObjectdialogFormIsOpen}
                onSubmit={onSubmitOuterDialog}
              />
            ) : (
              <></>
            )}
            {props.displayedDeploymentDefinition ? (
              <div>
                {/* <div>instancesToDisplay: {JSON.stringify(instancesToDisplay)}</div> */}
                <MTableComponent
                  type={props.tableComponentReportType}
                  displayedDeploymentDefinition={props.displayedDeploymentDefinition}
                  styles={props.styles}
                  currentEntity={currentReportTargetEntity}
                  currentEntityDefinition={currentReportTargetEntityDefinition}
                  foreignKeyObjects={foreignKeyObjects}
                  currentModel={currentModel}
                  columnDefs={tableColumnDefs}
                  instancesToDisplay={instancesToDisplay}
                  deploymentUuid={props.deploymentUuid}
                  displayTools={true}
                  maxRows={50}
                  onRowEdit={onEditFormObject}
                  onRowDelete={onDeleteFormObject}
                  sortByAttribute={props.section.definition.sortByAttribute}
                  paramsAsdomainElements={props.paramsAsdomainElements as any} // TODO: which is right? DomainElementObject or record<string, any>?
                ></MTableComponent>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        ) : (
          <span>No elements in the report</span>
        )
      ) : (
        <ThemedSpan style={{ color: "red" }}>
          ReportSectionListDisplay, no report to display: {JSON.stringify(props.section)}
        </ThemedSpan>
      )}
    </ThemedBox>
  );
  // } else { // props.tableComponentReportType == "JSON_ARRAY"
  //   // const existingRows = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData
  //   // log.info('ReportComponent display report for',props.label,props.tableComponentReportType,'dialogFormObject',dialogOuterFormObject);
    
  //   return (
  //     <div>
  //       {/* <span>rendered ReportSectionListDisplay: {count} times.</span> */}
  //       {/* <JsonObjectEditFormDialog
  //         showButton={true}
  //         jzodSchema={entityDefinitionEntityDefinition.jzodSchema as JzodObject}
  //         initialValuesObject={defaultFormValues(props.tableComponentReportType, entityDefinitionEntityDefinition.jzodSchema as JzodObject, [], existingRows)}
  //         label='InnerDialog'
  //         onSubmit={onSubmitInnerFormDialog}
  //       />
  //       <MTableComponent
  //         type="JSON_ARRAY"
  //         styles={props.styles}
  //         columnDefs={props.columnDefs}
  //         rowData={existingRows}
  //         displayTools={true}
  //       >
  //       </MTableComponent> */}
  //     </div>
  //   );
  // }
}