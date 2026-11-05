/**
 * #679: `GitRepositoryFactory` on isomorphic-git and the Node filesystem. Hosts load this module with a
 * dynamic `import()` registered on `ConfigurationService.registerGitRepositoryFactory`, never statically.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import git, { type FsClient, type PromiseFsClient } from "isomorphic-git";
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
  type GitRevertOutcome,
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

/** What every isomorphic-git call of a repository takes: its filesystem and its work tree. */
type GitDir = { fs: FsClient; dir: string };

/**
 * #689: the paths of a linked worktree's gitdir that are shared by all the worktrees, in the common
 * directory (git's `common_list`, path.c), and the exceptions below them that stay the worktree's own. Any
 * other path (HEAD, index, ORIG_HEAD, FETCH_HEAD, …) is the worktree's own.
 */
const COMMON_PATHS = [
  "branches",
  "common",
  "config",
  "hooks",
  "info",
  "logs",
  "lost-found",
  "objects",
  "packed-refs",
  "refs",
  "remotes",
  "rr-cache",
  "shallow",
  "svn",
  "worktrees",
];
const WORKTREE_PATHS = [
  "info/sparse-checkout",
  "logs/HEAD",
  "logs/refs/bisect",
  "logs/refs/rewritten",
  "logs/refs/worktree",
  "refs/bisect",
  "refs/rewritten",
  "refs/worktree",
];

function isUnder(relative: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => relative === prefix || relative.startsWith(prefix + "/"));
}

/** Whether a path relative to a worktree's gitdir is in the common directory. Exported for tests. */
export function isCommonGitPath(relative: string): boolean {
  return !isUnder(relative, WORKTREE_PATHS) && isUnder(relative, COMMON_PATHS);
}

function isTrue(value: string | undefined): boolean {
  return value !== undefined && ["true", "yes", "on", "1"].includes(value.toLowerCase());
}

/**
 * #690: the system and global configuration files git reads before the repository's own, in that order
 * (git-config(1), FILES), found with no Git binary: the system file is looked for where the usual
 * installations put it. Exported for tests.
 */
export function inheritedConfigFiles(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string[] {
  const files: string[] = [];
  if (!isTrue(env.GIT_CONFIG_NOSYSTEM)) {
    if (env.GIT_CONFIG_SYSTEM !== undefined) {
      files.push(env.GIT_CONFIG_SYSTEM);
    } else if (platform === "win32") {
      // Git for Windows reads ProgramData's file before the one of its installation
      for (const [variable, ...rest] of [
        ["ProgramData", "Git", "config"],
        ["ProgramFiles", "Git", "etc", "gitconfig"],
        ["ProgramFiles(x86)", "Git", "etc", "gitconfig"],
      ]) {
        const base = env[variable];
        if (base) {
          files.push(path.join(base, ...rest));
        }
      }
    } else {
      files.push("/etc/gitconfig", "/usr/local/etc/gitconfig", "/opt/homebrew/etc/gitconfig");
    }
  }
  if (env.GIT_CONFIG_GLOBAL !== undefined) {
    files.push(env.GIT_CONFIG_GLOBAL);
  } else {
    const home = env.HOME || os.homedir();
    files.push(
      env.XDG_CONFIG_HOME ? path.join(env.XDG_CONFIG_HOME, "git", "config") : path.join(home, ".config", "git", "config"),
      path.join(home, ".gitconfig"),
    );
  }
  return files.filter((file) => file !== "");
}

/**
 * The last value of `name` in the `[section]` of a git configuration text, or undefined when it has none.
 * A key with no `=` is true. Subsections and `[include]` are not followed. Exported for tests.
 */
export function gitConfigValue(text: string, section: string, name: string): string | undefined {
  let current: string | undefined;
  let value: string | undefined;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";")) {
      continue;
    }
    const header = /^\[\s*([A-Za-z0-9.-]+)\s*("[^"]*")?\s*\]/.exec(line);
    if (header) {
      current = header[2] === undefined ? header[1].toLowerCase() : undefined;
      continue;
    }
    if (current !== section) {
      continue;
    }
    const entry = /^([A-Za-z][A-Za-z0-9-]*)\s*(?:=\s*(.*))?$/.exec(line);
    if (entry && entry[1].toLowerCase() === name) {
      value = entry[2] === undefined ? "true" : unquoteConfigValue(entry[2]);
    }
  }
  return value;
}

