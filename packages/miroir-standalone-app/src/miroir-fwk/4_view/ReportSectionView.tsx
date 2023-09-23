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
  MiroirSelectorParams,
  ObjectListReportSection,
  ReportSection,
  SelectObjectInstanceQuery,
  SelectObjectListQuery,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel,
  selectEntityInstanceFromDomainState
} from "miroir-core";
import { ReduxStateWithUndoRedo, applyDomainStateSelector, selectEntityInstanceUuidIndexFromLocalCache, selectModelForDeployment } from "miroir-redux";

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
  fetchedData: Record<string,any>,
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


  // const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
  const currentModelSelectorParams:MiroirSelectorParams = useMemo(
    () => ({
      type: "DomainEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: applicationDeploymentLibrary.uuid,
      }
    } as MiroirSelectorParams),
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


  const currentMiroirReportSectionObjectList: ObjectListReportSection | undefined =
    props.reportSection?.type == "objectListReportSection"
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

  // props.reportSection?.fetchData

  const bookParams: MiroirSelectorParams = useMemo(()=>(
    {
      type: "EntityInstanceQueryParams",
      definition: {
        localCacheSelectorParams: {
          deploymentUuid: props.deploymentUuid,
          applicationSection: props.applicationSection as ApplicationSection,
          entityUuid: props.reportSection?.fetchData?.book.parentUuid??"",
          instanceUuid: (props.reportSection?.fetchData?.book as SelectObjectInstanceQuery)?.instanceUuid,
        },
        query: {
          type: "objectQuery",
          deploymentUuid: props.deploymentUuid,
          applicationSection: props.applicationSection as ApplicationSection,
          parentUuid: props.reportSection?.fetchData?.book.parentUuid??"",
          instanceUuid: (props.reportSection?.fetchData?.book as SelectObjectInstanceQuery)?.instanceUuid,
        }
      }
    }
  ),[props]);

  const book: EntityInstance | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectEntityInstanceFromDomainState)(state, bookParams)
  );

  console.log(
    "ReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    props.reportSection?.fetchData?.book.parentUuid,
    // "booksUuidIndex",
    // booksUuidIndex
  );

  const publisherParams: MiroirSelectorParams = useMemo(()=>(
    {
      type: "EntityInstanceQueryParams",
      definition: {
        localCacheSelectorParams: {
          deploymentUuid: props.deploymentUuid,
          applicationSection: props.applicationSection as ApplicationSection,
          entityUuid: props.reportSection?.fetchData?.publisher.parentUuid??"",
          instanceUuid: (props.reportSection?.fetchData?.publisher as SelectObjectInstanceQuery)?.rootObjectUuid??"",
        },
        query: {
          type: "objectQuery",
          deploymentUuid: props.deploymentUuid,
          applicationSection: props.applicationSection as ApplicationSection,
          parentUuid: props.reportSection?.fetchData?.publisher.parentUuid??"",
          instanceUuid: (props.reportSection?.fetchData?.publisher as SelectObjectInstanceQuery)?.rootObjectUuid??"",
        }
      }
    }
  ),[props]);

  const publisher: EntityInstance | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectEntityInstanceFromDomainState)(state, publisherParams)
  );

  const booksOfPublisherParams: MiroirSelectorParams = useMemo(() => ({
    type: "EntityInstanceListQueryParams",
    definition: {
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
    }
  }),[props.deploymentUuid, props.applicationSection,props.reportSection?.fetchData?.booksOfPublisher]);

  const booksOfPublisher: EntityInstancesUuidIndex | undefined = useEntityInstanceListQueryFromLocalCache(booksOfPublisherParams);
  
  const fetchedData: { [k: string]: any } = useMemo(
    () => ({
      book,
      booksOfPublisher,
      publisher,
      ...props.fetchedData,
    }),
    // [booksUuidIndex, publisher]
    // [booksUuidIndex, publisher, booksOfPublisher]
    // [props.fetchedData, booksUuidIndex, booksOfPublisher]
    // [props.fetchedData, book, booksOfPublisher]
    [props.fetchedData, book, publisher, booksOfPublisher]
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

  console.log("ReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData, "booksOfPublisher", booksOfPublisher);
  // console.log("ReportSectionView publishers", publishers, "publishersParams", publishersParams, "book", book);
  
  // const query: SelectObjectListQuery = useMemo(
  //   () => ({
  //     label
  //   })
  // ) 
  // console.log('EntityInstancePage instance',instance);
  console.log('ReportSectionView entityJzodSchema',entityJzodSchemaDefinition);
  console.log('ReportSectionView props.reportSection',props.reportSection);

  const evaluateExpression = (expression: string | undefined)=> {
    const parts = expression?.split(".");
    const object = Array.isArray(parts) && parts.length > 0?fetchedData[parts[0]]: undefined;
    const result = object && Array.isArray(parts) && parts.length > 1?object[parts[1]]: undefined;
    console.log("evaluateExpression",expression, parts, fetchedData, "object", object,"result",result);
    return result;
  }

  const interpolateExpression = (stringToInterpolate: string | undefined)=> {
    const reg = /\$\{([^}]*)\}/g
    const result = stringToInterpolate?stringToInterpolate.replace(reg,(expression, ...args)=>`${evaluateExpression(args[0])}`):"no string"
    console.log("interpolateExpression result",result);
    
    return result;
  }

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
                                    fetchedData={fetchedData}
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
              props.reportSection.type === "objectListReportSection" ? (
                <div>
                  {
                    currentReportTargetEntity &&
                    currentReportTargetEntityDefinition ?
                      <ReportSectionListDisplay
                        tableComponentReportType="EntityInstance"
                        label={"EntityInstance-" + currentReportTargetEntity?.name}
                        defaultlabel={interpolateExpression(props.reportSection.definition?.label)}
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
              props.reportSection.type === "objectInstanceReportSection" ? (
                <div>
                  <ReportSectionEntityInstance
                    fetchedData={fetchedData}
                    instance={fetchedData[props.reportSection.definition.fetchedDataReference??""]}
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
