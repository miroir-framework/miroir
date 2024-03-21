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

export function getColumnDefinitionsFromEntityDefinitionJzodElemenSchema(
  name: string,
  jzodSchema: JzodElement
): ColDef<any> {
  switch (name) {
    case "gender": {
      log.info("column gender", name, jzodSchema);

      return {
        field: "gender",
        cellRenderer: GenderCellRenderer,
        cellEditor: GenderCellEditor,
        cellEditorPopup: true,
        editable: true,
      };
      break;
    }
    case "publisher": {
      log.info("column publisher", name, jzodSchema);

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
      log.info("column author", name, jzodSchema);

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
      log.info("column conceptLevel", name, jzodSchema);
      return {
        field: name,
        headerName: jzodSchema.extra?.defaultLabel ? jzodSchema.extra?.defaultLabel : name,
      };
    }
    default: {
      log.info("column default", name, jzodSchema);
      return {
        field: name,
        cellRenderer: DefaultCellRenderer2,
        cellRendererParams: {
          columnName: name,
        },
        headerName: jzodSchema.extra?.defaultLabel ? jzodSchema.extra?.defaultLabel : name,
        // "sort":'asc'
      };
      break;
    }
  }
}

export function getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
  jzodSchema: JzodElement | undefined,
  viewAttributes?: string[]
): ColDef<any>[] {
  switch (jzodSchema?.type) {
    case "object":
      {
        const schemaKeys = Object.keys(jzodSchema.definition)
        if (viewAttributes) {
          return viewAttributes
          .filter(
           (a:string) => [a, schemaKeys.find(b => b == a)]
          )
          .map(
            (a: string) => getColumnDefinitionsFromEntityDefinitionJzodElemenSchema(a, jzodSchema.definition[a])
          )
        } else {
          return Object.entries(jzodSchema.definition ? jzodSchema.definition : {})
            // ?.filter((e: [string, any]) => viewAttributes == undefined || viewAttributes.includes(e[0]))
            .map((e: [string, any]) => getColumnDefinitionsFromEntityDefinitionJzodElemenSchema(e[0], e[1]));
          
        }
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
  //       log.info("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column gender", e);

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
  //       log.info("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column publisher", e);

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
  //       log.info("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column author", e);

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
  //       log.info("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column conceptLevel", e);
  //       return {
  //         field: e[1].name,
  //         headerName: e[1].extra?.defaultLabel?e[1].extra?.defaultLabel:e[1].name,
  //       };
  //     }
  //     default: {
  //       log.info("getColumnDefinitionsFromEntityDefinitionJzodObjectSchema column default", e);
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
