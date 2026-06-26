export type IntegrationTestBootstrapPhase =
  | "registerStoreSections"
  | "wireEmulatedStack"
  | "deployMiroir"
  | "deployLibrary"
  | "resetMiroirModel";

export type IntegrationTestSessionKind =
  | "transformer"
  | "appStackPsc"
  | "domainController"
  | "runner";

export type DomainControllerSessionProfile = "miroirPlatform" | "miroirAndLibrary";

export type IntegrationTestPlayfield =
  | "none"
  | "testApplication"
  | "libraryDeployment";

export type IntegrationTestSessionDescriptor = {
  kind: IntegrationTestSessionKind;
  bootstrapPhases: readonly IntegrationTestBootstrapPhase[];
  playfield: IntegrationTestPlayfield;
};

export function getPlayfieldForSessionKind(
  kind: IntegrationTestSessionKind,
): IntegrationTestPlayfield {
  switch (kind) {
    case "transformer":
      return "testApplication";
    case "appStackPsc":
    case "runner":
      return "libraryDeployment";
    case "domainController":
      throw new Error(
        "getPlayfieldForSessionKind: use getPlayfieldForDomainControllerProfile for kind domainController",
      );
  }
}

export function getPlayfieldForDomainControllerProfile(
  profile: DomainControllerSessionProfile,
): IntegrationTestPlayfield {
  switch (profile) {
    case "miroirPlatform":
      return "none";
    case "miroirAndLibrary":
      return "libraryDeployment";
  }
}

export function getBootstrapPhasesForSessionKind(
  kind: IntegrationTestSessionKind,
): readonly IntegrationTestBootstrapPhase[] {
  switch (kind) {
    case "transformer":
      return [];
    case "appStackPsc":
      return ["wireEmulatedStack", "deployMiroir", "deployLibrary"];
    case "domainController":
      throw new Error(
        "getBootstrapPhasesForSessionKind: use getBootstrapPhasesForDomainControllerProfile for kind domainController",
      );
    case "runner":
      return ["wireEmulatedStack", "deployMiroir"];
  }
}

export function getBootstrapPhasesForDomainControllerProfile(
  profile: DomainControllerSessionProfile,
): readonly IntegrationTestBootstrapPhase[] {
  switch (profile) {
    case "miroirPlatform":
      return ["wireEmulatedStack", "deployMiroir", "resetMiroirModel"];
    case "miroirAndLibrary":
      return ["wireEmulatedStack", "deployMiroir", "deployLibrary"];
  }
}

export function describeIntegrationTestSession(
  kind: IntegrationTestSessionKind,
  domainControllerProfile?: DomainControllerSessionProfile,
): IntegrationTestSessionDescriptor {
  if (kind === "domainController") {
    if (!domainControllerProfile) {
      throw new Error(
        "describeIntegrationTestSession: domainControllerProfile is required when kind is domainController",
      );
    }
    return {
      kind,
      bootstrapPhases: getBootstrapPhasesForDomainControllerProfile(domainControllerProfile),
      playfield: getPlayfieldForDomainControllerProfile(domainControllerProfile),
    };
  }
  return {
    kind,
    bootstrapPhases: getBootstrapPhasesForSessionKind(kind),
    playfield: getPlayfieldForSessionKind(kind),
  };
}
