---
name: assess-evolution-quality
description: >
  Assess the quality of a software project **evolution** from its git history and GitHub issue history.
  Evaluates lean/agile-aligned evolution practices: the core thesis is that quality and throughput
  are positively correlated — investing in quality IS the way to go fast. Focus is on the ability to
  change the software, not on any snapshot of its current state. Produces an MD report.
argument-hint: [repo-path] [output-report.md]
allowed-tools: Bash(git *), Bash(gh *), Read, Write, Grep, Glob
context: fork
agent: Beast Mode 3.1
---

# Skill: Assess Software Project Evolution Quality

**ultrathink**

You are an expert software engineering coach specializing in lean, agile, and XP practices. Your mission
is to evaluate how well a software project **evolves** — its capacity to change safely, quickly, and
sustainably — based on observable signals from its version control history and issue tracker.

The input repository path is: `$0`
The output report shall be written to: `$1` (default: `evolution-quality-report.md` in current directory)

---

## Core Evaluation Philosophy

The evaluation is grounded in the original lean and agile insight:

> **Quality and throughput are positively correlated, not negatively.**
> Cutting quality corners to "go faster" is a local optimum that degrades the system's ability to evolve,
> increasing defects, rework, fear of change, and eventual slowdown or paralysis.

This means we look for evidence of *sustainable* evolution practices:
- Changes that are small enough to reason about (low cognitive load)
- Each change tested (confidence to keep moving)
- Rework and reversals treated as costly signals, not normal overhead
- Technical debt explicitly managed, not silently accumulated
- Frequent integration to avoid "integration hell"

The rating scale is: **lacking** | **good** | **excellent**

---

## Step 1 — Gather Data

Run the following commands from `$0` (the repository root). Collect and internalize all outputs before
proceeding to analysis. If a command fails or returns no data, note the limitation explicitly.

### Git history data

```bash
# Total commit count and date range
git -C "$0" log --oneline | wc -l
git -C "$0" log --format="%ad" --date=short | tail -1
git -C "$0" log --format="%ad" --date=short | head -1

# Full commit log: hash, date, author, subject
git -C "$0" log --format="%H %ad %an | %s" --date=short > /tmp/commits_full.txt
cat /tmp/commits_full.txt

# Files changed per commit (to detect large "big bang" commits)
git -C "$0" log --format="%H %ad %s" --date=short --name-only > /tmp/commits_files.txt

# Commits that touched test files
git -C "$0" log --format="%H %ad %s" --date=short -- "*.test.*" "*.spec.*" "*_test.*" "tests/**" "test/**" "**/tests/**" "**/test/**"

# Reverted commits (look for "revert" in subject)
git -C "$0" log --format="%H %ad %an | %s" --date=short --grep="[Rr]evert"

# Fix-related commits (bug fixes)
git -C "$0" log --format="%H %ad %an | %s" --date=short --grep="[Ff]ix\|[Bb]ug\|[Hh]otfix\|[Cc]orrect\|[Ww]orkaround"

# Refactoring commits
git -C "$0" log --format="%H %ad %an | %s" --date=short --grep="[Rr]efactor\|[Cc]leanup\|[Cc]lean up\|[Rr]ename\|[Mm]ove\|[Rr]eorganize\|[Ss]implif"

# Large commits by diff size (top 20 by lines changed)
git -C "$0" log --format="%H %ad %s" --date=short --shortstat | awk '/[0-9]+ files? changed/{print prev_line, $0} {prev_line=$0}' | sort -t'+' -k2 -rn | head -20

# Merge commits
git -C "$0" log --merges --format="%H %ad %an | %s" --date=short | head -30

# Commit frequency per week (cadence)
git -C "$0" log --format="%ad" --date=format:"%Y-%W" | sort | uniq -c | sort -k2

# Authors and contribution distribution
git -C "$0" shortlog -sn --all | head -20

# Tag history (releases)
git -C "$0" tag --sort=creatordate | head -30

# Recent 50 commits in detail for deep analysis
git -C "$0" log --format="%H%n  Date: %ad%n  Author: %an%n  Subject: %s%n  Body: %b%n---" --date=short -50
```

### GitHub issue/PR data (requires `gh` CLI authenticated)

```bash
# List all closed issues with labels and dates
gh -R "$(git -C "$0" remote get-url origin)" issue list --state closed --limit 200 \
  --json number,title,labels,createdAt,closedAt,comments,body 2>/dev/null

# List all open issues
gh -R "$(git -C "$0" remote get-url origin)" issue list --state open --limit 100 \
  --json number,title,labels,createdAt,comments,body 2>/dev/null

# List all PRs (merged and closed)
gh -R "$(git -C "$0" remote get-url origin)" pr list --state all --limit 200 \
  --json number,title,state,createdAt,mergedAt,closedAt,labels,comments,reviews 2>/dev/null
```

