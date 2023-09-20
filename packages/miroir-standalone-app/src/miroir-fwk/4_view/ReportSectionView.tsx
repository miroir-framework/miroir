import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  MetaEntity,
  MiroirApplicationModel,
  ObjectList,
  ReportSection,
  SelectObjectListQuery,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import { ReduxStateWithUndoRedo, selectEntityInstanceUuidIndexFromLocalCache, selectModelForDeployment } from "miroir-redux";

import {
  useErrorLogService
} from "miroir-fwk/4_view/MiroirContextReactProvider";


import {
  EntityInstanceUuidIndexSelectorParams,
  useCurrentModel,
  useEntityInstanceListQueryFromLocalCache,
  useEntityInstanceUuidIndexFromLocalCache
} from "./ReduxHooks";
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance';
import { ReportSectionListDisplay } from './ReportSectionListDisplay';

export interface ReportSectionEntityInstanceProps {
  reportSection: ReportSection | undefined,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid: Uuid,
}

// ###############################################################################################################
export const ReportSectionView = (props: ReportSectionEntityInstanceProps) => {
  const errorLog = useErrorLogService();

  console.log("########################## ReportSectionView ReportSection", props.reportSection);

  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];


  const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
    () => ({
      deploymentUuid: applicationDeploymentLibrary.uuid,
    } as EntityInstanceUuidIndexSelectorParams),
    [applicationDeploymentLibrary.uuid]
  );

  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const libraryAppModel: MiroirApplicationModel = useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, currentModelSelectorParams)
  ) as MiroirApplicationModel;

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeployment | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  console.log("ReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || props.applicationSection == "model"
      ? (applicationDeploymentMiroir as ApplicationDeployment)
      : displayedDeploymentDefinition;
  const currentModel =
    props.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  
  const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
    currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
  console.log(
    "ReportSectionView currentReportDefinitionDeployment",
    currentReportDefinitionDeployment,
    "currentReportDefinitionApplicationSection",
    currentReportDefinitionApplicationSection
  );

  // const deploymentReports: Report[] = currentModel.reports;
  const currentReportDeploymentSectionEntities: MetaEntity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section


  const currentMiroirReportSectionObjectList: ObjectList | undefined =
    props.reportSection?.type == "objectList"
      ? props.reportSection
      : undefined
  ;

  console.log("ReportSectionView currentMiroirReportSectionObjectList", currentMiroirReportSectionObjectList);
  console.log("ReportSectionView currentReportDeploymentSectionEntities", currentReportDeploymentSectionEntities);

  const currentReportTargetEntity: MetaEntity | undefined = currentMiroirReportSectionObjectList?.definition?.parentUuid
    ? currentReportDeploymentSectionEntities?.find(
        (e) => e?.uuid === currentMiroirReportSectionObjectList?.definition?.parentUuid
      )
    : undefined;

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  // const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  // const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver = useMemo(
  //   () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
  //   [currentMiroirModel]
  // );

  const styles = useMemo(()=>({
    height: "280px",
    width: "90vw",
  }),[])

  props.reportSection?.fetchData

  const booksUuidIndexParams = useMemo(()=>(
    {
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection as ApplicationSection,
      entityUuid: props.reportSection?.fetchData?.books.parentUuid,
    }
  ),[props]);

  // const booksUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(booksUuidIndexParams);
  const booksUuidIndex: EntityInstancesUuidIndex | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, booksUuidIndexParams)
  );

  console.log("ReportSectionView", "deploymentUuid", props.deploymentUuid, props.applicationSection, props.reportSection?.fetchData?.books.parentUuid, "booksUuidIndex", booksUuidIndex);
  
  const book:EntityInstance | undefined = booksUuidIndex && props.instanceUuid?booksUuidIndex[props.instanceUuid]:undefined;
  // const instance:any = booksUuidIndex && props.reportSection?.fetchData?.books.rootObjectUuid?booksUuidIndex[props.reportSection?.fetchData?.books.rootObjectUuid]:undefined;

  const publishersParams = useMemo(
    () => ({
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection,
      entityUuid: props.reportSection?.fetchData?.publisher.parentUuid,
    }),
    [props.deploymentUuid, props.applicationSection, props.reportSection?.fetchData?.publisher.parentUuid]
  );

  const publishers: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    publishersParams
  )

  const publisher = book && publishers?publishers[(book as any)["publisher"]??""]:undefined;



