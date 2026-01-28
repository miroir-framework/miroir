# Miroir vs Alternatives: Competitive Analysis

**Estimated reading time: 15 minutes**

This guide compares Miroir Framework with over 30 similar platforms in the low-code, model-driven, and meta-programming space.

---

## Quick Comparison: Miroir's Unique Differentiators

| Feature | Miroir | Hasura/PostgREST | Retool/ToolJet | OutSystems/Mendix | Salesforce |
|---------|--------|------------------|----------------|-------------------|------------|
| **Full-Stack** (DB + API + UI) | ✅ | ❌ (API only) | ✅ | ✅ | ✅ |
| **Open Source** | ✅ | ✅ | ✅ (limited) | ❌ | ❌ |
| **Multi-Store** (SQL/NoSQL/Files) | ✅ | ❌ | Limited | ❌ | ❌ |
| **AI/MCP Integration** | ✅ | ❌ | ❌ | ❌ | Partial |
| **Portable Logic** (Client/Server/DB) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Meta-Language** (Jzod) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Development-Runtime Integration** | ✅ | ❌ | Partial | ❌ | ❌ |
| **General Purpose** | ✅ | ✅ | ✅ | ✅ | ❌ (CRM-focused) |
| **No Vendor Lock-in** | ✅ | ✅ | Partial | ❌ | ❌ |

---

## Open Source Alternatives

### API-Focused Platforms

#### [Hasura](https://hasura.io) (Apache 2.0)

**What it does**: Auto-generates GraphQL APIs from PostgreSQL schemas

**Similarities**:
- Schema-first approach
- PostgreSQL support with real-time capabilities
- Declarative configuration

**Key Differences**:
- ❌ API-only (no UI generation)
- ❌ No meta-language for schema evolution
- ❌ GraphQL-only (Miroir supports multiple query patterns)
- ❌ No IndexedDB/filesystem support
- ❌ No development-runtime integration

**Best for**: Teams needing instant GraphQL APIs from existing PostgreSQL databases

---

#### [PostgREST](https://postgrest.org) (MIT)

**What it does**: Generates RESTful APIs from PostgreSQL schemas

**Similarities**:
- Schema-driven API generation
- Reduces CRUD boilerplate

**Key Differences**:
- ❌ REST API only (no UI, no client components)
- ❌ No entity versioning
- ❌ SQL-only (no multi-store support)
- ❌ No meta-modeling layer

**Best for**: Microservices needing simple REST APIs over PostgreSQL

---

#### [Supabase](https://supabase.com) (Apache 2.0)

**What it does**: Open-source Firebase alternative with PostgreSQL, auth, and real-time

**Similarities**:
- Full-stack platform (database + auth + APIs)
- PostgreSQL-based
- Real-time subscriptions

**Key Differences**:
- ❌ Traditional SQL schemas (not Jzod meta-language)
- ❌ No report/UI generation
- ❌ PostgreSQL-only
- ❌ Not designed for runtime-development integration
- ❌ No portable transformers

**Best for**: Teams wanting Firebase-like experience with PostgreSQL

---

### Low-Code UI Builders

#### [ToolJet](https://tooljet.com) (GPL-3.0)

**What it does**: Low-code platform for building internal tools

**Similarities**:
- Visual UI builder
- Multiple data source connectors
- Queries and transformations

**Key Differences**:
- ❌ UI-focused (built model not reusable elsewhere)
- ❌ No entity versioning
- ❌ No Jzod-like meta-schemas
- ❌ Limited client/server code reuse
- ❌ No database-executable transformers

**Best for**: Non-developers building internal dashboards

---

#### [Budibase](https://budibase.com) (GPL-3.0)

**What it does**: Open-source low-code platform

**Similarities**:
- Visual application builder
- Multiple data sources
- Self-hostable

**Key Differences**:
- ❌ UI-builder focused (not model-driven)
- ❌ No formal meta-language
- ❌ Limited entity versioning
- ❌ No IndexedDB/filesystem as primary stores
- ❌ Not designed for DSL creation

**Best for**: Building simple CRUD apps without code

---

#### [Appsmith](https://appsmith.com) (Apache 2.0)

**What it does**: Low-code platform for internal applications

**Similarities**:
- Visual UI builder
- Multiple data connectors
- JavaScript transformations
- Git integration

**Key Differences**:
- ❌ UI-first (not model-first)
- ❌ JavaScript transformations (not declarative)
- ❌ No database-executable logic
- ❌ No meta-schemas
- ❌ Development and runtime are separate

**Best for**: Developers building internal tools quickly

---

### Headless CMS Platforms

#### [Directus](https://directus.io) (GPL-3.0)

**What it does**: Headless CMS wrapping databases with auto-generated APIs and admin UI

**Similarities**:
- Schema-based with visual modeling
- Multiple database backends
- Data transformation (Flows)
- Version control for schemas

**Key Differences**:
- ❌ CMS-focused (not general development framework)
- ❌ No Jzod-like bootstrapped meta-language
- ❌ Admin UI (not end-user app UI)
- ❌ No development-runtime integration
- ❌ Workflow transformations (not pure functional)
- ❌ No IndexedDB primary store support

**Best for**: Content-driven websites and applications

---

#### [Strapi](https://strapi.io) (MIT Community / Proprietary Enterprise)

**What it does**: Headless CMS with API generation

**Similarities**:
- Content-type modeling
- API auto-generation
- Plugin architecture

**Key Differences**:
- ❌ CMS-focused
- ❌ Content types less formal than Jzod
- ❌ No end-user UI generation
- ❌ Primarily SQL databases
- ❌ Logic not portable across contexts

**Best for**: Content management systems

