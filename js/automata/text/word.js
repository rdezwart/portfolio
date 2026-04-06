"use strict";

import {Letter} from "./letter.js";
import {alphabet} from "./alphabet.js";


/**
 * Represents several {@link Letter} objects constructed from {@link alphabet},
 * strung together into one unit.
 *
 * @requires Letter
 * @requires alphabet
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

    if (this.#regularText?.length > 0)
      for (let char of this.#regularText.split(""))
        this.appendLetter(char);

    if (this.#highlightedText?.length > 0)
      for (let char of this.#highlightedText.split(""))
        this.appendLetter(char, true);

    this.concatLetters();
  }


  /**
   * Appends a {@linkcode Letter} to this {@linkcode Word}.
   *
   * @param {string} char - The single character to be converted into a Letter.
   * @param {boolean} [highlighted=false] - If this Letter should be highlighted.
   * @throws {Error} Will throw an error if an unknown `char` is passed.
   */
  appendLetter(char, highlighted = false) {
    if (!(char in alphabet)) {
      console.warn("Cannot add '%s' from '%s', character unsupported.",
        char,
        this.#regularText + this.#highlightedText
      );
      return;
    }

    /** @type Letter */
    let letter = alphabet[char]();

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
}

export {Word};
