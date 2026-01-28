# Action API Reference (⚠️SLOPPY⚠️)

**Status: 🚧 Sketch - To be auto-generated from Jzod schemas**

---

## Overview

**Actions** perform side effects like creating, updating, or deleting data. Actions can operate on entity instances (data) or the application model (entities, reports, etc.).

---

## Action Types

### 1. Instance Actions

CRUD operations on entity instances.

#### Create Instance

```json
{
  "actionType": "instanceAction",
  "actionName": "createInstance",
  "endpoint": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "applicationSection": "data",
  "deploymentUuid": "f714bb2f-a12d-4e71-a03b-74dcb02aabf9",
  "objects": [{
    "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    "instances": [{
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "title": "New Book"
    }]
  }]
}
```

#### Update Instance

```json
{
  "actionType": "instanceAction",
  "actionName": "updateInstance",
  "endpoint": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "objects": [{
    "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    "instances": [{
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Updated Title"
    }]
  }]
}
```

#### Delete Instance

```json
{
  "actionType": "instanceAction",
  "actionName": "deleteInstance",
  "endpoint": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "objects": [{
    "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    "instances": [{
      "uuid": "550e8400-e29b-41d4-a716-446655440000"
    }]
  }]
}
```

### 2. Model Actions

Operations on application model (entities, reports, etc.).

#### Create Entity

```json
{
  "actionType": "modelAction",
  "actionName": "createEntity",
  "deploymentUuid": "f714bb2f-a12d-4e71-a03b-74dcb02aabf9",
  "endpoint": "7947ae40-eb34-4149-887b-15a9021e714e",
  "entities": [{
    "entity": { /* Entity */ },
    "entityDefinition": { /* EntityDefinition */ }
  }]
}
```

### 3. Composite Actions

Chain multiple actions and queries:

```json
{
  "actionType": "compositeAction",
  "actionLabel": "Complex Workflow",
  "definition": [
    {
      "compositeActionType": "query",
      "query": { /* Query */ },
      "queryReference": "queryResult"
    },
    {
      "compositeActionType": "action",
      "action": { /* Action using queryResult */ }
    }
  ]
}
```

---

## Using Actions in React

```typescript
import { useDispatch } from 'react-redux';

function CreateBookButton() {
  const dispatch = useDispatch();
  
  const createBook = () => {
    const action = {
      actionType: "instanceAction",
      actionName: "createInstance",
      // ...
    };
    
    dispatch(action);
  };
  
  return <button onClick={createBook}>Create Book</button>;
}
```

---

## Complete Action Type Reference

**Coming Soon**: Auto-generated from Jzod schemas

- `instanceAction` - CRUD on instances
- `modelAction` - Operations on model
- `storeManagementAction` - Store operations
- `transactionalInstanceAction` - Transactional CRUD
- `compositeAction` - Workflow actions
- `bundleAction` - Batch operations

---

**[← Back to API Reference](index.md)** | **[← Back to Documentation Index](../../index.md)**
