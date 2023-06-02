import {
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
import { ReportComponent } from "./ReportComponent";

export type JsonObjectFormEditorDialogInputs = {[a:string]:any}

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JsonObjectFormEditorDialogProps {
  label?: string;
  isOpen: boolean;
  isAttributes?:boolean;
  editorAttributes: EditorAttribute[];
  onSubmit: SubmitHandler<JsonObjectFormEditorDialogInputs>;
  onClose: (value: string) => void
}

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

function setValueMsg(sv:(a:string, b:any)=>void,a:string,b:any,msg:string) {
  console.log(msg,a,b);
  sv(a,b);
}
// #####################################################################################################
export function JsonObjectFormEditorDialog(props: JsonObjectFormEditorDialogProps) {
  const logHeader = 'JsonObjectEditorDialog ' + (props.label? props.label + ' ':'');

  const { register, handleSubmit, trigger, watch, setValue, getValues, formState } = useForm<JsonObjectFormEditorDialogInputs>();
  const { errors } = formState;
  console.log(logHeader,'called with props',props,'getValues()',getValues());

  return (
    <Dialog onClose={props.onClose} open={props.isOpen} >
      <DialogTitle>add Entity {props.isAttributes?'WITH ATTRIBUTES':''}</DialogTitle>

      <form id={'form.'+props.label} onSubmit={handleSubmit(props.onSubmit)} style={{display:"inline-flex"}}>
        {/* register your input into the hook by invoking the "register" function */}
        {/* <input defaultValue="test" {...register("example")} /> */}
        {/* include validation with required or other standard HTML validation rules */}
        {/* <input {...register("exampleRequired", { required: true })} /> */}
        <Grid sx={{display:'inline-flex',flexDirection:'column'}}>
          <Item>
            <List sx={{ pt: 0}}>
              {
                props?.editorAttributes?.map(
                  (editorAttribute) => {
                    if (editorAttribute.attribute.type == "ARRAY") {
                      const columnDefs:any[]=getColumnDefinitions(editorAttribute.attribute.lineFormat);
                      return (
                        <ListItem disableGutters key={editorAttribute.attribute.name}>
                          <span>
                            editorAttribute:{JSON.stringify(editorAttribute.value)}
                            <p/>
                            <ReportComponent
                              tableComponentReportType="JSON_ARRAY"
                              label={editorAttribute.attribute.name}
                              columnDefs={columnDefs}
                              styles={
                                {
                                  width: '50vw',
                                  height: '22vw',
                                }
                              }
                            ></ReportComponent>

                          </span>
                        </ListItem>
                      )
                    } else {
                      return (
                        <ListItem disableGutters key={editorAttribute.attribute.name}>
                          {editorAttribute.attribute.name}: <input form={'form.'+props.label} defaultValue={editorAttribute.value} {...register(editorAttribute.attribute.name)}/>
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
  );
}
