import {
  Dialog,
  DialogTitle,
  List,
  ListItem
} from "@mui/material";

import { ApplicationDeployment, DomainControllerInterface, EntityAttribute, EntityDefinition, MetaEntity, MiroirMetaModel, entityEntityDefinition } from "miroir-core";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDomainControllerServiceHook } from "./MiroirContextReactProvider";
import { ReportComponent } from "./ReportComponent";

// type Inputs = {
//   example: string,
//   exampleRequired: string,
// };

// type Inputs = {[a:string]:any}
type Inputs = {[a:string]:any}

export const emails = ['username@gmail.com', 'user02@gmail.com'];

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface InstanceEditorDialogProps {
  open: boolean;
  currentMiroirEntity: MetaEntity | undefined;
  currentMiroirEntityDefinition: EntityDefinition | undefined;
  editorAttributes: EditorAttribute[];
  displayedDeploymentDefinition: ApplicationDeployment | undefined;
  currentModel:MiroirMetaModel,
  // rowData:string[];
  selectedValue: string;
  onClose: (value: string) => void;
}

// #####################################################################################################
export function InstanceEditorDialog(props: InstanceEditorDialogProps) {
  // const classes = useStyles();
  console.log('InstanceEditorDialog',props);
  
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();
  const { onClose, selectedValue, open } = props;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async data => {
    // if (props.displayedDeploymentDefinition) {
    //   await domainController.handleDomainAction(
    //     props.displayedDeploymentDefinition?.uuid,
    //     {
    //     actionType: "DomainTransactionalAction",
    //     actionName: "UpdateMetaModelInstance",
    //     update: {
    //       updateActionType: "ModelCUDInstanceUpdate",
    //       updateActionName: "create",
    //       objects: [{
    //         parentName: data.name,
    //         parentUuid: data.parentUuid,
    //         applicationSection:'model',
    //         instances: [
    //           data as EntityInstance
    //         ]
    //       }],
    //     }
    //   },props.currentModel);
    // } else {
    //   throw new Error('SimpleDialog onSubmit props.displayedDeploymentDefinition is undefined.')
    // }
    console.log('SimpleDialog onSubmit',data);
  
    onClose(JSON.stringify(data))
  }

  const handleClose = () => {
    onClose(selectedValue);
  };

  const handleListItemClick = (value: string) => {
    onClose(value);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>add Entity</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
      {/* register your input into the hook by invoking the "register" function */}
      {/* <input defaultValue="test" {...register("example")} /> */}
      
      {/* include validation with required or other standard HTML validation rules */}
      {/* <input {...register("exampleRequired", { required: true })} /> */}
        <List sx={{ pt: 0 }}>
          {
            props?.editorAttributes?.map(
              (editorAttribute) => (
                <ListItem disableGutters key={editorAttribute.attribute.name}>
                  {editorAttribute.attribute.name}: <input defaultValue={editorAttribute.value} {...register(editorAttribute.attribute.name)}/>
                </ListItem>
              )
            )
          }
        </List>
        {
          // props.displayedDeploymentDefinition?.uuid = entit
          props.currentMiroirEntity?.uuid == entityEntityDefinition.uuid ?
            <ReportComponent
              tableComponentReportType="JSON_ARRAY"
              chosenApplicationSection={'model'}
              // currentMiroirReport={undefined}
              displayedDeploymentDefinition={props.displayedDeploymentDefinition}
              currentModel={props.currentModel}
              // currentMiroirEntity={props.currentMiroirEntity}
              // currentMiroirEntityDefinition={props.currentMiroirEntityDefinition}
            />
            :
            <div></div>
        }



      {/* errors will return when field validation fails  */}
      {errors.exampleRequired && <span>This field is required</span>}


      <input type="submit" />
    </form>
    </Dialog>
  );
}
