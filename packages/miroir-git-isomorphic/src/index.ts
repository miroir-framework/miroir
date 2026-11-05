/**
 * #679: `GitRepositoryFactory` on isomorphic-git and the Node filesystem. Hosts load this module with a
 * dynamic `import()` registered on `ConfigurationService.registerGitRepositoryFactory`, never statically.
 */
import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

import {
  GitRepositoryError,
  type GitAheadBehind,
  type GitBranches,
  type GitCheckoutOutcome,
  type GitCommitSummary,
  type GitFileDiff,
  type GitFileStatus,
  type GitPerson,
  type GitRepositoryFactory,
  type GitRemoteOptions,
  type GitRepositoryInterface,
} from "@miroir-framework/core";

const DEFAULT_BRANCH = "main";

/** isomorphic-git errors carry their class name in `code`. */
function errorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? code : undefined;
}

/** Rethrows an isomorphic-git ref error as a `GitRepositoryError` the actions map to a reason. */
function asRepositoryError(error: unknown, ref: string): unknown {
  switch (errorCode(error)) {
    case "AlreadyExistsError":
      return new GitRepositoryError("branchExists", `A branch named ${ref} already exists`);
    case "InvalidRefNameError":
      return new GitRepositoryError("invalidRefName", `${ref} is not a valid branch name`);
    case "NotFoundError":
    case "CommitNotFetchedError":
      return new GitRepositoryError("unknownRevision", `Unknown revision ${ref}`);
    default:
      return error;
  }
}

/** Network failures of Node's HTTP client: the remote cannot be reached at all. */
const UNREACHABLE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ECONNABORTED",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  // TLS: the remote's certificate is not trusted
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

/** Rethrows an error of a remote operation as a `GitRepositoryError` the actions map to a reason. */
function asRemoteError(error: unknown, remote: string): unknown {
  const code = errorCode(error);
  const statusCode = (error as { data?: { statusCode?: unknown } } | undefined)?.data?.statusCode;
  if (code === "UserCanceledError" || (code === "HttpError" && (statusCode === 401 || statusCode === 403))) {
    return new GitRepositoryError("authenticationRequired", `The remote ${remote} refused the credentials`);
  }
  if (code === "HttpError" || code === "SmartHttpError" || (code !== undefined && UNREACHABLE_CODES.has(code))) {
    const detail = error instanceof Error ? error.message : String(error);
    return new GitRepositoryError("remoteUnreachable", `The remote ${remote} could not be reached: ${detail}`);
  }
  if (code === "PushRejectedError") {
    return new GitRepositoryError(
      "pushRejected",
      `The remote ${remote} has commits the branch does not have: pull first`,
    );
  }
  if (code === "GitPushError") {
    // the remote itself refused the update (a protected branch, a hook)
    const detail = error instanceof Error ? error.message : String(error);
    return new GitRepositoryError("pushRefused", `The remote ${remote} refused the push: ${detail}`);
  }
  return error;
}

/**
 * isomorphic-git asks `onAuth` on a first 401, `onAuthFailure` when the credentials it gave were refused:
 * with no credential, or a refused one, the operation stops (`UserCanceledError`) instead of retrying.
 */
function transport(options: GitRemoteOptions) {
  return {
    http,
    // the URL the actions checked and took the credential's host from: never a `pushurl` or a
    // `http.corsProxy` of the configuration, which would send the credential elsewhere
    url: options.url,
    corsProxy: "",
    onAuth: () => options.onAuth?.() ?? { cancel: true },
    onAuthFailure: () => ({ cancel: true }),
  };
}

function toPosix(relative: string): string {
  return relative.split(path.sep).join("/");
}

async function resolveOrUndefined(dir: string, ref: string): Promise<string | undefined> {
  try {
    return await git.resolveRef({ fs, dir, ref });
  } catch {
    return undefined;
  }
}

