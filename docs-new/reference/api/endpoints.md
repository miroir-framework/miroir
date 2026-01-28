# Endpoint API Reference

**Status: 🚧 Sketch - To be auto-generated from Jzod schemas**

---

## Overview

**Endpoints** define service interfaces that expose Actions to clients.

---

## Schema Location

`packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json`

---

## Endpoint Types

### 1. Instance Endpoint

CRUD operations on entity instances:

```json
{
  "uuid": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "parentUuid": "e3c1cc69-066d-4f52-beeb-b659dc7a88b9",
  "name": "InstanceEndpoint",
  "defaultLabel": "Instance CRUD Operations",
  "definition": {
    "actionType": "instanceAction"
  }
}
```

### 2. Model Endpoint

Operations on application model:

```json
{
  "uuid": "7947ae40-eb34-4149-887b-15a9021e714e",
  "parentUuid": "e3c1cc69-066d-4f52-beeb-b659dc7a88b9",
  "name": "ModelEndpoint",
  "defaultLabel": "Model Operations",
  "definition": {
    "actionType": "modelAction"
  }
}
```

### 3. Query Endpoint

Execute queries:

**Coming Soon**

### 4. Custom Endpoint

Domain-specific operations:

**Coming Soon**

---

**[← Back to API Reference](index.md)** | **[← Back to Documentation Index](../../index.md)**
