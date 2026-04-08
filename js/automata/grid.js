"use strict";

/**
 * Module for {@linkcode Grid}.
 * @module automata/grid
 * @requires module:automata/cell.Cell
 * @requires module:automata/text/word.Word
 */

import {Cell} from "./cell.js";
import {Word} from "./text/word.js";

/**
 * Represents the simulation grid for
 * [Conway's Game of Life]{@link https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life}.
 */
class Grid {
  /**
   * The object containing the instanced p5 sketch.
   * @type p5
   */
  #sketch;
  /**
   * Contains the living [Cells]{@linkcode module:automata/cell.Cell} that
   * should be drawn each {@linkcode Grid#loop}.
   * @type Path2D
   */
  #livingPath;
  /**
   * Contains the highlighted [Cells]{@linkcode module:automata/cell.Cell} that
   * should be drawn each {@linkcode Grid#loop}.
   * @type Path2D
   */
  #highlightPath;
  /**
   * The text to be displayed on the canvas at startup and reset.
   * @type Word
   */
  #canvasWord;

  /**
   * The number of columns in this {@linkcode Grid}.
   * @type number
   */
  #cols;
  /**
   * The number of rows in this {@linkcode Grid}.
   * @type number
   */
  #rows;

  /**
   * 2D array of [Cells]{@linkcode module:automata/cell.Cell}. This is what gets
   * painted each frame.
   * @type Cell[][]
   */
  #cells;
  /**
   * 2D array of [Cells]{@linkcode module:automata/cell.Cell}. This is used to
   * calculate and update the next generation.
   * @type Cell[][]
   */
  #apply;

  /**
   * Base [Cell]{@linkcode module:automata/cell.Cell} size multiplier. This is
   * the largest the cells will get, but they can scale lower than this value.
   * @default
   * @readonly
   * @const {number}
   */
  static get BASE_SCALE_FACTOR() {
    return 8;
  }

  /**
   * [Cell]{@linkcode module:automata/cell.Cell} size multiplier. Used to scale
   * drawing output size and grid dimensions. Always makes sure the canvas word
   * will fit.
   * @type {number}
   */
  #scaleFactor = Grid.BASE_SCALE_FACTOR;

  /**
   * If a wave animation is currently playing.
   * @type boolean
   */
  #isAnimating = false;
  /**
   * Array keeping track of which column each animated wave is currently on.
   * @type number[]
   */
  #waveCols = [];
  /**
   * Array keeping track of which direction each animated wave is currently
   * moving.
   * @type number[]
   */
  #waveDeltas = [];

  /**
   * How many columns the wave animation moves each update.
   * @readonly
   * @const number
   */
  static get ANIMATION_SPEED() {
    return 2;
  }


