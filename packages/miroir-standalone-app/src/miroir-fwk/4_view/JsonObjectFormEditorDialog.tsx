import AddBoxIcon from '@mui/icons-material/AddBox';
import {
  Button,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  Paper,
  styled
} from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';

import { EntityAttribute } from "miroir-core";
import { SubmitHandler, useForm } from "react-hook-form";
import { getColumnDefinitions } from './EntityViewer';
import { ReportSectionDisplay } from "./ReportSectionDisplay";
import { useState } from "react";
import { useMiroirContextInnerFormOutput } from './MiroirContextReactProvider';

export type JsonObjectFormEditorDialogInputs = {[a:string]:any}

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JsonObjectFormEditorCoreDialogProps {
  label: string;
  isAttributes?:boolean;
  entityAttributes: EntityAttribute[];
  formObject:any;
  onSubmit: SubmitHandler<JsonObjectFormEditorDialogInputs>;
}

export interface JsonObjectFormEditorWithButtonDialogProps extends JsonObjectFormEditorCoreDialogProps {
  showButton: true;
}

export interface JsonObjectFormEditorDialogWithoutButtonProps  extends JsonObjectFormEditorCoreDialogProps {
  showButton: false;
  isOpen: boolean;
  onClose: (a?:any) => void;
  // onClose: z.function().args(z.any()).returns(z.void()),
}

export type JsonObjectFormEditorDialogProps= JsonObjectFormEditorWithButtonDialogProps | JsonObjectFormEditorDialogWithoutButtonProps;


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  display:'flex',
  maxHeight: '50vh',
  // height: '80vh',
  color: theme.palette.text.secondary,
}));

// #####################################################################################################
export function JsonObjectFormEditorDialog(props: JsonObjectFormEditorDialogProps) {
  const logHeader = 'JsonObjectEditorDialog ' + (props.label? props.label + ' ':'');
  const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();

  const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } = useForm<JsonObjectFormEditorDialogInputs>({defaultValues:props.formObject});
  const { errors } = formState;
  console.log(logHeader,'called with props',props,'formState',formState.isDirty,formState.isLoading,formState.isSubmitSuccessful,formState.isSubmitted,formState.isSubmitting,formState.isValid,formState.isValidating,'getValues()',getValues());

  const formIsOpen = addObjectdialogFormIsOpen || (!props.showButton && props.isOpen);

  const handleAddObjectDialogFormButtonClick = (label:string,a:any) => {
    console.log(logHeader,'handleAddObjectDialogFormOpen',label,'called, props.formObject',props.formObject, 'passed value',a);
    
    setAddObjectdialogFormIsOpen(true);
    reset(props.formObject);
    setdialogOuterFormObject(a);
  };

  const handleAddObjectDialogFormClose = (value: string) => {
    console.log(logHeader,'handleAddObjectDialogFormClose',value);
    
    setAddObjectdialogFormIsOpen(false);
    if (!props.showButton) {
      props.onClose();
    }
  };


  const handleAddObjectDialogFormSubmit: SubmitHandler<JsonObjectFormEditorDialogInputs> = async (data,event) => {
    const result = props.onSubmit(data,event);
    const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
    console.log(logHeader,'handleAddObjectDialogFormSubmit buttonType',buttonType,'props',props, 'passed value',data);

    if (buttonType == props.label) {
      handleAddObjectDialogFormClose('');
    } else {
      console.warn(logHeader,'handleAddObjectDialogFormSubmit nog closing dialog form',props.label,'buttonType',buttonType);
      
    }
    return result;
  }

  // if (dialogFormIsOpen && getValues()['uuid'] != props.formObject['uuid']) {
  if (formIsOpen && getValues()['uuid'] != props.formObject['uuid']) {
    console.log(logHeader,'reset form!');
    reset(props.formObject);
  }

  return (
    <div className='JsonObjectFormEditorDialog'>
      <span>
      {
          props.showButton?
          <h3>
            {props.label}
            <Button variant="outlined" onClick={()=>handleAddObjectDialogFormButtonClick(props?.label,props?.formObject)}>
              <AddBoxIcon/>
            </Button>
          </h3>
          :
          <div></div>
      }
        </span>
      <Dialog onClose={handleAddObjectDialogFormClose} open={formIsOpen}  >
        {/* <DialogTitle>add Entity</DialogTitle> */}
        <DialogTitle>{props.label} add Element</DialogTitle>
        {/* <form id={'form.'+props.label} onSubmit={handleSubmit(props.onSubmit)} style={{display:"inline-flex"}}> */}
        <form id={'form.'+props.label} onSubmit={handleSubmit(handleAddObjectDialogFormSubmit)} style={{display:"inline-flex"}}>
          {/* register your input into the hook by invoking the "register" function */}
          {/* <input defaultValue="test" {...register("example")} /> */}
          {/* include validation with required or other standard HTML validation rules */}
          {/* <input {...register("exampleRequired", { required: true })} /> */}
          <Grid sx={{display:'inline-flex',flexDirection:'column'}}>
            <Item>
              formObject: {JSON.stringify(props.formObject)}
            </Item>
            <Item>
              <List sx={{ pt: 0}}>
                {
                  props?.entityAttributes?.map(
                    (entityAttribute) => {
                      if (entityAttribute.type == "ARRAY") {
                        const columnDefs:any[]=getColumnDefinitions(entityAttribute.lineFormat);
                        return (
                          <ListItem disableGutters key={entityAttribute.name}>
                            <span>
                              <ReportSectionDisplay
                                tableComponentReportType="JSON_ARRAY"
                                label={"JSON_ARRAY-"+entityAttribute.name}
                                columnDefs={columnDefs}
                                rowData={props?.formObject[entityAttribute.name]}
                                styles={
                                  {
                                    width: '50vw',
                                    height: '22vw',
                                  }
                                }
                              ></ReportSectionDisplay>
                            </span>
                          </ListItem>
                        )
                      } else {
                        return (
                          <ListItem disableGutters key={entityAttribute.name}>
                            {entityAttribute.name}: <input form={'form.'+props.label} defaultValue={props.formObject[entityAttribute.name]} {...register(entityAttribute.name)}/>
                          </ListItem>
                        )
                      }
                    }
                  )
                }
              </List>
            </Item>
          </Grid>
          {/* errors will return when field validation fails  */}
          {errors.exampleRequired && <span>This field is required</span>}
          <input type="submit" id={props.label} name={props.label} form={'form.'+props.label}/>
        </form>
      </Dialog>
      {/* <span>
      JsonObjectFormEditorDialog end {props.label}
      </span> */}
    </div>
  );
}
