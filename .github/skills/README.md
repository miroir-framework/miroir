# Miroir Skills Directory

This directory contains AI Copilot skills for working with the Miroir Framework.

## Available Skills

### Transformer Skills

#### 📦 [edit-library-transformers](edit-library-transformers/)
Create and update **library-implemented** transformers - those requiring TypeScript handler functions.

**Use when:**
- Creating low-level, reusable transformation primitives
- Need TypeScript implementation
- Want SQL execution support
- Building operators and fundamental transformers

**Examples**: `ifThenElse`, `mapList`, `aggregate`, `createObject`

---

#### 🔗 [edit-composite-transformers](edit-composite-transformers/)
Create and update **composite** transformers - those composed entirely of other transformers.

**Use when:**
- Building domain-specific transformations
- Can express logic through composition
- Want rapid development without TypeScript
- No SQL execution needed

**Examples**: `spreadSheetToJzodSchema`, format conversions, data pipelines

---

### Other Skills

#### [create-skill](create-skill/)
Tools for creating new Copilot skills.

#### [query-editor](query-editor/)
Work with Miroir queries and extractors.

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

### "I want to create a transformer..."

**→ With TypeScript code?**
  - Yes → Use [edit-library-transformers](edit-library-transformers/)
  - No → Use [edit-composite-transformers](edit-composite-transformers/)

**→ By composing existing transformers?**
  - Yes → Use [edit-composite-transformers](edit-composite-transformers/)
  - No, I need custom logic → Use [edit-library-transformers](edit-library-transformers/)

**→ For fundamental operations?**
  - Yes → Use [edit-library-transformers](edit-library-transformers/)
  - No, for domain-specific logic → Use [edit-composite-transformers](edit-composite-transformers/)

---

## Quick Start

### Library Transformer
```bash
# Invoke skill
/edit-library-transformers create myTransformer

# Or natural language
"Create a library transformer called stringConcat with TypeScript implementation"
```

### Composite Transformer
```bash
# Invoke skill
/edit-composite-transformers create myCompositeTransformer

# Or natural language
"Create a composite transformer that filters active users and formats their data"
```

---

## Testing Commands

Both transformer skills use the same test infrastructure:

```bash
# Unit tests (in-memory execution)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Integration tests (database execution with PostgreSQL)
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'

# devBuild (only for library transformers)
npm run devBuild -w miroir-core
```

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
1. Use [create-skill](create-skill/) as a template
2. Follow the established pattern (SKILL.md, README.md, examples.md)
3. Include JSON templates where applicable
4. Add comprehensive examples
5. Update this README with the new skill
