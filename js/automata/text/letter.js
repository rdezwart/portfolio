"use strict";


/**
 * Represents a letter in a pixel font (specifically {@link
 * https://github.com/IdreesInc/Minecraft-Font|a fan rendition} of the font
 * from {@link https://www.minecraft.net/|Minecraft}).
 */
class Letter {
  /** @readonly
   * @const {number} */
  static get STANDARD_HEIGHT() {
    return 8;
  }

  /** @readonly
   * @const {number} */
  static get STANDARD_WIDTH() {
    return 5;
  }

  /**
   * @readonly
   * @const {number[]}
   */
  static get SEPARATOR() {
    return new Array(this.STANDARD_HEIGHT).fill(0);
  }

  /**
   * 2D array designating where active cells should be placed to create this
   * letter.
   * @type {number[][]}
   */
  #pixels;

  /**
   * How many columns this letter occupies.
   * @type {number}
   */
  #cols;

  /**
   * How many rows this letter occupies.
   * @type {number}
   */
  #rows;

  /**
   * @param {number[][]} pixels
   * @param {boolean} [doTranspose=true]
   * @throws {SyntaxError} - If no pixels are passed.
   */
  constructor(pixels, doTranspose = true) {
    if (pixels.length === 0 || pixels[0].length === 0)
      throw new SyntaxError("No pixels passed.");

    this.#pixels = doTranspose ? Letter.transpose(pixels) : pixels;
    this.#cols = this.#pixels.length;
    this.#rows = this.#pixels[0].length;
  }

  /**
   * Flips a 2D array on its side.
   *
   * Referenced: https://stackoverflow.com/a/46805290
   * @param {*[][]} matrix
   * @returns {*[][]}
   */
  static transpose(matrix) {
    return matrix[0].map((col, c) => {
      return matrix.map((row, r) => {
        return matrix[r][c];
      });
    });
  }

  /**
   * Applies a callback function to the entire 2D array, much like
   * {@link Array.map}. This method passes the value of each element to the
   * callback.
   * @param {function(number): number} fn
   */
  map(fn) {
    this.#pixels = this.#pixels.map((col, c) => {
      return this.#pixels[c].map((row, r) => {
        return fn(this.#pixels[c][r]);
      });
    });
  }

  get pixels() {
    return this.#pixels;
  }

  get cols() {
    return this.#cols;
  }

  get rows() {
    return this.#rows;
  }
}

export {Letter};
