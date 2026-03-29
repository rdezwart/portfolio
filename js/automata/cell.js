"use strict";

/**
 * Individual cell in the game grid.
 */
class Cell {

  /** @type boolean */
  alive;

  /**
   * @param {boolean} [alive=false] - If this cell is alive.
   */
  constructor(alive = false) {
    this.alive = alive;
  }
}
