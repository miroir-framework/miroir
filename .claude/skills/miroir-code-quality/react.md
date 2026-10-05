# React smells

AGENTS.md, section "React", states the rules: functional components with hooks, a `useEffect` only when strictly necessary and after asking, data through props and hooks, no publish-subscribe between components, service data exposed through a hook. The entries below show how each rule is broken in this codebase and the remedy. Names in the snippets are illustrations unless an entry cites them as a sanctioned form.

## hooks-order

A hook called conditionally, in a loop or in a callback.

**Fix.** Call the hook at the top level and put the condition inside it.

```tsx
// Before
if (!deploymentUuid) return null;
const entities = useEntities(deploymentUuid);
// After
const entities = useEntities(deploymentUuid); // the hook returns [] for an undefined deployment
if (!deploymentUuid) return null;
```

**Lint.** Error (`react-hooks/rules-of-hooks`); existing violations are counted in `eslint-suppressions.json`.

## effect-derived-state

An effect, or a `useMemo`, that calls a `setState` to compute a value from props or other state.

**Why.** The component renders once with the stale value, then again with the new one; effects that set state trigger other effects. A `useMemo` must be pure: React may call it again, or skip it.

**Fix.** Compute the value during render. To reset state when an input changes, give the component a `key`, or reset it in the event handler that changes the input.

```tsx
// Before
useEffect(() => {
  const available = entities?.map((e) => e.uuid) ?? [];
  if (available.length > 0 && !available.includes(selectedEntityUuid)) {
    setSelectedEntityUuid(available[0]);
  }
}, [entities, selectedEntityUuid]);

// After
const available = entities?.map((e) => e.uuid) ?? [];
const effectiveEntityUuid = available.includes(selectedEntityUuid) ? selectedEntityUuid : available[0];
```

```tsx
// Before: reset the index whenever the entity changes
useEffect(() => { setCurrentInstanceIndex(0); }, [selectedEntityUuid]);
// After: the pager starts at 0 for each entity
<InstancePager key={selectedEntityUuid} entityUuid={selectedEntityUuid} />
```

**Leave it** when the effect synchronises with something outside React (DOM measurement, focus, a third-party widget) and sets state from what it read.

**Lint.** Error (`react-hooks/set-state-in-effect`; existing violations are counted in `eslint-suppressions.json`); the lens adds a check for `setState` in `useMemo`. The React Compiler rules only analyse functions that return JSX.

## state-from-props

`useState(props.x)`: local state initialised from a prop.

**Why.** The initial value is read once; when the prop changes, the copy goes stale, and code grows to re-sync it.

**Fix.** Make the component controlled (the parent owns the value), or key it so a new prop value remounts it.

```tsx
// Before
const [editedContent, setEditedContent] = useState(props.initialContent);
useMemo(() => { if (props.isOpen) setEditedContent(props.initialContent); }, [props.isOpen, props.initialContent]);

// After: the parent keys the modal per opening, so its state starts from the prop each time
<MarkdownEditorModal key={openCount} initialContent={content} isOpen={isOpen} />
```

**Leave it** when the prop is explicitly an initial value that the component then owns, named so (`initialValue`, `defaultValue`), and the parent never expects to push a new one.

**Lint.** Lens only.

## component-io

`fetch` (or another I/O call) inside a component or hook.

**Why.** The component cannot render without a server; the request skips the DomainController, its access checks and its activity tracking; a test has to fake the network.

**Fix.** For domain data, run an action or a query through the DomainController hooks. For anything else, put the call in a client that the composition root builds, and hand it in through props or context.

```tsx
// Before
const response = await fetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });

// After
const authClient = useAuthClient(); // provided by the root
const result = await authClient.login(username, password);
```

**Lint.** Error (`miroir/component-io`: the global `fetch` in views); existing violations are counted in `eslint-suppressions.json`.

## pub-sub

A `.subscribe(…)` call in a component or hook, usually in an effect that copies the published value into state.

**Why.** AGENTS.md: publish-subscribe between components is an anti-pattern here. The effect plus the state copy add a render, and the copy is stale between the event and the effect.

**Fix.** Read the service through `useSyncExternalStore`, inside a hook named after the data. Its `getSnapshot` must return the same object until the data changes, or React renders in a loop ("The result of getSnapshot should be cached to avoid an infinite loop"). `MiroirEventService.getAllEvents()` returns a new array on each call, so it cannot be the snapshot: the service keeps one and replaces it on change.

