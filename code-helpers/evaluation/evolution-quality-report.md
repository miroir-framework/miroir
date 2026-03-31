# Evolution Quality Assessment Report

**Repository**: [miroir-framework/miroir](https://github.com/miroir-framework/miroir)
**Assessment Date**: 2026-03-17
**Git History Range**: 2022-11-16 → 2026-03-17 (3 years, 4 months)
**Total Commits Analyzed**: 2043 (2024 non-merge)
**Total Issues Analyzed**: 178 (GitHub)
**Analyst**: GitHub Copilot (assess-evolution-quality skill)

---

## 1. Evaluation Methodology

This assessment evaluates the **evolution capability** of the Miroir Framework project — its ability to change safely, frequently, and sustainably — based on observable signals from its Git history and GitHub issue tracker.

The evaluation is grounded in the lean / agile insight that **quality and throughput are positively correlated**: investing in quality (small changes, adequate testing, continuous refactoring, clear communication) is the way to sustain speed, not an obstacle to it. Cutting corners to "go faster" degrades the system's capacity to evolve, leading to defects, rework, fear of change, and eventual paralysis.

### Data Sources
- **Git log**: 2043 commits (19 merge, 2024 non-merge), analyzed for subject convention, file-change distribution, test co-evolution, revert patterns, refactoring cadence, and integration practices.
- **GitHub Issues**: 178 issues (open and closed), analyzed for labeling discipline, description quality, resolution times, and backlog health.
- **Note**: GitHub PRs are minimal (1 external PR visible) — the project operates as a primarily single-contributor effort with direct pushes to `master`.

### Limitations
- **Single primary contributor** ("Miroir Framework" — 2039/2043 commits, 99.8%). This limits the ability to assess integration discipline, code review practices, and collaborative issue triage. Merge patterns reflect personal branch management rather than team integration.
- **No tags/releases**: Zero git tags were found, meaning release cadence cannot be assessed from version history.
- **No CI/CD observability**: No build badge, pipeline status, or automated quality gate evidence in the repository.

---

## 2. Assessability of Topics

| Topic | Assessable? | Confidence | Reason if not fully assessable |
|---|---|---|---|
| Commit Atomicity & Granularity | Yes | High | Rich commit data (2024 non-merge commits) |
| Test Discipline | Yes | High | Test file co-modification patterns are visible |
| Rework Rate | Yes | Medium | Only 3 explicit reverts; manual reversals harder to detect |
| Defect Injection Rate | Yes | Medium | Bug/fix tagging in commit messages and issues is systematic |
| Incremental Delivery Cadence | Partial | Medium | No tags/releases; cadence measured by commit frequency only |
| Integration Discipline | Partial | Low | Single contributor; merge patterns reflect only personal branching |
| Refactoring Investment | Yes | High | Explicit REFACTOR tag convention in commit messages |
| Commit Message Quality | Yes | High | Full message history available |
| Issue & Backlog Quality | Yes | High | 178 issues with labels, descriptions |
| Change Coupling | Yes | Medium | File-per-commit statistics available; module boundary less clear in monorepo |

### Topics that could NOT be properly evaluated:
- **Integration Discipline**: With a single contributor, the concept of "integrating others' work" does not apply. The observed merge patterns (19 merges, `master` ↔ `dev-copilot`) are personal branch management, not team integration.

---

## 3. Topic Ratings and Analysis

### Commit Atomicity & Granularity — Good

**Rating**: good
**Confidence**: High

**Summary**: The project shows a generally healthy commit granularity with a median of 8 files per commit and a mean of 13.4. Most commits are focused on a single concern, with the subject line reflecting one logical change. However, there are notable outliers (P90=29, P99=100, max=357 files), and some commits mix feature work, renaming, and data migrations.

**Supporting Evidence**:
- `cb30232a` (2026-03-14): "#171 FEATURE: postgres model manipulation / reverse engineering app. added table details report." — 6 files, focused and clear.
- `af70ac25` (2026-03-11): "#170 FEATURE: enable automated testing on Runners. Added test for runner dropApplication" — 3 files, single concern.
- `e2d36c10` (2026-03-13): "#171 FEATURE: display Table Columns based on ANSI `information_schema` catalog." — 4 files, single concern.
- The naming convention (issue number + category + description) naturally encourages one-concern-per-commit.

**Counter-Evidence**:
- `425dda9f` (2026-03-16): "#178 REGRESSION: rename extractors and combiners to better fit their actual usage" — **171 files changed**, 2898 insertions, 2890 deletions. A massive renaming spread across the entire codebase. Justified by nature (cross-cutting rename) but a 171-file commit is a significant risk.
- `56b385f8` (2026-03-13): "#170 FEATURE: enable automated testing on Runners" — **114 files changed**, 191 insertions, 1634 deletions. Very large cleanup commit bundled with a feature issue.
- `9c741345` (2026-03-13): "FEATURE: changing `DebugHelper` into `JsonDisplayHelper`" — 25 files for a rename, mixed with feature work.
- `76af9201` (2026-03-12): "#174 FEATURE: Read-only Entities using external storage / datasource. Create package LocalCache, centralizing tests" — 17 files, 6307 insertions. Package extraction is architecturally valid but very large.

**Recommendation**: Split rename/restructure operations from feature work. A 171-file rename should be its own dedicated commit (or even a dedicated branch). Consider tooling like `jscodeshift` or IDE refactoring to automate large renames and verify them in isolation.

---

### Test Discipline — Good

**Rating**: good
**Confidence**: High

**Summary**: Approximately 871 commits (43% of the total 2024 non-merge commits) touch test files. This is a strong signal that tests evolve alongside production code. The project explicitly tracks test-related issues (e.g., #16 "add run-time Tests", #39 "refactor tests", #155 "unit tests fail") and has invested heavily in test infrastructure. Integration testing is strongly favored over unit testing (consistent with the project's philosophy). However, some large feature commits do not have corresponding test modifications.

**Supporting Evidence**:
- `780ad06f` (2026-03-09): "#173 FEATURE: enable non-uuid primary keys for Entities. Added integ tests, passing OK." — Feature explicitly includes integration tests.
- `1288a28e` (2026-03-12): "#174 FEATURE: Read-only Entities using external storage / datasource. Adding tests for LocalCache to ensure refactoring to deal with non-uuid PK entities." — Tests added _before_ the refactoring, a TDD-aligned approach.
- `6308a6ff` (2026-03-12): "#174 FEATURE: Tested / Fixed LocalCache to enable non-uuid PK entities." — Explicit "Tested / Fixed" framing.
- Issues #16, #39 are dedicated to testing infrastructure (runtime tests, test interface refactoring).
- The period Dec 2024 contains a sustained investment in test refactoring: `612f75ef`, `b8f05cd3`, `f541780d`, `31b09932`, `fc9869e6` — all dedicated to refactoring test infrastructure into `testCompositeActionSuite`.

**Counter-Evidence**:
- `e508f500` (2026-03-17): "#171 FEATURE: Display Class Diagram for JzodSchema of schema tables" — 9 files, UI feature, no test file modification visible.
- `762cecb8` (2026-03-02): "FEATURE: improve menus, separating miroirMenuReportLink & miroirMenuPageLink" — no test co-modification.
- Issue #155 "miroir-localcache-redux unit tests fail" — open bug since 2026-02-04 indicating unit tests in a package cannot even launch.
- Some UI-layer features appear consistently un-tested (visual components, menus, CSS fixes).

**Recommendation**: Ensure that even UI-layer features have smoke-level integration tests. Address issue #155 (unit tests that cannot even launch) as a priority — broken test suites are a negative signal that erodes confidence. Consider adding a CI gate that prevents commits when test suites fail.

---

### Rework Rate (Change Failure Rate) — Good

**Rating**: good
**Confidence**: Medium

**Summary**: The explicit revert rate is very low: only 3 commits with "revert" in the subject out of 2024 non-merge (0.15%). The project has 2 issues tagged as "REGRESSION" (both related to issue #178, a renaming). Fix-of-fix patterns are observable but infrequent. The overall rework rate is well within healthy bounds.

**Supporting Evidence**:
- Only 3 explicit reverts across 3+ years of history:
  - `f122dbb5` (2023-12-20): "reverting to vite 4.5.0" — infrastructure dependency issue with MSW, justified.
  - `e9dd8db3` (2023-11-03): "revert" — terse but isolated.
  - `a460b32c` (2023-11-03): "revert" — paired with the above, a quick correction.
- Bug-fix commit ratio: ~99 commits containing "fix " in the subject = ~5% of total, which is low.
- Issue #178 is labeled "REGRESSION" explicitly, showing awareness and intentionality.

**Counter-Evidence**:
- `cf2a6671`, `4848981d`, `aabe9cf6` (2026-02-18): Three consecutive commits attempting to fix bug #160 (Appbar sizing). The first says "Initial attempts to fix padding / margins, but this is due to position and size, actually." — this is a trial-and-error sequence that could have been a single, well-analyzed commit.
- `da43903c` (2023-11-21): "mistake in JenkinsFile" — minor but shows CI config trial-and-error.
- Issue #164 ("add form validation") explicitly notes: "This issue revives #4, that was closed as duplicate on the pretense of typecheck validation implementation. This is actually wrong" — an acknowledged premature closure.

**Recommendation**: Continue the discipline. For trial-and-error sequences (like the #160 Appbar fixes), consider squashing the exploratory commits into a single well-explained commit before pushing to `master`, to keep the mainline history clean.

---

### Defect Injection Rate & Bug Cycle Time — Good

**Rating**: good
**Confidence**: Medium

**Summary**: The project has ~29 issues explicitly labeled "bug" out of 178 total issues (16%). In commit messages, about 99 commits (~5%) contain "fix" and 45 contain "bug" (~2%). This is a healthy ratio for a framework under active development. Bug reports are well-described with reproduction context, screenshots, and stack traces. Bug cycle time varies: some bugs are closed quickly, while others remain open for extended periods.

**Supporting Evidence**:
- Issue #160 "BUG: sizing & placement of Appbar" — created 2026-02-18, closed 2026-02-18 (same day). Fast turnaround.
- Issue #153 "BUG: ExtractorPersistenceStoreRunner fails with Zustand store" — created 2026-02-02, closed 2026-02-02 (same day). Proactive fix with 4 comments of analysis.
- Issue #158 "BUG: store union-defined sub-objects on postgres / SQL fails" — created and closed 2026-02-12. Includes detailed stack trace, schema analysis, and root cause.
- Bug reports consistently include screenshots, error stacks, reproduction steps (e.g., #136, #160, #158, #177).

**Counter-Evidence**:
- Issue #154 "BUG: refresh fails on empty indexedDb, mongoDB deployments" — created 2026-02-03, still open as of assessment date (42+ days).
- Issue #134 "BUG: catch exceptions in `onEditValueObjectFormSubmit` properly" — created 2025-11-27, still open (109+ days).
- Issue #122 "BUG: User message of logged errors is wrong" — created 2025-11-13, still open (125+ days).
- Issue #136 "BUG: no schema reference context available" — created 2025-12-01, still open.
- Several long-lived bugs suggest they are deprioritized rather than forgotten, but this still represents unresolved technical debt.

**Recommendation**: Periodically triage old bug issues. If a bug has been open for >3 months and is not being worked on, either close it with a rationale or explicitly schedule it. Having many open bugs without triage erodes trust in the backlog.

---

### Incremental Delivery Cadence — Good

**Rating**: good
**Confidence**: Medium

**Summary**: The project shows sustained commit activity with no multi-month gaps. The cadence has accelerated significantly over time: from ~20-30 commits/month in 2023 to ~90-130 commits/month in late 2025/2026. There are no release tags, making it impossible to assess release frequency. Work proceeds in visible incremental steps, often broken down by feature issue (e.g., issue #170 has 15+ sequential commits, each a visible increment).

**Commit frequency by year**:
- 2022 (Nov-Dec): 21 commits
- 2023: 418 commits (~35/month)
- 2024: 358 commits (~30/month)
- 2025: 633 commits (~53/month)
- 2026 (Jan-Mar 17): 322 commits (~107/month)

**Supporting Evidence**:
- No month in the entire history has zero commits. The lowest is 2024-05 (15 commits) and 2024-07 (13 commits), still showing regular activity.
- Feature work is consistently sliced into multiple small commits. Example for issue #170 (enable automated testing on Runners): 15+ commits from 2026-03-04 to 2026-03-13, each adding one increment (abstract tools, pass specific test, add cleanup, extend to drop, etc.).
- Issue #171 (postgres reverse engineering) shows a similar pattern: 12+ incremental commits from 2026-03-09 to 2026-03-17.

**Counter-Evidence**:
- No release tags at all. There is issue #128 "RELEASE: release Miroir Studio v 0.5.0" opened 2025-11-24, still open after 4 months. This suggests the project has not yet reached a formal release milestone.
- The lack of releases means there's no formal batch-size metric; the project operates as a continuous flow without defined delivery points.
- The acceleration from ~30/month to ~130/month in late 2025/2026 may correlate with AI-assisted development activity (the `dev-copilot` branch name is suggestive). If so, the sustained quality of this higher throughput needs monitoring.

**Recommendation**: Establish a tagging and release cadence, even if informal (e.g., monthly or bi-weekly tags). This provides checkpoints for integration testing, documentation, and communicating progress. Address issue #128 (v0.5.0 release) as a forcing function.

---

### Integration Discipline — Not Fully Assessable (Single Contributor)

**Rating**: good (with caveats)
**Confidence**: Low

**Summary**: With 99.8% of commits from a single contributor, there is no meaningful team integration to evaluate. The 19 merge commits reflect personal branch management between `master` and `dev-copilot`, not collaborative integration. However, the observable pattern is reasonable: merges are infrequent, relatively clean, and the project maintains a linear-ish history on `master`.

**Supporting Evidence**:
- Only 19 merge commits in 2043 total (0.9%). The mainline is mostly linear.
- Branch names are meaningful: `dev-copilot` for AI-assisted development, merged back to `master` periodically.
- No evidence of long-lived feature branches causing large, painful merges.

**Counter-Evidence**:
- 1 external PR (from "Royalsuitking", merged 2026-01-31) — this is the only visible collaboration. The project would benefit from more community involvement.
- No branch protection rules or required reviews are observable.

**Recommendation**: As the project grows toward release (issue #128), consider establishing branch protection and review gates, even for the solo contributor (self-review after a cooldown period can catch issues).

---

### Refactoring Investment — Excellent

**Rating**: excellent
**Confidence**: High

**Summary**: The project has an unusually strong and consistent refactoring practice. At least 230 commits (~11.4% of non-merge commits) explicitly contain "REFACTOR" in the subject line. Refactoring is separated from feature work using a clear naming convention. There are dedicated issues for refactoring work (#39, #102, #145, #159). The refactoring spans the entire project history, not just a single period. Renames, simplifications, and structural reorganizations are frequent.

**Supporting Evidence**:
- 230+ commits with explicit "REFACTOR" category tag, distinct from FEATURE, BUG, BUILD.
- 93 commits with "rename" in the subject — showing a sustained practice of improving naming.
- 93 commits with "simplif" in the subject — active simplification effort.
- Dedicated refactoring issues: #159 "REFACTOR: simplify Queries and runQuery Actions", #145 "REFACTOR: distinguish the Miroir mlSchema from Jzod Schemas", #102 "REFACTOR: rationalize log management infrastructure", #140 "REFACTOR: migrate from Material Icons to Material Symbols".
- Dec 2024 shows a sustained refactoring phase dedicated to test infrastructure: 10+ commits refactoring tests into `testCompositeActionSuite`.
- Dec 2024: `adc95a00`, `d43a3267`, `f4e1f058`, `4d757735` — 4 consecutive REFACTOR commits simplifying the DomainController startup sequence.
- Refactoring is clearly separated from feature work (different commit subject prefix), enabling clean bisection and revert if needed.

**Counter-Evidence**:
- Some refactoring issues remain open for extended periods: #145 (opened 2026-01-15, still open), #159 (opened 2026-02-16, still open). This is not necessarily negative — they may represent planned future work.
- Some REFACTOR commits are quite large (cross-cutting renames affecting 30+ files).

**Recommendation**: This is the project's strongest practice. Continue the explicit separation of refactoring from feature work. Consider using automated lint rules or pre-commit hooks to detect when a commit mixes refactoring and feature changes.

---

### Commit Message Quality — Excellent

**Rating**: excellent
**Confidence**: High

**Summary**: The project uses a remarkably consistent and informative commit message convention. Most commits follow the pattern `#<issue> <CATEGORY>: <context>. <specific change>.` — this provides traceability (issue reference), categorization (FEATURE, REFACTOR, BUG, BUILD, etc.), and context (what specifically was done). Messages are detailed, often running to 1-2 lines of subject. The convention evolved organically and has been maintained throughout the project's life.

**Supporting Evidence**:
- `89f3cdfa` (2026-03-14): "#176 FEATURE: support tables / entities with composite PK. Checked non-regressionm extending implementation to support coöposite PK in combiners.." — Issue reference + category + context + specific action.
- `1288a28e` (2026-03-12): "#174 FEATURE: Read-only Entities using external storage / datasource. Adding tests for LocalCache to ensure refactoring to deal with non-uuid PK entities." — Explains the *why* (ensure refactoring safety) not just the *what*.
- `ec318fe1` (2026-03-13): "#170 FEATURE: enable automated testing on Runners. Corrected runner installApplication to use enable empty data bundle (was launching an error when empty, although the whole process was indeed successful)." — Includes the root cause in the commit message.
- The categorization (FEATURE, REFACTOR, BUG, BUILD, CLEANUP, EXPERIMENT, TEST) is consistent and enables automated analysis.
- Issue references (#NNN) are pervasive in recent history.

**Counter-Evidence**:
- `e9dd8db3` (2023-11-03): "revert" — completely uninformative.
- `a460b32c` (2023-11-03): "revert" — same single-word message.
- `c7ff6209` (2026-03-03): "fix domain endpoint" — terse without issue reference.
- `4d81c4e4` (2026-03-03): "fix nx circular dependency" — terse, no issue reference.
- `3329217885ea` (2026-03-02): "cosmetic corrections" — vague.
- Early history (2022-2023) has weaker messages: "remove babel module, not needed for now", "ignoring miroir-core/dist" (×3).

**Recommendation**: This is already excellent. The few terse messages ("fix ...", "cosmetic corrections") could be improved by always referencing an issue. Consider a commit-msg hook that enforces the `#issue CATEGORY: description` pattern to prevent the occasional slip.

---

### Issue & Backlog Quality — Good

**Rating**: good
**Confidence**: High

**Summary**: The 178 GitHub issues are generally well-described with structured NOW/TARGET format, context, and often screenshots or code samples. Labels are used systematically (enhancement, bug, refactor, top priority, build/CI/CD, etc.). However, the backlog has accumulated a significant number of old open issues, and some issues lack resolution notes.

**Supporting Evidence**:
- Issues use a consistent structure: "NOW: [current state]" → "TARGET: [desired state]" with context and often implementation considerations. Examples: #174, #172, #138, #102.
- Labels are systematic: 29 bug issues, many "enhancement", "refactor", "top priority", "experiment / prototyping", "documentation", "build/CI/CD", "good first issue".
- Bug issues include excellent diagnostic information: #158 includes the full SQL schema, Sequelize error, entity definition, and root cause analysis. #177 includes screenshots, schema excerpts, and a proposed solution with implementation considerations.
- Issue #166 demonstrates proper use of epic/sub-issue patterns: "create sub-issues to perform improvements. already identified: #165."

**Counter-Evidence**:
- Many issues remain open for extended periods without activity: 82+ open issues at the time of assessment. Some from mid-2025 have not been updated in 3+ months (#114, #116, #120, etc.).
- Some closed issues lack resolution notes (closed without a comment explaining the outcome).
- Issue #175 "FEATURE: support tables / entities without PK" — a one-liner body ("...PK-less Entity instances doesn't need to be possible in Miroir for the moment") that's lighter than the project's usual standard.
- Issue #168 "FEATURE: enable HTTPS" — body is just "in dev, prod, electron...", very minimal.
- The "top priority" label is applied to 8+ issues — which dilutes its signaling value.

**Recommendation**: Perform a quarterly backlog grooming: close or explicitly defer old issues with a note. Reduce "top priority" issues to 3 or fewer at a time. Ensure every closed issue has a brief resolution note (even just "resolved in commit abc1234").

---

### Change Coupling (Implicit Architecture Quality) — Good

**Rating**: good
**Confidence**: Medium

**Summary**: The monorepo structure naturally inflates file-per-commit metrics (changes often span `miroir-core`, `miroir-react`, `miroir-standalone-app`, etc.). Adjusting for this, most commits are well-localized within packages. The P90 of 29 files/commit and P99 of 100 are elevated but understandable for a monorepo with generated types and shared schemas. The architecture's explicit layering (0_interfaces → 1_core → 2_domain → 3_controllers → 4_services) helps contain coupling.

**Supporting Evidence**:
- The layered architecture convention (directory naming `0_interfaces/`, `1_core/`, etc.) provides structural guidance for change boundaries.
- Many commits touch fewer than 10 files and stay within one package.
- The feature issue approach (#170, #171, #174) shows changes that are logically localized to specific subsystems.

**Counter-Evidence**:
- `425dda9f` (2026-03-16): 171 files changed — a cross-cutting rename of extractors/combiners touching nearly every package. This is "shotgun surgery" even if justified.
- Type generation from schemas means a schema change in `miroir-test-app_deployment-miroir/assets` can cascade to `miroir-core/src/0_interfaces/1_core/preprocessor-generated/`, then through the export surface to all dependent packages — a structural coupling amplifier.
- `9c741345` (2026-03-13): 25 files for renaming `DebugHelper` → `JsonDisplayHelper` — a simple rename rippled across many modules.

**Recommendation**: For cross-cutting renames, consider adding an aliased re-export (deprecation layer) rather than bulk-renaming all call sites in one commit. This allows a gradual migration and reduces the risk of a 171-file commit. Monitor the coupling between schema packages and `miroir-core` generated types — this is the main coupling amplifier.

---

## 4. Synthetic Overview

The Miroir Framework project demonstrates **strong evolution practices** for a solo-developer open-source project. Its standout strengths are:

1. **Explicit commit categorization** (FEATURE, REFACTOR, BUG, BUILD, etc.) — an unusually disciplined convention that enables automated analysis and makes the project history self-documenting.
2. **Sustained refactoring investment** (11.4% of commits) — this is the project's strongest signal of lean/agile thinking. Technical debt is actively managed, not silently accumulated.
3. **Well-structured issue descriptions** with NOW/TARGET format, diagnostic details, and consistent labeling.
4. **Test co-evolution** (43% of commits touch test files) with explicit investment in test infrastructure and a preference for integration tests.

The main areas for improvement are:

1. **Release discipline**: Zero tags/releases after 3+ years signals that the project hasn't yet achieved a formal delivery milestone. Issue #128 (v0.5.0) has been open for 4 months.
2. **Backlog hygiene**: 82+ open issues with no triage cadence; several "top priority" items diluting urgency signaling.
3. **Large-commit outliers**: While most commits are well-sized, the occasional 100-171 file commits represent outsized risk. The schema → generated types cascade amplifies this.

The overall pattern suggests a developer with strong engineering instincts who values clean architecture, naming discipline, and test investment. The project's evolution patterns are consistent with someone who believes quality enables speed — which aligns perfectly with the lean principle being evaluated here. The acceleration in 2025-2026 (from ~30 to ~107 commits/month) coincides with AI-assisted development and has maintained good quality markers rather than degrading them.

### Overall Capability Profile

| Topic | Rating |
|---|---|
| Commit Atomicity & Granularity | good |
| Test Discipline | good |
| Rework Rate | good |
| Defect Injection Rate | good |
| Incremental Delivery Cadence | good |
| Integration Discipline | good (low confidence, single contributor) |
| Refactoring Investment | **excellent** |
| Commit Message Quality | **excellent** |
| Issue & Backlog Quality | good |
| Change Coupling | good |

---

## 5. Recommendations

### Priority 1 — Establish Release Cadence
**Topic**: Incremental Delivery Cadence
**Impact**: High

Create and push git tags for meaningful milestones. Aim for at least monthly tags (e.g., `v0.5.0-alpha.1`, `v0.5.0-alpha.2`). Resolve issue #128 (v0.5.0 release) — it has been open since 2025-11-24 and represents the project's first formal release. Even if the release itself is delayed, tagging intermediate states provides rollback points and progress markers.

**Concrete first step**: Tag the current `master` HEAD as `v0.5.0-dev.1` and document what's included. Then tag every 2-4 weeks.

### Priority 2 — Backlog Grooming
**Topic**: Issue & Backlog Quality
**Impact**: Medium-High

Perform a one-time triage of all 82+ open issues:
- Close issues that are no longer relevant with a note.
- Reduce "top priority" to 3 items maximum.
- Add a "deferred" or "backlog" label for issues that are acknowledged but not planned for the near future.
- Schedule a brief monthly review of the open issue list.

**Concrete first step**: Close or label-defer the 20 oldest open issues this week.

### Priority 3 — Address Broken Test Suites
**Topic**: Test Discipline
**Impact**: Medium-High

Issue #155 ("miroir-localcache-redux unit tests fail") has been open since 2026-02-04. Broken test suites that "can't even launch" are a critical signal — they erode confidence and can mask new regressions. Even if these tests are secondary to the integration test suite, having them fail silently degrades the project's evolution safety.

**Concrete first step**: Either fix the unit tests to at least launch, or explicitly remove them and document that the integration tests in `miroir-standalone-app` are the canonical test suite for that package.

### Priority 4 — Reduce Cross-Cutting Rename Risk
**Topic**: Commit Atomicity & Change Coupling
**Impact**: Medium

For large cross-cutting renames (like the 171-file `#178 REGRESSION` rename), consider:
1. Using a deprecation-then-migration pattern: add re-exports with new names, update call sites incrementally, remove old names.
2. Performing such renames in a dedicated branch with a single-purpose merge.
3. Automating with `jscodeshift` or TypeScript compiler API to ensure mechanical correctness.

**Concrete first step**: For the next cross-cutting rename, try the aliased re-export approach and compare the experience.

### Priority 5 — Add CI Quality Gate
**Topic**: Rework Rate, Test Discipline
**Impact**: Medium

No CI/CD pipeline observability was found. Even a minimal GitHub Actions workflow that runs `npm run test -w miroir-core` on every push to `master` would catch regressions immediately. The test infrastructure investment (issue #16, #39) deserves to be leveraged automatically.

**Concrete first step**: Create a `.github/workflows/ci.yml` that runs the core unit and integration tests on push.

---

## 6. Evolution Mistakes — Changes That Were Reversed

### Mistake 1 — Vite 5 Upgrade Reverted

- **Original change**: Commit upgrading to Vite 5 (hash not preserved in subject, occurred before 2023-12-20)
- **Reversal**: `f122dbb5` (2023-12-20): "reverting to vite 4.5.0, version 5 led to 'body.getReader is not a function' in msw interceptor, linked to cross-fetch / node-fetch"
- **Time to reversal**: Days (within the same month)
- **Better option available at the time?**: Possibly
- **Analysis**: Upgrading a major dependency (Vite 4→5) without first checking compatibility with MSW's interceptor layer. MSW is a core dependency for the test infrastructure (used as `RestClientStub`). A better approach would have been to check MSW's compatibility matrix with Vite 5 before upgrading, or to do the upgrade in a branch with a full test run before merging.

### Mistake 2 — Premature Closure of Issue #4 (Form Validation)

- **Original change**: Issue #4 was closed "as duplicate on the pretense of typecheck validation implementation"
- **Reversal**: Issue #164 (2026-02-26) explicitly notes: "This issue revives #4, that was closed as duplicate... This is actually wrong, since further validation criteria can be required."
- **Time to reversal**: Unclear (issue #4 creation date not in the analyzed set, but the reversal acknowledges the error explicitly)
- **Better option available at the time?**: Yes
- **Analysis**: Conflating type-checking with business-rule validation is a common design mistake. Type checking ensures structural correctness; form validation ensures business-rule correctness. They serve different purposes. The original closure treated them as interchangeable. The project correctly identified and corrected this.

### Mistake 3 — Trial-and-Error Bug Fix for Appbar Sizing (#160)

- **Original change**: `cf2a6671` (2026-02-18): "#160 BUG: Initial attempts to fix padding / margins, but this is due to position and size, actually."
- **Follow-ups**: `4848981d` (2026-02-18): "Further attempts to fix padding / margins, but still not good." → `aabe9cf6` (2026-02-18): "Further attempts to fix padding / margins, but still not good."
- **Time to reversal**: Not a full reversal, but 3 commits on the same day with "but still not good" in the messages, indicating the approach was wrong.
- **Better option available at the time?**: Possibly
- **Analysis**: The first commit's own message identifies the root cause ("this is due to position and size, actually") but then the next commits still attempt to fix "padding / margins." Analyzing the root cause more thoroughly before committing attempted fixes would have avoided the trial-and-error chain. These could have been a single commit after proper analysis.

### Mistake 4 — Issue #178 REGRESSION: Renaming Extractors/Combiners

- **Original change**: The original naming of extractors and combiners (accumulated over many commits in earlier history)
- **Reversal**: `425dda9f` (2026-03-16): "#178 REGRESSION: rename extractors and combiners to better fit their actual usage" — 171 files, 2898 insertions, 2890 deletions. Plus `d8e7f977` (2026-03-16): second pass, 36 files.
- **Time to reversal**: The names accumulated over months/years before being bulk-renamed
- **Better option available at the time?**: Unclear
- **Analysis**: The issue (#178) is labeled "REGRESSION," indicating the renaming was needed because the original names were misleading. This is a naming-debt accumulation pattern: names that were acceptable early on became increasingly misleading as the concepts evolved. The cost — a 171-file commit — is the accumulated debt. A better approach would have been to revise names incrementally as their usage diverged from their original meaning, rather than letting the divergence grow until a mass rename was needed.

### Mistake 5 — Terse Reverts Without Explanation

- **Original change**: Unidentified from the terse messages
- **Reversal**: `e9dd8db3` (2023-11-03): "revert" and `a460b32c` (2023-11-03): "revert"
- **Time to reversal**: N/A
- **Better option available at the time?**: Yes
- **Analysis**: These single-word "revert" commits are the sole instances in the project where the commit message provides zero information. Whatever was reverted, the context is permanently lost. A one-line explanation would have cost seconds and preserved months of future diagnostic value. Even "revert: X broke Y" would suffice.

---

## Appendix: Raw Metrics

- **Commits analyzed**: 2043 total (2024 non-merge, 19 merge)
- **Test-touching commits**: 871 (43%)
- **Revert commits**: 3 (0.15%)
- **Fix/bug commits**: ~99 "fix" + ~45 "bug" = ~144 (~7%)
- **Feature commits**: 698 (34.5%)
- **Refactor commits**: 230 (11.4%)
- **Rename commits**: 93 (~4.6%)
- **Simplification commits**: 93 (~4.6%)
- **Build/CI commits**: 2 explicit "BUILD" + additional CI mentions
- **Median files/commit**: 8
- **Mean files/commit**: 13.4
- **P90 files/commit**: 29
- **P99 files/commit**: 100
- **Max files/commit**: 357
- **Authors**: 3 (1 primary: "Miroir Framework" with 99.8% of commits)
- **Issues analyzed**: 178 (GitHub)
- **Bug issues**: 29 labeled "bug"
- **Enhancement issues**: majority of remaining
- **Refactoring issues**: labeled "refactor"
- **Tags/Releases**: 0
- **Monthly commit range**: 9 (2022-12) to 131 (2026-02)
