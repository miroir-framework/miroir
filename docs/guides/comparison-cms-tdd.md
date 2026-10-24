# CMSs and Test-Driven Development

**Estimated reading time: 5 minutes**

This guide answers one question from the [comparison with alternatives](comparison.md): which content management systems support test-driven development, and how does Miroir compare? It reflects the state of these products as of October 2026.

---

## Short answer

Several CMSs support TDD, but almost always for the **code that extends the CMS** (plugins, modules, custom fields, hooks), not for the content model or the configuration built in the admin UI.

How far a CMS supports TDD depends on how far it supports **configuration as code**. When content types live only in the database, there is nothing stable to write a failing test against.

---

## Strong built-in testing support

#### [Drupal](https://www.drupal.org)

- The most complete test setup among traditional CMSs: PHPUnit with **Unit**, **Kernel** (minimal bootstrap with a real database), **Functional** (full site with a browser emulator) and **FunctionalJavascript** test types.
- Configuration export and import (`config/sync`) turns content types and fields into files that tests can rely on.

#### [Wagtail](https://wagtail.org) (Django)

- The Django test runner, plus `WagtailPageTestCase` with assertions such as `assertCanCreate`, `assertAllowedSubpageTypes` and `assertPageIsRoutable`.
- Page types are Python classes, so they can be specified by tests before they are written.

#### [Plone](https://plone.org) / Zope

- A long-standing test-first culture: `plone.app.testing` test layers and doctests.

#### [Craft CMS](https://craftcms.com)

- A testing framework based on Codeception, with fixtures for elements, entries and users.

---

## Code-first headless CMSs

These define the schema in TypeScript or JavaScript, which makes the model itself testable.

#### [Payload CMS](https://payloadcms.com)

- The whole configuration (collections, fields, hooks, access control) is TypeScript.
- The **Local API** runs operations directly from Vitest or Jest, without HTTP.
- Probably the best fit for TDD in the JavaScript ecosystem.

#### [Keystone 6](https://keystonejs.com)

- The schema is code; `getContext()` gives tests direct access to the GraphQL and query APIs.

#### [Strapi](https://strapi.io)

- The documentation covers testing with Jest and Supertest.
- Content types created in the admin UI generate schema files, so they can be kept under version control.

#### [Sanity](https://www.sanity.io)

- Schemas are code. Content is usually checked with dataset fixtures and validation rules rather than through a unit-test API.

---

## Possible, but not a natural fit

#### [WordPress](https://wordpress.org)

- `WP_UnitTestCase` and `wp-env` support test-first plugin development.
- Most site configuration lives in the database, which leaves it outside the reach of tests.

---

## Where Miroir differs

None of the CMSs above treat **tests as first-class content**, authored and run in the same environment that edits the model. Tests are written in an IDE and run in CI, separately from the admin UI where the model is built.

In Miroir:

- **MiroirTest is an Entity.** Tests are model data, stored in the same deployments as the Entities, Queries, Reports and Transformers they test.
- **Tests run from the application itself**, through the **Miroir Tests** menu of the standalone app, as well as from the CLI (`testMiroir`).
- **The model is always data.** There is no split between a "configuration in the database" part and a "configuration as code" part: every Entity, Query, Transformer and Report is a JSON instance validated by ML schemas, so all of it can be tested.

This follows from Miroir's [development-runtime integration](why-miroir.md): writing a test, changing the model and seeing the result all happen in the same place.

| | Tests for extension code | Model / configuration testable | Tests are model data | Tests run from the app UI |
|---|---|---|---|---|
| **Drupal** | ✅ | ✅ (config sync) | ❌ | ❌ |
| **Wagtail** | ✅ | ✅ (Python classes) | ❌ | ❌ |
| **Plone** | ✅ | ✅ | ❌ | ❌ |
| **Craft CMS** | ✅ | Partial (project config) | ❌ | ❌ |
| **Payload** | ✅ | ✅ (TypeScript config) | ❌ | ❌ |
| **Keystone 6** | ✅ | ✅ (schema as code) | ❌ | ❌ |
| **Strapi** | ✅ | Partial (generated schema files) | ❌ | ❌ |
| **Sanity** | Partial | ✅ (schema as code) | ❌ | ❌ |
| **WordPress** | ✅ | ❌ (mostly in database) | ❌ | ❌ |
| **Miroir** | ✅ | ✅ (model is data) | ✅ | ✅ |

---

## Next Steps

- **[Testing guide →](developer/testing.md)** - Writing and running MiroirTests
- **[Comparison with alternatives →](comparison.md)** - Miroir against 30+ platforms
- **[Why Miroir →](why-miroir.md)** - The philosophy behind development-runtime integration

---

**[← Back to Documentation Index](../index.md)**
