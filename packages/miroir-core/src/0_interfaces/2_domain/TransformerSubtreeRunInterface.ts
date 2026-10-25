/**
 * #500 — one evaluation of a transformer subtree in a context its ancestors give it: `label` names
 * what that context binds when an ancestor runs it once per element (`defaultInput[1]`), absent
 * when it runs once.
 */
export interface TransformerSubtreeRun {
  label?: string;
  value: unknown;
}
