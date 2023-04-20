import { EntityAttribute } from "miroir-core";
import GenderCellRenderer from "./GenderCellRenderer";
import { ColDef } from "ag-grid-community";
import { GenderCellEditor } from "miroir-fwk/4_view/GenderCellEditor";
import { EntityInstanceCellRenderer, SelectEntityInstanceEditor } from "miroir-fwk/4_view/SelectEntityInstanceEditor";
import entityPublisher from "assets/entities/EntityPublisher.json";
import entityAuthor from "assets/entities/EntityAuthor.json";

export function getColumnDefinitions(attributes:EntityAttribute[]):ColDef<any>[] {
  return attributes?.map(
    (a)=>{
      switch (a.name) {
        case 'gender':{
          console.log('getColumnDefinitions column gender', a);
        
          return (
            {
              field: 'gender',
              cellRenderer: GenderCellRenderer,
              cellEditor: GenderCellEditor,
              cellEditorPopup: true,
              editable:true
            }
          );
          break;
        }
        case 'publisher':{
          console.log('getColumnDefinitions column publisher', a);
        
          return (
            {
              field: 'publisher',
              cellRenderer: EntityInstanceCellRenderer,
              cellEditor: SelectEntityInstanceEditor,
              cellEditorPopup: true,
              editable:true,
              // sort:'asc',
              cellEditorParams: {
                entityUuid: entityPublisher.uuid
              },
              cellRendererParams: {
                entityUuid: entityPublisher.uuid
              },
            }
          );
          break;
        }
        case 'author':{
          console.log('getColumnDefinitions column author', a);
        
          return (
            {
              field: 'author',
              cellRenderer: EntityInstanceCellRenderer,
              cellEditor: SelectEntityInstanceEditor,
              cellEditorPopup: true,
              editable:true,
              // sort:'asc',
              cellEditorParams: {
                entityUuid: entityAuthor.uuid
              },
              cellRendererParams: {
                entityUuid: entityAuthor.uuid
              },
            }
          );
          break;
        }
        default: {
          return {
            "field": a?.name,
            "headerName": a?.defaultLabel,
            // "sort":'asc'
  
          }
          break;
        }
      }
      if (a.name == 'gender') {
      } else {
      }
    }
  );
}