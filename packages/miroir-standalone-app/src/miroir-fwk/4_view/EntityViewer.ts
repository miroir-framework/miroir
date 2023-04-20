import { EntityAttribute } from "miroir-core";
import GenderCellRenderer from "./GenderCellRenderer";
import SelectEditor from "miroir-fwk/4_view/SelectEditor";
import { ColDef } from "ag-grid-community";
import { GenderCellEditor, MoodRenderer } from "miroir-fwk/4_view/GenderCellEditor";

export function getColumnDefinitions(attributes:EntityAttribute[]):ColDef<any>[] {
  return attributes?.map(
    (a)=>{
      if (a.name == 'gender') {
        console.log('getColumnDefinitions column gender', a);
        
        return (
          {
            field: 'gender',
            cellRenderer: GenderCellRenderer,
            // cellRenderer: MoodRenderer,
            // cellEditor: 'agRichSelectCellEditor',
            // cellEditor: SelectEditor,
            cellEditor: GenderCellEditor,
            cellEditorPopup: true,
            editable:true
            // sort:'asc',
            // cellEditorParams: {
            //   values: ['Male', 'Female'],
            //   cellRenderer: GenderCellRenderer,
            //   // sort:(a,b)=>a >= b,
            //   cellEditorPopup: true,
            // },
          }
        );
      } else {
        return {
          "field": a?.name,
          "headerName": a?.defaultLabel,
          // "sort":'asc'

        }
      }
    }
  );
}