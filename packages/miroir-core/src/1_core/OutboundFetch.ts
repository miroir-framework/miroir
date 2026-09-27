// ################################################################################################
// The fetch of the outbound HTTP requests to external services (#330, analysis T9): the OpenAPI
// document of the connection wizard, OAuth2 tokens, operation calls. Each DomainController sends
// them through its own fetch: a Report test replaces the fetch of its session's controller with
// the answers its suite declares, so the Report runs without a network while the other
// controllers of the process keep the global `fetch`.
// ################################################################################################

export type OutboundFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/** The default fetch of the outbound requests: the global `fetch`. */
export function outboundFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init);
}
