"use strict";

/**
 * Represents a set of coordinates in the grid. Think of a tuple.
 */
class Coordinate {
  /** @type {number} */
  #col;
  /** @type {number} */
  #row;

  /**
   * @param {number} col
   * @param {number} row
   */
  constructor(col, row) {
    this.#col = col;
    this.#row = row;
  }

  get col() {
    return this.#col;
  }

  get row() {
    return this.#row;
  }
}

export {Coordinate};
