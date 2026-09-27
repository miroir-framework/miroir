// ################################################################################################
// The fetch of the outbound HTTP requests to external services (#330, analysis T9): the OpenAPI
// document of the connection wizard, OAuth2 tokens, operation calls. A Report test replaces it
// with the answers its suite declares, so the Report runs without a network.
// ################################################################################################

export type OutboundFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

let replacementFetch: OutboundFetch | undefined;

/** `fetch` for a request to an external service: the global `fetch` unless a test replaced it. */
export function outboundFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return (replacementFetch ?? globalThis.fetch)(input, init);
}

/** Replaces the fetch of the outbound requests; `undefined` restores the global `fetch`. */
export function setOutboundFetch(fetchReplacement: OutboundFetch | undefined): void {
  replacementFetch = fetchReplacement;
}
