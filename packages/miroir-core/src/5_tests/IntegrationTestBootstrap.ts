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

export type IntegrationTestSessionDescriptor = {
  kind: IntegrationTestSessionKind;
  bootstrapPhases: readonly IntegrationTestBootstrapPhase[];
};

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
    };
  }
  return {
    kind,
    bootstrapPhases: getBootstrapPhasesForSessionKind(kind),
  };
}