/** The commit a ref points at, peeling annotated tags. */
async function commitOf(dir: string, ref: string): Promise<string | undefined> {
  const oid = await resolveOrUndefined(dir, ref);
  if (!oid) {
    return undefined;
  }
  let commit = oid;
  try {
    commit = (await git.readTag({ fs, dir, oid })).tag.object;
  } catch {
    // not an annotated tag
  }
  // a full-length oid resolves as itself: it must name a commit of the repository
  try {
    await git.readCommit({ fs, dir, oid: commit });
    return commit;
  } catch {
    return undefined;
  }
}

/**
 * Maps one statusMatrix row ([path, head, workdir, stage]) to a changed file, or undefined when the file
 * is unchanged. head: 0 absent, 1 present. workdir: 0 absent, 1 same as HEAD, 2 different from HEAD.
 * stage: 0 absent, 1 same as HEAD, 2 same as workdir, 3 different from both.
 */
export function statusFromMatrixRow([filepath, head, workdir, stage]: [string, number, number, number]):
  | GitFileStatus
  | undefined {
  const staged = head === 0 ? stage !== 0 : stage !== 1;
  const unstaged = stage === 0 ? workdir !== 0 : stage === 1 ? workdir !== 1 : stage === 3;
  if (!staged && !unstaged) {
    return undefined;
  }
  const change: GitFileStatus["change"] =
    head === 0 ? "added" : workdir === 0 || stage === 0 ? "deleted" : "modified";
  return { path: filepath, change, staged, unstaged };
}

class IsomorphicGitRepository implements GitRepositoryInterface {
  constructor(public readonly root: string) {}

  async status(filepaths?: string[]): Promise<GitFileStatus[]> {
    const rows = await git.statusMatrix({ fs, dir: this.root, filepaths });
    return rows
      .map((row) => statusFromMatrixRow(row as [string, number, number, number]))
      .filter((status): status is GitFileStatus => status !== undefined);
  }

  async log(options: { ref?: string; depth?: number } = {}): Promise<GitCommitSummary[]> {
    const ref = options.ref ?? "HEAD";
    if (!(await resolveOrUndefined(this.root, ref))) {
      return [];
    }
    const [entries, refsByOid] = await Promise.all([
      git.log({ fs, dir: this.root, ref, depth: options.depth }),
      this.refsByOid(),
    ]);
    return entries.map((entry) => ({
      oid: entry.oid,
      parents: entry.commit.parent,
      message: entry.commit.message,
      author: {
        name: entry.commit.author.name,
        email: entry.commit.author.email,
        timestamp: entry.commit.author.timestamp,
      },
      refs: refsByOid.get(entry.oid) ?? [],
    }));
  }