  /**
   * Constructs a new simulation {@linkcode Grid}.
   * @param {p5} sketch - A [p5]{@linkcode p5} object passed from the main
   *     Processing sketch.
   * @param {Word} canvasWord - The {@linkcode Word} to display on the canvas at
   *     startup.
   */
  constructor(sketch, canvasWord) {
    this.#sketch = sketch;
    this.#livingPath = new Path2D();
    this.#highlightPath = new Path2D();
    this.#canvasWord = canvasWord;

    [this.#cols, this.#rows, this.#scaleFactor] = this.calculateSizeAndScale();

    // Create filled 2D arrays
    this.#cells = new Array(this.#cols);
    this.#apply = new Array(this.#cols);

    for (let col = 0; col < this.#cols; col++) {
      this.#cells[col] = new Array(this.#rows);
      this.#apply[col] = new Array(this.#rows);

      for (let row = 0; row < this.#rows; row++) {
        let c = new Cell(false);
        this.#cells[col][row] = c;
        this.#apply[col][row] = c;
      }
    }

    this.placeWord();
  }


  /**
   * Calculates the appropriate size and scale for the {@linkcode Grid}. Ensures
   * that the `canvasWord` always fits on screen, regardless of size.
   * @returns {[number, number, number]} - [cols, rows, scaleFactor]
   */
  calculateSizeAndScale() {
    /** @type {number} */
    let cols, rows;
    let testFactor = Grid.BASE_SCALE_FACTOR + 1; // +1, for doWhile

    do {
      testFactor--;

      // Scale the number of rows and columns, plus a little extra.
      cols = Math.floor(this.#sketch.width / testFactor) + 1;
      rows = Math.floor(this.#sketch.height / testFactor) + 1;

      // Make sure the canvas word always fits on screen.
    } while (cols <= this.#canvasWord.cols || rows <= this.#canvasWord.rows);

    return [cols, rows, testFactor];
  }

  /**
   * Main loop for this {@linkcode Grid}. Handles drawing, animation, and update
   * logic.
   */
  loop() {
    this.#livingPath = new Path2D();
    this.#highlightPath = new Path2D();

    if (this.#sketch.isLooping()) this.#runAnimations();
    this.#isAnimating = this.#waveCols.length > 0;

    for (let col = 0; col < this.#cells.length; col++) {
      for (let row = 0; row < this.#cells[col].length; row++) {
        if (this.#sketch.isLooping()) this.#updateCell(col, row);
        this.#displayCell(col, row);
      }
    }

    if (this.#sketch.isLooping()) {
      // Replace the current generation. Needs to be a copy to avoid modifying
      // the current generation as we apply the game rules.
      let temp = this.#apply;
      this.#apply = this.#cells;
      this.#cells = temp;
    }
  }

  /**
   * Adds a specific {@linkcode module:automata/cell.Cell} in the
   * {@linkcode Grid} to the drawing paths.
   * @param {number} col - The column index of a {@linkcode Cell}.
   * @param {number} row - The row index of a {@linkcode Cell}.
   * @see Grid#livingPath
   * @see Grid#highlightPath
   */
  #displayCell(col, row) {
    // Only drawing living cells boosts performance significantly
    if (this.#cells[col][row].alive) {
      this.#livingPath.rect(col, row, 1, 1);
    }
    if (this.#cells[col][row].highlighted) {
      this.#highlightPath.rect(col, row, 1, 1);
    }
  }

  /**
   * Applies the rules of Conway's Game of Life to a specific
   * [Cell]{@linkcode module:automata/cell.Cell} in the {@linkcode Grid}, based
   * on its neighbours.
   * @param {number} col - The column index of a {@linkcode Cell}.
   * @param {number} row - The row index of a {@linkcode Cell}.
   */
  #updateCell(col, row) {
    let current = this.#cells[col][row];
    let livingNeighbours = this.getLivingNeighbours(col, row);

    // Make a copy to avoid concurrent modification
    let replacement = new Cell(current.alive, current.highlighted);

    // Rule 1: Any live cell with fewer than two live neighbours dies, as if by
    // underpopulation.
    if (current.alive && livingNeighbours < 2) {
      replacement.alive = false;
    }
    // Rule 2: Any live cell with two or three live neighbours lives on to the
    // next generation.
    if (current.alive && (livingNeighbours === 2 || livingNeighbours === 3)) {
      replacement.alive = true;
    }
    // Rule 3: Any live cell with more than three live neighbours dies, as if by
    // overpopulation.
    if (current.alive && livingNeighbours > 3) {
      replacement.alive = false;
    }
    // Rule 4: Any dead cell with exactly three live neighbours becomes a live
    // cell, as if by reproduction.
    if (!current.alive && livingNeighbours === 3) {
      replacement.alive = true;
    }

    this.#apply[col][row] = replacement;
  }

  /**
   * Triggers a wave to animate horizontally across the canvas.
   *
   * Multiple waves can be active at the same time.
   */
  startAnimations() {
    this.#isAnimating = true;
    this.#waveCols.push(0);
    this.#waveDeltas.push(Grid.ANIMATION_SPEED);
  }

  /**
   * Runs the calculations for each queued wave.
   *
   * Waves can be triggered with {@link Grid#startAnimations}
   */
  #runAnimations() {
    for (let i = 0; i < this.#waveCols.length; i++) {
      // TODO: can simplify these loops
      // Going to the right
      if (this.#waveDeltas[i] > 0) {
        for (let r = 0; r < this.#rows; r++) {
          if (this.getLivingNeighbours(this.#waveCols[i], r) < 5) {
            this.#cells[this.#waveCols[i]][r] = new Cell(
              Math.random() < 0.5,
              true
            );
          }
        }
      }

      // Going to the left
      if (this.#waveDeltas[i] < 0) {
        for (let r = 0; r < this.#rows; r++) {
          if (this.getLivingNeighbours(this.#waveCols[i], r) < 4) {
            this.#cells[this.#waveCols[i]][r] = new Cell(
              Math.random() < 0.25,
              true
            );
          }
        }
      }

      this.#waveCols[i] += this.#waveDeltas[i];
      if (this.#waveCols[i] >= this.#cols) {
        this.#waveDeltas[i] *= -1;
        this.#waveCols[i] = this.#cols - 1;
      }

      if (this.#waveCols[i] <= 0) {
        // Remove just this wave from the tracking lists
        this.#waveCols.splice(i, 1);
        this.#waveDeltas.splice(i, 1);
      }
    }
  }

  /**
   * Returns a count of the living neighbours of target cell, excluding itself.
   * Checking wraps around to the other edge of the array.
   * @param {number} col - The column index of the target
   *     [Cell]{@linkcode module:automata/cell.Cell}.
   * @param {number} row - The row index the target
   *     [Cell]{@linkcode module:automata/cell.Cell}.
   * @return {number} - How many living
   *     [Cells]{@linkcode module:automata/cell.Cell} are adjacent to target
   *     [Cell]{@linkcode module:automata/cell.Cell}.
   */
  getLivingNeighbours(col, row) {
    let livingNeighbours = 0;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let colIndex = col + i;
        let rowIndex = row + j;

        // Make sure we're not counting ourselves
        if (!(i === 0 && j === 0)) {
          // Use modulo to wrap around to other edge of array
          // Referenced: https://stackoverflow.com/a/45397704
          let neighbour = this.#cells
            [(colIndex % this.#cols + this.#cols) % this.#cols]
            [(rowIndex % this.#rows + this.#rows) % this.#rows];
          livingNeighbours += neighbour.alive;
        }
      }
    }
    return livingNeighbours;
  }

  /**
   * Resizes the simulation grid based on the size of the canvas, adding and
   * removing rows/columns as necessary.
   *
   * Referenced: https://stackoverflow.com/a/32055229/27162946
   */
  resize() {
    /** @type {number} */
    let newCols, newRows;
    [newCols, newRows, this.#scaleFactor] = this.calculateSizeAndScale();

    // Add new columns to base array
    while (newCols > this.#cells.length) {
      this.#cells.push(new Array(newRows));
      this.#apply.push(new Array(newRows));
    }
    // If there are fewer cols, reducing the length automatically removes them
    this.#cells.length = newCols;
    this.#apply.length = newCols;
    this.#cols = newCols;

    for (let col = 0; col < this.#cells.length; col++) {
      // Fill any empty rows
      for (let row = 0; row < this.#cells[col].length; row++) {
        if (this.#cells[col][row] === undefined) {
          let c = new Cell();
          this.#cells[col][row] = c;
          this.#apply[col][row] = c;
        }
      }

      // Append new cells if rows are too short
      while (newRows > this.#cells[col].length) {
        let c = new Cell();
        this.#cells[col].push(c);
        this.#apply[col].push(c);
      }
      // Chop off any extras, like above
      this.#cells[col].length = newRows;
      this.#apply[col].length = newRows;
    }
    this.#rows = newRows;

    // Make sure any active waves are capped to the new size of the grid
    for (let i = 0; i < this.#waveCols.length; i++) {
      if (this.#waveCols[i] >= this.#cols) {
        this.#waveCols[i] = this.#cols - 1;
      }
    }
  }

  /**
   * Places an arrangement of living
   * [Cells]{@linkcode module:automata/cell.Cell} in the shape of text in
   * `canvasWord`.
   *
   * For any "falsy" argument, the centre of the canvas (in its axis) will
   * be calculated and used instead.
   *
   * @param {number} [colOffset=undefined] - Number of grid
   *     [Cells]{@linkcode module:automata/cell.Cell} to offset in the X axis.
   * @param {number} [rowOffset=undefined] - Number of grid
   *     [Cells]{@linkcode module:automata/cell.Cell} to offset in the Y axis.
   */
  placeWord(colOffset = undefined, rowOffset = undefined) {
    colOffset = colOffset ? colOffset :
      Math.ceil(this.#cols / 2) - Math.ceil(this.#canvasWord.cols / 2);
    rowOffset = rowOffset ? rowOffset :
      Math.floor(this.#rows / 2) - Math.ceil(this.#canvasWord.rows / 2);

    for (let c = 0; c < this.#canvasWord.pixels.length; c++) {
      for (let r = 0; r < this.#canvasWord.pixels[c].length; r++) {
        let currentCell = this.#cells[c + colOffset][r + rowOffset];
        let currentPixel = this.#canvasWord.pixels[c][r];

        if (currentPixel >= 1)
          currentCell.alive = !currentCell.alive;
        if (currentPixel >= 2)
          currentCell.highlighted = !currentCell.highlighted;
      }
    }
  }

  /**
   * [Cell]{@linkcode module:automata/cell.Cell} size multiplier. Used to scale
   * drawing output size and grid dimensions. Always makes sure the canvas word
   * will fit.
   * @readonly
   * @type {number}
   */
  get scaleFactor() {
    return this.#scaleFactor;
  }

  /**
   * Contains the living [Cells]{@linkcode module:automata/cell.Cell} that
   * should be drawn each {@linkcode Grid#loop}.
   * @readonly
   * @type Path2D
   */
  get livingPath() {
    return this.#livingPath;
  }

  /**
   * Contains the highlighted [Cells]{@linkcode module:automata/cell.Cell} that
   * should be drawn each {@linkcode Grid#loop}.
   * @readonly
   * @type Path2D
   */
  get highlightPath() {
    return this.#highlightPath;
  }

  /**
   * If a wave animation is currently playing.
   * @readonly
   * @type boolean
   */
  get isAnimating() {
    return this.#isAnimating;
  }
}

export {Grid};
