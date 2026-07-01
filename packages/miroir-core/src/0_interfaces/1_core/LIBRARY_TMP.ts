export const lendingEndpointUuid = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";
export const selfApplicationLibraryUuid = "5af03c98-fe5e-490b-b08f-e1230971c57f";

// deployment_Library_DO_NO_USE, selfApplicationLibrary
export const LIBRARY_TMP = {
  lendingEndpointUuid,
  selfApplicationLibraryUuid,
  deployment_Library_DO_NO_USE: {
    "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
    "parentName":"Deployment",
    "parentUuid":"7959d814-400c-4e80-988f-a00fe582ab98",
    "name":"LibraryApplicationFilesystemDeployment",
    "defaultLabel":"LibraryApplicationFilesystemDeployment",
    "selfApplication":"5af03c98-fe5e-490b-b08f-e1230971c57f",
    "description": "The default Filesystem Deployment for SelfApplication Library",
    "configuration": {
      "admin": {
        "emulatedServerType": "filesystem",
        "directory":"miroir-core/src/assets/admin"
      },
      "model": {
        "emulatedServerType": "filesystem",
        "directory":"miroir-test-app_deployment-library/assets/library_model"
      },
      "data": {
        "emulatedServerType": "filesystem",
        "directory":"miroir-test-app_deployment-library/assets/library_data"
      }
    }
  }
   
};