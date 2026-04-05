"use strict";

import {Coordinate} from "./coordinate.js";
import {Letter} from "./letter.js";

/**
 *
 * @type {{d: function(): Letter, H: function(): Letter, o: function(): Letter, w: function(): Letter, y: function(): Letter, "!": function(): Letter}}
 */
const alphabet = {

  "d": function () {
    /** @type {Coordinate[]} */
    let coords = [];

    // Left side
    for (let r = 0; r < 3; r++)
      coords.push(new Coordinate(0, 3 + r));

    // Top
    for (let c = 0; c < 2; c++)
      coords.push(new Coordinate(1 + c, 2));
    coords.push(new Coordinate(3, 3));

    // Bottom
    for (let c = 0; c < 3; c++)
      coords.push(new Coordinate(1 + c, 6));

    // Ascender
    for (let r = 0; r < 7; r++)
      coords.push(new Coordinate(4, r));

    return new Letter(coords);
  },

  /**
   * Constructs the letter `H`.
   * @returns {Letter} - An array of {@link Coordinate|Coordinates} where
   *     active cells should be.
   */
  "H": function () {
    /** @type {Coordinate[]} */
    let coords = [];

    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 7; r++)
        coords.push(new Coordinate(4 * c, r));
    // Bar
    for (let c = 0; c < 3; c++)
      coords.push(new Coordinate(1 + c, 2));

    return new Letter(coords);
  },

  "o": function () {
    /** @type {Coordinate[]} */
    let coords = [];
    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 3; r++)
        coords.push(new Coordinate(4 * c, 3 + r));

    // Top and Bottom
    for (let c = 0; c < 3; c++)
      for (let r = 0; r < 2; r++)
        coords.push(new Coordinate(1 + c, 2 + (4 * r)));

    return new Letter(coords);
  },

  "w": function () {
    /** @type {Coordinate[]} */
    let coords = [];
    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 4; r++)
        coords.push(new Coordinate(4 * c, 2 + r));

    // Middle
    for (let r = 0; r < 2; r++)
      coords.push(new Coordinate(2, 4 + r));

    // Bottom
    for (let c = 0; c < 4; c++)
      coords.push(new Coordinate(1 + c, 6));

    return new Letter(coords);
  },

  "y": function () {
    /** @type {Coordinate[]} */
    let coords = [];

    // Sides, right side is taller
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 4 + (2 * c); r++)
        coords.push(new Coordinate(4 * c, 2 + r));

    // Bottom
    for (let c = 0; c < 3; c++)
      coords.push(new Coordinate(1 + c, 6));

    // Tail
    for (let c = 0; c < 4; c++)
      coords.push(new Coordinate(c, 8));

    return new Letter(coords);
  },

  "!": function () {
    /** @type {Coordinate[]} */
    let coords = [];

    // Whole thing, skip a cell for the gap
    for (let r = 0; r < 7; r++)
      if (r !== 5)
        coords.push(new Coordinate(0, r));

    return new Letter(coords, 1);
  }
}

export {alphabet};