  private async refsByOid(): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    const add = (oid: string | undefined, name: string) => {
      if (oid) {
        result.set(oid, [...(result.get(oid) ?? []), name]);
      }
    };
    add(await resolveOrUndefined(this.root, "HEAD"), "HEAD");
    for (const branch of await git.listBranches({ fs, dir: this.root })) {
      add(await resolveOrUndefined(this.root, `refs/heads/${branch}`), branch);
    }
    for (const { remote } of await git.listRemotes({ fs, dir: this.root })) {
      for (const branch of await git.listBranches({ fs, dir: this.root, remote })) {
        if (branch !== "HEAD") {
          add(await resolveOrUndefined(this.root, `refs/remotes/${remote}/${branch}`), `${remote}/${branch}`);
        }
      }
    }
    for (const tag of await git.listTags({ fs, dir: this.root })) {
      add(await commitOf(this.root, `refs/tags/${tag}`), `tag: ${tag}`);
    }
    return result;
  }

  async commitFiles(oid: string): Promise<string[]> {
    const { commit } = await git.readCommit({ fs, dir: this.root, oid });
    const parent = commit.parent[0];
    const trees = parent ? [git.TREE({ ref: parent }), git.TREE({ ref: oid })] : [git.TREE({ ref: oid })];
    const paths: string[] = await git.walk({
      fs,
      dir: this.root,
      trees,
      map: async (filepath, entries) => {
        if (filepath === ".") {
          return;
        }
        const [before, after] = parent ? entries : [null, entries[0]];
        const [beforeType, afterType] = [await before?.type(), await after?.type()];
        const [beforeOid, afterOid] = [await before?.oid(), await after?.oid()];
        if (beforeType === "tree" && afterType === "tree") {
          // an unchanged folder is not walked
          return beforeOid === afterOid ? null : undefined;
        }
        if (beforeType === "tree" || afterType === "tree") {
          // a file replaced by a folder, or the reverse: the file is listed, the folder walked
          return beforeType === "blob" || afterType === "blob" ? filepath : undefined;
        }
        return beforeOid === afterOid ? undefined : filepath;
      },
    });
    return paths.filter((filepath) => typeof filepath === "string");
  }

  async readFile(filepath: string, ref?: string): Promise<string | undefined> {
    if (!ref) {
      const absolute = this.workTreeFile(filepath);
      return absolute ? fs.readFileSync(absolute, "utf8") : undefined;
    }
    const oid = await commitOf(this.root, ref);
    if (!oid) {
      return undefined;
    }
    try {
      const { blob } = await git.readBlob({ fs, dir: this.root, oid, filepath });
      return Buffer.from(blob).toString("utf8");
    } catch {
      return undefined;
    }
  }

  /**
   * The absolute path of a work tree file, or undefined when it is absent, not a file, or (through `..`
   * or a symbolic link) outside the work tree or inside `.git`.
   */
  private workTreeFile(filepath: string): string | undefined {
    const absolute = path.resolve(this.root, filepath);
    if (!fs.existsSync(absolute)) {
      return undefined;
    }
    const real = fs.realpathSync(absolute);
    const relative = path.relative(fs.realpathSync(this.root), real);
    const segments = relative.split(path.sep);
    if (relative === "" || path.isAbsolute(relative) || segments[0] === ".." || segments[0].toLowerCase() === ".git") {
      return undefined;
    }
    return fs.statSync(real).isFile() ? real : undefined;
  }

  async diff(filepath: string, options: { from?: string; to?: string } = {}): Promise<GitFileDiff> {
    for (const ref of [options.from, options.to]) {
      if (ref !== undefined && !(await commitOf(this.root, ref))) {
        throw new Error(`Unknown revision ${ref}`);
      }
    }
    const [before, after] = await Promise.all([
      this.readFile(filepath, options.from ?? "HEAD"),
      this.readFile(filepath, options.to),
    ]);
    return { path: filepath, before, after };
  }

  async isIgnored(filepath: string): Promise<boolean> {
    return git.isIgnored({ fs, dir: this.root, filepath });
  }

  async stagedPaths(): Promise<string[]> {
    const head = await commitOf(this.root, "HEAD");
    if (!head) {
      return git.listFiles({ fs, dir: this.root });
    }
    // HEAD against the index only: no file of the work tree is read
    const paths: unknown[] = await git.walk({
      fs,
      dir: this.root,
      trees: [git.TREE({ ref: head }), git.STAGE()],
      map: async (filepath, [inHead, inStage]) => {
        if (filepath === ".") {
          return;
        }
        const [headType, stageType] = [await inHead?.type(), await inStage?.type()];
        const headBlob = headType === "blob" || headType === "commit" ? await inHead!.oid() : undefined;
        const stageBlob = stageType === "blob" || stageType === "commit" ? await inStage!.oid() : undefined;
        if (headBlob === undefined && stageBlob === undefined) {
          return; // two folders, or a folder on one side only: walked
        }
        return headBlob === stageBlob ? undefined : filepath;
      },
    });
    return paths.filter((filepath): filepath is string => typeof filepath === "string");
  }

  async stage(paths: string[]): Promise<void> {
    for (const filepath of paths) {
      if (fs.existsSync(path.join(this.root, filepath))) {
        // git.add follows symbolic links: a file reached through one out of the work tree is not staged
        if (!this.workTreeFile(filepath)) {
          throw new GitRepositoryError("outsideWorkTree", `${filepath} is not a file of the work tree`);
        }
        await git.add({ fs, dir: this.root, filepath });
      } else {
        await git.remove({ fs, dir: this.root, filepath });
      }
    }
  }

  async unstage(paths: string[]): Promise<void> {
    for (const filepath of paths) {
      await git.resetIndex({ fs, dir: this.root, filepath });
    }
  }

  async commit(message: string, author: GitPerson): Promise<string> {
    return git.commit({ fs, dir: this.root, message, author: { name: author.name, email: author.email } });
  }

  async getConfig(key: string): Promise<string | undefined> {
    const value = await git.getConfig({ fs, dir: this.root, path: key });
    return value === undefined || value === null ? undefined : String(value);
  }

  async setConfig(key: string, value: string): Promise<void> {
    await git.setConfig({ fs, dir: this.root, path: key, value });
  }

  async createBranch(name: string, startPoint?: string): Promise<void> {
    let object: string | undefined;
    if (startPoint !== undefined) {
      object = await commitOf(this.root, startPoint);
      if (!object) {
        throw new GitRepositoryError("unknownRevision", `Unknown revision ${startPoint}`);
      }
    }
    try {
      await git.branch({ fs, dir: this.root, ref: name, object, checkout: false });
    } catch (error) {
      throw asRepositoryError(error, name);
    }
  }

  async deleteBranch(name: string): Promise<void> {
    try {
      await git.deleteBranch({ fs, dir: this.root, ref: name });
    } catch (error) {
      throw asRepositoryError(error, name);
    }
  }

  async branchIsMergedIntoHead(name: string): Promise<boolean> {
    const [tip, head] = [await commitOf(this.root, `refs/heads/${name}`), await commitOf(this.root, "HEAD")];
    if (!tip || !head) {
      return tip === head;
    }
    return tip === head || git.isDescendent({ fs, dir: this.root, oid: head, ancestor: tip, depth: -1 });
  }

  async checkout(ref: string): Promise<GitCheckoutOutcome> {
    // a local branch is checked out as such; anything else that names a commit, as a detached HEAD; a name
    // only a remote has becomes a local branch tracking it
    const isLocalBranch = (await resolveOrUndefined(this.root, `refs/heads/${ref}`)) !== undefined;
    const commit = isLocalBranch ? undefined : await commitOf(this.root, ref);
    const target = isLocalBranch ? ref : (commit ?? ref);
    try {
      if (!isLocalBranch && !commit) {
        // git.checkout creates the tracking branch before it looks for conflicts: look first, on its commit
        const remoteCommit = await commitOf(this.root, `refs/remotes/origin/${ref}`);
        if (!remoteCommit) {
          throw new GitRepositoryError("unknownRevision", `Unknown revision ${ref}`);
        }
        await git.checkout({ fs, dir: this.root, ref: remoteCommit, dryRun: true });
      }
      await git.checkout({ fs, dir: this.root, ref: target });
      return { conflicts: [] };
    } catch (error) {
      if (errorCode(error) === "CheckoutConflictError") {
        return { conflicts: [...((error as { data?: { filepaths?: string[] } }).data?.filepaths ?? [])] };
      }
      throw asRepositoryError(error, ref);
    }
  }

  async remoteUrl(remote: string): Promise<string | undefined> {
    return this.getConfig(`remote.${remote}.url`);
  }

  async setRemote(remote: string, url: string): Promise<void> {
    await git.addRemote({ fs, dir: this.root, remote, url, force: true });
  }

  async fetch(options: GitRemoteOptions): Promise<void> {
    try {
      await git.fetch({ fs, dir: this.root, remote: options.remote, tags: true, ...transport(options) });
    } catch (error) {
      throw asRemoteError(error, options.remote);
    }
  }

  async upstream(branch: string): Promise<string | undefined> {
    const remote = await this.getConfig(`branch.${branch}.remote`);
    const merge = await this.getConfig(`branch.${branch}.merge`);
    if (!remote || !merge?.startsWith("refs/heads/")) {
      return undefined;
    }
    return `${remote}/${merge.slice("refs/heads/".length)}`;
  }

  /**
   * Walks both histories newest commit first, marking each commit with the side(s) it is reached from, and
   * stops once every commit left to walk is reached from both: what `git rev-list --left-right --count`
   * does, without walking the shared history.
   */
  async aheadBehind(local: string, upstream: string): Promise<GitAheadBehind> {
    const [localOid, upstreamOid] = [
      await commitOf(this.root, this.branchRef(local)),
      await commitOf(this.root, `refs/remotes/${upstream}`),
    ];
    if (!localOid || !upstreamOid) {
      throw new GitRepositoryError("unknownRevision", `Unknown revision ${!localOid ? local : upstream}`);
    }
    const LOCAL = 1;
    const UPSTREAM = 2;
    const BOTH = LOCAL | UPSTREAM;
    const flags = new Map<string, number>();
    const times = new Map<string, number>();
    const parents = new Map<string, string[]>();
    const read = async (oid: string) => {
      if (!times.has(oid)) {
        const { commit } = await git.readCommit({ fs, dir: this.root, oid });
        times.set(oid, commit.committer.timestamp);
        parents.set(oid, commit.parent);
      }
    };
    let queue: string[] = [];
    const mark = async (oid: string, flag: number) => {
      const previous = flags.get(oid) ?? 0;
      if ((previous | flag) !== previous) {
        flags.set(oid, previous | flag);
        await read(oid);
        queue.push(oid);
      }
    };
    await mark(localOid, LOCAL);
    await mark(upstreamOid, UPSTREAM);
    while (queue.some((oid) => flags.get(oid) !== BOTH)) {
      queue.sort((a, b) => times.get(a)! - times.get(b)!);
      const oid = queue.pop()!;
      queue = queue.filter((other) => other !== oid);
      for (const parent of parents.get(oid)!) {
        await mark(parent, flags.get(oid)!);
      }
    }
    // a commit walked from one side before the other side reached it (same timestamps, skewed clocks) is
    // shared all the same: the shared mark goes down to every walked ancestor
    const shared = queue.filter((oid) => flags.get(oid) === BOTH);
    while (shared.length > 0) {
      for (const parent of parents.get(shared.pop()!) ?? []) {
        if (flags.has(parent) && flags.get(parent) !== BOTH) {
          flags.set(parent, BOTH);
          shared.push(parent);
        }
      }
    }
    let ahead = 0;
    let behind = 0;
    for (const flag of flags.values()) {
      ahead += flag === LOCAL ? 1 : 0;
      behind += flag === UPSTREAM ? 1 : 0;
    }
    return { ahead, behind };
  }

  private branchRef(branch: string): string {
    return `refs/heads/${branch}`;
  }

  async fastForward(branch: string, upstream: string): Promise<GitCheckoutOutcome & { upToDate: boolean }> {
    const [current, target] = [
      await commitOf(this.root, this.branchRef(branch)),
      await commitOf(this.root, `refs/remotes/${upstream}`),
    ];
    if (!target) {
      throw new GitRepositoryError("unknownRevision", `Unknown revision ${upstream}`);
    }
    if (current === target) {
      return { conflicts: [], upToDate: true };
    }
    if (current) {
      if (await git.isDescendent({ fs, dir: this.root, oid: current, ancestor: target, depth: -1 })) {
        return { conflicts: [], upToDate: true }; // the branch is ahead: nothing to take
      }
      if (!(await git.isDescendent({ fs, dir: this.root, oid: target, ancestor: current, depth: -1 }))) {
        throw new GitRepositoryError(
          "notFastForward",
          `${branch} and ${upstream} have diverged: resolve them outside Miroir (merge or rebase), then pull again`,
        );
      }
    }
    try {
      // conflicts are looked for on the target before the branch moves
      await git.checkout({ fs, dir: this.root, ref: target, dryRun: true });
    } catch (error) {
      if (errorCode(error) === "CheckoutConflictError") {
        return { conflicts: [...((error as { data?: { filepaths?: string[] } }).data?.filepaths ?? [])], upToDate: false };
      }
      throw error;
    }
    // the files and the index first, HEAD left on the branch: if this fails, the branch has not moved
    await git.checkout({ fs, dir: this.root, ref: target, noUpdateHead: true });
    await git.writeRef({ fs, dir: this.root, ref: this.branchRef(branch), value: target, force: true });
    return { conflicts: [], upToDate: false };
  }

  async push(options: GitRemoteOptions & { branch: string }): Promise<void> {
    const upstream = await this.upstream(options.branch);
    const remoteBranch =
      upstream && upstream.startsWith(`${options.remote}/`) ? upstream.slice(options.remote.length + 1) : options.branch;
    try {
      await git.push({
        fs,
        dir: this.root,
        remote: options.remote,
        ref: options.branch,
        remoteRef: remoteBranch,
        ...transport(options),
      });
    } catch (error) {
      throw asRemoteError(error, options.remote);
    }
    if (!upstream) {
      await this.setConfig(`branch.${options.branch}.remote`, options.remote);
      await this.setConfig(`branch.${options.branch}.merge`, this.branchRef(options.branch));
    }
  }

  async branches(): Promise<GitBranches> {
    const current = await git.currentBranch({ fs, dir: this.root, fullname: false, test: true });
    const remotes = await git.listRemotes({ fs, dir: this.root });
    const remote: string[] = [];
    for (const { remote: name } of remotes) {
      for (const branch of await git.listBranches({ fs, dir: this.root, remote: name })) {
        if (branch !== "HEAD") {
          remote.push(`${name}/${branch}`);
        }
      }
    }
    return {
      current: current ?? undefined,
      head: await resolveOrUndefined(this.root, "HEAD"),
      local: await git.listBranches({ fs, dir: this.root }),
      remote,
      tags: await git.listTags({ fs, dir: this.root }),
    };
  }

  async listFiles(): Promise<string[]> {
    if (!(await commitOf(this.root, "HEAD"))) {
      return [];
    }
    return git.listFiles({ fs, dir: this.root, ref: "HEAD" });
  }
}

