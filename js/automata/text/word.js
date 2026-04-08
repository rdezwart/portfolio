"use strict";

/**
 * Module for {@linkcode Word}.
 * @module automata/text/word
 * @requires module:automata/text/letter.Letter
 * @requires module:automata/text/alphabet.Alphabet
 */

import {Letter} from "./letter.js";
import {Alphabet} from "./alphabet.js";

/**
 * Represents several [Letter]{@linkcode module:automata/text/letter.Letter}
 * objects constructed from
 * [Alphabet]{@linkcode module:automata/text/alphabet.Alphabet}, strung together
 * into one unit.
 */
class Word {
  /**
   * The number of
   * [Letter.SEPARATOR]{@linkcode module:automata/text/letter.Letter.SEPARATOR}
   * columns that should be placed between each
   * [Letter]{@linkcode module:automata/text/letter.Letter}.
   * @readonly
   * @const {number}
   * @default 1
   */
  static get GAP() {
    return 1;
  }

  /**
   * The string representation of the regular
   * [Letters]{@linkcode module:automata/text/letter.Letter} in this
   * {@linkcode Word}.
   * @type {string}
   */
  #regularText;
  /**
   * The string representation of the highlighted
   * [Letters]{@linkcode module:automata/text/letter.Letter} in this
   * {@linkcode Word}.
   * @type {string}
   */
  #highlightedText;

  /**
   * Array of [Letters]{@linkcode module:automata/text/letter.Letter} in this
   * {@linkcode Word}.
   * @type {Letter[]}
   */
  #letters = [];
  /**
   * A large 2D matrix combining the individual
   * [pixel]{@linkcode module:automata/text/letter.Letter#pixels} matrices from
   * each {@linkcode module:automata/text/letter.Letter} in this
   * {@linkcode Word}.
   * @type {number[][]}
   */
  #pixels = [];

  /**
   * The number of columns this {@linkcode Word} occupies.
   * @type {number}
   */
  #cols = 0;
  /**
   * The number of rows this {@linkcode Word} occupies.
   * @type {number}
   */
  #rows = 0;


  /**
   * Constructs a {@linkcode Word} by parsing the individual characters of
   * the arguments into their respective
   * [Letters]{@linkcode module:automata/text/letter.Letter}.
   * @param {string} regularText - The text to be displayed in regular living
   *     [Cells]{@linkcode module:automata/cell.Cell}.
   * @param {string} [highlightedText] - The text to be displayed in highlighted
   *     [Cells]{@linkcode module:automata/cell.Cell}.
   */
  constructor(regularText, highlightedText = "") {
    this.#regularText = regularText;
    this.#highlightedText = highlightedText;

    if (this.#regularText?.length > 0) {
      for (let char of this.#regularText.split("")) {
        try {
          this.appendLetter(char);
        } catch (/** @type Error */ e) {
          console.error(`${e.name}: ${e.message}`)
        }
      }
    }

    if (this.#highlightedText?.length > 0) {
      for (let char of this.#highlightedText.split("")) {
        try {
          this.appendLetter(char, true);
        } catch (/** @type Error */ e) {
          console.error(`${e.name}: ${e.message}`)
        }
      }
    }

    this.concatLetters();
  }


  /**
   * Appends a [Letter]{@linkcode module:automata/text/letter.Letter} to this
   * {@linkcode Word}.
   * @param {string} char - The single character to be converted into a
   *     [Letter]{@linkcode module:automata/text/letter.Letter}.
   * @param {boolean} [highlighted=false] - If this
   *     [Letter]{@linkcode module:automata/text/letter.Letter} should be
   *     highlighted.
   * @throws {RangeError} - If an unsupported `char` is passed.
   */
  appendLetter(char, highlighted = false) {
    if (!(char in Alphabet)) {
      throw new RangeError(
        `Cannot add "${char}" from "${this.allText}", character unsupported.`
      );
    }

    /** @type Letter */
    let letter = Alphabet[char]();

    if (highlighted) {
      // Turn all 1s into 2s but leave 0s untouched
      letter.map((val) => {
        return val * 2;
      });
    }

    this.#letters.push(letter);
    this.#cols += letter.cols + Word.GAP;
    this.#rows = letter.rows > this.#rows ? letter.rows : this.#rows;
  }

  /**
   * Concatenates all [Letters]{@linkcode module:automata/text/letter.Letter}
   * in this {@linkcode Word} together, with
   * [Letter.SEPARATOR]{@linkcode module:automata/text/letter.Letter.SEPARATOR}
   * columns in between.
   */
  concatLetters() {
    this.#pixels = [];

    for (let letter of this.#letters) {
      for (let c = 0; c < letter.pixels.length; c++) {
        this.#pixels.push(letter.pixels[c]);
      }

      for (let g = 0; g < Word.GAP; g++) {
        this.#pixels.push(Letter.SEPARATOR);
      }
    }
  }


  /**
   * A large 2D matrix combining the individual
   * [pixel]{@linkcode module:automata/text/letter.Letter#pixels} matrices from
   * each {@linkcode module:automata/text/letter.Letter} in this
   * {@linkcode Word}.
   * @type {number[][]}
   */
  get pixels() {
    return this.#pixels;
  }

  /**
   * The number of columns this {@linkcode Word} occupies.
   * @readonly
   * @type {number}
   */
  get cols() {
    // Remove the extra gap from the last character
    return Math.max(0, this.#cols - Word.GAP);
  }

  /**
   * The number of rows this {@linkcode Word} occupies.
   * @readonly
   * @type {number}
   */
  get rows() {
    return this.#rows;
  }

  /**
   * The string representation of the regular
   * [Letters]{@linkcode module:automata/text/letter.Letter} in this
   * {@linkcode Word}.
   * @readonly
   * @type {string}
   */
  get regularText() {
    return this.#regularText;
  }

  /**
   * The string representation of the highlighted
   * [Letters]{@linkcode module:automata/text/letter.Letter} in this
   * {@linkcode Word}.
   * @readonly
   * @type {string}
   */
  get highlightedText() {
    return this.#highlightedText;
  }

  /**
   * The string representation of ALL
   * [Letters]{@linkcode module:automata/text/letter.Letter} in this
   * {@linkcode Word}.
   * @readonly
   * @type {string}
   */
  get allText() {
    return this.#regularText + this.#highlightedText;
  }
}

export {Word};
