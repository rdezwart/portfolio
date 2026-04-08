"use strict";

/**
 * Module for {@linkcode Cell}.
 * @module automata/cell
 * @see module:automata/grid.Grid
 */

/**
 * Individual cell in a simulation {@linkcode module:automata/grid.Grid|Grid}.
 */
class Cell {
  /**
   * If this {@linkcode Cell} is alive and should be drawn in normal colours.
   * @type {boolean}
   */
  #alive;
  /**
   * If this {@linkcode Cell} should be drawn in alternate colours.
   *
   * A {@linkcode Cell} cannot be highlighted and dead at the same time.
   * @type {boolean}
   */
  #highlighted;


  /**
   * Constructs a new {@linkcode Cell}.
   * @param {boolean} [alive=false] - If this {@linkcode Cell} is alive and
   *     should be drawn in normal colours.
   * @param {boolean} [highlighted=false] - If this {@linkcode Cell} is
   *     highlighted and should be drawn in alternate colours.
   *
   *     A {@linkcode Cell} cannot be highlighted and dead at the same time.
   */
  constructor(alive = false, highlighted = false) {
    this.#alive = alive;
    this.#highlighted = alive && highlighted;
  }


  /**
   * If this {@linkcode Cell} is alive and should be drawn in normal colours.
   * @type {boolean}
   */
  get alive() {
    return this.#alive;
  }

  /**
   * If this {@linkcode Cell} is alive and should be drawn in normal colours.
   *
   * If this {@linkcode Cell} is marked as dead, also sets
   * {@linkcode highlighted} to `false`.
   * @param {boolean} alive
   */
  set alive(alive) {
    if (!alive) {
      this.#highlighted = false;
    }
    this.#alive = alive;
  }

  /**
   * If this {@linkcode Cell} should be drawn in alternate colours.
   * @type {boolean}
   */
  get highlighted() {
    return this.#highlighted;
  }

  /**
   * If this {@linkcode Cell} should be drawn in alternate colours.
   *
   * A {@linkcode Cell} cannot be highlighted and dead at the same time.
   * @param {boolean} highlighted
   */
  set highlighted(highlighted) {
    this.#highlighted = highlighted && this.#alive;
  }
}

export {Cell};
