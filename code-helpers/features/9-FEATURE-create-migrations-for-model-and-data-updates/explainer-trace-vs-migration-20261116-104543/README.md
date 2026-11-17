# Explainer: which actions a Migration runs, compared with what a trace records

> **Describes #9 before #745.** Since #745, a Migration has no jump: its model steps replay the traced model Actions, in one ordered list with the data steps, and a migration run checks the model against the frozen `from` and `to` versions. See [`docs/reference/versioning.md`](../../../../docs/reference/versioning.md#migrations-and-deployment-roles).

`trace-vs-migration.html` is the page; `candidate.archify.md` its source.
