"use strict";

import {Letter} from "./letter.js";

/**
 * Object representing {@linkcode Letter|Letters} of the alphabet rendered in a
 * pixel font (specifically {@link https://github.com/IdreesInc/Minecraft-Font|
 * a fan rendition} of the font from {@link https://www.minecraft.net/|
 * Minecraft}).
 *
 * The matrices defined in this object are written in a different orientation
 * from the canvas grid orientation, but it's much nicer to write the letters
 * out this way.
 *
 * Thankfully, they are automatically transposed by the {@link Letter}
 * constructor into the correct format!
 *
 * @type {Object.<string, function: Letter>}
 */
const alphabet = {

  /**
   * Returns the letter `a`.
   * @returns {Letter}
   */
  "a": () => (new Letter([
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0]
  ])),
}

export {alphabet};
