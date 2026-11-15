/**
 * #708 part B: the states of an application's model. A model state is a `MetaModel` holding every
 * collection of the one list of core (`metaModelCollections`, analysis D7-a), whatever it is read from: the
 * live model, a frozen version, or the model files at a Git ref.
 */
import {
  Action2Error,
  buildMetaModelCollections,
  getApplicationSection,
  metaModelCollections,
  type ApplicationDeploymentMap,
  type DomainControllerActionHost,
  type EntityInstance,
  type MetaModel,
} from "@miroir-framework/core";

/** The model of an application at one point of its history, in the shape of its live model. */
export type ModelState = MetaModel;

/**
 * The live model of `application`: each collection read from the section where its Entity's rows are
 * (`model`, or `modelVersion` for the history), from the store of this process or from the server.
 */
export async function liveModelState(
  host: Pick<DomainControllerActionHost, "readSectionInstances">,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<ModelState | Action2Error> {
  const read = await Promise.all(
    metaModelCollections.map(({ entity }) =>
      host.readSectionInstances(
        application,
        applicationDeploymentMap,
        getApplicationSection(application, entity.uuid),
        entity.uuid,
      ),
    ),
  );
  const failed = read.find((rows): rows is Action2Error => rows instanceof Action2Error);
  if (failed) {
    return new Action2Error(
      "FailedToHandleAction",
      `liveModelState could not read the model of ${application}`,
      [],
      failed,
    );
  }
  const collections = buildMetaModelCollections((_entry, index) => read[index] as EntityInstance[]);
  return {
    applicationUuid: application,
    applicationName: collections.applications.find((row) => row.uuid === application)?.name ?? "",
    ...collections,
  };
}
