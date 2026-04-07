"use strict";

import {Letter} from "./letter.js";

import {Alphabet} from "./alphabet.js";

/**
 * Represents several {@linkcode Letter} objects constructed from
 * {@linkcode Alphabet}, strung together into one unit.
 */
class Word {

  /**
   * The number of empty pixels should be placed between each
   * {@linkcode Letter}.
   *
   * @readonly
   * @const {number}
   * @default 1
   */
  static get GAP() {
    return 1;
  }

  /** @type {string} */
  #regularText;
  /** @type {string} */
  #highlightedText;

  /** @type {Letter[]} */
  #letters = [];
  /** @type {number[][]} */
  #pixels = [];

  /** @type {number} */
  #cols = 0;
  /** @type {number} */
  #rows = 0;


  /**
   * Parses the individual characters of strings into their respective
   * {@link Letter|Letters}.
   *
   * @param {string} regularText
   * @param {string} [highlightedText]
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
   * Appends a {@linkcode Letter} to this {@linkcode Word}.
   *
   * @param {string} char - The single character to be converted into a Letter.
   * @param {boolean} [highlighted=false] - If this Letter should be highlighted.
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
   * Concatenates all {@linkcode Letter|Letters} in this {@linkcode Word}
   * together, with gaps in between.
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
   * A large matrix combining the individual {@linkcode Letter.pixels|pixels}
   * from each {@linkcode Letter}.
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
   * The string representation of the regular {@linkcode Letter|Letters} in this
   * {@linkcode Word}.
   * @readonly
   * @type {string}
   */
  get regularText() {
    return this.#regularText;
  }

  /**
   * The string representation of the highlighted {@linkcode Letter|Letters} in
   * this {@linkcode Word}.
   * @readonly
   * @type {string}
   */
  get highlightedText() {
    return this.#highlightedText;
  }

  /**
   * The string representation of ALL {@linkcode Letter|Letters} in this
   * {@linkcode Word}.
   * @readonly
   * @type {string}
   */
  get allText() {
    return this.#regularText + this.#highlightedText;
  }
}

export {Word};
