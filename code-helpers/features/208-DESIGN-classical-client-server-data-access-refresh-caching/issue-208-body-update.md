# Proposed update to GitHub issue #208 body

> Agent token could not `gh issue edit` / comment on #208 (`Resource not accessible by
> integration`). Paste the following as the issue body (or merge into it) when permissions allow.

---

There are some classic situations that need to be dealt with around client / server interactions. The main reason for their existence is to circumvent the need to load an amount of data that would be too large for either the network or the client itself (too large for the cache, mainly). The ability to circumvent this problematic is limited by the need to display consistent / actual data to the user, without which the value of the software decreases rapidly.

For example:
- **Entity cardinality** is too large for a full local-cache load: the number of instances makes Entity-wide batch load impractical (e.g. a Library book lending / activity log where most rows are archive-level and only the most recent matter) or literally impossible (Entities with millions to billions of records). Access must be windowed / filtered / paged / keyed; the local cache can only ever hold a working subset
- Entity instance data (eg. Blob) is too large to be batch-loaded, load should happen on instance uuid-basis (with list of uuids, potentially) but the list of existing Blob instances shall be obtained before accessing individual instances
- some entities should never fetch from local cache without refresh; another way to say it is that cached instances are immediately stale and can be cache-evicted; another way to say it is that network fetch must happen on every report display for instances of such an Entity

Cardinality (#instances), payload size (bytes/instance), and freshness are **orthogonal** axes; all three break naïve “load all instances of Entity E into the CLIENT cache” behaviour.

identified main problems to be solved:
- **high / unbounded Entity cardinality** (cannot load all instances into the client local cache; need subset selection: recent window, filter, page, uuid set)
- multi-origin loading, when an item is "required" in different contexts (reports, queries, etc)
- cache under-eviction, cache over-eviction
- network over-fetch, network under-fetch, data denormalization on network fetch

identified key techniques for resolution:
- keep tracability of cache data, reason for which each item was loaded
- explicitly associate a given consistency level to model elements ensuring transparency to the user (overlays with the first point)
- use some sort of algebraic constraint DSL to decide on cache eviction & network fetch

Analysis (first pass): `code-helpers/features/208-DESIGN-classical-client-server-data-access-refresh-caching/analysis.md` (PR #210)
