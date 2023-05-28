import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { blue } from "@mui/material/colors";

import { useForm, SubmitHandler } from "react-hook-form";
import { ApplicationDeployment, DomainController, DomainControllerInterface, EntityAttribute, EntityInstance, MiroirMetaModel } from "miroir-core";
import { useDomainControllerServiceHook } from "./MiroirContextReactProvider";

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

export interface SimpleDialogProps {
  open: boolean;
  editorAttributes: EditorAttribute[];
  displayedDeploymentDefinition: ApplicationDeployment | undefined;
  currentModel:MiroirMetaModel,
  // rowData:string[];
  selectedValue: string;
  onClose: (value: string) => void;
}

// #####################################################################################################
export function SimpleDialog(props: SimpleDialogProps) {
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();
  const { onClose, selectedValue, open } = props;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async data => {
    if (props.displayedDeploymentDefinition) {
      await domainController.handleDomainAction(
        props.displayedDeploymentDefinition?.uuid,
        {
        actionType: "DomainTransactionalAction",
        actionName: "UpdateMetaModelInstance",
        update: {
          updateActionType: "ModelCUDInstanceUpdate",
          updateActionName: "create",
          objects: [{
            parentName: data.name,
            parentUuid: data.parentUuid,
            applicationSection:'model',
            instances: [
              data as EntityInstance
            ]
          }],
        }
      },props.currentModel);
    } else {
      throw new Error('SimpleDialog onSubmit props.displayedDeploymentDefinition is undefined.')
    }
    console.log(data);
  
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
      <DialogTitle>Set backup account</DialogTitle>

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
                  {editorAttribute.attribute.name}: <input defaultValue={editorAttribute.value} {...register(editorAttribute.attribute.name)}
                />
                  {/* <ListItemButton onClick={() => handleListItemClick(email)} key={email}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={email} />
                </ListItemButton> */}
                </ListItem>
              )
            )
          }
        </List>



      {/* errors will return when field validation fails  */}
      {errors.exampleRequired && <span>This field is required</span>}


      <input type="submit" />
    </form>
      {/* <List sx={{ pt: 0 }}>
        {emails.map((email) => (
          <ListItem disableGutters>
            <ListItemButton onClick={() => handleListItemClick(email)} key={email}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={email} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disableGutters>
          <ListItemButton
            autoFocus
            onClick={() => handleListItemClick('addAccount')}
          >
            <ListItemAvatar>
              <Avatar>
                <AddIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Add account" />
          </ListItemButton>
        </ListItem>
      </List> */}
    </Dialog>
  );
}
