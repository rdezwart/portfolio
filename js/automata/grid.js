"use strict";

/**
 * Represents the game grid for
 * {@link https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life|Conway's Game of Life}.
 */
class Grid {
  /** @type p5 */
  sketch;
  /** @type Path2D */
  livingPath;
  /** @type Path2D */
  highlightPath;

  /** @type number */
  cols;
  /** @type number */
  rows;
  /** @type Cell[][] */
  #cells;
  /** @type Cell[][] */
  #apply;

  /** @type number */
  scaleFactor = 8;
  /** @type number */
  rule3Threshold = 3;

  /** @type number[] */
  #waveCols = [];
  /** @type number[] */
  #waveDeltas = [];
  /** How many columns the wave moves each generation.
   * @const number */
  static ANIMATION_SPEED = 2;

  /** @const {boolean} */
  static PLACE_HOWDY = true;
  /** @const {{cols: number, rows: number}} */
  static HOWDY_DIMENSIONS = {cols: 31, rows: 9};


  /**
   * @param {p5} sketch - A p5 object passed from the main Processing sketch.
   */
  constructor(sketch) {
    this.sketch = sketch;
    this.livingPath = new Path2D();
    this.highlightPath = new Path2D();

    this.cols = Math.floor(this.sketch.width / this.scaleFactor) + 1;
    this.rows = Math.floor(this.sketch.height / this.scaleFactor) + 1;

    // Create filled 2D arrays
    this.#cells = new Array(this.cols);
    this.#apply = new Array(this.cols);

    for (let col = 0; col < this.cols; col++) {
      this.#cells[col] = new Array(this.rows);
      this.#apply[col] = new Array(this.rows);

      for (let row = 0; row < this.rows; row++) {
        let c = new Cell(false);
        this.#cells[col][row] = c;
        this.#apply[col][row] = c;
      }
    }

    if (Grid.PLACE_HOWDY) {
      this.placeHowdy();
    }
  }


  /**
   * Main logic loop for grid. Handles drawing and update logic.
   */
  loop() {
    this.livingPath = new Path2D();
    this.highlightPath = new Path2D();

    if (this.sketch.isLooping()) this.#runAnimations();

    for (let col = 0; col < this.#cells.length; col++) {
      for (let row = 0; row < this.#cells[col].length; row++) {
        if (this.sketch.isLooping()) this.#updateCell(col, row);
        this.#displayCell(col, row);
      }
    }

    if (this.sketch.isLooping()) {
      let temp = this.#apply;
      this.#apply = this.#cells;
      this.#cells = temp;
    }
  }

