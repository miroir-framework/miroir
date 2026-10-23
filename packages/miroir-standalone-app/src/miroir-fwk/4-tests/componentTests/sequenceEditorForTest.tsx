import {
  defaultSelfApplicationDeploymentMap,
  type ApplicationSection,
  type LocalCacheExtractor,
  type Uuid,
} from "miroir-core";
import { useMiroirContextService } from "miroir-react";
import React, { useMemo } from "react";

import { SequenceEditor } from "../../4_view/components/SequenceEditor/SequenceEditor.js";
import { useEntityInstanceUuidIndexFromLocalCache } from "../../4_view/ReduxHooks.js";

// ################################################################################################
// The SequenceEditor of the declarative component tests (#505), on an application of the test
// wrapper's context (the Library, for a suite that wires the local cache). The names of the
// instances of `watchedEntityUuid` are listed, one `sequence-editor-watched:<name>` each, to see
// what a run of a Runner created.
// ################################################################################################

export interface SequenceEditorForTestProps {
  application: Uuid;
  watchedEntityUuid?: Uuid;
  watchedApplicationSection?: ApplicationSection;
}

export function SequenceEditorForTest(props: SequenceEditorForTestProps) {
  const applicationDeploymentMap =
    useMiroirContextService().applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  return (
    <>
      {props.watchedEntityUuid && (
        <WatchedInstances
          application={props.application}
          applicationSection={props.watchedApplicationSection ?? "data"}
          entityUuid={props.watchedEntityUuid}
          applicationDeploymentMap={applicationDeploymentMap}
        />
      )}
      <SequenceEditor
        application={props.application}
        applicationDeploymentMap={applicationDeploymentMap}
        deploymentUuid={applicationDeploymentMap[props.application]}
      />
    </>
  );
}

function WatchedInstances(props: {
  application: Uuid;
  applicationSection: ApplicationSection;
  entityUuid: Uuid;
  applicationDeploymentMap: Record<Uuid, Uuid>;
}) {
  const extractor = useMemo(
    (): LocalCacheExtractor => ({
      queryType: "localCacheEntityInstancesExtractor",
      definition: { application: props.application, applicationSection: props.applicationSection, entityUuid: props.entityUuid },
    }),
    [props.application, props.applicationSection, props.entityUuid],
  );
  const index = useEntityInstanceUuidIndexFromLocalCache(extractor, props.applicationDeploymentMap);
  const names = Object.values(index ?? {})
    .map((instance) => String((instance as { name?: unknown }).name))
    .sort();
  return (
    <ul data-testid="sequence-editor-watched" data-names={JSON.stringify(names)} hidden>
      {names.map((name, index) => (
        <li key={index} data-testid={`sequence-editor-watched:${name}`}>
          {name}
        </li>
      ))}
    </ul>
  );
}
