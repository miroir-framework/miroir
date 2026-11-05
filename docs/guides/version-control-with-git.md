# Version control with Git

The Git page puts the files of a filesystem deployment under Git from Miroir itself. You can see what
changed, commit it, switch branches, sync with a remote over HTTPS, and clone a repository to install the
application it holds. The machine that runs Miroir needs no Git program: the
[isomorphic-git](https://isomorphic-git.org/) package does the work, and it loads with the first Git action.

Issue [#679](https://github.com/miroir-framework/miroir/issues/679). Design: [`code-helpers/features/679-FEATURE-git-version-control/analysis.md`](../../code-helpers/features/679-FEATURE-git-version-control/analysis.md).

## Turning it on

Git is a [process capability](../reference/process-capabilities.md). It is off unless the persistence
side (the server, or Electron main) sets it:

```json
{ "features": { "git": true } }
```

In an environment definition, `features` is the same object ([Environments](../reference/environments.md)).
`dev` and `desktop` turn it on. Restart the process after the change. With Git off, the AppBar has no Git
entry, no Git code is loaded, and every `gitAction_*` returns `FeatureUnavailable`.

The Git actions are designer tools: they also need `designerTools`. When authentication is on, only a
designer can run them.

## What the page does

Open the page from the AppBar (`?page=git`) and pick an application. It works on the repository that holds
the application's section folders (`model`, `data`, ...).

| Panel | What it shows and does |
|---|---|
| Changes | The changed files, named by Entity and instance. Stage or unstage them, see the diff, and commit with a message. Files outside the application's sections are not listed. |
| History | The commits with their branches and tags. A commit lists the files it changed. |
| Branches | Create, delete and check out branches. Check out a tag or a commit to look at an old state (a detached HEAD). After a checkout, the page reloads the application from its files. |
| Remote | The URL of the remote, and how many commits are to push and to pull. Fetch, Pull and Push. |
| Clone | Clone a repository into a new folder and install the Miroir application it holds. |

When a deployment has no repository yet, the page offers to create one in the folder that holds its
sections.

Miroir refuses a commit, a checkout or a pull while some Miroir changes are not saved to the files yet.
Commit them in Miroir first.

## Remotes and credentials

Remotes are `http` or `https` URLs. Give the URL without a username or token: Miroir asks for them when the
remote does.

When a remote asks for credentials, the page opens a form for a username and a token. Use a personal access
token, not your password. The action runs again with it. When it works, Miroir saves the token as the Admin
secret `git.<host>` (for example `git.github.com`), unless you uncheck "Save it". The next actions on that
host use the secret. A secret belongs to the logged-in user, or to the process when nobody is logged in.
Saving needs the secrets wrapping key (`MIROIR_SECRETS_MASTER_KEY`), as for other secrets.

The secrets are listed on the Admin Secrets page with the others. Results sent to the client never hold a
token, even one written in a URL outside Miroir.

## Cloning an application

The Clone panel at the top of the Git page takes a repository URL and a folder. The folder is a path under
the deployment root folder of the server; it must not exist yet, or be empty. By default it is named after
the repository.

Miroir clones the repository, then looks for Miroir deployments in it: rows of the Deployment Entity in
`<package>/assets/deployment/`, whose model section holds the application's SelfApplication row. The
repository can be one package, with `assets/` at its root, or a monorepo with packages under `packages/`.

- With one deployment, Miroir installs it at once.
- With several, the panel lists them and you pick the one to install.
- With none, the clone is kept and nothing is installed.

Installing writes the AdminApplication and Deployment rows in Admin, with section directories pointing into
the clone, and opens the stores. The application then appears like any other, and its Git page works on the
clone, whose `origin` is the URL you gave. An application that already has a deployment is not installed
twice.

The stored Runner "Clone application from Git" (`cloneApplicationFromGit`) runs the same clone and install
from a form with the URL and the folder.

## Limits

- HTTPS remotes only: isomorphic-git has no SSH transport.
- Pull is fast-forward only. When the branch and its upstream have diverged, merge or rebase them outside
  Miroir, then pull again.
- No merge with conflicts, rebase, cherry-pick, stash, submodules or worktrees.
- Only filesystem deployments: a deployment on another store has no files to version.
- Repository settings come from the repository's own `.git/config`. Git hooks and the global Git
  configuration of the machine are not used.
