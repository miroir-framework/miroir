# Miroir Skills Directory

This directory indexes Miroir Framework agent skills. Skill files live under [`.agents/skills/`](../../.agents/skills/).

## Available Skills

### Transformer Skills

#### 📦 [miroir-edit-transformers](../../.agents/skills/miroir-edit-transformers/)
Create and update **library-implemented** transformers - those requiring TypeScript handler functions.

**Use when:**
- Creating low-level, reusable transformation primitives
- Need TypeScript implementation
- Want SQL execution support
- Building operators and fundamental transformers

**Examples**: `ifThenElse`, `mapList`, `aggregate`, `createObject`

---

#### 🔗 [miroir-edit-composite-transformers](../../.agents/skills/miroir-edit-composite-transformers/)
Create and update **composite** transformers - those composed entirely of other transformers.

**Use when:**
- Building domain-specific transformations
- Can express logic through composition
- Want rapid development without TypeScript
- No SQL execution needed

**Examples**: `spreadSheetToJzodSchema`, format conversions, data pipelines

---

### Query Skills

#### 🔍 [miroir-edit-queries](../../.agents/skills/miroir-edit-queries/)
Create and update **Miroir Queries** (with Extractors, Combiners, and Transformers) using TDD practices.

**Use when:**
- Creating data access patterns with extractors
- Building query templates with build-time interpolation
- Implementing foreign key joins with combiners
- Transforming query results with runtime transformers
- Working with `boxedQueryWithExtractorCombinerTransformer`

**Examples**: Object fetching, filtered lists, FK joins, many-to-many relations

---

### Process & Quality Skills

#### 📊 [assess-evolution-quality](../../.agents/skills/assess-evolution-quality/)
Assess the quality of a software project **evolution** from its git history and GitHub issue history.

**Use when:**
- Wanting a structured evaluation of how well a project evolves (lean/agile lens)
- Reviewing a team's practices around commits, tests, refactoring, and issue management
- Identifying mistakes — changes that were later reversed — and their root causes
- Getting prioritized recommendations to improve evolution throughput and quality

**Output**: A comprehensive MD report with topic ratings (lacking / good / excellent), examples,
counter-examples, and a "Mistakes" catalogue of reversed decisions.

**Arguments**: `[repo-path] [output-report.md]`

---

### Other Skills

#### [create-skill](../../.agents/skills/create-skill/)
Tools for creating new Copilot skills.

#### [query-editor](../../.agents/skills/query-editor/)
Legacy query/transformer workflow (see [miroir-edit-queries](../../.agents/skills/miroir-edit-queries/) for TDD-focused query work).

---

## Architecture Documentation

### [TRANSFORMER-SKILLS-ARCHITECTURE.md](TRANSFORMER-SKILLS-ARCHITECTURE.md)
Comprehensive guide explaining:
- Why we use two separate transformer skills
- How to choose between library and composite transformers
- Workflow comparisons
- Migration guide from old unified skill

---

## Skill Selection Guide

### "I want to create a query..."

**→ With extractors, combiners, or filters?**
  - Yes → Use [miroir-edit-queries](../../.agents/skills/miroir-edit-queries/)

**→ Following TDD practices?**
  - Yes → Use [miroir-edit-queries](../../.agents/skills/miroir-edit-queries/)

### "I want to create a transformer..."

**→ With TypeScript code?**
  - Yes → Use [miroir-edit-transformers](../../.agents/skills/miroir-edit-transformers/)
  - No → Use [miroir-edit-composite-transformers](../../.agents/skills/miroir-edit-composite-transformers/)

**→ By composing existing transformers?**
  - Yes → Use [miroir-edit-composite-transformers](../../.agents/skills/miroir-edit-composite-transformers/)
  - No, I need custom logic → Use [miroir-edit-transformers](../../.agents/skills/miroir-edit-transformers/)

**→ For fundamental operations?**
  - Yes → Use [miroir-edit-transformers](../../.agents/skills/miroir-edit-transformers/)
  - No, for domain-specific logic → Use [miroir-edit-composite-transformers](../../.agents/skills/miroir-edit-composite-transformers/)

---

## Quick Start

### Library Transformer
```bash
# Invoke skill
/miroir-edit-transformers create myTransformer

# Or natural language
"Create a library transformer called stringConcat with TypeScript implementation"
```

### Composite Transformer
```bash
# Invoke skill
/miroir-edit-composite-transformers create myCompositeTransformer

# Or natural language
"Create a composite transformer that filters active users and formats their data"
```

---

## Testing Commands

Transformer skills use **MiroirTest** suites (registry key `miroirCoreTransformers` for the main transformer catalog):

```bash
# Preferred — MiroirTest CLI
npm run testMiroir -w miroir-core -- --suites miroirCoreTransformers --mode unit
npm run testMiroir -w miroir-core -- --suites miroirCoreTransformers --mode integration

# Per-file vitest (legacy selective gate)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
npm run testMiroir -w miroir-standalone-app -- --suites miroirCoreTransformers --mode integration

# devBuild (only for library transformers)
npm run devBuild -w miroir-core
```

See `docs/guides/developer/testing.md` and `docs/contributing/testing.md`.

---

## Skill Structure

Each skill contains:
- **SKILL.md** - Complete step-by-step workflow instructions
- **README.md** - Quick reference and overview
- **examples.md** - Real-world examples with complete code
- **template-*.json** - JSON templates for quick starts

---

## Comparison: Library vs Composite Transformers

| Aspect | Library | Composite |
|--------|---------|-----------|
| **Code Required** | TypeScript | JSON only |
| **Files Modified** | 6 files | 3 files |
| **Workflow Steps** | 8 steps | 5 steps |
| **devBuild Needed** | ✅ Yes | ❌ No |
| **Schema Registration** | ✅ Required | ❌ Not needed |
| **SQL Execution** | ✅ Optional | ❌ No |
| **Development Time** | Longer | Faster |
| **Complexity** | Higher | Lower |
| **Use Case** | Primitives, operators | Domain logic, pipelines |

---

## Historical Note

### edit-transformers-OLD/
This is the original unified transformer skill that handled both library and composite transformers. It has been **replaced** by the two specialized skills above and should **not be used** for new work.

**Kept for reference only** - demonstrates the architecture decision rationale.

---

## See Also

- [Miroir Framework Documentation](../../docs/)
- [Transformer Documentation](../../docs-OLD/transformers/)
- [Contributing Guide](../../docs/contributing/)

---

## Contributing

When creating new skills:
1. Use [create-skill](../../.agents/skills/create-skill/) as a template
2. Follow the established pattern (SKILL.md, README.md, examples.md)
3. Include JSON templates where applicable
4. Add comprehensive examples
5. Update this README with the new skill
