# Start a project

`@miroir-framework/create-app` writes a Miroir project: a Vite client and a Node server on the filesystem store, with
the Miroir and Admin applications. It needs Node 22 or later.

```bash
npm create @miroir-framework/app my-app
cd my-app
npm install
npm run build
npm start          # http://localhost:3080
```

The generator asks no questions. It refuses a folder that is not empty, and pins every `@miroir-framework/*`
dependency to its own version (the packages are released together).

The project's `README.md` describes its layout, how to move an application to Postgres, and authentication. The
environment file follows [environments.md](../reference/environments.md); the core exports the template uses are
marked `@public` ([core-public-api.md](../reference/core-public-api.md)).

The release pipeline builds such a project from the packed tarballs before each release
([release-process.md §6a](../reference/release-process.md#6a-the-generated-project-consumer-test-658)).
