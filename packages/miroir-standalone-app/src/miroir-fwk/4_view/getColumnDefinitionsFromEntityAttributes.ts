import { ColDef } from "ag-grid-community";

import { JzodElement } from "@miroir-framework/jzod-ts";

import { LoggerInterface, MiroirLoggerFactory, entityAuthor, entityPublisher, getLoggerName } from "miroir-core";

import { GenderCellEditor } from "../../miroir-fwk/4_view/GenderCellEditor";
import {
  DefaultCellRenderer2,
  EntityInstanceCellRenderer,
  SelectEntityInstanceEditor,
} from "../../miroir-fwk/4_view/SelectEntityInstanceEditor";
import GenderCellRenderer from "./GenderCellRenderer";
import { packageName } from "../../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"getColumnDefinitionsFromEntityDefinitionJzodElemenSchema");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export function getColumnDefinitionsFromEntityDefinitionJzodElemenSchema(name:string,jzodSchema: JzodElement): ColDef<any> {
  switch (name) {
    case "gender": {
      log.log("column gender", name, jzodSchema);

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
      log.log("column publisher", name, jzodSchema);

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
      log.log("column author", name, jzodSchema);

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
      log.log("column conceptLevel", name, jzodSchema);
      return {
        field: name,
        headerName: jzodSchema.extra?.defaultLabel?jzodSchema.extra?.defaultLabel:name,
      };
    }
    default: {
      log.log("column default", name, jzodSchema);
      return {
        field: name,
        cellRenderer: DefaultCellRenderer2,
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

export function getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(jzodSchema: JzodElement | undefined): ColDef<any>[] {
  switch (jzodSchema?.type) {
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
  //       log.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column gender", e);

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
  //       log.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column publisher", e);

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
  //       log.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column author", e);

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
  //       log.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column conceptLevel", e);
  //       return {
  //         field: e[1].name,
  //         headerName: e[1].extra?.defaultLabel?e[1].extra?.defaultLabel:e[1].name,
  //       };
  //     }
  //     default: {
  //       log.log("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column default", e);
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