export function createGitRepositoryFactory(): GitRepositoryFactory {
  return {
    async findRoot(directory: string): Promise<string | undefined> {
      try {
        return await git.findRoot({ fs, filepath: path.resolve(directory) });
      } catch {
        return undefined;
      }
    },
    async open(root: string): Promise<GitRepositoryInterface> {
      return new IsomorphicGitRepository(path.resolve(root));
    },
    async init(directory: string): Promise<GitRepositoryInterface> {
      const root = path.resolve(directory);
      fs.mkdirSync(root, { recursive: true });
      await git.init({ fs, dir: root, defaultBranch: DEFAULT_BRANCH });
      return new IsomorphicGitRepository(root);
    },
    async clone(
      directory: string,
      options: GitRemoteOptions & { branch?: string },
    ): Promise<GitRepositoryInterface> {
      const root = path.resolve(directory);
      fs.mkdirSync(root, { recursive: true });
      try {
        await git.clone({
          fs,
          dir: root,
          remote: options.remote,
          ref: options.branch,
          singleBranch: false,
          ...transport(options),
        });
      } catch (error) {
        throw asRemoteError(error, options.remote);
      }
      return new IsomorphicGitRepository(root);
    },
    async directoryState(directory: string): Promise<"missing" | "empty" | "notEmpty" | "notAFolder"> {
      const absolute = path.resolve(directory);
      if (!fs.existsSync(absolute)) {
        return "missing";
      }
      if (!fs.statSync(absolute).isDirectory()) {
        return "notAFolder";
      }
      return fs.readdirSync(absolute).length === 0 ? "empty" : "notEmpty";
    },
    async removeDirectory(directory: string): Promise<void> {
      fs.rmSync(path.resolve(directory), { recursive: true, force: true });
    },
    resolvePath(base: string, relative: string): string {
      return path.resolve(base, relative);
    },
    relativePath(root: string, target: string): string | undefined {
      const relative = path.relative(path.resolve(root), path.resolve(target));
      if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
        return undefined;
      }
      return toPosix(relative);
    },
    commonDirectory(paths: string[]): string {
      const resolved = paths.map((p) => path.resolve(p));
      if (resolved.length === 1) {
        return path.dirname(resolved[0]);
      }
      let common = resolved[0];
      while (!resolved.every((p) => p === common || p.startsWith(common + path.sep))) {
        const parent = path.dirname(common);
        if (parent === common) {
          break;
        }
        common = parent;
      }
      return common;
    },
  };
}