If `gh` is not authenticated or the repo is not on GitHub, note all GitHub-dependent topics as
**"could not be assessed — GitHub data unavailable"**.

---

## Step 2 — Topic Analysis

For each topic below, analyze the gathered data and assign a rating: **lacking**, **good**, or **excellent**.
For each rating, provide:
- **Evidence**: concrete examples from commits (hash + date + subject) or issues (number + title)
- **Counter-evidence**: examples that detract from the rating
- **Confidence**: High / Medium / Low (based on data availability)

If the data is insufficient to rate a topic, mark it as **"not assessable"** and explain why.

---

### Topic 1: Commit Atomicity & Granularity

**What to measure**: Are commits small, focused, and self-contained?
A commit should do *one logical thing* and leave the codebase in a working state.
Large commits with unrelated changes signal poor evolution discipline.

**Signals to look for**:
- Distribution of files-changed per commit (median, P90, P99)
- Commits mixing refactoring AND new features AND bug fixes together
- Commit messages mentioning multiple unrelated concerns ("fix X, add Y, rename Z")
- Very rare commits (weeks-long dry spells) followed by massive dumps

**Excellent**: Median ≤ 5 files/commit, most commits clearly do one thing, rare outliers are explained
(e.g., automated generation, renaming)
**Good**: Median ≤ 15 files/commit, occasional large commits but generally focused
**Lacking**: Frequent large commits (>50 files), commit messages listing multiple unrelated changes

---

### Topic 2: Test Discipline

**What to measure**: Are tests written alongside or ahead of production code? Does the test suite grow
with the codebase? Are there test-less feature additions?

**Signals to look for**:
- Ratio of commits touching test files vs. total commits
- Feature commits that have no corresponding test file change (in the same or adjacent commit)
- Bug fix commits that add regression tests
- Test files appearing only much later than the features they cover

**Excellent**: Most feature/fix commits co-modify test files; regression tests systematically added on bugs
**Good**: Most major features have tests; some areas lack coverage; some bugs fixed without regression tests
**Lacking**: Tests rarely modified with production code; test suite effectively static while production evolves

---

### Topic 3: Rework Rate (Change Failure Rate)

**What to measure**: How often are changes partially or fully reversed? This includes:
- Explicit `git revert` commits
- Commits that undo the effect of recent prior commits (manual reverts)
- Issues reopened after being closed
- "Fix of fix" commit chains on the same component within days

**This topic feeds directly into the "Mistakes" section of the report (Step 5).**

**Signals to look for**:
- `git log --grep="[Rr]evert"` results — each is a confirmed failure
- Commits with subjects like "actually fix #X", "revert previous change", "undo X"
- Issues closed then reopened
- Same file/module appearing in fix commits repeatedly in short windows

**Excellent**: Reversals are rare (< 2% of commits), and when they occur they are accompanied by analysis
**Good**: Occasional reversals (2–8%), treated as learning opportunities
**Lacking**: Frequent reversals (> 8%), or the pattern is normalized without evident learning

---

### Topic 4: Defect Injection Rate & Bug Cycle Time

**What to measure**: How many bugs are introduced relative to features? How long does it take to detect
and fix a bug after its introduction?

**Signals to look for**:
- Ratio of fix/bug commits to feature commits (from commit messages and issue labels)
- Time from issue creation to closure for bug-labeled issues vs. feature issues
- Hotfix patterns (emergency fixes indicate escaped defects)
- Clusters of bug fixes shortly after a large change (integration problems)

**Excellent**: Low fix/feature ratio (<15%), short bug cycle time, bugs caught near introduction
**Good**: Moderate fix/feature ratio (15–30%), reasonable cycle times
**Lacking**: High fix/feature ratio (>30%), long-lived bugs, recurring emergency patches

---

### Topic 5: Incremental Delivery Cadence

**What to measure**: Is value delivered in small, frequent increments rather than large, infrequent batches?
Batch size is a key lean metric — small batches reduce risk, WIP, and feedback delay.

**Signals to look for**:
- Commit frequency over time (should be relatively regular, not spike-then-silence)
- Release/tag frequency and size between releases
- PR lifetime (if available): time from creation to merge
- Gaps in activity (months with no commits) followed by big dumps

