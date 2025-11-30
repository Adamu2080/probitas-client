/**
 * Row array with first/last helper methods.
 * Implements ReadonlyArray<T> by extending Array<T>.
 */
export class SqlRows<T> extends Array<T> {
  constructor(items: readonly T[]) {
    super(...items);
    Object.setPrototypeOf(this, SqlRows.prototype);
  }

  /**
   * Get the first row, or undefined if empty.
   */
  first(): T | undefined {
    return this[0];
  }

  /**
   * Get the first row, or throw if empty.
   */
  firstOrThrow(): T {
    if (this.length === 0) {
      throw new Error("No rows found");
    }
    return this[0];
  }

  /**
   * Get the last row, or undefined if empty.
   */
  last(): T | undefined {
    return this[this.length - 1];
  }

  /**
   * Get the last row, or throw if empty.
   */
  lastOrThrow(): T {
    if (this.length === 0) {
      throw new Error("No rows found");
    }
    return this[this.length - 1];
  }
}
