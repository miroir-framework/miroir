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
  MiroirMetaModelSchema,
  DomainController,
  DomainControllerInterface,
  EntityAttribute,
} from "miroir-core";
import { useDomainControllerServiceHook } from "./MiroirContextReactProvider";
// import applicationLibrary from "../../src/assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";


export const ImporterCorePropsSchema = z.object({
  filename:z.string(),
  currentModel: MiroirMetaModelSchema,
  currentDeploymentUuid: z.string().uuid(),
  // rowData: z.array(z.any()),
  // styles:z.any().optional(),
  // children: z.any(),
  // displayTools: z.boolean(),
  // onRowDelete: z.function().optional(),
})

export type ImporterCoreProps = z.infer<typeof ImporterCorePropsSchema>;

const imageMimeType = /image\/(png|jpg|jpeg)/i;
const excelMimeType = /application\//i;

export const Importer:FC<ImporterCoreProps> = (props:ImporterCoreProps) => {

  const [file, setFile] = useState(null);
  const [fileDataURL, setFileDataURL] = useState<any>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [currentWorkSheet, setCurrentWorkSheet] = useState<XLSX.WorkSheet | undefined>(undefined);

  const domainController: DomainControllerInterface = useDomainControllerServiceHook();

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
          console.log('found excel workbook',workBook);
          const workSheetName: string = workBook.SheetNames[0];
          console.log('found excel workSheetName',workSheetName);
          const workSheet: XLSX.WorkSheet = workBook.Sheets[workSheetName];
          console.log('found excel workSheet',workSheet);
          const data: any = XLSX.utils.sheet_to_json(workSheet, {header:"A"});
          // headers = data[0];
          setFileData(data);
          setCurrentWorkSheet(workSheet)
          console.log('found excel data',data);
          
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
    const attributes: EntityAttribute[] = Object.values(fileData[0]).map((a:string,index)=>({
      id:index + 1,
      type:'STRING',
      name: a,
      defaultLabel:a,
      description: '',
      editable: true,
      nullable: true,
    }));
    const newEntityDefinition:EntityDefinition = {
      name: "test",
      uuid: uuidv4(),
      parentName: "EntityDefinition",
      parentUuid: entityEntityDefinition.uuid,
      entityUuid: newEntity.uuid,
      conceptLevel: "Model",
      attributes: attributes,
    }
    const createAction: DomainAction = {
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
    await domainController.handleDomainAction(props.currentDeploymentUuid, createAction, props.currentModel);
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