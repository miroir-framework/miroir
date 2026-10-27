# Working on the Library application through Miroir's MCP tools

A Miroir server runs the Library application. You change it only through the MCP tools of the server
named `miroir`; you have no file or shell access. A change you make through a tool is live at once.

## Miroir in short

- An application is described by data, in JSON: its **model** (Entities, Queries, Reports, Endpoints,
  MiroirTests...) and its **data** (the instances of its Entities).
- Every model element is itself an instance of a meta Entity, with `uuid`, `parentName`, `parentUuid`.
  You create a Query by creating an instance of the Query Entity in the model section.
- Each Entity carries an `mlSchema`: the schema its instances must follow. Read it before you write one.
- Queries combine extractors (instances of an Entity, one instance by uuid...), combiners and
  transformers. Reports display the result of a Query through sections. Endpoints declare actions.

## Identifiers

| What | uuid |
|---|---|
| Library application | `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| Library deployment | `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` |
| Entity Book | `e8ba151b-d68e-4cc3-9a83-3459d309ccf5` |
| Entity User | `ca794e28-b2dc-45b3-8137-00151557eea8` |
| Entity LendingHistoryItem | `e81078f3-2de7-4301-bd79-d3a156aec149` |
| Entity Author | `d7a144ff-d1b9-4135-800c-a7cfc1f38733` |
| meta Entity Entity | `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` |
| meta Entity Query | `e4320b9e-ab45-4abe-85d8-359604b3c62f` |
| meta Entity Report | `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| meta Entity Endpoint | `3d8da4d4-8f76-4bb4-9212-14869d81c00c` |
| meta Entity MiroirTest | `a311f363-e238-4203-bdfc-29e8c160c26b` |
| meta Entity TransformerDefinition | `a557419d-a288-4fb8-8a1e-971c86c113b8` |

## How to work

- Read before you write: `getInstances` on a meta Entity in the Library's model section lists the
  existing Queries, Reports, Endpoints and MiroirTests. They are the best examples of the format.
- The meta Entities themselves (with their `mlSchema`) belong to the Miroir application; read them
  with `getInstances` / `getInstance` the same way.
- Create or change model elements with `createInstance` and `updateInstance` on the model section.
- Run a Query with `runBoxedQueryTemplateAction` (or `runBoxedQueryAction`) to check its result.
- Run a MiroirTest with `runMiroirTestAction`: it runs on a throwaway copy of the Library, so a test that lends
  or changes instances leaves the Library as it was.
- `Library_lendDocument` and `Library_returnDocument` are the actions of the Lending Endpoint.
