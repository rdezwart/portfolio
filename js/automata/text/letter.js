"use strict";

/**
 * Module for {@linkcode Letter}.
 * @module automata/text/letter
 */

/**
 * Represents a letter in a pixel font (specifically
 * [a fan rendition]{@link https://github.com/IdreesInc/Minecraft-Font} of the
 * font from [Minecraft]{@link https://www.minecraft.net/}).
 */
class Letter {
  /**
   * How many pixels tall each standard {@linkcode Letter} is.
   * @readonly
   * @const {number}
   */
  static get STANDARD_HEIGHT() {
    return 8;
  }

  /**
   * How many pixels wide each standard {@linkcode Letter} is.
   * @readonly
   * @const {number}
   */
  static get STANDARD_WIDTH() {
    return 5;
  }

  /**
   * An array of pixels that is `1` wide, and {@linkcode Letter.STANDARD_HEIGHT}
   * pixels tall, meant to be placed between letters.
   * @readonly
   * @const {number[]}
   */
  static get SEPARATOR() {
    return new Array(this.STANDARD_HEIGHT).fill(0);
  }

  /**
   * 2D array of numbers designating where active
   * [Cells]{@linkcode module:automata/cell.Cell} should be placed when drawing
   * this {@linkcode Letter}.
   * @type {number[][]}
   */
  #pixels;

  /**
   * How many columns this {@linkcode Letter} occupies.
   * @type {number}
   */
  #cols;
  /**
   * How many rows this {@linkcode Letter} occupies.
   * @type {number}
   */
  #rows;


  /**
   * Constructs a new {@linkcode Letter}.
   *
   * Many common alphanumeric characters have already been implemented in
   * [Alphabet]{@linkcode module:automata/text/alphabet.Alphabet}, ready for
   * use.
   * @example
   *     // Creating a new Letter in a natural orientation.
   *     // Requires `doTranspose=true` (default value).
   *     let a = new Letter([
   *       [0, 0, 0, 0, 0],
   *       [0, 0, 0, 0, 0],
   *       [0, 1, 1, 1, 0],
   *       [0, 0, 0, 0, 1],
   *       [0, 1, 1, 1, 1],
   *       [1, 0, 0, 0, 1],
   *       [0, 1, 1, 1, 1],
   *       [0, 0, 0, 0, 0]
   *     ]);
   * @param {number[][]} pixels - 2D array of numbers designating where active
   *     [Cells]{@linkcode module:automata/cell.Cell} should be placed when
   *     drawing this {@linkcode Letter}.
   *
   *     Dead [Cells]{@linkcode module:automata/cell.Cell} should be represented
   *     with `0`, living [Cells]{@linkcode module:automata/cell.Cell} with `1`,
   *     and highlighted [Cells]{@linkcode module:automata/cell.Cell} with `2`.
   * @param {boolean} [doTranspose=true] - If {@linkcode Letter#pixels} should
   *     be [transposed]{@link Letter.transpose} into the correct format for a
   *     [Grid]{@linkcode module:automata/grid.Grid}.
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
   * Flips a 2D array (matrix) on its side.
   *
   * Referenced: https://stackoverflow.com/a/46805290
   * @param {*[][]} matrix - The 2D matrix to perform this operation on.
   * @returns {*[][]} - A transposed 2D matrix.
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
   * [Array.map()]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map}.
   * This method passes the value of each element to the callback.
   * @param {function(number): number} fn - The function to apply to each
   *     pixel in this {@linkcode Letter}. Should return a `number`.
   */
  map(fn) {
    this.#pixels = this.#pixels.map((col, c) => {
      return this.#pixels[c].map((row, r) => {
        return fn(this.#pixels[c][r]);
      });
    });
  }


  /**
   * 2D array of numbers designating where active
   * [Cells]{@linkcode module:automata/cell.Cell} should be placed when drawing
   * this {@linkcode Letter}.
   * @readonly
   * @type {number[][]}
   */
  get pixels() {
    return this.#pixels;
  }

  /**
   * How many columns this {@linkcode Letter} occupies.
   * @readonly
   * @type {number}
   */
  get cols() {
    return this.#cols;
  }

  /**
   * How many rows this {@linkcode Letter} occupies.
   * @readonly
   * @type {number}
   */
  get rows() {
    return this.#rows;
  }
}

export {Letter};
