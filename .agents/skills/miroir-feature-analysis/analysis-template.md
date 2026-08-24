# <NNN> — <Title>

> <1–3 line abstract: what this analysis covers and why now.>

Related issue: https://github.com/miroir-framework/miroir/issues/<NNN>
Parent issue: <link or remove> · Prerequisite: <link + status ✅ or remove>
Related analyses: [`../<NNN>-<TYPE>-<slug>/analysis.md`](../<NNN>-<TYPE>-<slug>/analysis.md)
Key sources: [`packages/...`](../../../packages/...)

**Document role:** <only if more than a plain analysis — e.g. "analysis and architectural decision record".>
**Status:** <analysis in progress | decisions confirmed | implemented — see tdd-implementation-plan.md>

---

## Decision record

<Include only when design choices exist. Choices are confirmed with the user before finalizing.>

| Decision | Choice |
|---|---|
| <question 1> | **<chosen option>** — <one-line justification> |
| <question 2> | **<chosen option>** — <one-line justification> |

**Rationale:** <shared drivers across decisions.>

### D1 — <decision question 1>

**Status:** Accepted — <chosen option>.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. <option>** ★ | <how it works> | <pros> | <cons> |
| D1-b. <option> | <how it works> | <pros> | <cons — include why rejected> |

**Decision:** D1-a. <note on whether rejected options may be revisited later, and by which issue.>

---

## 1. Goals

1. **<name>** — In order to <benefit> as a <role>, I can <capability>.
2. **<name>** — In order to <benefit> as a <role>, I can <capability>.

## 2. Non-goals

- <excluded work> (owned by #<NNN>).
- <excluded work> (later, unscheduled).

## 3. Current state

<Factual baseline. Cite real paths / functions / UUIDs. Split into aligned vs misaligned when the issue fixes a drift between two parts of the system.>

### 3.1 <Sub-area> (<aligned|misaligned>)

```typescript
// <real code illustrating the current behavior; mark removed/historical code explicitly>
```

- <fact 1 with file reference>
- <fact 2 with file reference>

## 4. Key reuse

<Include when existing pieces are consumed rather than rebuilt.>

| Piece | Location |
|-------|----------|
| <name> | `packages/...` |
| <model element> | uuid `<uuid>` |

## 5. Proposals / options

<Include when several implementation routes exist. Evaluate impact and effort.>

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | <name> | <high/med/low> | <high/med/low> | <adopt / defer / reject> |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written after this analysis is confirmed, following the `miroir-analysis-to-tdd-plan` skill).