/** A configuration value without its trailing comment and its quotes. */
function unquoteConfigValue(raw: string): string {
  let value = "";
  let quoted = false;
  for (const character of raw) {
    if (character === '"') {
      quoted = !quoted;
    } else if (!quoted && (character === "#" || character === ";")) {
      break;
    } else {
      value += character;
    }
  }
  return value.trim();
}

/**
 * #690: `core.autocrlf` as the system and global configurations set it, the later file winning: true for
 * `true` and `input`, which mean the same when Git reads the work tree (CRLF becomes LF), and nothing here
 * converts on checkout.
 */
function inheritedAutocrlf(): boolean {
  let value: string | undefined;
  for (const file of inheritedConfigFiles()) {
    try {
      value = gitConfigValue(fs.readFileSync(file, "utf8"), "core", "autocrlf") ?? value;
    } catch {
      // no such file
    }
  }
  return value !== undefined && (value.toLowerCase() === "input" || isTrue(value));
}

/**
 * A work-tree file's content as git stores it with `core.autocrlf`: CRLF becomes LF, byte for byte, unless
 * the file looks binary to git (a NUL, or a CR alone). Exported for tests.
 *
 * isomorphic-git's own conversion (a repository whose `config` sets `core.autocrlf true`) goes through a
 * `TextDecoder` that drops a UTF-8 BOM, so a file starting with one never matches its blob.
 */
export function withLfLineEndings(content: Buffer): Buffer {
  if (content.indexOf(0) !== -1 || content.indexOf("\r\n") === -1) {
    return content;
  }
  const lf = Buffer.from(content.toString("latin1").replace(/\r\n/g, "\n"), "latin1");
  return lf.indexOf("\r") === -1 ? lf : content;
}

/** Where a repository's git files are: its gitdir, and the common directory of a linked worktree. */
type GitdirLayout = { gitdir: string; commonDirectory?: string };

function gitdirLayout(root: string): GitdirLayout | undefined {
  const dotgit = path.join(root, ".git");
  try {
    if (fs.statSync(dotgit).isDirectory()) {
      return { gitdir: dotgit };
    }
    const gitdirLine = /^gitdir:\s*(.+)$/m.exec(fs.readFileSync(dotgit, "utf8"));
    if (!gitdirLine) {
      return undefined;
    }
    const gitdir = path.resolve(root, gitdirLine[1].trim());
    const commondirFile = path.join(gitdir, "commondir");
    // a submodule has no commondir: its gitdir holds everything
    return fs.existsSync(commondirFile)
      ? { gitdir, commonDirectory: path.resolve(gitdir, fs.readFileSync(commondirFile, "utf8").trim()) }
      : { gitdir };
  } catch {
    return undefined;
  }
}

/**
 * The filesystem isomorphic-git works with on a repository whose layout or inherited configuration it does
 * not know of itself.
 *
 * #689: isomorphic-git follows the `.git` file of a linked worktree to its gitdir but not that gitdir's
 * `commondir`: it would find the worktree's HEAD and index, and no branch, object or configuration. The
 * shared paths of the gitdir are sent to the common directory, as git does.
 *
 * #690: isomorphic-git reads only the repository's own `config`. It hands the `core.autocrlf` found there
 * to each read of a work-tree file, which converts it; with none there and `inheritAutocrlf`, the read
 * converts the file here instead.
 */
function gitFs(layout: GitdirLayout, inheritAutocrlf: boolean): PromiseFsClient {
  const { gitdir, commonDirectory } = layout;
  const at = (target: string): string => {
    if (!commonDirectory) {
      return target;
    }
    const relative = path.relative(gitdir, path.resolve(target));
    if (relative === "" || relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
      return target;
    }
    return isCommonGitPath(toPosix(relative)) ? path.join(commonDirectory, relative) : target;
  };
  // isomorphic-git calls readFile() with no argument to tell a promise filesystem: `at` is given strings only
  const p = fs.promises;
  type Rest<F extends (...args: never[]) => unknown> = Parameters<F> extends [unknown, ...infer R] ? R : never;
  return {
    promises: {
      readFile: async (file: string, options?: Parameters<typeof p.readFile>[1] & { autocrlf?: unknown }) => {
        if (file === undefined) {
          return p.readFile(file);
        }
        const content = await p.readFile(at(file), options ?? null);
        // a work-tree read carries the repository's own core.autocrlf, undefined when its config has none
        const converts = inheritAutocrlf && options !== null && typeof options === "object" && "autocrlf" in options;
        return converts && options.autocrlf === undefined && Buffer.isBuffer(content) ? withLfLineEndings(content) : content;
      },
      writeFile: (file: string, ...rest: Rest<typeof p.writeFile>) => p.writeFile(at(file), ...rest),
      mkdir: (dir: string, ...rest: Rest<typeof p.mkdir>) => p.mkdir(at(dir), ...rest),
      rmdir: (dir: string, ...rest: Rest<typeof p.rmdir>) => p.rmdir(at(dir), ...rest),
      unlink: (file: string) => p.unlink(at(file)),
      stat: (target: string, ...rest: Rest<typeof p.stat>) => p.stat(at(target), ...rest),
      lstat: (target: string, ...rest: Rest<typeof p.lstat>) => p.lstat(at(target), ...rest),
      readdir: (dir: string, ...rest: Rest<typeof p.readdir>) => p.readdir(at(dir), ...rest),
      readlink: (link: string, ...rest: Rest<typeof p.readlink>) => p.readlink(at(link), ...rest),
      // the target of a link is its content, not a path to redirect
      symlink: (target: string, link: string) => p.symlink(target, at(link)),
    },
  };
}

