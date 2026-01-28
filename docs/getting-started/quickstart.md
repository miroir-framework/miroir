# Quickstart Guide (⚠️SLOPPY⚠️)

**Estimated time: 15 minutes**

Get up and running with Miroir Framework in under 15 minutes. This guide will help you install Miroir, explore the example Library application, and understand the basic development workflow.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** and **npm** installed ([Download](https://nodejs.org/))
- **Git** for cloning the repository ([Download](https://git-scm.com/))
- (Optional) **PostgreSQL 14+** for database persistence ([Download](https://www.postgresql.org/))
- A code editor (VS Code recommended)
- Basic familiarity with command line

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/miroir-framework/miroir.git
cd miroir
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Link Local Jzod Packages

Miroir depends on local Jzod packages:

```bash
npm link @miroir-framework/jzod-ts @miroir-framework/jzod
```

### 4. Build Core Packages

Build Miroir core and store packages:

```bash
# Build miroir-core (includes type generation from Jzod schemas)
npm run devBuild -w miroir-core

# Build state management and store packages
npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres
```

**Note**: The `devBuild` command generates TypeScript types from Jzod schemas. This is required whenever core schemas change.

---

## Running the Application

Miroir can run in two modes:

### Option A: Client + Server (Recommended for Beginners)

Run both client and server together:

**Terminal 1 - Start the Server:**
```bash
npm run dev -w miroir-server
```

The server will start on http://localhost:3080

**Terminal 2 - Start the Client:**
```bash
npm run dev -w miroir-standalone-app
```

The client will open at http://localhost:5173

### Option B: Client Only (Emulated Server)

For development, you can run the client without a real server using MSW (Mock Service Worker) to simulate server responses:

```bash
npm run dev -w miroir-standalone-app
```

Open http://localhost:5173 in your browser.

**Note**: This mode uses emulated storage (IndexedDB or filesystem) instead of connecting to a real server.

---

## Exploring the Library Application

Once running, you'll see the Miroir standalone application with the **Library** example app loaded.

### What is the Library App?

The Library app is a complete CRUD application demonstrating Miroir's capabilities:

**Entities:**
- **Book** - Books in the library
- **Author** - Book authors
- **Publisher** - Publishing companies
- **Country** - Countries (for author nationalities)
- **User** - Library users

### Quick Tour

#### 1. **Home Page**

You'll see the main application menu with options to:
- Browse Books
- Browse Authors
- Browse Publishers
- Manage the application (model editing)

#### 2. **Browse Books**

Click "Books" to see the list of books:
- View all books in a grid
- See title, author, ISBN, publication date
- Click on a book to see details

#### 3. **Create a Book**

- Click "New Book" button
- Fill in the form:
  - Title (required)
  - Author (select from dropdown)
  - Publisher (select from dropdown)
  - ISBN (optional)
  - Published Date
- Click "Save"

Your new book appears in the list immediately!

#### 4. **Edit a Book**

- Click on any book in the list
- Click "Edit" button
- Modify fields
- Click "Save"

Changes appear instantly - **no page refresh required**.

#### 5. **Delete a Book**

- Click on a book
- Click "Delete" button
- Confirm deletion

The book is removed from the list.

---

## Understanding What You Just Did

### No Code Was Written

Everything you just experienced was defined **declaratively** in JSON:

1. **Data Model** - Book entity defined using Jzod schema
2. **UI** - List and form generated from Report definitions
3. **CRUD Operations** - Create/Read/Update/Delete defined as Actions
4. **Data Validation** - Enforced by Jzod schema validators

### Behind the Scenes

When you clicked "New Book":
1. The form was generated from the Book entity's Jzod schema
2. Your input was validated against the schema
3. An Action was dispatched to create a Book instance
4. The data was persisted to the configured store (IndexedDB/filesystem/Postgres)
5. The UI automatically re-queried and refreshed

**All without writing a single line of React code.**

---

## Development Workflow

### Making Changes

Let's try modifying the Library app:

#### 1. **Add a New Attribute to Book**

We'll add a "genre" field to books.

**Location**: `packages/miroir-core/src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/`

Find the Book EntityDefinition file (look for `"name": "Book"`).

Add to the `jzodSchema.definition`:

```json
"genre": {
  "type": "string",
  "optional": true
}
```

#### 2. **Rebuild Core**

```bash
npm run devBuild -w miroir-core
```

#### 3. **Restart the Application**

Stop and restart the dev servers (Ctrl+C then re-run).

#### 4. **See the Changes**

- Open the "New Book" form
- You'll see a new "Genre" field!
- Create a book with a genre
- It appears in the book details

**You just modified the application's data model and UI without writing React components or migration scripts.**

---

## Next Steps

### 📖 Learn More

Now that you have Miroir running:

1. **[Complete Library Tutorial](../tutorials/library-tutorial.md)** - Detailed hands-on walkthrough (20 min)
2. **[Core Concepts](../guides/core-concepts.md)** - Understand Entity, Query, Transformer, Action, Report
3. **[Creating Your First Application](../guides/developer/creating-applications.md)** - Build an app from scratch

### 🔧 Try These Tasks

**Beginner Tasks:**
- Add more books to the library
- Create new authors and publishers
- Explore the relationship between books and authors

**Intermediate Tasks:**
- Add a "rating" field to books (1-5 stars)
- Create a query to find books by author
- Add a report showing books published after 2020

**Advanced Tasks:**
- Create a new entity (e.g., "Genre")
- Create a relationship between Book and Genre
- Write a transformer to sort books by rating

### 🛠️ Configuration Options

#### Using PostgreSQL

To use PostgreSQL instead of IndexedDB/filesystem:

1. **Create a database:**
```bash
createdb miroir_library
```

2. **Configure connection:**

Edit test configuration or set environment variables:
```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql
```

3. **Restart:**
```bash
npm run dev -w miroir-standalone-app
```

#### Using Filesystem Storage

For file-based persistence:

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem npm run dev -w miroir-standalone-app
```

Data will be stored in JSON files in the `packages/miroir-core/src/assets/` directory.

**[See Configuration Reference →](../reference/configuration.md)**

---

## Common Issues

### Build Errors

**Problem**: `Cannot find module '@miroir-framework/jzod'`

**Solution**: Re-link the packages:
```bash
npm link @miroir-framework/jzod-ts @miroir-framework/jzod
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5173`

**Solution**: Kill the process using the port:
```bash
# Windows (Git Bash)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Type Errors After Schema Changes

**Problem**: TypeScript errors after modifying Jzod schemas

**Solution**: Rebuild miroir-core to regenerate types:
```bash
npm run devBuild -w miroir-core
```

---

## Testing

Run tests to verify your installation:

### Core Tests

```bash
# Run all miroir-core tests
npm run test -w miroir-core
```

### Integration Tests

```bash
# Filesystem persistence
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem npm run testByFile -w miroir-standalone-app -- DomainController.integ

# PostgreSQL persistence (requires Postgres setup)
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

---

## What's Next?

**You've successfully:**
✅ Installed Miroir
✅ Run the Library example application
✅ Explored CRUD operations
✅ Understood the basic development workflow

**Continue your journey:**

📚 **[Library Tutorial](../tutorials/library-tutorial.md)** - Comprehensive hands-on guide
🎓 **[Core Concepts](../guides/core-concepts.md)** - Deep dive into Miroir architecture
💻 **[Developer Guide](../guides/developer/creating-applications.md)** - Build your own app
📖 **[Full Documentation](../index.md)** - Complete documentation index

---

**[← Back to Documentation Index](../index.md)**
