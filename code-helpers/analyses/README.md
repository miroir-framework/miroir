# Analyses

Investigations that are not (yet) tied to a feature issue: regressions, behaviour audits,
"how does X work today" write-ups, and the blast-radius studies that precede a fix.

When an analysis turns into planned work, open an issue and continue in
`code-helpers/features/<issue>-<TYPE>-<slug>/` (skills `miroir-feature-analysis`,
`miroir-analysis-to-tdd-plan`); link back to the analysis from there.

## Layout

One folder per analysis, named `<YYYY-MM-DD>-<slug>/`, dated when the analysis starts:

| File | Role |
|---|---|
| `analysis.md` | The analysis itself: question, findings with `file:line` evidence and commit hashes, blast radius, options, open questions. |
| `*.html` (optional) | Rendered pages, such as an archify explainer or diagram. |
| `candidate.archify.md` (optional) | Source of an archify page. Regenerate with `node .agents/skills/archify/bin/archify.mjs finalize explainer candidate.archify.md <page>.html --repo-root . --json` from the repo root, using paths relative to it. |
| `*.delivery.json`, `*.finalize*.json` (optional) | Archify delivery receipts that `archify check` uses to verify the page. |

## Index

| Date | Analysis | Status |
|---|---|---|
| 2026-10-22 | [Report editor ↔ rendered report: lost live feedback](2026-10-22-report-editor-live-feedback/analysis.md) | Analysis done, no fix yet |
