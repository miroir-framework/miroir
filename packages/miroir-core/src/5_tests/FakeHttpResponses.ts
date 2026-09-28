import type { ReportTestFakeHttpResponse } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { OutboundFetch } from "../1_core/OutboundFetch.js";

// ################################################################################################
// The fake of the outbound fetch for a Report test (#330, analysis T9): it answers the requests
// its suite declares in `fakeHttpResponses` and refuses any other, recording it so the leaf can
// fail with its method and URL.
// ################################################################################################

export interface FakeOutboundFetch {
  fetch: OutboundFetch;
  /** The requests that had no declared answer, as `<METHOD> <url>`, in order. */
  undeclaredRequests: string[];
}

function requestMethodAndUrl(input: string | URL | Request, init?: RequestInit): { method: string; url: string } {
  if (typeof input === "string" || input instanceof URL) {
    return { method: (init?.method ?? "GET").toUpperCase(), url: String(input) };
  }
  return { method: (init?.method ?? input.method ?? "GET").toUpperCase(), url: input.url };
}

function responseOf(declared: ReportTestFakeHttpResponse): Response {
  const headers: Record<string, string> = { ...(declared.headers ?? {}) };
  let body: string | null = null;
  if (typeof declared.body === "string") {
    body = declared.body;
  } else if (declared.body !== undefined) {
    body = JSON.stringify(declared.body);
    if (!Object.keys(headers).some((name) => name.toLowerCase() === "content-type")) {
      headers["content-type"] = "application/json";
    }
  }
  return new Response(body, { status: declared.status ?? 200, headers });
}

/**
 * A fetch that answers each request whose method and URL match a declared response (the first
 * match), and rejects the others with an error naming them, which it also records.
 */
export function createFakeOutboundFetch(responses: readonly ReportTestFakeHttpResponse[]): FakeOutboundFetch {
  const undeclaredRequests: string[] = [];
  const fetch: OutboundFetch = async (input, init) => {
    const { method, url } = requestMethodAndUrl(input, init);
    const declared = responses.find(
      (response) => response.method.toUpperCase() === method && response.url === url,
    );
    if (!declared) {
      undeclaredRequests.push(`${method} ${url}`);
      throw new Error(`no fake HTTP response declared for ${method} ${url}`);
    }
    return responseOf(declared);
  };
  return { fetch, undeclaredRequests };
}
