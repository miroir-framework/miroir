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

/** Gap A: CLI/Vitest runs isolated by default; embedded attaches to a live UI host. */
export type IntegrationTestHostMode = "isolated" | "embedded";

export type IntegrationTestSessionDescriptor = {
  kind: IntegrationTestSessionKind;
  bootstrapPhases: readonly IntegrationTestBootstrapPhase[];
  playfield: IntegrationTestPlayfield;
  /** Recommended host mode for this session kind (always `isolated` today). */
  defaultHostMode: IntegrationTestHostMode;
  /** Whether #197 UI may offer embedded execution against a live host stack. */
  embeddedCapable: boolean;
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

export function getDefaultHostModeForSessionKind(
  _kind: IntegrationTestSessionKind,
): IntegrationTestHostMode {
  return "isolated";
}

export function getEmbeddedCapableForSessionKind(
  kind: IntegrationTestSessionKind,
): boolean {
  switch (kind) {
    case "transformer":
      return false;
    case "appStackPsc":
    case "domainController":
    case "runner":
      return true;
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
      defaultHostMode: getDefaultHostModeForSessionKind(kind),
      embeddedCapable: getEmbeddedCapableForSessionKind(kind),
    };
  }
  return {
    kind,
    bootstrapPhases: getBootstrapPhasesForSessionKind(kind),
    playfield: getPlayfieldForSessionKind(kind),
    defaultHostMode: getDefaultHostModeForSessionKind(kind),
    embeddedCapable: getEmbeddedCapableForSessionKind(kind),
  };
}
