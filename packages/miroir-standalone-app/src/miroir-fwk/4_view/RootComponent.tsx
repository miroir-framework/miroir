import { Box, Card, CardContent, CardHeader, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { ConfigurationService, DomainControllerInterface, EntityDefinition, entityEntity, entityReport, Instance, MiroirReport, reportEntityList, reportReportList } from "miroir-core";
import { useLocalCacheEntities, useLocalCacheReports, useLocalCacheTransactions } from "miroir-fwk/4_view/hooks";
import { useDomainControllerServiceHook, useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
import { ReduxStateChanges } from "miroir-redux";

import * as React from "react";
import { ReportComponent } from "./ReportComponent";

import entityAuthor from "assets/entities/Author.json";
import entityBook from "assets/entities/Book.json";
import author1 from "assets/instances/Author - Cornell Woolrich.json";
import author2 from "assets/instances/Author - Don Norman.json";
import author3 from "assets/instances/Author - Paul Veyne.json";
import book3 from "assets/instances/Book - Et dans l'éternité.json";
import book4 from "assets/instances/Book - Rear Window.json";
import book1 from "assets/instances/Book - The Bride Wore Black.json";
import book2 from "assets/instances/Book - The Design of Everyday Things.json";
import reportAuthorList from "assets/reports/AuthorList.json";
import reportBookList from "assets/reports/BookList.json";

export interface RootComponentProps {
  // store:any;
  reportName:string
}

function defaultToEntityList(value:string, miroirReports:MiroirReport[]):string {
  return value?value as string:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined)
}

// ###################################################################################
async function uploadConfiguration(domainController:DomainControllerInterface) {
  // USING DATA ACTIONS BECAUSE INITIAL, BOOTSTRAP ENTITIES CANNOT BE INSERTED TRANSACTIONALLY
  await domainController.handleDomainAction({
    actionName: "create",
    actionType:"DomainDataAction",
    objects: [
      {
        entity: "Entity",
        entityUuid:entityEntity.uuid,
        instances: [
          entityEntity as Instance,
          entityReport as Instance,
          // entityAuthor as Instance,
          // entityBook as Instance
        ],
      },
      {
        entity: "Report",
        entityUuid:entityReport.uuid,
        instances: [
          reportEntityList as Instance,
          reportReportList as Instance,
        ],
      },
    ],
  });
}

// ###################################################################################
async function uploadBooksAndReports(domainController:DomainControllerInterface) {
  // const updateEntitiesAction: DomainModelAction = ;
  await domainController.handleDomainAction({
    actionName: "create",
    actionType:"DomainModelAction",
    objects: [
      {
        entity: "Entity",
        instances: [
          entityAuthor as Instance,
          entityBook as Instance
        ],
      },
      {
        entity: "Report",
        instances: [
          reportAuthorList as Instance,
          reportBookList as Instance,
        ],
      },
    ],
  });
  await domainController.handleDomainAction({actionName: "commit",actionType:"DomainModelAction"});
  await domainController.handleDomainAction({
    actionName: "create",
    actionType:"DomainDataAction",
    objects: [
      {
        entity: "Author",
        instances: [
          author1 as Instance,
          author2 as Instance,
          author3 as Instance,
        ],
      },
      {
        entity: "Book",
        instances: [
          book1 as Instance,
          book2 as Instance,
          book3 as Instance,
          book4 as Instance,
        ],
      },
    ],
  });
  // await domainController.handleDomainAction({actionName: "commit",actionType:"DomainModelAction"});
}


export const RootComponent = (props:RootComponentProps) => {
  // const errorLog: ErrorLogServiceInterface = ErrorLogServiceCreator();
  const miroirReports:MiroirReport[] = useLocalCacheReports();
  const miroirEntities:EntityDefinition[] = useLocalCacheEntities();
  const transactions:ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogServiceHook();
  const domainController:DomainControllerInterface = useDomainControllerServiceHook();
  // const [displayedReportName, setDisplayedReportName] = React.useState('');
  const [displayedReportUuid, setDisplayedReportUuid] = React.useState('');


  const handleChange = (event: SelectChangeEvent) => {
    // setDisplayedReportName(event.target.value?event.target.value as string:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined));
    setDisplayedReportUuid(defaultToEntityList(event.target.value,miroirReports));
  };

  console.log("RootComponent miroirReports",miroirReports);

  // const {store} = props;
  return (
    <div>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction({
              actionName: "undo",
              actionType: "DomainModelAction",
            });
          }}
        >
          undo
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction({
              actionName: "redo",
              actionType: "DomainModelAction",
            });
          }}
        >
          Redo
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction({
              actionName: "commit",
              actionType: "DomainModelAction",
            });
          }}
        >
          Commit
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction({
              actionName: "replace",
              actionType: "DomainModelAction",
            });
          }}
        >
          Rollback
        </button>
      </span>
      <p />
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction({
              actionName: "resetModel",
              actionType: "DomainModelAction",
            });
          }}
        >
          Reset database
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction({
              actionName: "replace",
              actionType: "DomainModelAction",
            });
          }}
        >
          fetch Miroir & App configurations from database
        </button>
      </span>
      <p />
      <span>
        <button
          onClick={async () => {
            await uploadConfiguration(domainController);
          }}
        >
          upload Miroir configuration to database
        </button>
      </span>
      {/* <p/> */}
      <span>
        <button
          onClick={async () => {
            await uploadBooksAndReports(domainController);
          }}
        >
          upload App configuration to database
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              {
                actionName: "updateModel",
                actionType: "DomainModelAction",
                updates: [{updateActionType:"ModelStructureUpdate", updateActionName: "rename", entityName: entityBook.name, entityUuid: entityBook.uuid,targetValue:'Bookss' }],
              },
              {
                entities:miroirEntities,
                reports: miroirReports,
              }
            )
          }}
        >
          Modify Book entity name
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              {
                actionName: "update",
                actionType: 'DomainModelAction',
                objects: [
                  {
                    entity: reportReportList.entity,
                    entityUuid:reportReportList.entityUuid,
                    instances: [
                      Object.assign({},reportReportList,{"name":"Report2List", "defaultLabel": "Modified List of Reports"}) as Instance
                    ],
                  },
                ],
              },
              {
                entities:miroirEntities,
                reports: miroirReports,
              }
            )
          }}
        >
          Modify Report List name
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              {
                actionName: "delete",
                actionType: "DomainModelAction",
                objects: [{entity: entityAuthor.entity, entityUuid: entityAuthor.entityUuid,instances:[entityAuthor as Instance] }],
              },
              {
                entities:miroirEntities,
                reports: miroirReports,
              }
            )
          }}
        >
          Remove Author entity
        </button>
      </span>
      <p />
      <p />
     <span>transactions: {JSON.stringify(transactions)}</span>
      <p />
      {/* <span>cache size: {JSON.stringify(domainController.currentLocalCacheInfo())}</span> */}
      <p />
      <h3>
        {/* props: {JSON.stringify(props)} */}
        erreurs: {JSON.stringify(errorLog)}
      </h3>
      <span>
        packages: {JSON.stringify(ConfigurationService.packages)}
      </span>
      <p/>
      <Box sx={{ minWidth: 50 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Displayed Report</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            // value={displayedReportName?displayedReportName:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined)}
            // value={defaultToEntityList(displayedReportName,miroirReports)}
            value={displayedReportUuid}
            label="displayedReportUuid"
            onChange={handleChange}
          >
            {
              miroirReports.map(r=>{return <MenuItem key={r.name} value={r.uuid}>{r.defaultLabel}</MenuItem>})
            }
            {/* <MenuItem value='EntityList'>List of Entities</MenuItem> */}
            {/* <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem> */}
          </Select>
        </FormControl>
      </Box>
      <Card>
        <CardHeader>
          AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        </CardHeader>
        <CardContent>
          <ReportComponent
            // reportName={displayedReportUuid}
            reportUuid={displayedReportUuid}
            // reportName={props.reportName}
            // reportName="ReportList"
            // reportName="EntityList"
            // store={store}
          />
        </CardContent>
      </Card>
    </div>
  )
}