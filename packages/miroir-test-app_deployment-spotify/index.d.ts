import type {
  EndpointDefinition,
  Entity,
  EntityInstance,
  Menu,
  MetaModel,
  MiroirModelEnvironment,
  Report,
  SelfApplication,
} from "miroir-core";
export declare const adminApplication_Spotify_DO_NOT_USE: any;
export declare const deployment_Spotify_DO_NO_USE: any;
export declare const selfApplicationSpotify: SelfApplication;
export declare const selfApplicationModelBranchSpotifyMasterBranch: any;
export declare const spotifyInitApplicationVersion: EntityInstance;
export declare const entitySpotifyPlaylist: Entity;
export declare const reportSpotifyPlaylist: Report;
export declare const querySpotifyGetPlaylist: any;
export declare const spotifyServiceEndpoint: EndpointDefinition;
export declare const menuDefaultSpotify: Menu;
export declare const defaultSpotifyAppModel: MetaModel;
export declare function getDefaultSpotifyModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  spotifyDeploymentUuid: string,
): MiroirModelEnvironment;
