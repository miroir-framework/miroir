import { ColDef } from "ag-grid-community";

import entityPublisher from "assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityAuthor from "assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import { GenderCellEditor } from "miroir-fwk/4_view/GenderCellEditor";
import {
  DefaultCellRenderer,
  EntityInstanceCellRenderer,
  SelectEntityInstanceEditor,
} from "miroir-fwk/4_view/SelectEntityInstanceEditor";
import GenderCellRenderer from "./GenderCellRenderer";
import { JzodElement, JzodObject } from "@miroir-framework/jzod";

// export function getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(jzodSchema:JzodObject):ColDef<any>[] {

export function getColumnDefinitionsFromEntityDefinitionJzodElemenSchema(name:string,jzodSchema: JzodElement): ColDef<any> {
  switch (name) {
    case "gender": {
      console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column gender", name, jzodSchema);

      return ({
        field: "gender",
        cellRenderer: GenderCellRenderer,
        cellEditor: GenderCellEditor,
        cellEditorPopup: true,
        editable: true,
      });
      break;
    }
    case "publisher": {
      console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column publisher", name, jzodSchema);

      return {
        field: "publisher",
        cellRenderer: EntityInstanceCellRenderer,
        cellEditor: SelectEntityInstanceEditor,
        cellEditorPopup: true,
        editable: true,
        // sort:'asc',
        cellEditorParams: {
          entityUuid: entityPublisher.uuid,
        },
        cellRendererParams: {
          entityUuid: entityPublisher.uuid,
        },
      };
      break;
    }
    case "author": {
      console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column author", name, jzodSchema);

      return {
        field: "author",
        cellRenderer: EntityInstanceCellRenderer,
        cellEditor: SelectEntityInstanceEditor,
        cellEditorPopup: true,
        editable: true,
        // sort:'asc',
        cellEditorParams: {
          entityUuid: entityAuthor.uuid,
        },
        cellRendererParams: {
          entityUuid: entityAuthor.uuid,
        },
      };
      break;
    }
    case "conceptLevel": {
      console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column conceptLevel", name, jzodSchema);
      return {
        field: name,
        headerName: jzodSchema.extra?.defaultLabel?jzodSchema.extra?.defaultLabel:name,
      };
    }
    default: {
      console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column default", name, jzodSchema);
      return {
        field: name,
        cellRenderer: DefaultCellRenderer,
        cellRendererParams: {
          columnName: name,
        },
        headerName: jzodSchema.extra?.defaultLabel?jzodSchema.extra?.defaultLabel:name,
        // "sort":'asc'
      };
      break;
    }
  }
}

export function getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(jzodSchema: JzodElement): ColDef<any>[] {
  switch (jzodSchema.type) {
    case "object": {
      return Object.entries(jzodSchema.definition ? jzodSchema.definition : {})?.map((e: [string, any]) =>
        getColumnDefinitionsFromEntityDefinitionJzodElemenSchema(e[0], e[1])
      );
    }
    break;
  default: {
    return [];
    break;
  }
}
  // return Object.entries(jzodSchema.definition ? jzodSchema.definition : {})?.map((e: [string, any]) => {
  //   switch (e[0]) {
  //     case "gender": {
  //       console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column gender", e);

  //       return {
  //         field: "gender",
  //         cellRenderer: GenderCellRenderer,
  //         cellEditor: GenderCellEditor,
  //         cellEditorPopup: true,
  //         editable: true,
  //       };
  //       break;
  //     }
  //     case "publisher": {
  //       console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column publisher", e);

  //       return {
  //         field: "publisher",
  //         cellRenderer: EntityInstanceCellRenderer,
  //         cellEditor: SelectEntityInstanceEditor,
  //         cellEditorPopup: true,
  //         editable: true,
  //         // sort:'asc',
  //         cellEditorParams: {
  //           entityUuid: entityPublisher.uuid,
  //         },
  //         cellRendererParams: {
  //           entityUuid: entityPublisher.uuid,
  //         },
  //       };
  //       break;
  //     }
  //     case "author": {
  //       console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column author", e);

  //       return {
  //         field: "author",
  //         cellRenderer: EntityInstanceCellRenderer,
  //         cellEditor: SelectEntityInstanceEditor,
  //         cellEditorPopup: true,
  //         editable: true,
  //         // sort:'asc',
  //         cellEditorParams: {
  //           entityUuid: entityAuthor.uuid,
  //         },
  //         cellRendererParams: {
  //           entityUuid: entityAuthor.uuid,
  //         },
  //       };
  //       break;
  //     }
  //     case "conceptLevel": {
  //       console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column conceptLevel", e);
  //       return {
  //         field: e[1].name,
  //         headerName: e[1].extra?.defaultLabel?e[1].extra?.defaultLabel:e[1].name,
  //       };
  //     }
  //     default: {
  //       console.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column default", e);
  //       return {
  //         field: e[0],
  //         cellRenderer: DefaultCellRenderer,
  //         cellRendererParams: {
  //           columnName: e[0],
  //         },
  //         headerName: e[1].extra?.defaultLabel?e[1].extra?.defaultLabel:e[1].name,
  //         // "sort":'asc'
  //       };
  //       break;
  //     }
  //   }
  // });
}
