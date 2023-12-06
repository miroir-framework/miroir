import { FC, useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
import AddBoxIcon from '@mui/icons-material/AddBox';
import { Button } from "@mui/material";
// import * as XLSX from 'xlsx/xlsx.mjs';
import * as XLSX from 'xlsx';
import {
  DomainAction,
  EntityDefinition,
  MetaEntity,
  entityEntity,
  entityEntityDefinition,
  ApplicationModelSchema,
  DomainController,
  DomainControllerInterface,
  EntityAttribute,
  DomainDataAction,
  EntityInstance,
  Report,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
} from "miroir-core";
import { useDomainControllerService } from "./MiroirContextReactProvider";
// import { JzodObject } from "@miroir-framework/jzod-ts";
import { packageName } from "../../constants";
import { cleanLevel } from "./constants";
import { JzodObject } from "@miroir-framework/jzod-ts";


const loggerName: string = getLoggerName(packageName, cleanLevel,"importer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const ImporterCorePropsSchema = z.object({
  filename:z.string(),
  currentModel: ApplicationModelSchema,
  currentDeploymentUuid: z.string().uuid(),
})

export type ImporterCoreProps = z.infer<typeof ImporterCorePropsSchema>;

const imageMimeType = /image\/(png|jpg|jpeg)/i;
const excelMimeType = /application\//i;

export const Importer:FC<ImporterCoreProps> = (props:ImporterCoreProps) => {

  const [file, setFile] = useState(null);
  const [fileDataURL, setFileDataURL] = useState<any>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [currentWorkSheet, setCurrentWorkSheet] = useState<XLSX.WorkSheet | undefined>(undefined);

  const domainController: DomainControllerInterface = useDomainControllerService();

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
          log.log('found excel workbook',workBook);
          const workSheetName: string = workBook.SheetNames[0];
          log.log('found excel workSheetName',workSheetName);
          const workSheet: XLSX.WorkSheet = workBook.Sheets[workSheetName];
          log.log('found excel workSheet',workSheet);
          const data: any = XLSX.utils.sheet_to_json(workSheet, {header:"A"});
          // headers = data[0];
          setFileData(data);
          setCurrentWorkSheet(workSheet)
          log.log('found excel data',data);
          
        }

          //     // const bstr: string = e.target.result;
 
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


  const createEntity = async () => {
    const newEntity: MetaEntity = {
      uuid: uuidv4(),
      parentUuid: entityEntity.uuid,
      application: '',
      description: "",
      name: "test",
    }
    // const attributes: EntityAttribute[] = [
    //   {
    //     id:0,
    //     type:'STRING',
    //     name: 'uuid',
    //     defaultLabel:'Uuid',
    //     description: '',
    //     editable: false,
    //     nullable: false,
    //   } as EntityAttribute
    // ].concat(Object.values(fileData[0]).map((a:string,index)=>({
    //   id:index + 1,
    //   type:'STRING',
    //   name: a,
    //   defaultLabel:a,
    //   description: '',
    //   editable: true,
    //   nullable: true,
    // })));
    const jzodSchema:JzodObject = {
      type: "object",
      definition: Object.assign(
        {},
        {
          uuid: {
            type: "simpleType",
            definition: "string",
            validations: [{ type: "uuid" }],
            extra: { id: 1, defaultLabel: "Uuid", editable: false },
          },
        },
        ...Object.values(fileData[0]).map(
          (a: string, index) => (
            {
              [a]: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: index + 1, defaultLabel: a, editable: true },
              },
            }
          )
        )
      ),
    };
    const newEntityDefinition:EntityDefinition = {
      name: "Fountain",
      uuid: uuidv4(),
      parentName: "EntityDefinition",
      parentUuid: entityEntityDefinition.uuid,
      entityUuid: newEntity.uuid,
      conceptLevel: "Model",
      jzodSchema: jzodSchema,
    }
    const createEntityAction: DomainAction = {
      actionType:"DomainTransactionalAction",
      actionName: "updateEntity",
      update: {
        updateActionName:"WrappedTransactionalEntityUpdate",
        modelEntityUpdate: {
          updateActionType: "ModelEntityUpdate",
          updateActionName: "createEntity",
          // parentName: entityDefinitionEntityDefinition.name,
          // parentUuid: entityDefinitionEntityDefinition.uuid,
          entities: [
            {entity: newEntity, entityDefinition:newEntityDefinition},
          ],
        },
      }
    };
    await domainController.handleDomainAction(props.currentDeploymentUuid, createEntityAction, props.currentModel);
    const newEntityReport: Report = {
      "uuid": uuidv4(),
      "parentName":"Report",
      "parentUuid":"3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      "conceptLevel":"Model",
      "name":"FountainList",
      "defaultLabel": "List of Fountains",
      "type": "list",
      "definition":{
        "section": {
          "type":"objectListReportSection",
          "definition": {
            "type": "objectListQuery",
            "parentName": "Fountain",
            "parentUuid": newEntity.uuid
          }
        }
      }
    }
    const createReportAction: DomainAction = {
      actionType: "DomainTransactionalAction",
      actionName: "UpdateMetaModelInstance",
      update: {
        updateActionType: "ModelCUDInstanceUpdate",
        updateActionName: "create",
        objects: [{
          parentName: newEntityReport.parentName,
          parentUuid: newEntityReport.parentUuid,
          applicationSection:'model',
          instances: [
            newEntityReport as EntityInstance
          ]
        }],
      }
    };
    await domainController.handleDomainAction(props.currentDeploymentUuid, createReportAction, props.currentModel);

    await domainController.handleDomainAction(props.currentDeploymentUuid, {actionName: "commit",actionType:"DomainTransactionalAction"},props.currentModel);
    // const entityColumns = 
    const instances:EntityInstance[] = 
      fileData.map(
        (r:any) => {
          return Object.fromEntries(
            [
              ...Object.entries(r).map((e,index)=>([[Object.keys(jzodSchema.definition)[index]],e[1]])),
              ['uuid',uuidv4()],
              ['parentName',newEntity.name],
              ['parentUuid',newEntity.uuid],
            ]
          ) as EntityInstance
        }
      ) 
    ;
    log.log('adding instances',instances);
    
    const createRowsAction: DomainDataAction = {
      actionName:'create',
      actionType:"DomainDataAction",
      objects:[
        {
          parentName:newEntity.name,
          parentUuid:newEntity.uuid,
          applicationSection:'data',
          instances:instances,
        }
      ]
    };
    await domainController.handleDomainAction(props.currentDeploymentUuid, createRowsAction);
  }

  return (
    <>
    <form>
      <p>
        <label htmlFor='image'> Browse images  </label>
        <input
          type="file"
          id='excel'
          accept='.xls, .xlsx, .ods'
          onChange={changeHandler}
        />
          {file?file['type']:''}
      </p>
      <p>
        <input type="submit"/>
      </p>
    </form>
    {
      fileDataURL ?
      <p>
        found Json file length:{
          // <img src={fileDataURL} alt="preview" />
          JSON.stringify(fileData).length
        }
      </p> : null
    }
      found row A:{JSON.stringify(fileData?fileData[0]:'')}
      <h3>
        create Entity from Excel File:
        <Button variant="outlined" onClick={()=>createEntity()}>
          <AddBoxIcon/>
        </Button>
      </h3>
    </>
  );
}