//   const booksOfPublisher: EntityInstancesUuidIndex | undefined = useSelector((state: ReduxStateWithUndoRedo) => {
//     const booksUuidIndex = selectEntityInstanceUuidIndexFromLocalCache(state, booksUuidIndexParams)

//     // const result = Object.fromEntries(
//     //   Object.entries(booksUuidIndex ?? {}).filter(
//     //     (i: [string, EntityInstance]) =>
//     //       (i[1] as any)[props.reportSection?.fetchData?.booksOfPublisher?.rootObjectAttribute ?? "dummy"] ==
//     //       publisher?.uuid
//     //   )
//     // );
//     // const result = useMemo(()=>Object.fromEntries(
//     //     Object.entries(booksUuidIndex ?? {})
//     //     // .filter(
//     //     //   (i: [string, EntityInstance]) =>
//     //     //     (i[1] as any)[props.reportSection?.fetchData?.booksOfPublisher?.rootObjectAttribute ?? "dummy"] ==
//     //     //     publisher?.uuid
//     //     // )
//     //   ),[booksUuidIndex])
//     // ;
//     const result = Object.fromEntries(
//         Object.entries(booksUuidIndex ?? {})
//         // .filter(
//         //   (i: [string, EntityInstance]) =>
//         //     (i[1] as any)[props.reportSection?.fetchData?.booksOfPublisher?.rootObjectAttribute ?? "dummy"] ==
//         //     publisher?.uuid
//         // )
//       )
//     ;
//     // const result = useMemo(
//     //   () => {
//     //     return Object.fromEntries(
//     //       Object.entries(booksUuidIndex ?? {})
//     //       // .filter(
//     //       //   (i: [string, EntityInstance]) =>
//     //       //     (i[1] as any)[props.reportSection?.fetchData?.booksOfPublisher?.rootObjectAttribute ?? "dummy"] ==
//     //       //     publisher?.uuid
//     //       // )
//     //     )
//     //   },
//     //   [booksUuidIndexParams]
//     // );
//     return result;
//   }
// );

  const booksOfPublisherParams = useMemo(() => ({
    localCacheSelectorParams: {
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection,
      entityUuid: props.reportSection?.fetchData?.booksOfPublisher?.parentUuid,
    },
    query: (props.reportSection?.fetchData?.booksOfPublisher as SelectObjectListQuery) ?? {
      type: "objectListQuery",
      parentUuid: "",
      parentName: undefined,
      rootObjectAttribute: undefined,
      rootObjectUuid: undefined,
    },
  }),[props.deploymentUuid, props.applicationSection,props.reportSection?.fetchData?.booksOfPublisher]);

  const booksOfPublisher: EntityInstancesUuidIndex | undefined = useEntityInstanceListQueryFromLocalCache(booksOfPublisherParams);
  
  // const booksOfPublisher: EntityInstancesUuidIndex | undefined = useMemo(()=>Object.fromEntries(
  //   Object.entries(booksUuidIndex ?? {}).filter(
  //     (i: [string, EntityInstance]) =>
  //       (i[1] as any)[props.reportSection?.fetchData?.booksOfPublisher?.rootObjectAttribute ?? "dummy"] == publisher?.uuid
  //   )
  // ), [booksUuidIndex]);

  const fetchedData: { [k: string]: any } = useMemo(
    () => ({
      books: booksUuidIndex,
      publisher,
      booksOfPublisher,
    }),
    // [booksUuidIndex, publisher]
    [booksUuidIndex, publisher, booksOfPublisher]
  );
      // const publisher = 
  // const publishers: EntityInstancesUuidIndex | undefined = useEntityInstanceListQueryFromLocalCache(
  //   {
  //     localCacheSelectorParams: {
  //       deploymentUuid: props.deploymentUuid,
  //       applicationSection: props.applicationSection,
  //       entityUuid: props.reportSection?.fetchData?.publisher.parentUuid,
  //     },
  //     query: (props.reportSection?.fetchData?.publisher as SelectObjectListQuery)??{
  //       type: "objectListQuery",
  //       parentUuid: '',
  //       parentName: undefined,
  //       rootObjectAttribute: undefined,
  //       rootObjectUuid: undefined
  //     }
  //   }
  // )

  console.log("ReportSectionView fetchedData", fetchedData, "booksUuidIndex", booksUuidIndex);
  // console.log("ReportSectionView publishers", publishers, "publishersParams", publishersParams, "book", book);
  
  // const query: SelectObjectListQuery = useMemo(
  //   () => ({
  //     label
  //   })
  // ) 
  // console.log('EntityInstancePage instance',instance);
  console.log('ReportSectionView entityJzodSchema',entityJzodSchemaDefinition);
  console.log('ReportSectionView props.reportSection',props.reportSection);
  
  if (props.applicationSection) {
    return (
      <div>
        {/* params:{JSON.stringify(params)}
        <p /> */}
        {/* <p>ReportSection</p> */}
        {
          props.applicationSection &&
          props.reportSection
          ? (
          <div>
            {
              props.reportSection.type === "grid" ? (
                <div>
                  <table>
                    <tbody>
                      <tr>
                        <td>
                          grid not supported yet!
                        </td>
                      </tr>
                      {/* {
                        props.reportSection.definition.map(
                          (reportSection, index) => {
                            return (
                              <tr key={index}>
                                <td>
                                  <ReportSection
                                    deploymentUuid={props.deploymentUuid}
                                    applicationSection={props.applicationSection}
                                    reportSection={reportSection}
                                    instanceUuid={props.instanceUuid}
                                  />
                                </td>
                              </tr>
                            )
                          }
                        )
                      } */}
                    </tbody>
                  </table>
                </div>
              ) : (
                // <div>Not a list!!</div>
                <div></div>
              )
            }
            {
              props.reportSection.type === "list" ? (
                <div>
                  <table>
                    <tbody>
                      {
                        props.reportSection.definition.map(
                          (reportSection, index) => {
                            return (
                              <tr key={index}>
                                <td>
                                  <ReportSectionView
                                    deploymentUuid={props.deploymentUuid}
                                    applicationSection={props.applicationSection}
                                    reportSection={reportSection}
                                    instanceUuid={props.instanceUuid}
                                  />
                                </td>
                              </tr>
                            )
                          }
                        )
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                // <div>Not a list!!</div>
                <div></div>
              )
            }
            {
              props.reportSection.type === "objectList" ? (
                <div>
                  {
                    currentReportTargetEntity &&
                    currentReportTargetEntityDefinition ?
                      <ReportSectionListDisplay
                        tableComponentReportType="EntityInstance"
                        label={"EntityInstance-" + currentReportTargetEntity?.name}
                        styles={styles}
                        chosenApplicationSection={props.applicationSection as ApplicationSection}
                        displayedDeploymentDefinition={displayedDeploymentDefinition}
                        fetchedData={fetchedData}
                        select={props.reportSection.definition}
                        currentModel={currentModel}
                        currentMiroirReportSectionObjectList={props.reportSection}
                        currentMiroirEntity={currentReportTargetEntity}
                        currentMiroirEntityDefinition={currentReportTargetEntityDefinition}
                      />
                    :
                    <div>error on object list {JSON.stringify(currentReportTargetEntity)}</div>
                  }
               </div>
              ) : <div></div>
            }
            {
              props.reportSection.type === "objectInstance" ? (
                <div>
                  <ReportSectionEntityInstance
                    applicationSection={props.applicationSection as ApplicationSection}
                    deploymentUuid={props.deploymentUuid}
                    entityUuid={props.reportSection.definition.parentUuid}
                    instanceUuid={props.instanceUuid}
                  />
               </div>
              ) : <div></div>
            }
          </div>
        ) : (
          <div>Oops.</div>
        )}
      </div>
    );
  } else {
    return (
      <>
        ReportSection Invalid props! {JSON.stringify(props)}
      </>
    )
  }
};
