/**
 * #679: `GitRepositoryFactory` on isomorphic-git and the Node filesystem. Hosts load this module with a
 * dynamic `import()` registered on `ConfigurationService.registerGitRepositoryFactory`, never statically.
 */
import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";

import type {
  GitBranches,
  GitCommitSummary,
  GitFileDiff,
  GitFileStatus,
  GitRepositoryFactory,
  GitRepositoryInterface,
} from "@miroir-framework/core";

const DEFAULT_BRANCH = "main";

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
