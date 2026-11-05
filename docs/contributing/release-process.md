# Release process

A Miroir release is one product version, published in three places from one commit:

- a git tag, named after the version,
- the `@miroir-framework/*` packages on npm,
- a GitHub Release with the platform downloads (server, desktop app, Docker image).

This page goes from what you need before starting to what a finished release contains. How the release tool works
inside (layers, Lerna, the handoff file) is in [Release process internals](../reference/release-process.md) and
[`ci/release/README.md`](../../ci/release/README.md).

## Version numbering

- SemVer, `X.Y.Z` or a prerelease `X.Y.Z-rc.N` (dot form, e.g. `0.5.0-rc.2`).
- The git tag is the version string with **no `v` prefix**.
- Any version containing `-` is a **prerelease**. npm gets it under the `next` dist-tag, and its GitHub Release is
  marked Pre-release. A plain `X.Y.Z` goes to the `latest` dist-tag.

## Input

| What | Example | Notes |
|---|---|---|
| Version to release | `0.5.0-rc.3` | Not on npm and not tagged yet. A version that is tagged or partly published cannot be reused: release the next one. |
| Previous release tag | `0.5.0-rc.2` | Lerna's change detection starts there. |
| Source branch | `master` | Clean, with CI green. Everything below builds from the tag the first step creates on it. |
| npm credentials | `NPM_TOKEN` secret, or trusted publishing | See [npm credentials](#npm-credentials). |
| A Windows machine | | Only for the Windows downloads, which no workflow builds yet. |

## Output

A finished release has all of these:

| Output | Where | Made by |
|---|---|---|
| Tag `<version>` | GitHub | step 2 |
| Branch `release/<version>`, merged into `_integration` by a PR | GitHub | steps 2 and 3 |
| The `@miroir-framework/*` packages at `<version>` | npm (`next` or `latest`) | step 2 |
| Server, desktop app and Docker downloads | GitHub Release `<version>` | steps 4 to 6 |

The GitHub Release holds these files (names for `0.5.0-rc.3`):

| File | Built by |
|---|---|
| `miroir-server-nodejs-linux-0.5.0-rc.3.zip` | "Build Miroir Runnables (Linux)", artifact `miroir-server-release`, zipped |
| `miroir-framework_miroir-amd64_0.5.0-rc.3-docker_image.tar.gz` | same workflow, artifact `miroir-docker-release` (`miroir.tar`), gzipped |
| `Miroir.Standalone.App-0.5.0-rc.3.AppImage`, `miroir-standalone-app-electron_0.5.0-rc.3_amd64.deb`, `..._amd64.snap`, `miroir-standalone-app-electron-0.5.0-rc.3.apk` | same workflow, artifact `miroir-electron-release` |
| `miroir-server-nodejs-win-0.5.0-rc.3.zip` | Windows machine, by hand |
| `Miroir.Standalone.App.Win.Setup.0.5.0-rc.3.exe`, `Miroir.Standalone.App.Win.Portable.0.5.0-rc.3.zip` | Windows machine, by hand |
| `library-model.json`, `library-data.json` | the Library example bundle, `docs/tutorials/libraryTutorial/bundles-2026-05/` |

GitHub replaces spaces in uploaded file names with dots (`Miroir Standalone App-…` becomes `Miroir.Standalone.App-…`).

> **Known gap.** `release_version.py` versions the npm packages only. `miroir-server`, `miroir-standalone-app` and
> `miroir-standalone-app-electron` keep the version they had (`0.5.0-rc.1` on the `0.5.0-rc.2` tag), so the
> desktop app files come out named with that old version, and the server reports it. Rename the files to the
> release version before uploading them, until these packages follow the product version.

## Steps

### 1. Dry run

**Actions → Publish to npm → Run workflow**, from `master`, with `version`, `since` (the previous tag) and
`publish` **unticked**.

It runs the release pipeline tests, versions, builds and packs every package, and runs each `npm publish` with
`--dry-run`. Nothing leaves the runner. The run keeps `release-plan.json`, `release-handoff.json` and
`publish-commands.sh` as the `release-<version>` artifact.

### 2. Publish to npm

Same workflow, same inputs, `publish` **ticked**. It:

1. publishes the packages in layer order, with provenance,
2. pushes the tag `<version>` and the branch `release/<version>` (the release commit).

If a package fails, the packages before it stay published, and rerunning the workflow does not resume: its
`--apply` step refuses a version already on npm. Release the next version instead.

### 3. Merge the release branch

Open a PR from `release/<version>` into `_integration` and merge it. The source branch then carries the new
versions.

### 4. Build the downloads

**Actions → Build Miroir Runnables (Linux) → Run workflow**. In "Use workflow from", pick **Tags → `<version>`**.
Leave `docker_tag` blank or give `miroir-framework/miroir:<version>`.

Build from the tag, not from a branch, so the downloads match the npm packages. When it succeeds, the run has
seven artifacts. Three of them are the downloads: `miroir-server-release`, `miroir-electron-release` and
`miroir-docker-release`. The other four (`dist-*`) only pass build outputs between jobs.

### 5. Windows downloads

On a Windows machine, in Git Bash, check out the tag and build ([Build it yourself](../guides/build-it-yourself.md)):

```bash
git checkout <version>
./build-all.sh
npm run build:release -w miroir-server              # packages/miroir-server/release/
npm run dist -w miroir-standalone-app-electron      # packages/miroir-standalone-app-electron/release/
```

Zip `packages/miroir-server/release/` as `miroir-server-nodejs-win-<version>.zip`. The Electron build gives the
NSIS installer, `Miroir Standalone App Setup <version>.exe`: rename it `Miroir.Standalone.App.Win.Setup.<version>.exe`.
Zip its `win-unpacked/` folder as `Miroir.Standalone.App.Win.Portable.<version>.zip` for the portable download.

### 6. Create the GitHub Release

Download the three artifacts from step 4 and give the files their release names:

```bash
V=0.5.0-rc.3
gh run download <run-id> -n miroir-server-release -D server
gh run download <run-id> -n miroir-electron-release -D electron
gh run download <run-id> -n miroir-docker-release -D docker
(cd server && zip -r "../miroir-server-nodejs-linux-$V.zip" .)
gzip -c docker/miroir.tar > "miroir-framework_miroir-amd64_$V-docker_image.tar.gz"
ls electron/   # the .AppImage, .deb, .snap and .apk; rename them if they carry another version
```

Then create the release from the tag, as a prerelease when the version has a `-`:

```bash
gh release create "$V" --verify-tag --prerelease --title "$V" --notes "release candidate" \
  miroir-server-nodejs-linux-$V.zip miroir-framework_miroir-amd64_$V-docker_image.tar.gz \
  electron/*.AppImage electron/*.deb electron/*.snap electron/*.apk \
  <the Windows files> \
  docs/tutorials/libraryTutorial/bundles-2026-05/library-model.json \
  docs/tutorials/libraryTutorial/bundles-2026-05/library-data.json
```

Or from the web: **Releases → Draft a new release**, pick the tag, tick Pre-release, upload the files.

### 7. Check

- `npm view @miroir-framework/core@<version>` answers, and `npm view @miroir-framework/core dist-tags` shows it
  under `next` (or `latest`).
- The GitHub Release lists every file of the [output table](#output).
- `npx @miroir-framework/create-app@<version> my-app` creates a project that starts.

## npm credentials

The first publish of a package needs a token: trusted publishing only works for a package that already exists on
npm. Add an npm granular access token with read and write on `@miroir-framework` as `NPM_TOKEN` in the
`npm-publish` environment secrets (a repository secret works too).

Once every package exists, add a trusted publisher to each one on npmjs.com (repository `miroir-framework/miroir`,
workflow `publish-npm.yml`, environment `npm-publish`) and delete the secret. Add required reviewers to the
`npm-publish` environment to get an approval step before each publish.

npm plans to stop direct publishing with tokens that bypass 2FA around January 2027. Packages added after that need
staged publishing (#667) or a first publish from a maintainer's machine.

## If something fails

| Failure | What to do |
|---|---|
| "Publish to npm" fails before publishing (tests, build, dry run) | Fix on `master`, run again with the same version. Nothing was published or tagged. |
| It fails during publishing | Release the next version. A rerun stops at the first package already on npm. |
| A fix is needed after the tag exists | Merge the fix, release the next version. A tag is never moved. |
| "Build Miroir Runnables" fails on the tag | Fix on `master` and release the next version, so the downloads match a tag. |

## Without CI

`ci/release/README.md`, "Without CI", publishes from a maintainer's machine with `npm login`. The packages then
have no provenance.
