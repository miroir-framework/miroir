import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";

export type RecordedExternalServiceRequest = {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
};

export type FakeExternalServiceFixture = {
  status?: number;
  /** JSON-serialized unless `rawBody` is set. */
  body?: unknown;
  /** Sent as-is (for invalid-JSON / non-JSON D12 cases). */
  rawBody?: string;
  contentType?: string;
  /** Optional pause before responding (loading-state tests). */
  delayMs?: number;
};

export type FakeExternalServiceServer = {
  baseUrl: string;
  port: number;
  receivedRequests: RecordedExternalServiceRequest[];
  setFixture: (method: string, path: string, fixture: FakeExternalServiceFixture) => void;
  close: () => Promise<void>;
};

function requestPath(req: IncomingMessage): string {
  const host = req.headers.host ?? "127.0.0.1";
  const url = new URL(req.url ?? "/", `http://${host}`);
  return url.pathname;
}

function headerRecord(req: IncomingMessage): Record<string, string | string[] | undefined> {
  return { ...req.headers };
}

function writeCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

function writeFixtureResponse(res: ServerResponse, fixture: FakeExternalServiceFixture): void {
  res.statusCode = fixture.status ?? 200;
  res.setHeader("Content-Type", fixture.contentType ?? "application/json");
  if (fixture.rawBody !== undefined) {
    res.end(fixture.rawBody);
    return;
  }
  res.end(JSON.stringify(fixture.body ?? {}));
}

/**
 * Local HTTP fake for outbound external-service calls (issue #267).
 * Binds an ephemeral port (`listen(0)`). Tests assert recorded requests.
 */
export async function startFakeExternalServiceServer(
  initialFixtures: Record<string, FakeExternalServiceFixture> = {},
): Promise<FakeExternalServiceServer> {
  const fixtures = new Map<string, FakeExternalServiceFixture>(Object.entries(initialFixtures));
  const receivedRequests: RecordedExternalServiceRequest[] = [];

  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const method = (req.method ?? "GET").toUpperCase();
    const path = requestPath(req);
    writeCorsHeaders(res);
    // happy-dom fetch issues a CORS preflight; do not count it as an API request.
    if (method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    receivedRequests.push({
      method,
      path,
      headers: headerRecord(req),
    });
    const fixture = fixtures.get(`${method} ${path}`) ?? fixtures.get(path);
    if (!fixture) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: { status: 404, message: `No fixture for ${method} ${path}` } }));
      return;
    }
    if (fixture.delayMs && fixture.delayMs > 0) {
      setTimeout(() => writeFixtureResponse(res, fixture), fixture.delayMs);
      return;
    }
    writeFixtureResponse(res, fixture);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("fakeExternalServiceServer failed to bind an ephemeral TCP port");
  }

  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    port,
    receivedRequests,
    setFixture(method: string, path: string, fixture: FakeExternalServiceFixture) {
      fixtures.set(`${method.toUpperCase()} ${path}`, fixture);
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
