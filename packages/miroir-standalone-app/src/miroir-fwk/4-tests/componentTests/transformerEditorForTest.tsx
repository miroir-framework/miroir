import { defaultSelfApplicationDeploymentMap, type Uuid } from "miroir-core";

import { TransformerEditor } from "../../4_view/components/TransformerEditor/TransformerEditor.js";

// ################################################################################################
// The TransformerEditor of the declarative component tests (#406). The test wrapper's context
// holds the Miroir and Admin deployments (`defaultSelfApplicationDeploymentMap`), so `application`
// is one of them and its deployment is read from that map.
// ################################################################################################

export interface TransformerEditorForTestProps {
  application: Uuid;
  /** The entity of the editor's "instance" input mode. */
  entityUuid: Uuid;
}

export function TransformerEditorForTest(props: TransformerEditorForTestProps) {
  return (
    <TransformerEditor
      application={props.application}
      applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
      deploymentUuid={defaultSelfApplicationDeploymentMap[props.application]}
      entityUuid={props.entityUuid}
    />
  );
}
