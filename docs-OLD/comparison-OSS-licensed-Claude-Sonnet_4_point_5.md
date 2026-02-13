# Miroir Framework: Comparison with Similar Projects

This document compares the Miroir Framework with other platforms that share similar goals or approaches in the low-code, model-driven, or meta-programming space.

## Open Source Projects

### 1. [Hasura](https://hasura.io)

**License:** Apache 2.0

**Similarities:**
- Schema-first approach: Auto-generates GraphQL APIs from database schemas
- Supports PostgreSQL with real-time capabilities
- Bridges the gap between data models and application APIs
- Declarative configuration approach

**Differences:**
- Hasura is focused solely on API generation, not a full development environment
- No built-in UI generation or report builders
- No meta-language like Jzod for schema evolution
- Limited to GraphQL; Miroir supports multiple data access patterns (Queries, Transformers)
- No integrated development-runtime environment like Miroir's Smalltalk-inspired approach
- Does not support filesystem or IndexedDB persistence natively

---

### 2. [PostgREST](https://postgrest.org)

**License:** MIT

**Similarities:**
- Schema-driven API generation from PostgreSQL databases
- Declarative approach to backend development
- Reduces boilerplate code for CRUD operations
- RESTful approach to data access

**Differences:**
- Purely REST API generation; no UI, no client-side components
- No versioning system for entity definitions
- No support for non-SQL persistence (IndexedDB, filesystem)
- No query language beyond SQL/PostgREST filters
- Lacks the meta-modeling layer (Jzod schemas)
- No integrated testing or development environment

---

### 3. [Supabase](https://supabase.com)

**License:** Apache 2.0

**Similarities:**
- Full-stack platform with database, authentication, and real-time capabilities
- PostgreSQL-based with schema management
- Provides both client and server components
- Aims to reduce development complexity
- Support for real-time subscriptions

**Differences:**
- Not schema-first in Miroir's sense; uses traditional SQL schemas
- No meta-language for defining entities and transformations
- No built-in report/UI generation system
- Limited to PostgreSQL; no IndexedDB or filesystem stores
- Not designed for runtime-development environment integration
- No built-in support for domain-specific languages (DSLs)
- Authentication-focused rather than model-evolution focused

---

### 4. [Directus](https://directus.io)

**License:** GPL-3.0

**Similarities:**
- Wraps databases with auto-generated APIs and admin UI
- Schema-based approach with visual modeling
- Supports multiple database backends
- Provides data transformation capabilities (Flows)
- Real-time features and webhooks
- Version control for schema changes

**Differences:**
- Primarily a headless CMS rather than a development framework
- No Jzod-like meta-language for bootstrapped schemas
- UI is admin-focused, not end-user application focused
- No integrated development environment with runtime
- Transformations are workflow-based, not pure functional transformers
- Limited support for custom DSLs
- No support for in-memory or browser-based IndexedDB as primary store

---

### 5. [ToolJet](https://tooljet.com)

**License:** GPL-3.0

**Similarities:**
- Low-code platform for building internal tools
- Visual UI builder with drag-and-drop
- Connects to multiple data sources
- Supports queries and transformations
- Open source with self-hosting option

**Differences:**
- Focused on UI/dashboard creation, not full application development
- No meta-model or entity versioning system
- UI-centric rather than model-centric
- No support for Jzod-like schema definitions
- Limited code reusability between client and server
- No integrated development-runtime environment
- Does not support running business logic in the database (SQL transformers)

---

### 6. [Budibase](https://budibase.com)

**License:** GPL-3.0

