# Working on the Library application through its files

This folder holds the Library application of Miroir as JSON files. You change the application by
editing these files; a Miroir server reads them when it starts. There is no server running for you.

## Layout

- `library/model/<parentUuid>/<uuid>.json`: the model of the Library (Entities, Queries, Reports,
  Endpoints, MiroirTests...). The folder name is the uuid of the meta Entity of the instances it holds.
- `library/data/<entityUuid>/<uuid>.json`: the data, one file per instance.
- `meta-model/`: the Miroir application's model, read only. It holds the meta Entities (Entity, Query,
  Report, Endpoint, MiroirTest...) with their `mlSchema`, the schema their instances follow.
- `./check`: validates the files of `library/` against the `mlSchema` of their Entity (and Queries and
  Reports against the schema the runtime uses) and prints the errors with their file. MiroirTests are not
  checked. Run it after each change. Nothing here runs a Query or a MiroirTest.

## Miroir in short

- An application is described by data: its **model** and its **data**. Every model element is an
  instance of a meta Entity, with `uuid`, `parentName`, `parentUuid`. A new Query is a new file in
  the Query folder of `library/model/`, with a fresh uuid.
- Queries combine extractors (instances of an Entity, one instance by uuid...), combiners and
  transformers. Reports display the result of a Query through sections. Endpoints declare actions.
- Existing files are the best examples of the format.

## Identifiers

| What | uuid |
|---|---|
| Library application | `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| Library deployment | `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` |
| Entity Book | `e8ba151b-d68e-4cc3-9a83-3459d309ccf5` |
| Entity User | `ca794e28-b2dc-45b3-8137-00151557eea8` |
| Entity LendingHistoryItem | `e81078f3-2de7-4301-bd79-d3a156aec149` |
| meta Entity Query | `e4320b9e-ab45-4abe-85d8-359604b3c62f` |
| meta Entity Report | `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| meta Entity Endpoint | `3d8da4d4-8f76-4bb4-9212-14869d81c00c` |
| meta Entity MiroirTest | `a311f363-e238-4203-bdfc-29e8c160c26b` |
| meta Entity TransformerDefinition | `a557419d-a288-4fb8-8a1e-971c86c113b8` |
