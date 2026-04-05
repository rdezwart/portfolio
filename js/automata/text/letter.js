"use strict";

import {Coordinate} from "./coordinate.js";

/**
 * Represents a letter in a pixel font.
 */
class Letter {
  /** @type {Coordinate[]} */
  #coords;
  /** @type {number} */
  #cols;
  /** @type {number} */
  #rows;

  /**
   * @param {Coordinate[]} coords
   * @param {number} [cols=5]
   * @param {number} [rows=7]
   */
  constructor(coords, cols = 5, rows = 7) {
    this.#coords = coords;
    this.#cols = cols;
    this.#rows = rows;
  }

  /**
   * The coordinates of where active cells should be placed to create this
   * letter.
   * @type {Coordinate[]}
   */
  get coords() {
    return this.#coords;
  }

  /**
   * How many columns this letter occupies.
   * @type {number}
   */
  get cols() {
    return this.#cols;
  }

  /**
   * How many rows this letter occupies.
   * @type {number}
   */
  get rows() {
    return this.#rows;
  }
}

export {Letter};
