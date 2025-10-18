import { useEffect, useMemo } from 'react';

import {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  ExtractorRunnerParamsForJzodSchema,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryByQuery2GetParamJzodSchema,
  QueryRunnerMapForJzodSchema,
  RecordOfJzodObject,
  ReduxDeploymentsState
} from "miroir-core";



import { useMiroirContextService } from "../../MiroirContextReactProvider.js";
import { useReduxDeploymentsStateJzodSchemaSelector } from '../../ReduxHooks.js';
import { ThemedSpan } from '../Themes/index.js';
import { ReportSectionView } from './ReportSectionView.js';

import {
  getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap
} from "miroir-localcache-redux";
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { useDocumentOutlineContext } from '../ValueObjectEditor/InstanceEditorOutlineContext.js';
import { useQueryTemplateResults, type ReportViewProps } from './ReportHooks.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportView"), "UI",
).then((logger: LoggerInterface) => {log = logger});


// ###############################################################################################################
/**
 * It role is to gather the data that must be displayed by the potentially many sections of the report.
 * 
 * @param props 
 * @returns 
 */
export const ReportView = (props: ReportViewProps) => {
  // Track render counts with centralized tracker
  // Use deployment-level key to maintain consistency across all report navigation within same deployment
  const currentNavigationKey = `${props.deploymentUuid}-${props.applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportView", currentNavigationKey);

  // Get outline context and update data when query results change
  const outlineContext = useDocumentOutlineContext();

  // const paramsAsdomainElements: Domain2QueryReturnType<Record<string,any>> = props.pageParams;
  // log.info("########################## ReportView rendering", "navigationCount", navigationCount, "totalCount", totalCount);

  // log.info(
  //   "deploymentUuid",
  //   props.deploymentUuid,
  //   props.applicationSection,
  //   "paramsAsdomainElements",
  //   paramsAsdomainElements,
  //   "extractors",
  //   props.reportSection.extractors
  // );


  // log.info("deploymentEntityStateFetchQueryTemplateParams",deploymentEntityStateFetchQueryTemplateParams)


  const reportDataQueryBase:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = useMemo(
    () =>
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid
        ? props.reportDefinition.extractorTemplates
          ? {
              queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractorTemplates: props.reportDefinition.extractorTemplates,
              combinerTemplates: props.reportDefinition.combinerTemplates,
              runtimeTransformers: props.reportDefinition.runtimeTransformers,
            }
          : props.reportDefinition.extractors
          ? {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractors: props.reportDefinition.extractors,
              combiners: props.reportDefinition.combiners,
              runtimeTransformers: props.reportDefinition.runtimeTransformers,
            }
          : {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              deploymentUuid: "",
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractors: {},
            }
        : undefined,
    // [props.reportDefinition, props.pageParams, resolvedTemplateQuery]
    [props.reportDefinition, props.pageParams]
  );

  // const reportData: Domain2QueryReturnType<
  //   Domain2QueryReturnType<Record<string, any>>
  // > = useQueryTemplateResults(props);
  const reportDataQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults(props, reportDataQueryBase);

  if (reportDataQueryResults instanceof Domain2ElementFailed) { // should never happen
    throw new Error("ReportView: failed to get report data: " + JSON.stringify(reportDataQueryResults, null, 2));
  }
  const {reportData, resolvedQuery} = reportDataQueryResults;
  log.info("reportData", reportData);

  const reportViewData = useMemo(() => ({
    // return typeof reportData === "object" && !Array.isArray(reportData)
    // ? 
    // {
      ...reportData,
      reportData,
      storedQueryData: props.storedQueryData
    // }
    // }: reportData;
  }), [reportData, props.storedQueryData]);

  log.info("ReportView reportViewData", reportViewData);
  log.info("################################################################ Fecth NON-Template report schema");
  const jzodSchemaSelectorMap: QueryRunnerMapForJzodSchema<ReduxDeploymentsState> = useMemo(
    () => getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap(),
    []
  );


  const fetchedDataJzodSchemaParams: ExtractorRunnerParamsForJzodSchema<
    QueryByQuery2GetParamJzodSchema,
    ReduxDeploymentsState
  > = useMemo(
    () => ({
      extractorRunnerMap: jzodSchemaSelectorMap,
      query:
        props.pageParams.deploymentUuid &&
        props.pageParams.applicationSection &&
        props.pageParams.reportUuid &&
        props.reportDefinition.extractors &&
        reportDataQueryBase
          ? {
            queryType: "queryByTemplateGetParamJzodSchema",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: {
                applicationSection: props.pageParams.applicationSection,
                deploymentUuid: props.pageParams.deploymentUuid,
                instanceUuid: props.pageParams.instanceUuid ?? "",
              },
              queryParams: {},
              contextResults: {},
              // fetchParams: deploymentEntityStateFetchQueryParams.extractor,
              fetchParams: resolvedQuery,
            }
          : // dummy query
            {
              queryType: "queryByTemplateGetParamJzodSchema",
              deploymentUuid: "DUMMY",
              pageParams: {
                applicationSection: "data",
                deploymentUuid: "",
                instanceUuid: "",
              },
              queryParams: {},
              contextResults: {},
              fetchParams: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                deploymentUuid: "DUMMY",
                pageParams: props.pageParams,
                queryParams: {},
                contextResults: {},
                // extractorTemplates: {},
                extractors: {},
              } as BoxedQueryWithExtractorCombinerTransformer,
            },
    }),
    [jzodSchemaSelectorMap, props.pageParams, props.reportDefinition]
  );
  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useReduxDeploymentsStateJzodSchemaSelector(
    jzodSchemaSelectorMap.extractFetchQueryJzodSchema,
    fetchedDataJzodSchemaParams
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type

  // log.info(
  //   "ReportView found",
  //   "fetchedDataJzodSchema",
  //   fetchedDataJzodSchema,
  //   "fetchedDataJzodSchemaParams",
  //   fetchedDataJzodSchemaParams,
  //   "props.reportSection?.extractorTemplates",
  //   props.reportDefinition?.extractorTemplates,
  //   "props.reportSection?.combinerTemplates",
  //   props.reportDefinition?.combinerTemplates,
  //   "props.reportSection?.runtimeTransformers",
  //   props.reportDefinition?.runtimeTransformers,
  //   "deploymentEntityStateQueryResults",
  //   deploymentEntityStateQueryResults,
  // );
  // log.info("ReportView props.reportSection", props.reportDefinition);

  const outlineElement = useMemo(() => { // TODO: belongs to the outline!
    if (
      reportData &&
      reportData.elementType !== "failure"
    ) {
      if (Object.keys(reportData).length > 0) {
        const reportRootAttribute = (reportData as any)[
          Object.keys(reportData)[0]
        ];
    
        const outlineElement = {
          [reportRootAttribute.name ?? Object.keys(reportData)[0]]:
            reportRootAttribute,
        }
        return outlineElement;
      }
    }
  }, [reportData]);
  // Update outline data when query results change
  useEffect(() => {
    if (outlineElement) {
      outlineContext.setOutlineData(outlineElement);
    }
  }, [outlineElement, outlineContext]);

  const context = useMiroirContextService();
  const showPerformanceDisplay = context.showPerformanceDisplay;

  if (props.applicationSection) {
    return reportData.elementType == "failure" ? (
      <div>found query failure! {JSON.stringify(reportData, null, 2)}</div>
    ) : props.deploymentUuid ? (
      <>
        {showPerformanceDisplay && (
          <div>
            ReportView renders: {navigationCount} (total: {totalCount})
          </div>
        )}
        <ReportSectionView
          // reportData={reportData}
          reportData={reportViewData}
          fetchedDataJzodSchema={fetchedDataJzodSchema}
          reportSection={props.reportDefinition?.section}
          rootReport={props.reportDefinition}
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
          paramsAsdomainElements={props.pageParams}
          // Pass outline state down from context
          isOutlineOpen={outlineContext.isOutlineOpen}
          onToggleOutline={outlineContext.onToggleOutline}
        />
      </>
    ) : (
      <ThemedSpan style={{ color: "red" }}>no deployment found!</ThemedSpan>
    );
  } else {
    return <>RootReport Invalid props! {JSON.stringify(props)}</>;
  }
};
