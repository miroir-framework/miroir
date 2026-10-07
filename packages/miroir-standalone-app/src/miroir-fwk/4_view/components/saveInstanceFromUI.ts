import {
  getApplicationSection,
  type Action2Error,
  type ApplicationDeploymentMap,
  type ApplicationSection,
  type DomainControllerInterface,
  type MiroirModelEnvironment,
  type TransactionalInstanceAction,
  type Uuid,
} from "miroir-core";

// ################################################################################################
// #502, #505: an editor saves an instance of the edited application, a composite
// TransformerDefinition or a Runner, with createInstance or updateInstance. An instance of the
// model section goes through a transaction, which the user commits as any other model change.
// ################################################################################################

const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const TRANSACTIONAL_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

export type InstanceSaveResult =
  | { ok: true; applicationSection: ApplicationSection }
  | { ok: false; error: string };

export async function saveInstanceFromUI(
  domainController: DomainControllerInterface,
  params: {
    application: Uuid;
    applicationDeploymentMap: ApplicationDeploymentMap;
    modelEnvironment: MiroirModelEnvironment;
    instance: { uuid: Uuid; parentUuid: Uuid } & Record<string, unknown>;
    actionType: "createInstance" | "updateInstance";
  },
): Promise<InstanceSaveResult> {
  const applicationSection = getApplicationSection(params.application, params.instance.parentUuid);
  const instanceAction = {
    actionType: params.actionType,
    endpoint: INSTANCE_ENDPOINT,
    payload: { application: params.application, applicationSection, objects: [params.instance] },
  } as TransactionalInstanceAction["payload"]["instanceAction"];
  try {
    const result = await domainController.handleActionFromUI(
      applicationSection === "model"
        ? {
            actionType: "transactionalInstanceAction",
            endpoint: TRANSACTIONAL_ENDPOINT,
            payload: { application: params.application, instanceAction },
          }
        : instanceAction,
      params.applicationDeploymentMap,
      params.modelEnvironment,
    );
    if (result.status === "error") {
      const error = result as Action2Error;
      return { ok: false, error: error.errorMessage ?? error.errorType };
    }
    return { ok: true, applicationSection };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
