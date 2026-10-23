import { defaultSelfApplicationDeploymentMap, type Uuid } from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { TransformerEditor } from "../../4_view/components/TransformerEditor/TransformerEditor.js";

// ################################################################################################
// The TransformerEditor of the declarative component tests (#406). The test wrapper's context
// holds the Miroir and Admin deployments (`defaultSelfApplicationDeploymentMap`), and the Library
// for a suite that wires the local cache (#502), so `application` is one of them and its
// deployment is read from the context's map.
// ################################################################################################

export interface TransformerEditorForTestProps {
  application: Uuid;
  /** The entity of the editor's "instance" input mode. */
  entityUuid: Uuid;
}

export function TransformerEditorForTest(props: TransformerEditorForTestProps) {
  const applicationDeploymentMap =
    useMiroirContextService().applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  return (
    <TransformerEditor
      application={props.application}
      applicationDeploymentMap={applicationDeploymentMap}
      deploymentUuid={applicationDeploymentMap[props.application]}
      entityUuid={props.entityUuid}
    />
  );
}
