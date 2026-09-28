# Creating Actions

> ⚠️⚠️⚠️ This document is a placeholder and needs to be completed.

## Overview

Actions perform side-effects in Miroir applications, such as creating, updating, or deleting entities.

## Action Types

(Content to be added)

## Action Structure

An action is declared in an **Endpoint** (Entity `3d8da4d4-8f76-4bb4-9212-14869d81c00c`), in its `definition.actions` array. The Miroir Endpoints are in `packages/miroir-test-app_deployment-miroir/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/`. Each action definition has:

| Attribute | Role |
|---|---|
| `actionParameters` | the shape of the action: `actionType` literal, `endpoint` literal (the Endpoint uuid), `payload`, … |
| `actionImplementation` | how the action runs, see below |
| `autocommitFromUI` | optional; `true` makes `handleActionFromUI` commit after the action |
| `logPhase` | optional; `bootstrap`, `rollback` or `query`, the activity-tracker phase while the action runs |

`actionImplementation` is one of:

- `{ "actionImplementationType": "libraryImplementation", "inMemoryImplementationFunctionName": "handleAction_<actionType>" }`: a TypeScript function registered in `miroirActionImplementations` (`packages/miroir-core/src/3_controllers/ActionImplementations.ts`), like the in-memory transformer library.
- `{ "actionImplementationType": "compositeActionTemplate", "definition": { … } }`: a composite action template, resolved against the action's payload and run by `DomainController`.

`DomainController.handleAction` finds the definition from the action's `endpoint` and `actionType` (Miroir Endpoints come from the bundled meta-model, application Endpoints from the application's model) and runs its implementation. It holds no list of action types.

## CRUD Operations

(Content to be added)

## Custom Actions

To add an action with a library implementation:

1. Declare it in an Endpoint JSON: `actionParameters`, then `actionImplementation` with `inMemoryImplementationFunctionName: "handleAction_<actionType>"`.
2. Add `handleAction_<actionType>` to `miroirActionImplementations`. A handler receives the `DomainControllerActionHost` (`packages/miroir-core/src/0_interfaces/3_controllers/DomainControllerActionHost.ts`), the action and an `ActionImplementationContext` (deployment map, model environment, principal), and returns an `Action2ReturnType`. If it needs a `DomainController` capability the host interface does not offer yet, add that method to the interface.
3. Rebuild (`npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-core`) and send the action through `handleAction`. `DomainController` itself is not edited.

A name missing from the map makes `handleAction` return an `InvalidAction` error naming it. `packages/miroir-core/tests/3_controllers/ActionImplementations.unit.test.ts` checks that every declared name resolves and that every action of the Model, Instance, Domain, StoreManagement, UndoRedo and Query Endpoints declares an implementation.

An action that combines existing actions needs no TypeScript: declare it with a `compositeActionTemplate` instead (e.g. `entity_DuplicateAttribute` in the ModelEndpoint).

## Examples

(Content to be added)

## Best Practices

(Content to be added)

---

**Note**: Action implementation guide coming soon.
