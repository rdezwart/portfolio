"use strict";

import {Coordinate} from "./coordinate.js";
import {Letter} from "./letter.js";
import {alphabet} from "./alphabet.js";

class Word {
  static get GAP() {
    return 1;
  }

  /** @type {string} */
  #text;

  /** @type {Letter[]} */
  #letters = [];
  /** @type {Coordinate[][]} */
  #coords = [];
  /** @type {number} */
  #cols = 0;
  /** @type {number} */
  #rows = 0;

  /**
   *
   * @param {string} text
   */
  constructor(text) {
    this.#text = text;

    for (let char in this.text.split("")) {

      let letter = alphabet[char]();
      if (letter === undefined)
        throw new Error(`This character is unsupported: '${char}'`);

      this.#letters.push(letter);
      this.#cols += letter.cols + Word.GAP;
      this.#rows = letter.rows > this.#rows ? letter.rows : this.#rows;
    }
    // Remove the extra gap from the last character
    this.#cols -= Word.GAP;

    this.createWord();
  }

  createWord() {
    let col = 0;
    let row = 0;

    for (let letter in this.#letters) {
      this.#coords.push(letter.coords);
    }
  }

  get text() {
    return this.#text;
  }
}

export {Word};