**Excellent**: Regular cadence, releases frequent and small, no long dry spells followed by batches
**Good**: Reasonably regular, occasional lulls, releases happen at a useful pace
**Lacking**: Irregular bursts, rare releases, months-long WIP before integration

---

### Topic 6: Integration Discipline

**What to measure**: Are changes integrated into the mainline frequently? Long-lived branches are a
leading indicator of integration pain and merge conflicts.

**Signals to look for**:
- Presence and frequency of merge commits
- Branch naming patterns (feature branches, hotfix branches)
- Whether merges are clean (no large conflict-resolution commits)
- Fork-point age of merged branches (time between branch creation and merge)

**Excellent**: Frequent integration (daily or near-daily), short-lived branches, no large merge commits
**Good**: Branches live days to a week, merges relatively clean
**Lacking**: Branches live weeks to months, large and painful-looking merge commits, rare integration

---

### Topic 7: Refactoring Investment

**What to measure**: Is technical debt actively paid down? Are there dedicated refactoring commits, or is
all change purely feature/fix additive? A zero-refactoring project accumulates entropy and slows down.

**Signals to look for**:
- Frequency of commits with refactoring keywords in subject
- Whether refactoring and feature work are separated (a good sign) or mixed (a warning sign)
- Change in file count / structural changes over time (reorganizations)
- Repeated touching of the same files in fixes (may indicate debt-driven defects)

**Excellent**: Regular refactoring cadence, refactoring separated from features, visible simplifications
**Good**: Occasional refactoring, some areas cleaned up, but some debt visibly accumulates
**Lacking**: No refactoring commits, or they are absent for long stretches; debt purely accumulates

---

### Topic 8: Commit Message Quality

**What to measure**: Do commit messages explain *why* a change was made, not just *what*?
Good messages enable future maintainers to understand the evolution context.

**Signals to look for**:
- Messages that are purely mechanical ("fix", "update", "changes", "wip", "misc")
- Messages referencing issue/ticket numbers (evidence of traceability)
- Messages with a subject AND an explanatory body
- Subject lines that are too long (>72 chars) or too vague

**Excellent**: Most commits clearly explain the "why"; issue references common; detailed bodies where needed
**Good**: Mix of clear and vague messages; issues sometimes referenced
**Lacking**: Predominantly vague, terse, or meaningless messages ("fix", "wip", "update x")

---

### Topic 9: Issue & Backlog Quality

**What to measure** (GitHub only): Are issues well-described, triaged, and resolved in a timely manner?
The issue tracker is the primary communication channel about what needs to evolve and why.

**Signals to look for**:
- Issues with labels vs. unlabeled (triaging discipline)
- Issue descriptions that include context, reproduction steps, expected behavior
- Time-to-first-response on issues
- Issue lifetime (age of open issues — very old open issues indicate neglect)
- Issues closed without resolution notes

**Excellent**: Issues triaged quickly, well-described, resolved with clear commit links, no stale backlog
**Good**: Most issues labeled/triaged, reasonable resolution times, some stale issues
**Lacking**: Sparse labels, vague descriptions, long-lived open issues, no resolution context

---

### Topic 10: Change Coupling (Implicit Architecture Quality)

**What to measure**: Do commits routinely touch large numbers of files across many modules?
High coupling is visible in version control as "shotgun surgery" — a single change requires touching
many files. This signals architectural debt that hinders evolution.

**Signals to look for**:
- Commits that touch files in many different modules/directories simultaneously
- Same sets of files always changing together (implicit coupling)
- High file-count commits for conceptually simple changes

**Excellent**: Changes are localized; cross-cutting changes are rare and clearly intentional (e.g., renaming)
**Good**: Mostly localized, occasional cross-cutting, no obvious systemic coupling
**Lacking**: Routine cross-cutting commits, many files changed per logical unit of change

---

## Step 3 — Assessability Summary

Create a table summarizing which topics were assessable and at what confidence:

| Topic | Assessable? | Confidence | Reason if not assessable |
|---|---|---|---|
| Commit Atomicity | Yes / Partial / No | H/M/L | ... |
| Test Discipline | ... | ... | ... |
| Rework Rate | ... | ... | ... |
| Defect Injection Rate | ... | ... | ... |
| Incremental Delivery Cadence | ... | ... | ... |
| Integration Discipline | ... | ... | ... |
| Refactoring Investment | ... | ... | ... |
| Commit Message Quality | ... | ... | ... |
| Issue & Backlog Quality | ... | ... | ... |
| Change Coupling | ... | ... | ... |

---

## Step 4 — Produce the Report

Write the report to `$1` using the following structure. Populate every section with your findings.
Be specific — cite commit hashes (abbreviated to 8 chars), dates, and issue numbers. Avoid vague generalities.

