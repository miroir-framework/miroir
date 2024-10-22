import { ApplicationSection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityReport from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import entitySelfApplication from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
import entityMenu from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json';


import adminConfigurationDeploymentMiroir from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";

export const getApplicationSection = (deploymentUUid: string, entityUuid: string): ApplicationSection => {
  if (deploymentUUid == adminConfigurationDeploymentMiroir.uuid) {
    return entityUuid == entityEntity.uuid || entityUuid == entityEntityDefinition.uuid ? "model" : "data";
  } else {
    return entityUuid == entityEntity.uuid ||
      entityUuid == entityEntityDefinition.uuid ||
      entityUuid == entityReport.uuid ||
      entityUuid == entitySelfApplication.uuid ||
      entityUuid == entityMenu.uuid
      ? "model"
      : "data";
  }
};
