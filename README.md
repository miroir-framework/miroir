# Miroir Framework

**An end-to-end, low-code, agentic development platform for data-centric applications.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/miroir-framework/miroir?style=social)](https://github.com/miroir-framework/miroir)

---

## What is Miroir?

Miroir is a comprehensive development framework that transforms how you create data-centric applications by:

- **Unifying development and runtime** - Define concepts once, use everywhere (database, API, UI, business logic)
- **Enabling low-code creation** - Build and modify applications at runtime without recompilation
- **Supporting AI agents** - Native Model Context Protocol (MCP) integration for natural language development
- **Fostering domain languages** - Create custom Domain-Specific Languages (DSLs) for your business domain

### Key Features

✨ **Schema-First Development** - Define your data model using Jzod (Miroir Meta-Language), generate TypeScript types, Zod validators, and database schemas automatically

🔄 **Write Once, Run Anywhere** - Business logic (Queries, Transformers, Actions) runs on client, server, or in-database (SQL)

🗄️ **Multi-Store Support** - PostgreSQL, IndexedDB (browser), or filesystem - switch without code changes

📊 **Declarative UI** - Define Reports and Runners using JSON, no React code required

🤖 **AI-Ready** - Built-in MCP server for LLM-driven development with Claude, ChatGPT, and other AI agents

🧪 **Test-Driven** - Integrated testing framework with development/runtime parity

---

## Who Is Miroir For?

### 🎯 Start Small, Scale Seamlessly

**Problem**: You need a quick data management solution. A spreadsheet works today, but what about tomorrow when requirements grow?

**Solution**: Start with Miroir's low-code interface, then seamlessly add complexity as needs evolve - automated testing, version control, multi-user access, production deployment.

### 💼 Common Use Cases

| User Profile | Use Case | Miroir Benefits |
|-------------|----------|-----------------|
| **Citizen Developer** | Internal tools, data tracking apps | No-code/low-code creation, instant feedback |
| **Software Engineer** | Business applications, APIs, dashboards | Reduce boilerplate by 80%, rapid prototyping |
| **Data Analyst** | Custom reporting, data transformation | SQL-free queries, visual report builder |
| **IT Manager** | Internal applications portfolio | Faster delivery, easier maintenance |
| **Startup Founder** | MVP development | Quick iteration, AI-assisted development |

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) PostgreSQL 14+ for database persistence
- (Optional) Git for version control

### Installation
### Installing Node.js

If Node.js is not already installed, download the LTS version (18 or higher) from:
https://nodejs.org

After installation, verify it by running:
node -v
npm -v

```bash
# Clone the repository
git clone https://github.com/miroir-framework/miroir.git
cd miroir

# Install dependencies
npm install

# Build core packages
npm run devBuild -w miroir-core
npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres
```

### Run Your First Application

```bash
# Terminal 1: Start the server
npm run dev -w miroir-server

# Terminal 2: Start the client
npm run dev -w miroir-standalone-app
```

Open http://localhost:5173 in your browser and explore the Library example application!

**📖 [Complete Getting Started Guide →](docs/getting-started/quickstart.md)**

---

## Learn Miroir

### 🎓 For Beginners

1. **[Quickstart Guide](docs/getting-started/quickstart.md)** - 15-minute introduction
2. **[Library Tutorial](docs/tutorials/library-tutorial.md)** - Hands-on walkthrough (20 min)
3. **[Core Concepts](docs/guides/core-concepts.md)** - Understanding Entity, Query, Transformer, Action, Report

### 💻 For Developers

1. **[Creating Your First Application](docs/guides/developer/creating-applications.md)** - Build from scratch
2. **[Developer Guides](docs/guides/developer/)** - In-depth development topics
3. **[API Reference](docs/reference/api/)** - Complete API documentation

### 🤖 For AI Integration

1. **[MCP Integration Guide](docs/guides/mcp-integration.md)** - Connect with Claude, ChatGPT, and other AI agents
2. **[Natural Language Development](docs/tutorials/natural-language-interface.md)** - **Coming Soon**

### 📚 Full Documentation

**[Complete Documentation Index →](docs/index.md)**

Documentation organized by role: Executives, Project Managers, Architects, Developers, End Users, AI Integrators, Contributors

---

## Why Miroir?

### The Problem: Development Tools Are Fragmented

Modern development requires juggling dozens of tools and languages:

- editors (VS Code, VIM, Eclipse...) for coding
- Separate database design tools
- API testing tools (Postman, etc.)
- UI builders
- CI/CD pipelines
- Each with its own DSL and learning curve

### The Miroir Approach: Integration Inspired by Smalltalk

Miroir integrates development-time and runtime activities in a single environment:

- **Immediate Feedback** - Change your model, see results instantly without recompilation
- **Unified Model** - Define entities once, use in DB, API, UI, and business logic
- **Experimental Development** - Rapid prototyping with instant verification
- **Progressive Enhancement** - Start simple, add complexity as needed

**[Read the full rationale →](docs/guides/why-miroir.md)**