/**
 * The filesystem isomorphic-git reads the repository of `root` with: the Node one, unless `root` is a linked
 * worktree or inherits `core.autocrlf` from the system or global configuration.
 */
function repositoryFs(root: string): FsClient {
  const layout = gitdirLayout(root);
  if (!layout) {
    return fs;
  }
  const inheritAutocrlf = inheritedAutocrlf();
  return layout.commonDirectory || inheritAutocrlf ? gitFs(layout, inheritAutocrlf) : fs;
}

/** The entry at `absolute` itself (a link is not followed), undefined when there is none. */
function lstatOrUndefined(absolute: string): fs.Stats | undefined {
  try {
    return fs.lstatSync(absolute);
  } catch {
    return undefined;
  }
}

async function resolveOrUndefined(repository: GitDir, ref: string): Promise<string | undefined> {
  try {
    return await git.resolveRef({ ...repository, ref });
  } catch {
    return undefined;
  }
}

/** The commit a ref points at, peeling annotated tags. */
async function commitOf(repository: GitDir, ref: string): Promise<string | undefined> {
  const oid = await resolveOrUndefined(repository, ref);
  if (!oid) {
    return undefined;
  }
  let commit = oid;
  try {
    commit = (await git.readTag({ ...repository, oid })).tag.object;
  } catch {
    // not an annotated tag
  }
  // a full-length oid resolves as itself: it must name a commit of the repository
  try {
    await git.readCommit({ ...repository, oid: commit });
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
  if (!unstaged) {
    return { path: filepath, change, staged, unstaged };
  }
  // #691: a revert makes the work tree equal to the index, which decides what happens to the file
  const revertOutcome: GitRevertOutcome = stage === 0 ? "deleted" : workdir === 0 ? "recreated" : "rewritten";
  return { path: filepath, change, staged, unstaged, revertOutcome };
}

class IsomorphicGitRepository implements GitRepositoryInterface {
  private readonly repository: GitDir;

  constructor(public readonly root: string) {
    this.repository = { fs: repositoryFs(root), dir: root };
  }

  async status(filepaths?: string[]): Promise<GitFileStatus[]> {
    // refresh: false, reading the status never writes the index: isomorphic-git's refresh of its stat cache
    // records the work tree's file mode even with core.filemode false, which stages a mode change (#689)
    const rows = await git.statusMatrix({ ...this.repository, filepaths, refresh: false });
    return rows
      .map((row) => statusFromMatrixRow(row as [string, number, number, number]))
      .filter((status): status is GitFileStatus => status !== undefined);
  }

  async log(options: { ref?: string; depth?: number } = {}): Promise<GitCommitSummary[]> {
    const ref = options.ref ?? "HEAD";
    if (!(await resolveOrUndefined(this.repository, ref))) {
      return [];
    }
    const [entries, refsByOid] = await Promise.all([
      git.log({ ...this.repository, ref, depth: options.depth }),
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
    add(await resolveOrUndefined(this.repository, "HEAD"), "HEAD");
    for (const branch of await git.listBranches(this.repository)) {
      add(await resolveOrUndefined(this.repository, `refs/heads/${branch}`), branch);
    }
    for (const { remote } of await git.listRemotes(this.repository)) {
      for (const branch of await git.listBranches({ ...this.repository, remote })) {
        if (branch !== "HEAD") {
          add(await resolveOrUndefined(this.repository, `refs/remotes/${remote}/${branch}`), `${remote}/${branch}`);
        }
      }
    }
    for (const tag of await git.listTags(this.repository)) {
      add(await commitOf(this.repository, `refs/tags/${tag}`), `tag: ${tag}`);
    }
    return result;
  }

  async commitFiles(oid: string): Promise<string[]> {
    const { commit } = await git.readCommit({ ...this.repository, oid });
    const parent = commit.parent[0];
    const trees = parent ? [git.TREE({ ref: parent }), git.TREE({ ref: oid })] : [git.TREE({ ref: oid })];
    const paths: string[] = await git.walk({
      ...this.repository,
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
    const oid = await commitOf(this.repository, ref);
    if (!oid) {
      return undefined;
    }
    try {
      const { blob } = await git.readBlob({ ...this.repository, oid, filepath });
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
      if (ref !== undefined && !(await commitOf(this.repository, ref))) {
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
    return git.isIgnored({ ...this.repository, filepath });
  }

  async stagedPaths(): Promise<string[]> {
    const head = await commitOf(this.repository, "HEAD");
    if (!head) {
      return git.listFiles(this.repository);
    }
    // HEAD against the index only: no file of the work tree is read
    const paths: unknown[] = await git.walk({
      ...this.repository,
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
        await git.add({ ...this.repository, filepath });
      } else {
        await git.remove({ ...this.repository, filepath });
      }
    }
  }

  async restoreFromIndex(paths: string[]): Promise<{ path: string; outcome: GitRevertOutcome }[]> {
    const wanted = new Set(paths);
    const entries = new Map<string, { oid: string; mode: number }>();
    await git.walk({
      ...this.repository,
      trees: [git.STAGE()],
      map: async (filepath, [entry]) => {
        if (entry && wanted.has(filepath) && (await entry.type()) === "blob") {
          entries.set(filepath, { oid: await entry.oid(), mode: await entry.mode() });
        }
        return undefined;
      },
    });
    const realRoot = fs.realpathSync(this.root);
    const fileModes = (await this.getConfig("core.filemode")) !== "false";
    // every file is checked before any is written: a refusal leaves the work tree as it was
    const plans = paths.map((filepath) => {
      const absolute = path.resolve(this.root, filepath);
      const entry = entries.get(filepath);
      if (entry?.mode === 0o120000) {
        throw new GitRepositoryError("symbolicLink", `${filepath} is a symbolic link in the index`);
      }
      // the nearest folder that exists must be reached through no link at all: a link to another folder of
      // the work tree would make the write land in another file
      let folder = path.dirname(absolute);
      while (!fs.existsSync(folder)) {
        folder = path.dirname(folder);
      }
      const expected = path.join(realRoot, path.relative(this.root, folder));
      const relative = path.relative(realRoot, expected);
      const segments = relative.split(path.sep);
      if (
        fs.realpathSync(folder) !== expected ||
        path.isAbsolute(relative) ||
        segments[0] === ".." ||
        segments[0].toLowerCase() === ".git"
      ) {
        throw new GitRepositoryError("symbolicLink", `${filepath} is reached through a symbolic link`);
      }
      const present = lstatOrUndefined(absolute);
      if (present?.isSymbolicLink() && entry) {
        // writing would follow the link: its target is another file
        throw new GitRepositoryError("symbolicLink", `${filepath} is a symbolic link in the work tree`);
      }
      if (present?.isDirectory()) {
        throw new GitRepositoryError("outsideWorkTree", `${filepath} is a folder of the work tree`);
      }
      const outcome: GitRevertOutcome = !entry ? "deleted" : present ? "rewritten" : "recreated";
      return { filepath, absolute, entry, present, outcome };
    });
    // deletions first: on a filesystem that ignores case, a file deleted under one name may be the one
    // re-created under the other
    for (const { absolute, entry } of plans) {
      if (!entry) {
        // a link is removed itself, never its target
        fs.rmSync(absolute, { force: true });
      }
    }
    for (const { absolute, entry, present } of plans) {
      if (!entry) {
        continue;
      }
      const { blob } = await git.readBlob({ ...this.repository, oid: entry.oid });
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      const executable = entry.mode === 0o100755;
      // a rewritten file keeps its permissions, but for the executable bits when the repository tracks them
      // (a re-created file gets the process umask, as git gives it)
      const mode = present
        ? fileModes
          ? (present.mode & 0o666) | (executable ? (present.mode & 0o444) >> 2 : 0)
          : present.mode & 0o777
        : undefined;
      // written next to the file, then renamed over it: a link or a hard link put there meanwhile is
      // replaced, never written through
      const temporary = path.join(path.dirname(absolute), `.${path.basename(absolute)}.miroir-revert-${process.pid}`);
      try {
        fs.writeFileSync(temporary, blob, { flag: "wx", mode: executable ? 0o777 : 0o666 });
        if (mode !== undefined) {
          fs.chmodSync(temporary, mode);
        }
        fs.renameSync(temporary, absolute);
      } finally {
        fs.rmSync(temporary, { force: true });
      }
    }
    return plans.map(({ filepath, outcome }) => ({ path: filepath, outcome }));
  }

  async unstage(paths: string[]): Promise<void> {
    for (const filepath of paths) {
      await git.resetIndex({ ...this.repository, filepath });
    }
  }

  async commit(message: string, author: GitPerson): Promise<string> {
    return git.commit({ ...this.repository, message, author: { name: author.name, email: author.email } });
  }

  async getConfig(key: string): Promise<string | undefined> {
    const value = await git.getConfig({ ...this.repository, path: key });
    return value === undefined || value === null ? undefined : String(value);
  }

  async setConfig(key: string, value: string): Promise<void> {
    await git.setConfig({ ...this.repository, path: key, value });
  }

  async createBranch(name: string, startPoint?: string): Promise<void> {
    let object: string | undefined;
    if (startPoint !== undefined) {
      object = await commitOf(this.repository, startPoint);
      if (!object) {
        throw new GitRepositoryError("unknownRevision", `Unknown revision ${startPoint}`);
      }
    }
    try {
      await git.branch({ ...this.repository, ref: name, object, checkout: false });
    } catch (error) {
      throw asRepositoryError(error, name);
    }
  }

  async deleteBranch(name: string): Promise<void> {
    try {
      await git.deleteBranch({ ...this.repository, ref: name });
    } catch (error) {
      throw asRepositoryError(error, name);
    }
  }

  async branchIsMergedIntoHead(name: string): Promise<boolean> {
    const [tip, head] = [await commitOf(this.repository, `refs/heads/${name}`), await commitOf(this.repository, "HEAD")];
    if (!tip || !head) {
      return tip === head;
    }
    return tip === head || git.isDescendent({ ...this.repository, oid: head, ancestor: tip, depth: -1 });
  }

  async checkout(ref: string): Promise<GitCheckoutOutcome> {
    // a local branch is checked out as such; anything else that names a commit, as a detached HEAD; a name
    // only a remote has becomes a local branch tracking it
    const isLocalBranch = (await resolveOrUndefined(this.repository, `refs/heads/${ref}`)) !== undefined;
    const commit = isLocalBranch ? undefined : await commitOf(this.repository, ref);
    const target = isLocalBranch ? ref : (commit ?? ref);
    try {
      if (!isLocalBranch && !commit) {
        // git.checkout creates the tracking branch before it looks for conflicts: look first, on its commit
        const remoteCommit = await commitOf(this.repository, `refs/remotes/origin/${ref}`);
        if (!remoteCommit) {
          throw new GitRepositoryError("unknownRevision", `Unknown revision ${ref}`);
        }
        await git.checkout({ ...this.repository, ref: remoteCommit, dryRun: true });
      }
      await git.checkout({ ...this.repository, ref: target });
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
    await git.addRemote({ ...this.repository, remote, url, force: true });
  }

  async fetch(options: GitRemoteOptions): Promise<void> {
    try {
      await git.fetch({ ...this.repository, remote: options.remote, tags: true, ...transport(options) });
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
      await commitOf(this.repository, this.branchRef(local)),
      await commitOf(this.repository, `refs/remotes/${upstream}`),
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
        const { commit } = await git.readCommit({ ...this.repository, oid });
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
      await commitOf(this.repository, this.branchRef(branch)),
      await commitOf(this.repository, `refs/remotes/${upstream}`),
    ];
    if (!target) {
      throw new GitRepositoryError("unknownRevision", `Unknown revision ${upstream}`);
    }
    if (current === target) {
      return { conflicts: [], upToDate: true };
    }
    if (current) {
      if (await git.isDescendent({ ...this.repository, oid: current, ancestor: target, depth: -1 })) {
        return { conflicts: [], upToDate: true }; // the branch is ahead: nothing to take
      }
      if (!(await git.isDescendent({ ...this.repository, oid: target, ancestor: current, depth: -1 }))) {
        throw new GitRepositoryError(
          "notFastForward",
          `${branch} and ${upstream} have diverged: resolve them outside Miroir (merge or rebase), then pull again`,
        );
      }
    }
    try {
      // conflicts are looked for on the target before the branch moves
      await git.checkout({ ...this.repository, ref: target, dryRun: true });
    } catch (error) {
      if (errorCode(error) === "CheckoutConflictError") {
        return { conflicts: [...((error as { data?: { filepaths?: string[] } }).data?.filepaths ?? [])], upToDate: false };
      }
      throw error;
    }
    // the files and the index first, HEAD left on the branch: if this fails, the branch has not moved
    await git.checkout({ ...this.repository, ref: target, noUpdateHead: true });
    await git.writeRef({ ...this.repository, ref: this.branchRef(branch), value: target, force: true });
    return { conflicts: [], upToDate: false };
  }

  async push(options: GitRemoteOptions & { branch: string }): Promise<void> {
    const upstream = await this.upstream(options.branch);
    const remoteBranch =
      upstream && upstream.startsWith(`${options.remote}/`) ? upstream.slice(options.remote.length + 1) : options.branch;
    try {
      await git.push({
        ...this.repository,
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
    const current = await git.currentBranch({ ...this.repository, fullname: false, test: true });
    const remotes = await git.listRemotes(this.repository);
    const remote: string[] = [];
    for (const { remote: name } of remotes) {
      for (const branch of await git.listBranches({ ...this.repository, remote: name })) {
        if (branch !== "HEAD") {
          remote.push(`${name}/${branch}`);
        }
      }
    }
    return {
      current: current ?? undefined,
      head: await resolveOrUndefined(this.repository, "HEAD"),
      local: await git.listBranches(this.repository),
      remote,
      tags: await git.listTags(this.repository),
    };
  }

  async listFiles(): Promise<string[]> {
    if (!(await commitOf(this.repository, "HEAD"))) {
      return [];
    }
    return git.listFiles({ ...this.repository, ref: "HEAD" });
  }

  async symbolicLinks(): Promise<string[]> {
    if (!(await commitOf(this.repository, "HEAD"))) {
      return [];
    }
    const links: string[] = [];
    await git.walk({
      ...this.repository,
      trees: [git.TREE({ ref: "HEAD" })],
      map: async (filepath, [entry]) => {
        if (entry && (await entry.mode()) === 0o120000) {
          links.push(filepath);
        }
        return undefined;
      },
    });
    return links;
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
      try {
        await git.clone({
          fs,
          dir: root,
          remote: options.remote,
          ref: options.branch,
          singleBranch: false,
          // the files are written below, once the commit is known to hold no symbolic link
          noCheckout: true,
          ...transport(options),
        });
      } catch (error) {
        throw asRemoteError(error, options.remote);
      }
      const repository = new IsomorphicGitRepository(root);
      const links = await repository.symbolicLinks();
      if (links.length > 0) {
        // isomorphic-git would write them as links, and the stores opened on the clone would follow them
        throw new GitRepositoryError(
          "symbolicLink",
          `The repository holds symbolic links, which Miroir does not check out: ${links.slice(0, 5).join(", ")}`,
        );
      }
      const branch = await git.currentBranch({ fs, dir: root });
      if (branch) {
        await git.checkout({ fs, dir: root, ref: branch });
      }
      return repository;
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
    async createDirectory(directory: string): Promise<boolean> {
      const absolute = path.resolve(directory);
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      try {
        fs.mkdirSync(absolute); // not recursive: fails when another clone created it first
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
          return false;
        }
        throw error;
      }
    },
    async removeDirectory(directory: string, options?: { contentsOnly?: boolean }): Promise<void> {
      const absolute = path.resolve(directory);
      if (!options?.contentsOnly) {
        fs.rmSync(absolute, { recursive: true, force: true });
        return;
      }
      for (const entry of fs.existsSync(absolute) ? fs.readdirSync(absolute) : []) {
        fs.rmSync(path.join(absolute, entry), { recursive: true, force: true });
      }
    },
    async realPath(target: string): Promise<string> {
      let existing = path.resolve(target);
      const rest: string[] = [];
      while (!fs.existsSync(existing)) {
        const parent = path.dirname(existing);
        if (parent === existing) {
          break;
        }
        rest.unshift(path.basename(existing));
        existing = parent;
      }
      return path.join(fs.realpathSync(existing), ...rest);
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
