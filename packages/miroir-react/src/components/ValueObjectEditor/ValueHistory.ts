import equal from "fast-deep-equal";

// ################################################################################################
// #499 (analysis #497, G2): the undo / redo history of one edited value. It does not know how the
// value is written: its owner reports every value it sees (`observe`), whichever view or effect
// wrote it, and writes back what `undo` and `redo` return. Entries are deep copies, so no later
// write to the edited value can alter them.
// ################################################################################################

const DEFAULT_LIMIT = 100;

function snapshot(value: unknown): unknown {
  return value === undefined ? undefined : structuredClone(value);
}

export class ValueHistory {
  private entries: unknown[];
  private index = 0;
  /** The value last observed, to skip the comparison when the owner sees the same value again. */
  private lastObserved: unknown;
  /** The text field whose typing made the current entry; typing there again extends the entry. */
  private openGroup: EventTarget | undefined;

  constructor(
    value: unknown,
    private readonly limit: number = DEFAULT_LIMIT,
  ) {
    this.entries = [snapshot(value)];
    this.lastObserved = value;
  }

  get canUndo(): boolean {
    return this.index > 0;
  }

  get canRedo(): boolean {
    return this.index < this.entries.length - 1;
  }

  /**
   * Records `value` when it differs from the current entry. `typedInto` is the text field the
   * change was typed into, if any: consecutive changes typed into the same field make one entry.
   * Returns whether an entry was added or extended.
   */
  observe(value: unknown, typedInto?: EventTarget): boolean {
    // an absent value (a selector branch without the field) is no step: undoing to it would remove
    // the field, and its Undo and Redo buttons with it
    if (value === undefined || value === this.lastObserved) {
      return false;
    }
    this.lastObserved = value;
    if (equal(value, this.entries[this.index])) {
      return false;
    }
    this.entries.splice(this.index + 1);
    if (typedInto !== undefined && typedInto === this.openGroup && this.index > 0) {
      if (equal(value, this.entries[this.index - 1])) {
        // the typing undid itself: a step would change nothing
        this.entries.splice(this.index);
        this.index -= 1;
        this.openGroup = undefined;
        return true;
      }
      this.entries[this.index] = snapshot(value);
      return true;
    }
    this.entries.push(snapshot(value));
    if (this.entries.length > this.limit) {
      this.entries.shift();
    }
    this.index = this.entries.length - 1;
    this.openGroup = typedInto;
    return true;
  }

  /** Ends the current typing group: the next change makes a new entry. */
  closeGroup(): void {
    this.openGroup = undefined;
  }

  /** Forgets every entry: `value` is the new starting point (a stored transformer was loaded). */
  reset(value: unknown): void {
    this.entries = [snapshot(value)];
    this.index = 0;
    this.lastObserved = value;
    this.openGroup = undefined;
  }

  /** Steps back; returns a copy of the value to write, or undefined when there is nothing to undo. */
  undo(): { value: unknown } | undefined {
    return this.moveTo(this.index - 1);
  }

  /** Steps forward; returns a copy of the value to write, or undefined when there is nothing to redo. */
  redo(): { value: unknown } | undefined {
    return this.moveTo(this.index + 1);
  }

  private moveTo(index: number): { value: unknown } | undefined {
    if (index < 0 || index >= this.entries.length) {
      return undefined;
    }
    this.index = index;
    this.openGroup = undefined;
    const value = snapshot(this.entries[index]);
    this.lastObserved = value;
    return { value };
  }
}