**tutorial:** [Budibase Review](https://www.youtube.com/watch?v=hQGQ2YW1uDU)

**Similarities:**
- Open source low-code platform
- Visual application builder
- Multiple data source support
- Self-hostable
- Provides both UI and backend logic

**Differences:**
- UI-builder focused rather than model-driven
- No meta-language for schema definitions
- Limited entity versioning and migration support
- No support for IndexedDB or filesystem as primary stores
- Not designed for domain-specific language creation
- No Smalltalk-inspired integrated development approach
- Transformations are not portable across client/server/database

---

### 7. [Strapi](https://strapi.io)

**License:** MIT (Community), Proprietary (Enterprise)

**Similarities:**
- Content-type modeling with visual editor
- API auto-generation from models
- Plugin architecture for extensibility
- Support for versioning and internationalization
- GraphQL and REST API support

**Differences:**
- Headless CMS focus, not a general development framework
- Content-type models are not as formally defined as Jzod schemas
- No built-in UI generation for end-user applications
- Limited multi-store support (primarily SQL databases)
- No integrated development-runtime environment
- Transformers/business logic not first-class citizens
- No support for running logic in multiple execution contexts (client/server/DB)

---

### 8. [KeystoneJS](https://keystonejs.com)

**License:** MIT

**Similarities:**
- GraphQL-based CMS and application framework
- Schema-first approach with TypeScript
- Declarative field definitions
- Extensible architecture
- Admin UI auto-generation

**Differences:**
- CMS-oriented rather than general-purpose development framework
- TypeScript schemas, not runtime-interpretable like Jzod
- No support for multiple persistence backends (IndexedDB, filesystem)
- Limited visual modeling capabilities
- No integrated development environment features
- Transformers and queries not portable across execution contexts
- No meta-modeling or bootstrapped schema approach

---

### 9. [NocoDB](https://nocodb.com)

**License:** GPL-3.0

**Similarities:**
- Transforms databases into smart spreadsheets
- Visual data modeling and manipulation
- Multiple database backend support
- REST and GraphQL API generation
- Open source and self-hostable

**Differences:**
- Spreadsheet interface paradigm, not application development framework
- No formal meta-language for schemas
- UI is table-centric, not customizable application UIs
- No support for complex transformers or domain logic
- Limited report generation beyond grid views
- No development-runtime integration
- Does not support IndexedDB or filesystem as primary stores

---

### 10. [Appsmith](https://appsmith.com)

**License:** Apache 2.0

**Similarities:**
- Low-code platform for internal applications
- Visual UI builder with widgets
- Multiple data source connectors
- JavaScript-based transformations
- Version control integration (Git)

**Differences:**
- UI-first approach rather than model-first
- No formal entity modeling or meta-schemas
- Limited schema versioning and migration
- JavaScript transformations, not declarative transformers
- No support for running logic in database
- No IndexedDB or filesystem store support
- Not designed for DSL creation
- Development and runtime are separate concepts

---

### 11. [RedwoodJS](https://redwoodjs.com)

**License:** MIT

**Similarities:**
- Full-stack JavaScript/TypeScript framework
- Opinionated architecture with clear conventions
- GraphQL-based data layer
- Integrated testing support
- Cell architecture for data fetching patterns
- Aims to reduce boilerplate

**Differences:**
- Traditional code-first framework, not declarative/model-first
- No visual modeling or schema editing
- Schemas defined in code (Prisma), not runtime-interpretable
- No multiple persistence backend support
- No integrated development-runtime environment
- No meta-language or DSL creation facilities
- Not designed for runtime schema evolution

---

### 12. [Blitz.js](https://blitzjs.com)

**License:** MIT

**Similarities:**
- Full-stack React framework
- Convention over configuration
- Integrated development experience
- Built-in authentication and data layer
- TypeScript-first approach

**Differences:**
- Code-first, not model-first or schema-first
- No runtime schema interpretation
- Traditional development workflow (build, deploy)
- No visual modeling tools
- Limited to Node.js/React stack
- No support for multiple persistence backends
- No DSL creation capabilities
- Development and runtime are separate phases

---

### 13. [Forest Admin](https://forestadmin.com)

**License:** GPL-3.0 (Community)

**Similarities:**
- Auto-generates admin interfaces from database schemas
- Supports multiple database types
- Customizable views and actions
- REST API integration

**Differences:**
- Admin panel generator, not application development framework
- No end-user application creation
- Limited to reading existing database schemas
- No meta-language or formal modeling
- No support for IndexedDB or filesystem stores
- Cannot define custom entities beyond database tables
- No integrated development environment
- No support for portable transformers

---

### 14. [Windmill](https://windmill.dev)

**License:** AGPLv3

**Similarities:**
- Developer platform for scripts and workflows
- Supports multiple languages (TypeScript, Python, etc.)
- Visual workflow builder
- Self-hostable
- Version control integration

**Differences:**
- Workflow/script execution platform, not model-driven framework
- No entity modeling or schema definitions
- UI generation is basic forms, not comprehensive applications
- No persistence layer abstraction
- Scripts/workflows not based on declarative schemas
- No meta-language or DSL creation
- Limited data modeling capabilities

---

### 15. [n8n](https://n8n.io)

**License:** Sustainable Use License (source-available)

**Similarities:**
- Workflow automation with visual editor
- Extensible node system
- Self-hostable
- JSON-based configuration
- Multiple integration points

**Differences:**
- Workflow automation tool, not application framework
- No data modeling or entity definitions
- Limited UI generation (primarily for workflow configuration)
- No schema versioning or migrations
- Not designed for full application development
- No support for database schema management
- Workflows, not applications

---

### 16. [Metabase](https://metabase.com)

**License:** AGPLv3

**Similarities:**
- Data exploration and visualization
- Query builder interface
- Multiple database support
- Self-hostable
- Report generation

**Differences:**
- Analytics/BI tool, not application development framework
- Read-only focus (querying), limited data modification
- No entity modeling or schema evolution
- No application UI generation beyond dashboards
- No support for custom business logic/transformers
- Cannot define custom persistence backends
- No integrated development environment

---

### 17. [Grafana](https://grafana.com)

**License:** AGPLv3

**Similarities:**
- Data visualization and dashboards
- Multiple data source support
- Query language abstraction
- Plugin architecture
- Self-hostable

**Differences:**
- Monitoring and observability focus, not general application development
- Time-series oriented
- No entity modeling or CRUD operations
- Read-only dashboards, not interactive applications
- No schema evolution or versioning
- No support for business logic transformers
- Limited to visualization use cases

---

## Proprietary / Non-Open Source Projects

### 1. [Retool](https://retool.com)

**Similarities:**
- Low-code platform for internal tools
- Visual UI builder with components
- Multiple data source connections
- JavaScript transformations
- Query abstraction layer
- Report/dashboard generation

**Differences:**
- Proprietary with limited self-hosting
- UI-first approach, not model-driven
- No formal meta-language for schemas
- JavaScript-based transformations, not declarative
- Cannot run business logic in database
- No entity versioning system
- Development and runtime are distinct
- No Jzod-like bootstrapped meta-model
- Limited to internal tools use case

---

### 2. [OutSystems](https://outsystems.com)

**Similarities:**
- Enterprise low-code platform
- Visual development environment
- Full-stack application development
- Database integration and modeling
- Version control and deployment
- Supports complex business logic

**Differences:**
- Proprietary enterprise platform, very expensive
- Visual modeling uses proprietary formats, not JSON schemas
- No open meta-language like Jzod
- Platform lock-in (cannot easily export to standard code)
- No support for lightweight deployments (IndexedDB, filesystem)
- Traditional separation of development and runtime
- Limited to OutSystems cloud or on-premise infrastructure
- Not designed for Smalltalk-like interactive development

---

### 3. [Mendix](https://mendix.com)

**Similarities:**
- Enterprise low-code platform
- Visual modeling with domain models
- Full-stack application development
- Version control integration
- Supports microservices architecture
- Extensible with custom code

**Differences:**
- Proprietary platform with vendor lock-in
- Visual models not based on open standards like Jzod
- Expensive enterprise licensing
- Limited to Mendix runtime environment
- No support for alternative persistence (IndexedDB, filesystem)
- Traditional dev/test/prod separation
- Cannot run same logic on client/server/database
- Not designed for meta-programming or DSL creation

---

### 4. [Microsoft Power Apps](https://powerapps.microsoft.com)

**Similarities:**
- Low-code platform for business applications
- Visual app builder
- Integration with various data sources
- Formula-based logic (similar to transformers)
- Versioning and deployment

**Differences:**
- Proprietary Microsoft ecosystem
- Formula language (Power Fx) is specific to platform
- No open meta-language
- Tight integration with Microsoft 365, limiting portability
- No support for PostgreSQL, IndexedDB, or filesystem stores natively
- Cloud-dependent (limited local execution)
- No Smalltalk-like development environment
- Cannot define custom entity versioning systems
- Platform lock-in

---

### 5. [Salesforce Lightning](https://www.salesforce.com/platform/lightning)

**Similarities:**
- Low-code platform for business applications
- Component-based UI development
- Declarative configuration alongside code
- Complex data modeling with objects and fields
- API-first architecture
- Version control (with add-ons)

**Differences:**
- Proprietary Salesforce ecosystem
- Extremely expensive, enterprise-focused
- Salesforce-specific technologies (Apex, Lightning Web Components)
- Data model tied to Salesforce objects
- No support for alternative persistence backends
- Cloud-only platform
- Heavy vendor lock-in
- Not designed for meta-programming
- No concept of running same logic across execution contexts

---

### 6. [Bubble](https://bubble.io)

**Similarities:**
- No-code/low-code web application platform
- Visual UI builder
- Database modeling with data types
- Workflow engine for business logic
- API integrations
- Version control and deployment

**Differences:**
- Proprietary cloud platform, no self-hosting
- Visual programming, not schema/model-first
- No formal meta-language like Jzod
- Cannot export to standard code
- Bubble-specific runtime, cannot deploy elsewhere
- No support for SQL databases, IndexedDB, or filesystem
- Workflows not portable or executable in different contexts
- No integrated development-runtime environment
- Platform lock-in with monthly fees

---

### 7. [Airtable](https://airtable.com)

**Similarities:**
- Hybrid spreadsheet-database platform
- Visual data modeling with bases and tables
- API access to data
- Multiple views (grid, kandar, gallery)
- Automation and scripting capabilities
- Collaborative features

**Differences:**
- Spreadsheet paradigm, not application development framework
- No UI generation beyond grid/form views
- Proprietary cloud platform
- Limited business logic capabilities
- No formal schema versioning or migrations
- Cannot define custom entities beyond tables
- No support for running logic in different contexts
- Cloud-dependent, no local persistence options
- Not designed for complex application development

---

### 8. [Qlik Sense](https://www.qlik.com/us/products/qlik-sense)

**Similarities:**
- Data analytics and visualization platform
- Data modeling and transformation (load scripts)
- Multiple data source support
- Self-service analytics
- Scripting for data manipulation

**Differences:**
- Analytics/BI tool, not application development framework
- Focus on data exploration and dashboards
- Proprietary platform and licensing
- No entity modeling for CRUD applications
- Limited to analytics use cases
- No application UI generation
- Cannot define custom business logic beyond analytics
- Qlik-specific scripting language
- No support for application deployment patterns

---

### 9. [Claris FileMaker](https://www.claris.com/filemaker)

**Similarities:**
- Low-code database application platform
- Visual UI designer
- Custom scripting for business logic
- Cross-platform deployment (desktop, web, mobile)
- Schema evolution and versioning
- Long history (40+ years)

**Differences:**
- Proprietary platform with licensing fees
- FileMaker-specific scripting language, not portable
- Desktop application paradigm, not modern web architecture
- No JSON-based schema definitions
- Limited to FileMaker ecosystem
- Cannot run logic in modern web contexts (React, etc.)
- Traditional IDE approach, not integrated dev-runtime
- No support for modern persistence (IndexedDB)
- Vendor lock-in

---

### 10. [Zoho Creator](https://www.zoho.com/creator)

**Similarities:**
- Low-code application platform
- Visual form and report builders
- Multi-platform deployment
- Workflow automation
- Database integration

**Differences:**
- Proprietary cloud platform
- Deluge scripting language specific to Zoho
- No open meta-language
- Limited to Zoho ecosystem and databases
- No support for alternative persistence backends
- Platform lock-in with subscription model
- Traditional development-deployment separation
- Cannot define custom DSLs or meta-models
- Cloud-dependent

---

### 11. [Appian](https://appian.com)

**Similarities:**
- Low-code automation platform
- Process modeling and workflow
- Data modeling capabilities
- Multiple deployment options
- Enterprise-scale applications

**Differences:**
- Proprietary enterprise platform, very expensive
- BPM (Business Process Management) focus
- No open meta-language like Jzod
- Appian-specific development environment
- Limited portability of business logic
- Enterprise licensing model
- Traditional dev/test/prod workflow
- No support for lightweight stores (IndexedDB, filesystem)
- Platform lock-in

---

### 12. [ServiceNow App Engine](https://www.servicenow.com/products/app-engine.html)

**Similarities:**
- Low-code platform for enterprise applications
- Data modeling with tables and relationships
- Workflow and business logic
- Multi-platform deployment
- API-first architecture

**Differences:**
- Proprietary ServiceNow platform
- Extremely expensive enterprise focus
- ServiceNow-specific technologies and runtime
- Cloud-only platform
- Heavy vendor lock-in
- No support for alternative persistence
- Traditional separation of development and runtime
- Cannot define custom meta-models
- Limited to ServiceNow ecosystem

---

### 13. [Oracle APEX](https://apex.oracle.com)

**Similarities:**
- Low-code platform for database applications
- SQL and PL/SQL based
- Form and report builders
- Oracle Database integration
- Web application development

**Differences:**
- Proprietary Oracle platform
- Tightly coupled to Oracle Database only
- PL/SQL centric, not portable
- No support for NoSQL, IndexedDB, or filesystem
- Traditional Oracle licensing costs
- Server-side focused, limited client-side capabilities
- No modern JavaScript framework integration
- Cannot run same logic across different contexts
- Vendor lock-in to Oracle ecosystem

---

### 14. [Monday.com](https://monday.com)

**Similarities:**
- Work management platform with customization
- Visual board and table views
- Workflow automation
- API and integrations
- Custom apps marketplace

**Differences:**
- Project management focus, not application development
- No formal data modeling or schema definitions
- Proprietary cloud platform
- Limited to Monday.com ecosystem
- Cannot build standalone applications
- No support for complex business logic
- Platform-specific, no portability
- Subscription-based SaaS model
- Not designed for general application development

---

## Summary: Miroir's Unique Position

### Key Differentiators

1. **Bootstrapped Meta-Language (Jzod):** Miroir's Jzod meta-language is self-describing and runtime-interpretable, enabling true meta-programming that most platforms lack.

2. **Integrated Development-Runtime Environment:** Inspired by Smalltalk, Miroir blends development and runtime, offering immediate feedback - a feature virtually absent in all compared platforms.

3. **Multi-Context Execution:** Transformers and queries can run in-memory (client/server) or in the database (SQL), a unique portability feature.

4. **True Multi-Store Support:** Native support for PostgreSQL, IndexedDB, and filesystem with unified interface - most platforms support only one or two backend types.

5. **Schema-First Entity Versioning:** Formal entity definition versioning with migration support built into the core model, not an afterthought.

6. **DSL Creation as First-Class Feature:** Designed for creating domain-specific languages, not just using pre-built components.

7. **Open Source Full Stack:** Unlike proprietary platforms, Miroir provides the complete source for inspection, modification, and self-hosting without vendor lock-in.

8. **Model-Driven Everything:** Reports, queries, transformers, actions, endpoints - all defined declaratively through JSON schemas, making them versionable, analyzable, and transformable.

### Closest Competitors

**Open Source:** Directus comes closest with its schema-based approach and multi-database support, but lacks Miroir's meta-language, multi-context execution, and development-runtime integration.

**Proprietary:** FileMaker has the longest history of integrated development, but lacks modern web architecture, open standards, and portability.

### Miroir's Challenges

Most compared platforms have:
- Larger user communities
- More extensive documentation
- Visual development tools (Miroir's are still limited)
- Enterprise support and SLAs
- Proven scalability in production
- Lower learning curves for beginners

Miroir's ambitious vision of unifying development and runtime, while powerful, creates complexity that may challenge adoption compared to more focused tools.

---

## Annex: Synoptic Comparison Table

### Legend
- ✅ Full support
- ⚠️ Partial/limited support
- ❌ Not supported
- 💰 Paid/proprietary
- 🆓 Free/open source

### Open Source Projects

| Project | License | Meta-Language | Multi-Store | Schema Versioning | UI Generation | Dev-Runtime Integration | Client/Server/DB Execution | DSL Creation | Primary Focus |
|---------|---------|---------------|-------------|-------------------|---------------|------------------------|----------------------------|--------------|---------------|
| **Miroir** | 🆓 MIT-like | ✅ Jzod | ✅ PG/IDB/FS | ✅ EntityDef | ✅ Reports | ✅ Smalltalk-like | ✅ Portable | ✅ First-class | Full-stack dev framework |
| [Hasura](https://hasura.io) | 🆓 Apache 2.0 | ❌ | ⚠️ PG only | ⚠️ Migrations | ❌ | ❌ | ⚠️ Server only | ❌ | GraphQL API generation |
| [PostgREST](https://postgrest.org) | 🆓 MIT | ❌ | ⚠️ PG only | ⚠️ SQL | ❌ | ❌ | ⚠️ DB only | ❌ | REST API generation |
| [Supabase](https://supabase.com) | 🆓 Apache 2.0 | ❌ | ⚠️ PG only | ⚠️ SQL | ⚠️ Basic | ❌ | ⚠️ Server | ❌ | Backend-as-a-Service |
| [Directus](https://directus.io) | 🆓 GPL-3.0 | ❌ | ⚠️ SQL DBs | ✅ | ✅ Admin UI | ❌ | ⚠️ Server | ❌ | Headless CMS |
| [ToolJet](https://tooljet.com) | 🆓 GPL-3.0 | ❌ | ⚠️ External | ❌ | ✅ Visual | ❌ | ⚠️ Client | ❌ | Internal tools UI |
| [Budibase](https://budibase.com) | 🆓 GPL-3.0 | ❌ | ⚠️ Limited | ⚠️ | ✅ Visual | ❌ | ⚠️ Mixed | ❌ | Low-code apps |
| [Strapi](https://strapi.io) | 🆓 MIT | ❌ | ⚠️ SQL DBs | ⚠️ | ⚠️ Admin | ❌ | ⚠️ Server | ❌ | Headless CMS |
| [KeystoneJS](https://keystonejs.com) | 🆓 MIT | ⚠️ TS types | ⚠️ PG/Mongo | ⚠️ Prisma | ⚠️ Admin | ❌ | ⚠️ Server | ❌ | CMS framework |
| [NocoDB](https://nocodb.com) | 🆓 GPL-3.0 | ❌ | ⚠️ SQL DBs | ⚠️ | ⚠️ Grid | ❌ | ⚠️ Server | ❌ | DB to spreadsheet |
| [Appsmith](https://appsmith.com) | 🆓 Apache 2.0 | ❌ | ⚠️ External | ⚠️ Git | ✅ Visual | ❌ | ⚠️ Client | ❌ | Internal tools |
| [RedwoodJS](https://redwoodjs.com) | 🆓 MIT | ❌ | ⚠️ Prisma | ⚠️ Prisma | ❌ | ❌ | ⚠️ Code | ❌ | Full-stack framework |
| [Blitz.js](https://blitzjs.com) | 🆓 MIT | ❌ | ⚠️ Prisma | ⚠️ Prisma | ❌ | ❌ | ⚠️ Code | ❌ | Full-stack framework |
| [Forest Admin](https://forestadmin.com) | 🆓 GPL-3.0 | ❌ | ⚠️ SQL DBs | ❌ | ⚠️ Admin | ❌ | ⚠️ Server | ❌ | Admin panels |
| [Windmill](https://windmill.dev) | 🆓 AGPLv3 | ❌ | ⚠️ External | ⚠️ Git | ⚠️ Forms | ❌ | ⚠️ Scripts | ⚠️ Limited | Workflow engine |
| [n8n](https://n8n.io) | ⚠️ SU License | ❌ | ⚠️ External | ⚠️ | ⚠️ Workflow UI | ❌ | ⚠️ Server | ❌ | Workflow automation |
| [Metabase](https://metabase.com) | 🆓 AGPLv3 | ❌ | ⚠️ Read-only | ❌ | ⚠️ Dashboards | ❌ | ⚠️ Server | ❌ | BI/Analytics |
| [Grafana](https://grafana.com) | 🆓 AGPLv3 | ❌ | ⚠️ Read-only | ❌ | ⚠️ Dashboards | ❌ | ⚠️ Server | ❌ | Monitoring/viz |

### Proprietary Projects

| Project | Type | Meta-Language | Multi-Store | Schema Versioning | UI Generation | Dev-Runtime Integration | Client/Server/DB Execution | DSL Creation | Cost Model |
|---------|------|---------------|-------------|-------------------|---------------|------------------------|----------------------------|--------------|------------|
| [Retool](https://retool.com) | 💰 SaaS | ❌ | ⚠️ External | ⚠️ Git | ✅ Visual | ❌ | ⚠️ Client | ❌ | $10-50/user/mo |
| [OutSystems](https://outsystems.com) | 💰 Platform | ⚠️ Proprietary | ⚠️ Limited | ✅ | ✅ Visual | ⚠️ Limited | ⚠️ Platform | ⚠️ Limited | $$$$ Enterprise |
| [Mendix](https://mendix.com) | 💰 Platform | ⚠️ Proprietary | ⚠️ Limited | ✅ | ✅ Visual | ⚠️ Limited | ⚠️ Platform | ⚠️ Limited | $$$$ Enterprise |
| [Power Apps](https://powerapps.microsoft.com) | 💰 SaaS | ⚠️ Power Fx | ⚠️ MS only | ⚠️ | ✅ Visual | ❌ | ⚠️ Cloud | ⚠️ Limited | $5-40/user/mo |
| [Salesforce](https://www.salesforce.com/platform/lightning) | 💰 Platform | ⚠️ Proprietary | ⚠️ SF only | ⚠️ | ✅ Lightning | ⚠️ Limited | ⚠️ Cloud | ⚠️ Limited | $$$$$ Enterprise |
| [Bubble](https://bubble.io) | 💰 SaaS | ❌ | ⚠️ Bubble DB | ⚠️ | ✅ Visual | ❌ | ⚠️ Cloud | ❌ | $29-529/mo |
| [Airtable](https://airtable.com) | 💰 SaaS | ❌ | ⚠️ Cloud only | ⚠️ | ⚠️ Grid/forms | ❌ | ⚠️ Cloud | ❌ | $10-45/user/mo |
| [Qlik Sense](https://www.qlik.com/us/products/qlik-sense) | 💰 Platform | ⚠️ Qlik script | ⚠️ Read-only | ❌ | ⚠️ Dashboards | ❌ | ⚠️ Server | ❌ | $$$$ Enterprise |
| [FileMaker](https://www.claris.com/filemaker) | 💰 Platform | ⚠️ FileMaker | ⚠️ FM DB | ✅ | ✅ Visual | ⚠️ Desktop IDE | ⚠️ Local | ⚠️ Scripts | $19-43/user/mo |
| [Zoho Creator](https://www.zoho.com/creator) | 💰 SaaS | ⚠️ Deluge | ⚠️ Zoho only | ⚠️ | ✅ Visual | ❌ | ⚠️ Cloud | ❌ | $8-25/user/mo |
| [Appian](https://appian.com) | 💰 Platform | ⚠️ Proprietary | ⚠️ Limited | ✅ | ✅ Visual | ⚠️ Limited | ⚠️ Platform | ⚠️ BPM | $$$$$ Enterprise |
| [ServiceNow](https://www.servicenow.com/products/app-engine.html) | 💰 Platform | ⚠️ Proprietary | ⚠️ SN only | ⚠️ | ✅ Visual | ❌ | ⚠️ Cloud | ⚠️ Limited | $$$$$ Enterprise |
| [Oracle APEX](https://apex.oracle.com) | 💰 Platform | ❌ | ⚠️ Oracle only | ⚠️ PL/SQL | ✅ Visual | ⚠️ SQL IDE | ⚠️ DB only | ⚠️ PL/SQL | $$$$ Oracle license |
| [Monday.com](https://monday.com) | 💰 SaaS | ❌ | ⚠️ Cloud only | ❌ | ⚠️ Boards | ❌ | ⚠️ Cloud | ❌ | $8-16/user/mo |

### Key Comparison Dimensions

#### Meta-Language Support
- **Miroir (Jzod)**: Runtime-interpretable, bootstrapped, generates TS types and Zod validators
- **Most Others**: Either no meta-language or proprietary/platform-specific languages
- **Some TS-based**: Use TypeScript types but only at compile-time

#### Multi-Store Architecture
- **Miroir**: PostgreSQL, IndexedDB, Filesystem with unified interface
- **Most**: Limited to one or two databases, often proprietary storage
- **None**: Match Miroir's breadth of local (IDB, FS) + server (PG) options

#### Schema Versioning & Evolution
- **Miroir**: First-class EntityDefinitions with formal versioning
- **Enterprise Platforms**: Have versioning but proprietary mechanisms
- **Most OSS**: Limited to database migration tools (Prisma, SQL scripts)

#### Development-Runtime Integration
- **Miroir**: Smalltalk-inspired immediate feedback, unified environment
- **FileMaker**: Desktop IDE with tight integration (closest competitor)
- **Most Others**: Traditional separation of dev and runtime

#### Portable Business Logic
- **Miroir**: Transformers/queries run in-memory (client/server) or DB (SQL)
- **Oracle APEX**: PL/SQL can run in DB but not portable to client
- **Most Others**: Logic tied to single execution context

#### DSL Creation as Core Feature
- **Miroir**: Designed for creating domain-specific languages
- **Enterprise Low-Code**: Some support for custom scripting languages
- **Most Others**: Use platform features, cannot define new languages

#### Self-Hosting & Vendor Lock-in
- **Open Source Projects**: Generally self-hostable, varying degrees of portability
- **Proprietary SaaS**: Cloud-dependent, complete vendor lock-in
- **Enterprise Platforms**: Often on-premise but proprietary runtimes

### Conclusion from Synoptic View

The table reveals that **no single platform combines all of Miroir's characteristics**:

1. **True open source** with comprehensive meta-language support
2. **Multiple persistence backends** including browser-local options
3. **Formal schema evolution** as first-class concept
4. **Unified development-runtime** environment
5. **Portable business logic** across execution contexts
6. **DSL creation** as core design goal

Miroir occupies a unique position attempting to bridge academic research (meta-programming, bootstrapped systems) with practical low-code/model-driven development, while remaining fully open source and self-hostable.

## Annex 1: How this document was produced

This document was mostly generated on 2026/01/24, by Claude Sonnet 4.5 in agent mode, using the following prompts:

`
give me a list of open source projects and a list of non-open-source projects, which resemble the Miroir Framework. For each item in the lists, give a brief description of similarities and a brief description of differences
`

`
add a synoptic table as an annex at the end of the document
`

`
update the document so that the section titles and entries in the first columns of the comparison tables become clickable links to a reference web page for the mentioned product
`