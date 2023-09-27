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
  MiroirQuery,
  MiroirSelectorParams,
  ObjectListReportSection,
  ReportSection,
  RootReportSection,
  SelectObjectInstanceQuery,
  SelectObjectListQuery,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel,
  selectEntityInstanceFromDomainState,
  selectEntityInstanceUuidIndexFromDomainState
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
import { ReportSectionView } from './ReportSectionView';

export interface ReportSectionEntityInstanceProps {
  fetchedData: Record<string,any>,
  // reportSection: ReportSection | undefined,
  reportSection: RootReportSection | undefined,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid: Uuid,
}

// ###############################################################################################################
export const RootReportSectionView = (props: ReportSectionEntityInstanceProps) => {
  const errorLog = useErrorLogService();

  console.log("########################## RootReportSectionView ReportSection", props.reportSection);

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
  console.log("RootReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);
  // const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
  //   displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || props.applicationSection == "model"
  //     ? (applicationDeploymentMiroir as ApplicationDeployment)
  //     : displayedDeploymentDefinition;
  // const currentModel =
  //   props.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  
  // const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
  //   currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
  // console.log(
  //   "RootReportSectionView currentReportDefinitionDeployment",
  //   currentReportDefinitionDeployment,
  //   "currentReportDefinitionApplicationSection",
  //   currentReportDefinitionApplicationSection
  // );

  // const currentReportDeploymentSectionEntities: MetaEntity[] = currentModel.entities; // Entities are always defined in the 'model' section
  // const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section


  // const currentMiroirReportSectionObjectList: ObjectListReportSection | undefined =
  //   props.reportSection?.section?.type == "objectListReportSection"
  //     ? props.reportSection.section
  //     : undefined
  // ;

  // console.log("RootReportSectionView currentMiroirReportSectionObjectList", currentMiroirReportSectionObjectList);
  // console.log("RootReportSectionView currentReportDeploymentSectionEntities", currentReportDeploymentSectionEntities);

  const bookParams: MiroirSelectorParams = useMemo(()=>(
    {
      type: "EntityInstanceQueryParams",
      definition: {
        localCacheSelectorParams: {
          deploymentUuid: props.deploymentUuid,
          applicationSection: props.applicationSection as ApplicationSection,
          entityUuid: props.reportSection?.fetchData?.book?.parentUuid??"",
          instanceUuid: (props.reportSection?.fetchData?.book as SelectObjectInstanceQuery)?.instanceUuid,
        },
        query: {
          type: "objectQuery",
          deploymentUuid: props.deploymentUuid,
          applicationSection: props.applicationSection as ApplicationSection,
          parentUuid: props.reportSection?.fetchData?.book?.parentUuid??"",
          instanceUuid: (props.reportSection?.fetchData?.book as SelectObjectInstanceQuery)?.instanceUuid,
        }
      }
    }
  ),[props]);

  const book: EntityInstance | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectEntityInstanceFromDomainState)(state, bookParams)
  );

  console.log(
    "RootReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    props.reportSection?.fetchData?.book?.parentUuid,
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
          entityUuid: props.reportSection?.fetchData?.publisher?.parentUuid??"",
          instanceUuid: (props.reportSection?.fetchData?.publisher as SelectObjectInstanceQuery)?.rootObjectUuid??"",
        },
        query: {
          type: "objectQuery",
          deploymentUuid: props.deploymentUuid,
          applicationSection: props.applicationSection as ApplicationSection,
          parentUuid: props.reportSection?.fetchData?.publisher?.parentUuid??"",
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
  
  const booksParams: MiroirSelectorParams = useMemo(() => ({
    type: "EntityInstanceListQueryParams",
    definition: {
      localCacheSelectorParams: {
        deploymentUuid: props.deploymentUuid,
        applicationSection: props.applicationSection,
        entityUuid: props.reportSection?.fetchData?.books?.parentUuid,
      },
      query: (props.reportSection?.fetchData?.books as SelectObjectListQuery) ?? {
        type: "objectListQuery",
        parentUuid: "",
        parentName: undefined,
        rootObjectAttribute: undefined,
        rootObjectUuid: undefined,
      },
    }
  }),[props.deploymentUuid, props.applicationSection,props.reportSection?.fetchData?.booksOfPublisher]);

  // const books: EntityInstancesUuidIndex | undefined = useEntityInstanceListQueryFromLocalCache(booksParams);
  const books: EntityInstancesUuidIndex | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectEntityInstanceUuidIndexFromDomainState)(state, booksParams)
  );


  
  // const fechedDataEntries = Object.entries(props.reportSection?.fetchData??{}).map(
  //   (e: [string,MiroirQuery]) => {
  //     let result;
  //     switch (e[0]) {
  //       case "booksOfPublisherParams":
          
  //         break;
      
  //       default:
  //         break;
  //     }
  //     return [e, result]
  //   }
  // );

  const fetchedData: { [k: string]: any } = useMemo(
    () => ({
      books,
      book,
      booksOfPublisher,
      publisher,
      ...props.fetchedData,
    }),
    // [booksUuidIndex, publisher]
    // [booksUuidIndex, publisher, booksOfPublisher]
    // [props.fetchedData, booksUuidIndex, booksOfPublisher]
    // [props.fetchedData, book, booksOfPublisher]
    [props.fetchedData, books, book, publisher, booksOfPublisher]
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

  console.log("RootReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData, "booksOfPublisher", booksOfPublisher);
  // console.log("RootReportSectionView publishers", publishers, "publishersParams", publishersParams, "book", book);
  
  // console.log('RootReportSectionView entityJzodSchema',entityJzodSchemaDefinition);
  console.log('RootReportSectionView props.reportSection',props.reportSection);

  if (props.applicationSection) {
    return (
      <div>
        <ReportSectionView
          fetchedData={fetchedData}
          reportSection={props.reportSection?.section}
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
          instanceUuid={props.instanceUuid}

        />
      </div>
    );
  } else {
    return (
      <>
        RootReportSection Invalid props! {JSON.stringify(props)}
      </>
    )
  }
};
