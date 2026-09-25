# Creating Your First Application

> ⚠️⚠️⚠️ This document is a placeholder and needs to be completed.

## Overview

Learn how to create a complete Miroir application from scratch.

## Application Structure

Every Miroir application consists of:

- **Model**: Entities (each carrying its own `mlSchema`), relationships, and business rules
- **Data**: Actual instances of your entities
- **Queries**: Data retrieval logic
- **Transformers**: Data manipulation logic
- **Reports**: UI presentation layer
- **Actions**: Side-effect operations (CRUD, etc.)

## Step-by-Step Guide

### 1. Plan Your Domain Model

(Content to be added)

### 2. Define Entities

See [Defining Entities](defining-entities.md): an Entity row, with its `mlSchema`, is all that is needed to define a concept. There is no separate "Entity Version" step: EntityVersions are history snapshots written by `freezeApplicationVersion` for versioned-internal applications.

### 3. Build Queries

(Content to be added)

### 4. Design Reports

(Content to be added)

### 5. Implement Actions

(Content to be added)

### 6. Test Your Application

(Content to be added)

## Best Practices

- Start with a simple model
- Iterate incrementally
- Test frequently
- Document your domain concepts

## Next Steps

- [Defining Entities](defining-entities.md)
- [Writing Queries](writing-queries.md)
- [Creating Actions](creating-actions.md)

---

**Note**: Detailed examples and code snippets will be added.
