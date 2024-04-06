import {
  getLocalCacheIndexDeploymentSection,
  getLocalCacheIndexDeploymentUuid,
  getLocalCacheIndexEntityUuid,
  getLocalCacheKeysDeploymentSectionEntitiesList,
  getLocalCacheKeysDeploymentSectionList,
  getDeploymentUuidListFromLocalCacheKeys,
  getLocalCacheKeysForDeploymentSection,
  getLocalCacheKeysForDeploymentUuid,
  localCacheStateToDomainState,
} from "../dist/src/4_services/localCache/LocalCacheSlice";
// import { LocalCacheSliceState } from "../src/4_services/localCache/localCacheReduxSliceInterface";
import { LocalCacheSliceState } from "../dist/src/4_services/localCache/localCacheReduxSliceInterface";


// ################################################################################################
// ################################################################################################
//  DATA
import sliceStateReference from "./localCacheReference.json";
import domainStateReference from "./domainStateReference.json";

// ################################################################################################

describe("localCacheSlice.unit.test", () => {

  // ##############################################################################################
  it("getLocalCacheIndexEntityUuid", () => {
    expect(
      getLocalCacheIndexEntityUuid("10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad")
    ).toEqual("16dbfe28-e1d7-4f20-9ba4-c1a9873202ad");
  });

  // ##############################################################################################
  it("getLocalCacheIndexDeploymentUuid", () => {
    expect(
      getLocalCacheIndexDeploymentUuid(
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
      )
    ).toEqual("10ff36f2-50a3-48d8-b80f-e48e5d13af8e");
  });

  // ##############################################################################################
  it("getLocalCacheIndexDeploymentSection", () => {
    expect(
      getLocalCacheIndexDeploymentSection(
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
      )
    ).toEqual("model");
  });

  // ##############################################################################################
  it("getLocalCacheKeysForDeploymentUuid", () => {
    const result = getLocalCacheKeysForDeploymentUuid(
      Object.keys(sliceStateReference),
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e"
    );
    // console.log("keys",Object.keys(exampleSliceState));
    // console.log("result",result);

    expect(result).toEqual([
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_35c5608a-7678-4f07-a4ec-76fc5bc35424",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_5e81e1b9-38be-487c-b3e5-53796c57fccf",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_7990c0c9-86c3-40a1-a121-036c91b55ed7",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_8bec933d-6287-4de7-8a88-5c24216de9f4",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_a659d350-dd97-4da9-91de-524fa01745dc",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
    ]);
  });

  // ##############################################################################################
  it("getLocalCacheKeysForDeploymentSection", () => {
    const result = getLocalCacheKeysForDeploymentSection(Object.keys(sliceStateReference), "model");
    // console.log("keys",Object.keys(exampleSliceState));
    // console.log("result",result);

    expect(result).toEqual([
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_a659d350-dd97-4da9-91de-524fa01745dc",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_35c5608a-7678-4f07-a4ec-76fc5bc35424",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_7990c0c9-86c3-40a1-a121-036c91b55ed7",
    ]);
  });

  // ##############################################################################################
  it("getLocalCacheKeysDeploymentUuidList", () => {
    const result = getDeploymentUuidListFromLocalCacheKeys(Object.keys(sliceStateReference));
    // console.log("keys",Object.keys(exampleSliceState));
    // console.log("result",result);

    expect(result).toEqual(["10ff36f2-50a3-48d8-b80f-e48e5d13af8e", "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"]);
  });

  // ##############################################################################################
  it("getLocalCacheKeysDeploymentSectionList", () => {
    const result = getLocalCacheKeysDeploymentSectionList(
      Object.keys(sliceStateReference),
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
    );
    // console.log("keys",Object.keys(exampleSliceState));
    // console.log("result",result);

    expect(result).toEqual(["model", "data"]);
  });

  // ##############################################################################################
  it("getLocalCacheKeysDeploymentSectionEntitiesList", () => {
    const result = getLocalCacheKeysDeploymentSectionEntitiesList(
      Object.keys(sliceStateReference),
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      "model"
    );
    // console.log("keys",Object.keys(exampleSliceState));
    console.log("result", result);

    expect(result).toEqual([
      "a659d350-dd97-4da9-91de-524fa01745dc",
      "35c5608a-7678-4f07-a4ec-76fc5bc35424",
      "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
      "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
      "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      "7990c0c9-86c3-40a1-a121-036c91b55ed7",
    ]);
  });

  // ##############################################################################################
  it("localCacheStateToDomainState", () => {
    const result = localCacheStateToDomainState(sliceStateReference as LocalCacheSliceState);
    // console.log("keys",Object.keys(exampleSliceState));
    // console.log("exampleSliceState",JSON.stringify(exampleSliceState));
    // console.log("result",JSON.stringify(result));

    expect(result).toEqual(domainStateReference);
  });
});