---

### Full-Stack Frameworks

#### [RedwoodJS](https://redwoodjs.com) (MIT)

**What it does**: Opinionated full-stack JavaScript framework

**Similarities**:
- Full-stack with clear conventions
- GraphQL data layer
- Integrated testing

**Key Differences**:
- ❌ Code-first (not declarative/model-first)
- ❌ Schemas in code (Prisma), not runtime-interpretable
- ❌ No visual modeling
- ❌ No multi-store support
- ❌ No development-runtime integration
- ❌ No meta-language/DSL facilities

**Best for**: Traditional full-stack JavaScript development

---

## Proprietary Alternatives

### Enterprise Low-Code Platforms

#### [OutSystems](https://www.outsystems.com)

**License**: Proprietary

**Similarities**:
- Visual development
- Model-driven architecture
- Full-stack capabilities

**Key Differences**:
- ❌ Proprietary (vendor lock-in)
- ❌ Expensive licensing
- ❌ Cloud-only deployment options
- ❌ No source code access
- ❌ Not AI-ready (no MCP)

**Best for**: Large enterprises with budget for commercial platforms

---

#### [Mendix](https://www.mendix.com)

**License**: Proprietary

**Similarities**:
- Low-code visual development
- Model-driven approach
- Full application lifecycle

**Key Differences**:
- ❌ Proprietary platform
- ❌ Vendor lock-in
- ❌ Expensive for scale
- ❌ Limited customization
- ❌ Not open source

**Best for**: Enterprises standardizing on Siemens stack

---

#### [Retool](https://retool.com)

**License**: Proprietary

**Similarities**:
- Rapid internal tool development
- Multiple data connectors
- Component-based UI

**Key Differences**:
- ❌ SaaS-only (limited self-hosting)
- ❌ UI-focused (not model-driven)
- ❌ Expensive pricing tiers
- ❌ JavaScript-based logic (not declarative)
- ❌ No multi-store abstraction

**Best for**: Teams needing quick internal dashboards with support contracts

---

#### [Microsoft Power Apps](https://powerapps.microsoft.com)

**License**: Proprietary

**Similarities**:
- Low-code platform
- Multiple data connectors
- Integration with business tools

**Key Differences**:
- ❌ Microsoft ecosystem lock-in
- ❌ Per-user licensing costs
- ❌ Limited outside Microsoft stack
- ❌ Not open source
- ❌ Formula-based (not Jzod)

**Best for**: Organizations heavily invested in Microsoft 365

---

#### [Salesforce Platform](https://www.salesforce.com/platform)

**License**: Proprietary

**Similarities**:
- Declarative development
- Metadata-driven architecture
- Custom object modeling

**Key Differences**:
- ❌ CRM-focused (not general purpose)
- ❌ Extremely expensive
- ❌ Vendor lock-in
- ❌ Proprietary Apex language
- ❌ Cloud-only

**Best for**: CRM-centric enterprises with large budgets

---

## Why Choose Miroir?

### Unique Combination of Features

Miroir is the **only platform** offering:

1. ✅ **Open Source** - Full source access, MIT license
2. ✅ **Full-Stack** - Database + API + UI from one model
3. ✅ **Multi-Store** - PostgreSQL, IndexedDB, Filesystem (swap without code changes)
4. ✅ **Portable Logic** - Run business logic on client, server, OR in-database (SQL)
5. ✅ **AI-Ready** - Native Model Context Protocol (MCP) support
6. ✅ **Bootstrapped Meta-Model** - Self-describing schemas (Jzod)
7. ✅ **Development-Runtime Integration** - Smalltalk-inspired immediate feedback
8. ✅ **General Purpose** - Not limited to specific use case or industry

### When to Choose Miroir Over Alternatives

Choose Miroir when you need:

| Requirement | Choose Miroir | Alternative |
|-------------|---------------|-------------|
| **Full control (no vendor lock-in)** | ✅ | ❌ Proprietary platforms |
| **Multi-store flexibility** | ✅ Miroir | ❌ Most platforms lock to one DB |
| **Portable business logic** | ✅ Miroir | ❌ Logic tied to one execution context |
| **AI/LLM integration** | ✅ Miroir (MCP) | ❌ Most platforms lack AI support |
| **Start small, scale big** | ✅ Miroir | ❌ Enterprise platforms over-engineered for small projects |
| **Model-driven + Low-code** | ✅ Miroir | Partial (most focus on one or the other) |
| **Immediate feedback** | ✅ Miroir | ❌ Traditional compile-deploy-test cycle |
| **Free and open source** | ✅ Miroir | ❌ Proprietary platforms have licensing costs |

---

## Detailed Comparison Tables

For complete details on how Miroir compares to 30+ alternatives, see:

**[Full Comparison Document →](../../docs-OLD/comparison-OSS-licensed-Claude-Sonnet_4_point_5.md)**

Includes detailed analysis of:
- 17 open-source platforms
- 14 proprietary platforms
- Synoptic comparison tables
- Feature-by-feature breakdowns

---

## Next Steps

**Convinced Miroir is right for you?**

- **[Try the Quickstart →](../getting-started/quickstart.md)** - Get up and running in 15 minutes
- **[Read Why Miroir →](why-miroir.md)** - Understand the philosophy
- **[Explore Core Concepts →](core-concepts.md)** - Learn how Miroir works

**Still evaluating?**

- **[See Use Cases →](use-cases.md)** - Real-world scenarios
- **[Read the FAQ →](faq.md)** - Common questions answered
- **[Join the Discussion →](https://github.com/miroir-framework/miroir/discussions)** - **Coming Soon**

---

**[← Back to Documentation Index](../index.md)**
