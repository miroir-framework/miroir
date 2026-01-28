# Why Miroir? The Philosophy and Rationale

**Estimated reading time: 20 minutes**

This document explains the motivation behind the Miroir Framework, the problems it aims to solve, and the philosophy guiding its design.

⚠️This document lacks consistency, especially in the second part. Better focus can be brought, probably later chapters put elsewhere, or just appear as links to other documents which have reused parts of this document. ⚠️
---

## Table of Contents

1. [The Problem: Fragmented Software Development](#the-problem-fragmented-software-development)
2. [The Proposal: Integrated Development](#the-proposal-integrated-development)
3. [Inspiration from Smalltalk](#inspiration-from-smalltalk)
4. [Beyond Online IDEs](#beyond-online-ides)
5. [The Miroir Vision](#the-miroir-vision)
6. [Model-Based Software Engineering](#model-based-software-engineering)
7. [What You Give, What You Get](#what-you-give-what-you-get)
8. [Perspectives on Miroir](#perspectives-on-miroir)

---

## The Problem: Fragmented Software Development

### The Software Development Quandary

Today's Integrated Development Environments (IDEs) - VS Code, IntelliJ, Eclipse - are paradoxically **not-so-much "integrated"**. They directly address only a fraction of development-related activities:

**✅ What IDEs Do Well:**
- Writing code
- Browsing code
- Refactoring (to some extent)

**⚠️ Limited Support Through Third-Party Integration:**
- Version control (Git integration)
- Testing (test runners, coverage tools)
- Terminal access (shell integration)

**❌ No Support At All:**
- Software design and modeling
- Database/storage design and evolution
- Continuous Integration/Deployment pipelines
- Runtime monitoring and debugging integration

### The Tool Sprawl Problem

Modern software development requires juggling **dozens of disparate tools**, each with its own:

- **Domain-Specific Language (DSL)** - SQL, GraphQL, YAML (CI/CD), Terraform, etc.
- **Mental model** - Different paradigms for each tool
- **Configuration** - Separate setup and integration overhead
- **Learning curve** - Multiplicative complexity

There is **very little interoperability** among these languages, even sometimes among DSLs within the same tool.

### The Separation of Concerns Paradox

**Mainstream IDEs boast about being "unopinionated"** - independent from any particular software design method. This fosters wide acceptance (being unopinionated leads to better adoption).

**However**, this creates a fundamental problem:

> Using different tools and methods at **conception/development time** vs **runtime** makes encompassing the whole lifecycle of a software system considerably more difficult.

Software development becomes paradoxically **considered separate from the runtime workings** of the system itself, barring any holistic approach from a [Systems Engineering](https://en.wikipedia.org/wiki/Systems_engineering) point of view.

**We view this as a major hindrance to improving software development activities themselves.**

### Progress Through CI/CD

This tendency has been somewhat alleviated in recent years through [Continuous Integration / Continuous Delivery (CI/CD)](https://en.wikipedia.org/wiki/CI/CD) methodologies.

We assess that this tendency can be **greatly amplified**, with considerable benefits to be reaped in the transformation.

**Only the tools we use still lag in features to address those practices.**

---

## The Proposal: Integrated Development

Miroir aims to **integrate development-time and runtime activities** in a unified environment, where:

1. **Development, testing, and deployment** are not separate phases but continuous activities
2. **Models are executable** and evolve with your application
3. **Feedback is immediate** - no compile-wait-run-debug cycle
4. **Everything is data** - models, queries, transformations, UI definitions are all machine-readable JSON
5. **DSLs are first-class citizens** - create, integrate, and evolve domain languages at runtime

---

## Inspiration from Smalltalk

### The Paradise Lost

Looking to the past for inspiration, some development environments pioneered radically different, interactive approaches to software development:

**[Smalltalk](https://en.wikipedia.org/wiki/Smalltalk)** is the prime example.

In Smalltalk:
- **Development-time and runtime activities happen in the same environment**
- On the small scale, development, testing, and deployment become **essentially the same activity**
- Having **perfect, runtime-precise, immediate feedback** during development creates what many developers describe as an "ideal world"

> "Having perfect, run-time-precise, immediate feedback during development amounts to many developers to being in a proverbial 'ideal world', a paradise lost which many have endeavoured to reach again."

Indeed, **accelerating feedback** is now widely recognized as a primary means to increase software quality and developer productivity (see [Accelerate](https://en.wikipedia.org/wiki/Accelerate_(book))).

### Smalltalk's Limitations

Yet Smalltalk had important limitations - many issues were outside the scope that any development environment could reach at the time:

- ❌ No support for version control or delivery processes
- ❌ No direct support for automated testing
- ❌ No support for refactoring tools
- ❌ No support for software or database model design
- ❌ Limited ecosystem and integration with external systems

**Miroir aims to recapture Smalltalk's interactive development experience while addressing its limitations with modern tooling.**

---

## Beyond Online IDEs

### The Horse-Carriage Analogy

Starting from the late 2000's-mid 2010's, [online IDEs](https://en.wikipedia.org/wiki/Online_integrated_development_environment) like [Stackblitz](https://stackblitz.com/) and [CodeSandbox](https://codesandbox.io/) offered the "usual" functionalities of well-known IDEs but running within the web browser, accessed through the cloud.

**The problem**: You develop a web application from within another web application (the online IDE), but there's **no synergy between the two** (except automatic refresh of the developed application).

This appears to us like **early automobiles**:

> The first automobiles, especially ones using steam engines, were first inspired by and compared to horse-carriages, their main competitors at the time. They merely had a motor instead of horses.
>
> Yet, in the end, automobiles evolved and reached so much more uses than what could have been dreamt of by the simple improvement of horse carriages.

**Online IDEs are the "horseless carriages" of software development** - they've replaced the "horse" (desktop IDE) with a "motor" (browser-based editor), but haven't fundamentally reimagined what's possible.

### Exploiting Synergies

**The Miroir Framework aims at exploiting the synergies between web applications and their development environments:**

By integrating the development and runtime environments (or at least providing access to a **perfect mirror image** of the runtime environment during the development phase), we can:

1. **Speed up the software quality improvement process** (a.k.a. debugging)
2. Enable developers to **concentrate on essential hardships** of software development:
   - Adequacy to user needs
   - Software design and architecture
3. **Eliminate extrinsic complexity** of tooling, configuration, and integration

---

## The Miroir Vision

### Core Principles

Miroir shall provide support for:

1. **Model/Database Design and Evolution**
   - Visual and textual modeling tools
   - Schema versioning and migration
   - Multi-store support (SQL, NoSQL, files)

2. **Adoption of "Relevant" Software Development Processes**
   - Test-Driven Development (TDD)
   - Continuous Integration/Delivery
   - Iterative and incremental development

3. **Interactive "Positive" Feedback Loops**
   - Immediate execution of changes
   - Runtime debugging and inspection
   - Live data visualization

4. **Version Control, CI/CD**
   - Git integration
   - Automated testing and deployment
   - Collaborative development workflows

### Method & Means

**Allow seamless creation, integration, and benefit from DSLs at runtime.**

- Enrich an application step-by-step
- Capture new world models in DSLs
- Connect those DSLs as needed
- **Miroir itself is largely developed in Miroir** (dogfooding)

### Embracing Web Technologies

Now web applications increasingly look like general-purpose applications:
- [React Native](https://reactnative.dev/) - Mobile apps from web tech
- [Electron](https://www.electronjs.org/) - Desktop apps from web tech

**Miroir leverages this evolution** to create a unified development experience across desktop, web, and server environments.

---

## Model-Based Software Engineering

### Current State: Models as Communication Tools

Software engineers usually rely on models at least in the conception phase of applications, using:

- Well-known methods (Merise, Booch, UML)
- Notations that are part of the informal lingua franca
- Diagrams shared in documentation, blog articles, forums

**However**, such models remain used mostly as:
- Support for development-time communication among developers
- Basis for user documentation

**The models are then discarded** - they don't live in the running application.

### The Miroir Proposition

**We propose to use software models throughout the entire software development lifecycle.**

We claim that:
1. The tools to create, manipulate, and exploit these models are now readily available
2. There has been an incomprehensible delay in the software industry taking this into account

### From Abstract Models to Running Systems

From abstract, simple models, Miroir can:

✅ **Infer display properties** → Generate graphical user interfaces

✅ **Infer storage properties** → Support any storage form:
   - NoSQL databases or key-value stores
   - JSON files
   - Relational databases (PostgreSQL)
   - Distributed databases
   - Plain-text databases

✅ **Provide end-user analytical capabilities** → Enable users to analyze and extract information from modeled data

✅ **Enable Domain-Specific Languages** → Let users define and exploit DSLs at any level to implement business functionalities

✅ **Reuse business code** → Share value-adding business code between server and client (and database!)

---

## What You Give, What You Get

### What You Provide to Miroir

To build an application with Miroir, you provide:

1. **📋 A Structured Data Model**
   - Define your domain entities
   - Specify attributes and relationships
   - Use Jzod (Miroir Meta-Language) schemas
   - Maintain through integrated versioning

2. **🔧 Domain-Specific Language Definitions**
   - Actions for data creation and modification
   - Transformers for data manipulation
   - Queries for data retrieval
   - All defined declaratively in JSON

3. **📊 Reports for Data Presentation**
   - Define how data is displayed
   - Specify user interactions
   - All declarative, no React code required

### What Miroir Provides to You

In return, Miroir gives you:

1. **🚀 A Backend Web Server** (Node.js)
   - Executes your DSL Actions
   - Runs Queries and Transformers
   - Returns required data via REST/GraphQL
   - Optionally runs business logic in-database (SQL)

2. **💻 A Web Application**
   - Can run as desktop app (Electron)
   - Can be deployed to server and accessed via browser
   - Automatically generated UI from Reports
   - Runtime modification without recompilation

3. **🗄️ Multi-Store Persistence**
   - PostgreSQL for production
   - IndexedDB for browser-based apps
   - Filesystem for development and prototyping
   - Switch stores without code changes

4. **🤖 AI Integration**
   - Model Context Protocol (MCP) server
   - Natural language development interface
   - LLM-assisted development workflows

5. **🧪 Integrated Testing**
   - Unit tests for transformers
   - Integration tests across stores
   - Test-driven development support
   - Vitest-based test framework

---

## Perspectives on Miroir

### For Software Developers

**"DSLs and the Command Pattern Gone Mad"**

Miroir lets applicative software developers **concentrate on tackling the intrinsic complexity of the problem at hand** by providing "standard" solutions for extrinsic complexity:

- ✅ Storage (databases, files, NoSQL)
- ✅ Concurrent versioning
- ✅ Transactions and data consistency
- ✅ API generation
- ✅ UI scaffolding

**What Miroir provides:**
- A concept modeling DSL for versioned Entities and relationships
- Concurrent versioning and transactions for defined concepts
- Transparent access to Databases (Relational, NoSQL) and files
- Portable business logic (client, server, or database execution)

### For Architects and Decision-Makers

**"Model-Driven Development with Immediate ROI"**

Miroir enables:
- **Faster time to market** - Reduce boilerplate by 80%
- **Lower maintenance costs** - Changes to models propagate automatically
- **Better alignment** - Models stay synchronized with running code
- **Flexibility** - Swap datastores or deployment targets without rewrites
- **Future-proofing** - AI-ready architecture supports LLM integration

### For Citizen Developers

**"Build Without Becoming a Programmer"**

Miroir provides:
- **Low-code interface** - Define data and behavior without coding
- **Immediate feedback** - See changes instantly
- **Start simple** - Begin with basic CRUD, add complexity as needed
- **Gradual learning** - Progressively learn more advanced features
- **Safety net** - Type checking and validation prevent common errors

### For Data Analysts

**"From Spreadsheets to Applications"**

Miroir enables:
- **Model your data** - Move beyond spreadsheet limitations
- **Query without SQL** - Declarative query language
- **Transform data** - Powerful transformation pipeline
- **Visualize results** - Automatic report generation
- **Scale seamlessly** - Start local, deploy to production when ready

---

## Comparison to Existing Solutions

Many existing platforms limit their scope either horizontally (UI-only, API-only) or vertically (specific industry, specific use case):

### Horizontal Limitations

- **ToolJet, Retool, Appsmith** - Focused on GUI aspects; the built "model" is not used for other purposes
- **Hasura, PostgREST** - API generation only; no UI, no client-side logic
- **Directus, Strapi** - Headless CMS focus; limited to content management use cases

### Vertical Limitations

- **Qlik Sense** - Analytics focus; time series and dashboards
- **RStudio** - Data science; not intended to build "releasable" apps
- **Salesforce, Dynamics** - Industry-specific platforms with vendor lock-in

### Miroir's Unique Position

Miroir provides **horizontal and vertical integration**:

- ✅ **Full-stack** - Database, API, business logic, UI all from one model
- ✅ **General-purpose** - Not limited to specific industry or use case
- ✅ **AI-ready** - Native support for LLM integration via MCP
- ✅ **Open source** - No vendor lock-in
- ✅ **Portable** - Logic runs client, server, or database
- ✅ **Extensible** - Create custom DSLs for your domain

**[See detailed comparison with 30+ alternatives →](comparison.md)**

---

## The Best Case and Worst Case

### Realistic Assessment

> "In the worst case Miroir could end up as yet another software demonstrator of somewhat ludicrous, way-above-their-head ideas, or maybe in the best case as another Smalltalk."

We acknowledge the ambitious nature of Miroir's goals. However:

- **Technology has matured** - The tools Smalltalk lacked now exist (Git, CI/CD, web standards)
- **Market is ready** - Low-code/no-code demand is exploding
- **AI changes everything** - MCP and LLM integration open new possibilities
- **Pragmatic approach** - We're building iteratively, with real-world use cases driving development

### Miroir Developed in Miroir

**Dogfooding is our north star:**

- Miroir is largely developed in Miroir itself
- We use the framework to build the framework
- Every limitation we encounter, we fix
- Every feature we need, we add

This ensures Miroir solves real development problems, not imaginary ones.

---

## Next Steps

Now that you understand **why** Miroir exists:

- **[See how Miroir compares to alternatives →](comparison.md)**
- **[Learn core concepts →](core-concepts.md)**
- **[Try the quickstart guide →](../getting-started/quickstart.md)**
- **[Read the architecture overview →](architecture.md)**

---

**[← Back to Documentation Index](../index.md)**
