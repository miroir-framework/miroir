// Load-timing marks from miroir-react code (#580, #633 D6). The browser recorder lives in the host application,
// because it observes fetch and the DOM from the first module the page loads; miroir-react only forwards
// named marks to whatever sink the host registers. Without a sink, a mark does nothing.

export type LoadTimingMarkSink = (name: string) => void;

let sink: LoadTimingMarkSink | undefined;

export function setLoadTimingMarkSink(next: LoadTimingMarkSink | undefined): void {
  sink = next;
}

export function loadTimingMark(name: string): void {
  sink?.(name);
}