```tsx
// Before
const [events, setEvents] = useState(() => eventService.getAllEvents());
useEffect(() => eventService.subscribe((newEvents) => setEvents(newEvents)), [eventService]);

// After, in the service: one snapshot per change
private snapshot: MiroirEvent[] = [];
private listeners = new Set<() => void>();
getSnapshot = (): MiroirEvent[] => this.snapshot;
onChange = (listener: () => void): (() => void) => {
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);
};
private notifySubscribers(): void {
  this.snapshot = this.getAllEvents();
  this.listeners.forEach((listener) => listener());
}

// After, in the hook
return useSyncExternalStore(eventService.onChange, eventService.getSnapshot);
```

Both are arrows because React calls them without `this`. Sanctioned forms: `useAuthSession` (`auth/authSession.ts`), whose `currentSnapshot` returns the cached object while nothing changed, and `useYamlParserStatus` (`Reports/useYamlParserStatus.ts`), whose snapshot is a string.

**Leave it** outside React: services, sagas and the server subscribe as they need.

**Lint.** Error (`miroir/pub-sub`, in views); existing violations are counted in `eslint-suppressions.json`. It flags calls only, so passing `store.subscribe` to `useSyncExternalStore` is not reported.

## service-read-in-render

`useMemo(() => someService.read(), [deps])`.

**Why.** AGENTS.md: "a `useMemo` around a plain service call does not track the data". The memo re-runs when its dependencies change, not when the service's data does.

**Fix.** Read the data through a hook built as for `pub-sub`, then derive from it during render. `getErrorStats()` builds a new object on each call, so it cannot be the snapshot either: the errors are the snapshot, and the stats a pure function of them.

```tsx
// Before
const stats = useMemo(() => errorLogService.getErrorStats(), [errors]);
// After
const errors = useSyncExternalStore(errorLogService.onChange, errorLogService.getSnapshot); // one array per change
const stats = useMemo(() => errorStats(errors), [errors]);
```

**Leave it** when the call is a pure computation over its arguments (the lens only flags objects named `…Service`, `…Controller`, `…Tracker`, `…Registry`, `…Store` or `…Cache`).

**Lint.** Lens only.

## unstable-deps

A dependency list that serialises a value (`JSON.stringify`, `safeStringify`), or that misses a value the hook reads.

**Why.** Serialising runs on every render, on objects that can be large. A missing dependency reads a stale value.

**Fix.** Depend on the value itself. Redux and Formik state is immutable: its reference changes exactly when its content does.

```tsx
// Before
}, [safeStringify(formikContext.values.transformerEditor_input), persistedState]);
// After
}, [formikContext.values.transformerEditor_input, persistedState]);
```

For a function that changes on every render, define it with `useCallback` where it is created, or move it inside the hook.

**Lint.** Lens (`react-hooks/exhaustive-deps`, plus serialisation in a dependency list).

## prop-drilling

A prop that components pass on as is (`x={x}`, `x={props.x}`) through many files, or a group of props that always travel together.

**Why.** Each new value costs an edit in every component on the way, and those components depend on data they do not use. #453 added `transformerTypeBadges` at 16 places in 6 files of the value editors, the sixth per-path annotation to take that route; a hop that forgets it drops the value without an error.

**Fix.** Provide the value once in a context and read it with a hook where it is used. For props that travel together, pass one object.

```tsx
// Before: each editor in the tree declares the prop and passes it on
<MlObjectEditor {...rest} transformerTypeBadges={transformerTypeBadges} environmentAnnotations={environmentAnnotations} />

// After: the top editor provides the annotations once, the title row reads them
<EditorAnnotationsContext.Provider value={{ transformerTypeBadges, environmentAnnotations }}>…</EditorAnnotationsContext.Provider>
const { transformerTypeBadges } = useEditorAnnotations();
```

Sanctioned form: `TransformerTypesDisplayContext` (#453) hands a setting to the component test cases. The most drilled prop, `applicationDeploymentMap` (22 files), is also in the Miroir context (`useApplicationDeploymentMap()`, miroir-react), but `RootComponent` copies it there in an effect, one render late: give the context the value in the same render before removing the drilled copies.

**Leave it** for one or two levels, and for the props a component hands to the element it wraps (`className`, `style`, `id`, `onChange` …: the runner skips them).

**Lint.** Runner only: a prop passed on as is in 5 or more files.
