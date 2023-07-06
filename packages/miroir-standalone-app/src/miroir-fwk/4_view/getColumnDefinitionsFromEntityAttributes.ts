import { ColDef } from "ag-grid-community";

import entityPublisher from "assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityAuthor from "assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import { EntityAttribute, entityDefinitionEntityDefinitionAttributes2Type } from "miroir-core";
import { GenderCellEditor } from "miroir-fwk/4_view/GenderCellEditor";
import { DefaultCellRenderer, EntityInstanceCellRenderer, SelectEntityInstanceEditor } from "miroir-fwk/4_view/SelectEntityInstanceEditor";
import GenderCellRenderer from "./GenderCellRenderer";


export function getColumnDefinitionsFromEntityAttributesNew(attributes:entityDefinitionEntityDefinitionAttributes2Type[]):ColDef<any>[] {
  return attributes?.map(
    (a:entityDefinitionEntityDefinitionAttributes2Type)=>{
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
        case 'conceptLevel':{
          console.log('getColumnDefinitions column conceptLevel', a);
          return {
            "field": a?.name,
            "headerName": a?.defaultLabel,
          }
        }
        default: {
          return {
            "field": a?.name,
            cellRenderer: DefaultCellRenderer,
            cellRendererParams: {
              columnName: a?.name
            },
          "headerName": a?.defaultLabel,
            // "sort":'asc'
  
          }
          break;
        }
      }
    }
  );
}


export function getColumnDefinitionsFromEntityAttributes(attributes:EntityAttribute[]):ColDef<any>[] {
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
        case 'conceptLevel':{
          console.log('getColumnDefinitions column conceptLevel', a);
          return {
            "field": a?.name,
            "headerName": a?.defaultLabel,
          }
        }
        default: {
          return {
            "field": a?.name,
            cellRenderer: DefaultCellRenderer,
            cellRendererParams: {
              columnName: a?.name
            },
          "headerName": a?.defaultLabel,
            // "sort":'asc'
  
          }
          break;
        }
      }
    }
  );
}