  /**
   * Draw the game grid to the canvas.
   * @param {number} col
   * @param {number} row
   */
  #displayCell(col, row) {
    // Only drawing living cells boosts performance significantly
    if (this.#cells[col][row].alive) {
      this.livingPath.rect(col, row, 1, 1);
    }
    if (this.#cells[col][row].highlighted) {
      this.highlightPath.rect(col, row, 1, 1);
    }
  }

  /**
   * Applies the rules of Conway's Game of Life to the grid and replaces the
   * current generation.
   * @param {number} col
   * @param {number} row
   */
  #updateCell(col, row) {
    let current = this.#cells[col][row];
    let livingNeighbours = this.getLivingNeighbours(col, row);

    // Make a copy to avoid concurrent modification
    let replacement = new Cell(current.alive, current.highlighted);

    // Rule 1: Any live cell with fewer than two live neighbours dies, as if by underpopulation.
    if (current.alive && livingNeighbours < 2) {
      replacement.alive = false;
    }
    // Rule 2: Any live cell with two or three live neighbours lives on to the next generation.
    if (current.alive && (livingNeighbours === 2 || livingNeighbours === 3)) {
      replacement.alive = true;
    }
    // Rule 3: Any live cell with more than three live neighbours dies, as if by overpopulation.
    if (current.alive && livingNeighbours > this.rule3Threshold) {
      replacement.alive = false;
    }
    // Rule 4: Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
    if (!current.alive && livingNeighbours === 3) {
      replacement.alive = true;
    }

    this.#apply[col][row] = replacement; // TODO: See if Maps might save on some work here
  }


  /**
   * Triggers a wave to animate horizontally across the canvas.
   *
   * Multiple waves can be active at the same time.
   */
  startAnimations() {
    this.#waveCols.push(0);
    this.#waveDeltas.push(Grid.ANIMATION_SPEED);
  }

  /**
   * Runs the calculations for each queued wave.
   *
   * Waves can be triggered with {@link Grid~startAnimations}
   */
  #runAnimations() {
    for (let i = 0; i < this.#waveCols.length; i++) {
      // Going to the right
      if (this.#waveDeltas[i] > 0) {
        for (let r = 0; r < this.rows; r++) {
          if (this.getLivingNeighbours(this.#waveCols[i], r) < 5) {
            this.#cells[this.#waveCols[i]][r] = new Cell(Math.random() < 0.5, true);
          }
        }
      }

      // Going to the left
      if (this.#waveDeltas[i] < 0) {
        for (let r = 0; r < this.rows; r++) {
          if (this.getLivingNeighbours(this.#waveCols[i], r) < 4) {
            this.#cells[this.#waveCols[i]][r] = new Cell(Math.random() < 0.25, true);
          }
        }
      }

      this.#waveCols[i] += this.#waveDeltas[i];
      if (this.#waveCols[i] >= this.cols) {
        this.#waveDeltas[i] *= -1;
        this.#waveCols[i] = this.cols - 1;
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
   * @param {number} col - which column the target cell is in.
   * @param {number} row - which row the target cell is in.
   * @return {number} - how many living cells are adjacent to target cell.
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
          let neighbour = this.#cells[(colIndex % this.cols + this.cols) % this.cols]
            [(rowIndex % this.rows + this.rows) % this.rows];
          livingNeighbours += neighbour.alive;
        }
      }
    }
    return livingNeighbours;
  }


  /**
   * Resizes the game grid based on the size of the canvas, adding and removing
   * rows/columns as necessary.
   *
   * Referenced: https://stackoverflow.com/a/32055229/27162946
   */
  resize() {
    let newCols = Math.floor(this.sketch.width / this.scaleFactor) + 1;
    let newRows = Math.floor(this.sketch.height / this.scaleFactor) + 1;

    // Add new columns to base array
    while (newCols > this.#cells.length) {
      this.#cells.push(new Array(newRows));
      this.#apply.push(new Array(newRows));
    }
    // If there are fewer cols, reducing the length automatically removes them
    this.#cells.length = newCols;
    this.#apply.length = newCols;
    this.cols = newCols;

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
    this.rows = newRows;
  }


  /**
   * Places an arrangement of living cells in the shape of "Howdy!".
   *
   * Bounding box of `31` by `9` cells, but a baseline height of only `7` cells.
   * @param {number} [colOffset=undefined] - Number of grid cells to offset in the X axis.
   *        If `undefined`, the centre of the canvas will be calculated and used.
   * @param {number} [rowOffset=undefined] - Number of grid cells to offset in the Y axis.
   *        If `undefined`, the centre of the canvas will be calculated and used.
   */
  placeHowdy(colOffset = undefined, rowOffset = undefined) {
    if (colOffset === undefined)
      colOffset = Math.ceil(this.cols / 2) - Math.ceil(Grid.HOWDY_DIMENSIONS.cols / 2);
    if (rowOffset === undefined)
      rowOffset = Math.ceil(this.rows / 2) - Math.ceil(Grid.HOWDY_DIMENSIONS.rows / 2);

    /** @type Cell[] */
    let letterH = [];
    /** @type Cell[] */
    let letterO = [];
    /** @type Cell[] */
    let letterW = [];
    /** @type Cell[] */
    let letterD = [];
    /** @type Cell[] */
    let letterY = [];
    /** @type Cell[] */
    let letterExclamation = [];
    /** @type Cell[][] */
    let word = [letterH, letterO, letterW, letterD, letterY, letterExclamation];
    /** @type Cell[][] */
    let highlighted = [letterExclamation];

    let col = colOffset;
    let row = rowOffset;


    // ---- H ---- //
    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 7; r++)
        letterH.push(this.#cells[col + (4 * c)][row + r]);

    // Bar
    for (let c = 0; c < 3; c++)
      letterH.push(this.#cells[col + 1 + c][row + 2]);


    // ---- o ---- /
    col += 6;
    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 3; r++)
        letterO.push(this.#cells[col + (4 * c)][row + 3 + r]);

    // Top and Bottom
    for (let c = 0; c < 3; c++)
      for (let r = 0; r < 2; r++)
        letterO.push(this.#cells[col + 1 + c][row + 2 + (4 * r)]);


    // ---- w ---- //
    col += 6;
    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 4; r++)
        letterW.push(this.#cells[col + (4 * c)][row + 2 + r]);

    // Middle
    for (let r = 0; r < 2; r++)
      letterW.push(this.#cells[col + 2][row + 4 + r]);

    // Bottom
    for (let c = 0; c < 4; c++)
      letterW.push(this.#cells[col + 1 + c][row + 6]);


    // ---- d ---- //
    col += 6;
    // Left side
    for (let r = 0; r < 3; r++)
      letterD.push(this.#cells[col][row + 3 + r]);

    // Top
    for (let c = 0; c < 2; c++)
      letterD.push(this.#cells[col + 1 + c][row + 2]);
    letterD.push(this.#cells[col + 3][row + 3]);

    // Bottom
    for (let c = 0; c < 3; c++)
      letterD.push(this.#cells[col + 1 + c][row + 6]);

    // Ascender
    for (let r = 0; r < 7; r++)
      letterD.push(this.#cells[col + 4][row + r]);


    // ---- y ---- //
    col += 6;
    // Sides, right side is taller
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 4 + (2 * c); r++)
        letterY.push(this.#cells[col + (4 * c)][row + 2 + r]);

    // Bottom
    for (let c = 0; c < 3; c++)
      letterY.push(this.#cells[col + 1 + c][row + 6]);

    // Tail
    for (let c = 0; c < 4; c++)
      letterY.push(this.#cells[col + c][row + 8]);


    // ---- ! ---- //
    col += 6;
    // Whole thing, skip a cell for the gap
    for (let r = 0; r < 7; r++)
      if (r !== 5)
        letterExclamation.push(this.#cells[col][row + r]);


    // Final activation
    for (let letter of highlighted)
      for (let cell of letter)
        cell.highlighted = !cell.highlighted;

    for (let letter of word)
      for (let cell of letter)
        cell.alive = !cell.alive;
  }
}
