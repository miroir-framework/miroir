import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import * as XLSX from 'xlsx';

import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  CompositeActionTemplate,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  EntityInstance,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
  TransformerForBuildPlusRuntime
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  entityApplicationForAdmin,
  entityDeployment,
  entityEntity,
  entityEntityDefinition,
  MiroirLoggerFactory
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { OuterRunnerView } from "./OuterRunnerView.js";
import type { FormMlSchema } from "./RunnerInterface.js";
import { getCreateEntityActionTemplate } from "./CreateEntityTool.js";
import { transformer, type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ImportEntityFromSpreadsheetRunner"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

const imageMimeType = /image\/(png|jpg|jpeg)/i;
const excelMimeType = /application\//i;

// ################################################################################################
export interface CreateEntityToolProps {
  deploymentUuid: string;
}

// ################################################################################################
export const ImportEntityFromSpreadsheetRunner: React.FC<CreateEntityToolProps> = ({
  deploymentUuid,
}) => {
  const runnerName: string = "importEntityFromSpreadsheet";
  const runnerLabel: string = "Import Entity From Spreadsheet";
  const newEntityUuid = uuidv4();
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);

  const [file, setFile] = useState(null);
  const [fileDataURL, setFileDataURL] = useState<any>(null);
  const [fileData, setFileData] = useState<string[]>([]);
  const [currentWorkSheet, setCurrentWorkSheet] = useState<XLSX.WorkSheet | undefined>(undefined);

  // const localDeploymentUuid = deploymentUuid;
  // const localDeploymentUuid = "1b3f973b-a000-4a85-9d42-2639ecd0c473"; // WRONG, it's the application's uuid
  const formMlSchema: FormMlSchema = useMemo(
    () => ({
      // formMlSchemaType: "mlSchema",
      formMlSchemaType: "transformer",
      transformer: {
        type: "object",
        definition: {
          [runnerName]: {
            type: "object",
            definition: {
              application: {
                type: "uuid",
                nullable: true,
                tag: {
                  value: {
                    defaultLabel: "Application",
                    editable: true,
                    selectorParams: {
                      targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      targetEntity: entityApplicationForAdmin.uuid,
                      targetEntityOrderInstancesBy: "name",
                    },
                  },
                },
              },
              entityName: {
                type: "string",
                nullable: true,
                tag: {
                  value: {
                    defaultLabel: "Entity Name",
                    editable: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    []
  );

  const initialFormValue = useMemo(() => {
    return {
      [runnerName]: {
        application: noValue.uuid,
        entityName: "",
      },
    };
  }, []);

  // ##############################################################################################
  const changeHandler = (e:any) => {
      const file = e.target.files[0];
      if (!file.type.match(excelMimeType)) {
        alert("excel mime type is not valid: " + file.type);
        return;
      }
      setFile(file);
    }
    useEffect(() => {
      let fileReader:FileReader, isCancel = false;
      if (file) {
        fileReader = new FileReader();
        fileReader.onload = (e:ProgressEvent<FileReader>) => {
          const result = e.target?.result;
          if (result && !isCancel) {
            setFileDataURL(result);
            const workBook: XLSX.WorkBook = XLSX.read(result, {type: 'binary'});
            log.info('found excel workbook',workBook);
            const workSheetName: string = workBook.SheetNames[0];
            log.info('found excel workSheetName',workSheetName);
            const workSheet: XLSX.WorkSheet = workBook.Sheets[workSheetName];
            log.info('found excel workSheet',workSheet);
            const data: any = XLSX.utils.sheet_to_json(workSheet, {header:"A"});
            // headers = data[0];
            setFileData(data);
            setCurrentWorkSheet(workSheet)
            log.info('found excel data',data);
            
          }
        }
        fileReader.readAsBinaryString(file);
      }
      return () => {
        isCancel = true;
        if (fileReader && fileReader.readyState === 1) {
          fileReader.abort();
        }
      }
  
    }, [file]);
  
  // ##############################################################################################
  const deploymentUuidQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = {
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
    pageParams: {},
    queryParams: {},
    contextResults: {},
    extractorTemplates: {
      deployments: {
        label: "deployments of the application",
        extractorTemplateType: "extractorTemplateForObjectListByEntity",
        parentUuid: entityDeployment.uuid,
        parentName: entityDeployment.name,
        applicationSection: "data",
        filter: {
          attributeName: "adminApplication",
          value: {
            transformerType: "mustacheStringTemplate",
            definition: `{{${runnerName}.application}}`,
          },
        },
      },
    },
  } as BoxedQueryTemplateWithExtractorCombinerTransformer;

  // const deleteEntityActionTemplate = useMemo((): CompositeActionTemplate => {
  //   return {
  //     actionType: "compositeAction",
  //     actionLabel: runnerLabel,
  //     actionName: "sequence",
  //     definition: [
  //       // Step 1: Query to get the deployment UUID from the selected application
  //       {
  //         actionType: "compositeRunBoxedExtractorOrQueryAction",
  //         actionLabel: "getDeploymentForApplication",
  //         nameGivenToResult: "deploymentInfo",
  //         query: {
  //           actionType: "runBoxedExtractorOrQueryAction",
  //           actionName: "runQuery",
  //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //           deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //           payload: {
  //             applicationSection: "data",
  //             query: {
  //               queryType: "boxedQueryWithExtractorCombinerTransformer",
  //               deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //               pageParams: {},
  //               queryParams: {},
  //               contextResults: {},
  //               extractors: {
  //                 deployments: {
  //                   label: "deployments of the application",
  //                   extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //                   parentUuid: entityDeployment.uuid,
  //                   parentName: entityDeployment.name,
  //                   applicationSection: "data",
  //                   filter: {
  //                     attributeName: "adminApplication",
  //                     value: {
  //                       transformerType: "mustacheStringTemplate",
  //                       interpolation: "build",
  //                       definition: `{{${runnerName}.application}}`,
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       // infer entityDefintion from entity uuid
  //       {
  //         actionType: "compositeRunBoxedExtractorOrQueryAction",
  //         // actionType: "",
  //         actionLabel: "getEntityDefinitionForEntity",
  //         nameGivenToResult: "entityDefinitionInfo",
  //         query: {
  //           actionType: "runBoxedExtractorOrQueryAction",
  //           actionName: "runQuery",
  //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //           deploymentUuid: {
  //             transformerType: "getFromContext",
  //             interpolation: "runtime",
  //             // definition: "{{deploymentInfo.deployments.0.uuid}}",
  //             referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
  //           } as any,
  //           payload: {
  //             applicationSection: "model",
  //             query: {
  //               queryType: "boxedQueryWithExtractorCombinerTransformer",
  //               deploymentUuid: {
  //                 transformerType: "getFromContext",
  //                 interpolation: "runtime",
  //                 // definition: "{{deploymentInfo.deployments.0.uuid}}",
  //                 referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
  //               } as any,
  //               pageParams: {},
  //               queryParams: {},
  //               contextResults: {},
  //               extractors: {
  //                 entityDefinitions: {
  //                   label: "entityDefinitions of the deployment",
  //                   extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //                   parentUuid: entityEntityDefinition.uuid,
  //                   parentName: entityEntityDefinition.name,
  //                   applicationSection: "model",
  //                   filter: {
  //                     attributeName: "entityUuid",
  //                     value: {
  //                       transformerType: "mustacheStringTemplate",
  //                       interpolation: "build",
  //                       definition: `{{${runnerName}.entity}}`,
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       // createEntity action
  //       {
  //         actionType: "dropEntity",
  //         actionLabel: runnerName,
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           interpolation: "runtime",
  //           definition: "{{deploymentInfo.deployments.0.uuid}}",
  //         } as any,
  //         payload: {
  //           entityUuid: {
  //             transformerType: "getFromParameters",
  //             interpolation: "build",
  //             referencePath: [runnerName, "entity"],
  //           } as any,
  //           entityDefinitionUuid: {
  //             transformerType: "getFromContext",
  //             interpolation: "runtime",
  //             referencePath: ["entityDefinitionInfo", "entityDefinitions", "0", "uuid"],
  //           } as any,
  //         },
  //       },
  //       {
  //         actionType: "commit",
  //         actionLabel: "commit",
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           interpolation: "runtime",
  //           definition: "{{deploymentInfo.deployments.0.uuid}}",
  //         } as any,
  //       },
  //     ],
  //   };
  // }, [localDeploymentUuid]);

  // const createEntityActionTemplate = useMemo(() => getCreateEntityActionTemplate(runnerName, "Create Entity"), []);
  const createEntityActionTemplate = useCallback(
    (
      entity: Entity,
      entityDefinition: EntityDefinition,
      instances: EntityInstance[]
    ): CompositeActionTemplate => ({
      actionType: "compositeAction",
      actionLabel: "createEntity",
      actionName: "sequence",
      definition: [
        // Step 1: Query to get the deployment UUID from the selected application
        {
          actionType: "compositeRunBoxedExtractorOrQueryAction",
          actionLabel: "getDeploymentForApplication",
          nameGivenToResult: "deploymentInfo",
          query: {
            actionType: "runBoxedExtractorOrQueryAction",
            actionName: "runQuery",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
            payload: {
              applicationSection: "data",
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                extractors: {
                  deployments: {
                    label: "deployments of the application",
                    extractorOrCombinerType: "extractorByEntityReturningObjectList",
                    parentUuid: entityDeployment.uuid,
                    parentName: entityDeployment.name,
                    applicationSection: "data",
                    filter: {
                      attributeName: "adminApplication",
                      value: {
                        transformerType: "getFromParameters",
                        referencePath: [runnerName, "application"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        // createEntity action
        {
          actionType: "createEntity",
          actionLabel: "createEntity",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
          } as any,
          payload: {
            entities: [
              {
                entity,
                entityDefinition,
              },
            ],
          } as any,
        },
        {
          actionType: "commit",
          actionLabel: "commit",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
          } as any,
        },
        {
          actionType: "createInstance",
          deploymentUuid: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
          } as any,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            applicationSection: "data",
            objects: [
              {
                parentName: "EntityName",
                parentUuid: newEntityUuid,
                applicationSection: "data",
                instances: instances,
              },
            ],
          },
        },
      ],
    }),
    [runnerName, newEntityUuid]
  );
  
  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  const onSubmit = useCallback(
  async (values: any) => {
    log.info("ImportEntityFromSpreadsheetRunner onSubmit", "newEntityUuid", newEntityUuid, "values", values);

    // open file??

    // create mlSchema from spreadsheet
    // const fileData: { [k: string]: any }[] = [
    //   { a: "iso3166-1Alpha-2", b: "iso3166-1Alpha-3", c: "Name" },
    //   { a: "US", b: "USA", c: "United States" },
    //   { a: "DE", b: "DEU", c: "Germany" },
    // ];
    // const newEntityJzodSchema: JzodObject = {
    //   type: "object",
    //   definition: Object.assign(
    //     {},
    //     {
    //       uuid: {
    //         type: "string",
    //         validations: [{ type: "uuid" }],
    //         tag: { id: 1, defaultLabel: "Uuid", editable: false },
    //       },
    //       parentName: {
    //         type: "string",
    //         optional: true,
    //         tag: { id: 2, defaultLabel: "Uuid", editable: false },
    //       },
    //       parentUuid: {
    //         type: "string",
    //         validations: [{ type: "uuid" }],
    //         tag: { id: 3, defaultLabel: "parentUuid", editable: false },
    //       },
    //     },
    //     ...(fileData[0]
    //       ? Object.values(fileData[0]).map((a: string, index) => ({
    //           [a]: {
    //             type: "string",
    //             // optional: true,
    //             // tag: { id: index + 2 /* uuid attribute has been added*/, defaultLabel: a, editable: true },
    //           },
    //         }))
    //       : [])
    //   ),
    // };

    const objectAttributeNames = fileData[0];
    const instances:EntityInstance[] = 
      fileData.slice(1)
      .map(
        (fileDataRow:any) => {
          return Object.fromEntries([
            ...Object.entries(fileDataRow).map((e: [string, any], index: number) => [
              objectAttributeNames[(e as any)[0]],
              e[1],
            ]),
            ["uuid", uuidv4()],
            ["parentName", "EntityName"], // TODO: replace with actual entity name!
            ["parentUuid", newEntityUuid],
          ]) as EntityInstance;
        }
      ) 
    ;
    log.info('ImportEntityFromSpreadsheetRunner adding instances',instances);

    const entity: Entity = {
      uuid: newEntityUuid,
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentName: "Entity",
      parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      name: {
        transformerType: "getFromParameters",
        referencePath: [runnerName, "entityName"],
      } as any,
    };
    log.info("ImportEntityFromSpreadsheetRunner onSubmit entity", JSON.stringify(entity, null, 2));
    const entityDefinition: EntityDefinition = {
      uuid: uuidv4(),
      parentName: "EntityDefinition",
      parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      parentDefinitionVersionUuid: "c50240e7-c451-46c2-b60a-07b3172a5ef9",
      name: {
        transformerType: "mustacheStringTemplate",
        definition: `{{${runnerName}.entityName}} Definition`,
      } as any,
      entityUuid: newEntityUuid,
      jzodSchema: {
        transformerType: "spreadSheetToJzodSchema",
        spreadsheetContents: fileData,
      } as any,
    };

    // log.info(
    //   "ImportEntityFromSpreadsheetRunner onSubmit entityDefinition",
    //   JSON.stringify(entityDefinition, null, 2)
    // );
    const action: CompositeActionTemplate = createEntityActionTemplate(
      entity,
      entityDefinition,
      instances,
    )

    // call createEntity action
    log.info("ImportEntityFromSpreadsheetRunner onSubmit action create Entity", 
      JSON.stringify(action, null, 2),
      //
      // action
    );
    await domainController.handleCompositeActionTemplate(
      action,
      currentMiroirModelEnvironment,
      values,
    )


  }
  , [fileData, createEntityActionTemplate, domainController, currentMiroirModelEnvironment, newEntityUuid]);

  return (
    <>
      {/* <ThemedOnScreenHelper
        label={`DeleteEntityRunner for ${runnerName} initialFormValue`}
        data={initialFormValue}
      />
      <ThemedOnScreenHelper
        label={`DeleteEntityRunner for ${runnerName} deploymentUuidQuery`}
        data={deploymentUuidQuery}
      /> */}
      <form>
        <p>
          <label htmlFor="image"> Browse files </label>
          <input type="file" id="excel" accept=".xls, .xlsx, .ods" onChange={changeHandler} />
          {file ? file["type"] : ""}
        </p>
        <p>
          <input type="submit" />
        </p>
      </form>
      {fileDataURL ? (
        <p>
          found Json file length:
          {
            // <img src={fileDataURL} alt="preview" />
            JSON.stringify(fileData).length
          }
        </p>
      ) : null}
      found row A:{JSON.stringify(fileData ? fileData[0] : "")}
      <OuterRunnerView
        runnerName={runnerName}
        deploymentUuid={deploymentUuid}
        deploymentUuidQuery={deploymentUuidQuery}
        formMlSchema={formMlSchema}
        initialFormValue={initialFormValue}
        action={{
          actionType: "onSubmit",
          onSubmit
        }}
        // action={{
        //   actionType: "compositeActionTemplate",
        //   compositeActionTemplate: deleteEntityActionTemplate,
        // }}
        labelElement={<h2>{runnerLabel}</h2>}
        formikValuePathAsString={runnerName}
        formLabel={runnerLabel}
        displaySubmitButton="onFirstLine"
        useActionButton={true}
      />
    </>
  );
};