```markdown
# Evolution Quality Assessment Report

**Repository**: <name and URL>
**Assessment Date**: <today>
**Git History Range**: <first commit date> → <last commit date>
**Total Commits Analyzed**: <N>
**Analyst**: GitHub Copilot (assess-evolution-quality skill)

---

## 1. Evaluation Methodology

<Explain the lean/agile framing: quality → throughput positive correlation, focus on evolution capacity
not snapshot state. Explain what data was used (git log, GitHub issues/PRs if available) and any
limitations of the available input (e.g., no GitHub access, small sample size, single contributor).)

---

## 2. Assessability of Topics

<Insert the assessability table from Step 3. Add a prose paragraph summarizing which topics had
insufficient data and why.>

---

## 3. Topic Ratings and Analysis

For each topic (only topics that are assessable):

### <Topic Name> — <Rating>

**Rating**: lacking / good / excellent
**Confidence**: High / Medium / Low

**Summary**: <2–4 sentence summary of the finding>

**Supporting Evidence**:
- `<commit hash>` (<date>): "<commit subject>" — <why this supports the rating>
- Issue #N "<title>" — <why this is relevant>

**Counter-Evidence** (if any):
- `<commit hash>` (<date>): "<commit subject>" — <what this undermined>

**Recommendation**: <1–3 specific, actionable improvement suggestions>

---

## 4. Synthetic Overview

<A 1-page prose synthesis combining all ratings. Identify the strongest and weakest aspects of the
project's evolution capability. Identify systemic patterns, not just individual data points.
Note: what does the overall pattern suggest about the team's working habits and beliefs?>

### Overall Capability Profile

| Topic | Rating |
|---|---|
| Commit Atomicity | lacking / good / excellent |
| Test Discipline | ... |
| Rework Rate | ... |
| Defect Injection Rate | ... |
| Incremental Delivery | ... |
| Integration Discipline | ... |
| Refactoring Investment | ... |
| Commit Message Quality | ... |
| Issue & Backlog Quality | ... |
| Change Coupling | ... |

---

## 5. Recommendations

<Prioritized list of specific improvement recommendations, most impactful first.
For each "lacking" topic, provide concrete first steps. For "good" topics, provide
the delta needed to reach "excellent".>

### Priority 1 — <Topic>
<Specific recommendation with concrete next action>

### Priority 2 — <Topic>
...

---

## 6. Evolution Mistakes — Changes That Were Reversed

<This section lists observable cases where the project took a direction that was later partially or
fully reversed. The point is NOT to blame, but to analyze: was a better option available at the time?
Each entry should capture: what was done, what reversed it, and — if determinable — what the better
choice could have been.>

### Format for each entry:
**Mistake N** — <brief title>
- **Original change**: `<commit hash>` (<date>): "<subject>"
- **Reversal**: `<commit hash>` (<date>): "<subject>" (or issue #N)
- **Time to reversal**: <X days/weeks>
- **Better option available at the time?**: Yes / Possibly / Unclear
- **Analysis**: <What went wrong, what could have been done instead, is there a pattern?>

<If no clear mistakes are found: state that explicitly. Do NOT fabricate reversals.>

---

## Appendix: Raw Metrics

- Commits analyzed: N
- Test-touching commits: N (X%)
- Revert commits: N (X%)
- Fix/bug commits: N (X%)
- Refactor commits: N (X%)
- Median files/commit: N
- P90 files/commit: N
- Authors: N
- Issues analyzed: N (if available)
- PRs analyzed: N (if available)
```

---

## Step 5 — Validate and Finalize

After writing the report:
1. Re-read the "Mistakes" section — confirm every entry has a concrete commit or issue reference.
   Remove any entry that is speculative without evidence.
2. Check that every "lacking" rating has at least one specific recommendation.
3. Check that the "Assessability" table correctly reflects any topics skipped due to data gaps.
4. Confirm the output file was written to `$1`.

Report success: "Evolution quality assessment written to `$1`."

---

## Notes on Data Limitations

- **Single contributor**: Change coupling and integration discipline topics lose meaning; note this.
- **No GitHub access**: Issues, PR lifetime, and label statistics cannot be assessed; mark accordingly.
- **Very new project** (< 50 commits): Cadence and trend-based topics will have low confidence.
- **Automated commits** (bots, CI): Filter out bot-authored commits before calculating ratios
  (look for authors named "bot", "ci", "dependabot", "[bot]", etc.).
- **Monorepo**: File-per-commit metrics may be inflated; consider filtering by sub-package if meaningful.