**[Compare with alternatives →](docs/guides/comparison.md)** (Hasura, Supabase, Retool, OutSystems, and 30+ others)

---

## Example: Building a Book Library App (Idealized)

This section gives a slightly simplified syntax for better understanding of the main features that constitute a Library Miroir application. See it for real in **[the Library Tutorial →](docs/tutorials/library-tutorial.md)**

### Define The Book Entity Model Schema

```json
{
  "type": "object",
  "definition": {
    "uuid": { "type": "uuid" },
    "title": { "type": "string" },
    "author": { "type": "uuid", "tag": { "value": { "defaultLabel": "Author", "targetEntity": "Author" } } },
    "isbn": { "type": "string", "optional": true },
    "publishedDate": { "type": "date" }
  }
}
```

### Query for the list of Books (Declarative)

```json
{
  "queryType": "extractorByEntityReturningObjectList",
  "targetEntity": "Book"
}
```

### Extract The Book Titles Only: Transform Data (Portable Logic)

```json
{
  "transformerType": "mapperListToList",
  "interpolation": "runtime",
  "referencedExtractor": "books",
  "orderBy": { "attributeName": "title" }
}
```

### Display Books in the UI: The BookList Report

```json
{
  "type": "list",
  "definition": {
    "entityUuid": "Book",
    "fetchQuery": { "queryReference": "booksQuery" }
  }
}
```

**Result**: A declarative, fully functional CRUD application with sorting, filtering, and relationships - no "code" required!

**[Try the Library Tutorial →](docs/tutorials/library-tutorial.md)**

---

## Current Status (v0.9 - Pre-Release)

### ✅ Available Now

- ✅ Jzod meta-language and type generation
- ✅ Entity and EntityDefinition meta-model
- ✅ Multi-store connectors (PostgreSQL, IndexedDB, Filesystem)
- ✅ Query, Transformer, Action, Report interpreters
- ✅ In-memory and SQL execution for business logic
- ✅ Web application and Node.js server
- ✅ Electron desktop application
- ✅ Comprehensive test suite
- ✅ Event system for monitoring and debugging
- ✅ MCP server for AI integration

### 🚧 In Active Development

- 🚧 Interactive Transformer/Query/Action editors
- 🚧 Visual model editor (UML-like)
- 🚧 Spreadsheet connector (ODS, Excel)

### 📅 Roadmap

- 📅 Graph visualization (D3.js integration)
- 📅 Markdown/HTML text editor for documentation
- 📅 Block-based visual programming (low-code)
- 📅 Additional NoSQL stores (MongoDB, DuckDB, ElasticSearch)
- 📅 Command Line Interface (CLI)
- 📅 Git/GitHub integration
- 📅 Code generation ("freeze to JavaScript/Rust")

**[Full Roadmap →](docs/guides/roadmap.md)**

---

## Architecture Highlights

### Layered Domain-Driven Design

```
0_interfaces/    → Core types and Jzod schemas
1_core/          → Foundation (tools, constants, domain state)
2_domain/        → Domain logic (selectors, transformers, templates)
3_controllers/   → Application controllers
4_services/      → Infrastructure (persistence stores)
4_views/         → UI layer (React components)
```

**Rule**: Dependencies flow downwards only. Implementation in layer 3 uses layers 2 & 1, but not vice versa.

### Multi-Workspace Monorepo

- **jzod** - JSON schema definition language
- **jzod-ts** - TypeScript type generation
- **miroir-core** - Framework foundation
- **miroir-localcache-redux** - Client-side state management
- **miroir-store-*** - Persistence adapters
- **miroir-react** - UI components
- **miroir-server** - Node.js backend
- **miroir-standalone-app** - Web application
- **miroir-mcp** - Model Context Protocol server

**[Architecture Deep Dive →](docs/guides/architecture.md)**

---

## Community & Contributing

### 🤝 Get Involved

- **[Contributing Guide](docs/contributing/)** - Development setup and workflow
- **[GitHub Discussions](https://github.com/miroir-framework/miroir/discussions)** - Coming Soon
- **[Issue Tracker](https://github.com/miroir-framework/miroir/issues)** - Report bugs or request features

### 📜 License

MIT License - see [LICENSE](LICENSE) file

### 🙏 Acknowledgments

Inspired by:
- **Smalltalk** - Interactive development environment
- **Model-Driven Architecture (MDA)** - Model-first development
- **Domain-Driven Design (DDD)** - Domain modeling patterns

---

## Links

- **Documentation**: [docs-new/index.md](docs/index.md)
- **GitHub**: https://github.com/miroir-framework/miroir
- **NPM**: https://www.npmjs.com/org/miroir-framework
- **Issues**: https://github.com/miroir-framework/miroir/issues

---

**Start building your next application with Miroir today!**

**[📖 Read the Docs](docs/index.md)** | **[🚀 Quickstart](docs/getting-started/quickstart.md)** | **[💬 Discuss](https://github.com/miroir-framework/miroir/discussions)**
