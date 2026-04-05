"use strict";

/**
 * Individual cell in the game grid.
 */
class Cell {

  /** @type boolean */
  #alive;
  /** @type boolean */
  #highlighted;

  /**
   * @param {boolean} [alive=false] - If this cell is alive.
   * @param {boolean} [highlighted=false] - If this cell should be highlighted.
   */
  constructor(alive = false, highlighted = false) {
    this.#alive = alive;
    this.#highlighted = alive && highlighted;
  }

  /** @return {boolean} */
  get alive() {
    return this.#alive;
  }

  /**
   * If cell is marked as dead, also sets `highlighted` to false.
   * @param {boolean} value
   */
  set alive(value) {
    if (!value) {
      this.#highlighted = false;
    }
    this.#alive = value;
  }

  /** @return {boolean} */
  get highlighted() {
    return this.#highlighted;
  }

  /** @param {boolean} value */
  set highlighted(value) {
    this.#highlighted = value;
  }
}

export {Cell};
