/**
 * #679 D22: a Git remote for the tests, over HTTP on a free local port: `git http-backend` (the CGI program
 * shipped with Git) serves the bare repositories of a temp folder. With `basicAuth`, every request without
 * those credentials gets 401, as a hosted remote asking for a token does.
 *
 * Needs the `git` program, for this server only: the code under test (isomorphic-git) does not.
 */
import { execFileSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";

export type GitHttpServer = {
  /** `http://127.0.0.1:<port>` */
  baseUrl: string;
  /** `127.0.0.1:<port>`: the host part of a credential name `git.<host>`. */
  host: string;
  /** Folder of the bare repositories; `<name>.git` is served at `<baseUrl>/<name>.git`. */
  root: string;
  /** Creates an empty bare repository, default branch `main`, and returns its URL. */
  createBareRepository: (name: string) => string;
  /** Requests seen, with the status answered: what a test checks to tell that a call reached the remote. */
  requests: { method: string; url: string; status: number }[];
  close: () => Promise<void>;
};

/** Undefined when the `git` program is missing, so a test can skip with that reason. */
export function gitProgramMissing(): string | undefined {
  const result = spawnSync("git", ["--version"], { encoding: "utf8" });
  return result.status === 0 ? undefined : "the git program is not on the PATH: the test Git server needs it";
}

/**
 * Runs the `git` program in `directory`, as another machine working on the remote would, with a fixed
 * author. Synchronous: give it the bare repository's folder (`root/<name>.git`), never the HTTP URL of
 * this process' own server, which could not answer while the call blocks.
 */
export function gitCli(directory: string, ...args: string[]): string {
  return execFileSync("git", ["-C", directory, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Other Machine",
      GIT_AUTHOR_EMAIL: "other@example.com",
      GIT_COMMITTER_NAME: "Other Machine",
      GIT_COMMITTER_EMAIL: "other@example.com",
    },
  }).trim();
}

/**
 * Another machine's work: clones the bare repository `bareDirectory` into a temp folder, writes `files`
 * (repository-relative path to text), commits them and pushes `branch`. Returns the new commit.
 */
export function commitOnRemote(
  bareDirectory: string,
  files: Record<string, string>,
  message: string,
  branch = "main",
): string {
  const clone = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-git679-other-"));
  try {
    gitCli(os.tmpdir(), "clone", "--quiet", "--branch", branch, bareDirectory, clone);
    for (const [filepath, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(clone, filepath)), { recursive: true });
      fs.writeFileSync(path.join(clone, filepath), text);
    }
    gitCli(clone, "add", "--all");
    gitCli(clone, "commit", "--quiet", "-m", message);
    gitCli(clone, "push", "--quiet", "origin", branch);
    return gitCli(clone, "rev-parse", "HEAD");
  } finally {
    fs.rmSync(clone, { recursive: true, force: true });
  }
}

export async function startGitHttpServer(options: { basicAuth?: { username: string; password: string } } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-git679-remote-"));
  const requests: GitHttpServer["requests"] = [];
  const expectedAuthorization = options.basicAuth
    ? `Basic ${Buffer.from(`${options.basicAuth.username}:${options.basicAuth.password}`).toString("base64")}`
    : undefined;

  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const record = (status: number) => requests.push({ method: request.method ?? "", url: url.pathname + url.search, status });
    if (expectedAuthorization && request.headers.authorization !== expectedAuthorization) {
      record(401);
      response.writeHead(401, { "WWW-Authenticate": 'Basic realm="miroir-test"' });
      response.end();
      return;
    }
    const backend = spawn("git", ["http-backend"], {
      env: {
        ...process.env,
        GIT_PROJECT_ROOT: root,
        GIT_HTTP_EXPORT_ALL: "1",
        PATH_INFO: decodeURIComponent(url.pathname),
        QUERY_STRING: url.search.slice(1),
        REQUEST_METHOD: request.method ?? "GET",
        CONTENT_TYPE: request.headers["content-type"] ?? "",
        CONTENT_LENGTH: request.headers["content-length"] ?? "",
        HTTP_CONTENT_ENCODING: String(request.headers["content-encoding"] ?? ""),
        GIT_HTTP_MAX_REQUEST_BUFFER: "100M",
        REMOTE_USER: options.basicAuth?.username ?? "",
        REMOTE_ADDR: "127.0.0.1",
      },
    });
    request.pipe(backend.stdin);
    // CGI output: headers, a blank line, then the body
    let buffered = Buffer.alloc(0);
    let headersSent = false;
    backend.stdout.on("data", (chunk: Buffer) => {
      if (headersSent) {
        response.write(chunk);
        return;
      }
      buffered = Buffer.concat([buffered, chunk]);
      const separator = buffered.indexOf("\r\n\r\n");
      if (separator < 0) {
        return;
      }
      const headerLines = buffered.subarray(0, separator).toString("utf8").split("\r\n");
      let status = 200;
      const headers: Record<string, string> = {};
      for (const line of headerLines) {
        const colon = line.indexOf(":");
        const name = line.slice(0, colon).trim();
        const value = line.slice(colon + 1).trim();
        if (name.toLowerCase() === "status") {
          status = Number.parseInt(value, 10);
        } else {
          headers[name] = value;
        }
      }
      record(status);
      response.writeHead(status, headers);
      response.write(buffered.subarray(separator + 4));
      headersSent = true;
    });
    backend.on("close", () => {
      if (!headersSent) {
        record(500);
        response.writeHead(500);
      }
      response.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;
  return {
    baseUrl,
    host: `127.0.0.1:${port}`,
    root,
    requests,
    createBareRepository(name: string): string {
      const directory = path.join(root, `${name}.git`);
      execFileSync("git", ["init", "--bare", "--initial-branch=main", directory], { stdio: "ignore" });
      // a push from the tests is accepted without a configured user
      execFileSync("git", ["-C", directory, "config", "http.receivepack", "true"], { stdio: "ignore" });
      return `${baseUrl}/${name}.git`;
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => {
          fs.rmSync(root, { recursive: true, force: true });
          resolve();
        });
      }),
  } satisfies GitHttpServer;
}
