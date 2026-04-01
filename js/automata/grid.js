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

  /** @type number */
  cols;
  /** @type number */
  rows;
  /** @type Cell[][] */
  cells;
  /** @type Cell[][] */
  apply;

  /** @type number */
  opacity = 255;
  /** @type p5.Color */
  deadColor;
  /** @type p5.Color */
  aliveColor;

  /** @type number */
  animX = 0;
  /** @type number */
  animY = 0;

  /** @type boolean */
  anim = false;
  /** @type boolean */
  paused = true;
  /** @type number */
  scaleFactor = 8;

  /** @type number */
  leadIn = 30;
  /** @type number */
  waveDelay = 800;
  /** @type number */
  rule3Threshold = 3;

  /** @type number[] */
  animTriggers;

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

    this.deadColor = this.sketch.color(42, 42, 47, 255);
    this.aliveColor = this.sketch.color(255, 153, 51, 255);

    this.cols = Math.floor(this.sketch.width / this.scaleFactor) + 1;
    this.rows = Math.floor(this.sketch.height / this.scaleFactor) + 1;

    // Create filled 2D arrays
    this.cells = new Array(this.cols);
    this.apply = new Array(this.cols);

    for (let col = 0; col < this.cols; col++) {
      this.cells[col] = new Array(this.rows);
      this.apply[col] = new Array(this.rows);

      for (let row = 0; row < this.rows; row++) {
        let c = new Cell(false);
        this.cells[col][row] = c;
        this.apply[col][row] = c;
      }
    }

    if (Grid.PLACE_HOWDY) {
      this.placeHowdy(
        Math.ceil(this.cols / 2) - Math.ceil(Grid.HOWDY_DIMENSIONS.cols / 2),
        Math.ceil(this.rows / 2) - Math.ceil(Grid.HOWDY_DIMENSIONS.rows / 2)
      );
    }

    // TODO: Implement horizontal anim
    this.animTriggers = [];
    for (let i = 0; i < 4; i++) {
      this.animTriggers.push(this.leadIn + (this.waveDelay * i));
    }

    this.animY = this.rows - 1;
  }


  /**
   * Main logic loop for grid. Handles drawing and update logic.
   */
  loop() {
    this.livingPath = new Path2D();
    for (let col = 0; col < this.cells.length; col++) {
      for (let row = 0; row < this.cells[col].length; row++) {
        this.#displayCell(col, row);
        if (!this.paused)
          this.#updateCell(col, row);
      }
    }

    if (!this.paused) {
      let temp = this.apply;
      this.apply = this.cells;
      this.cells = temp;
    }
  }

  /**
   * Draw the game grid to the canvas.
   * @param {number} col
   * @param {number} row
   */
  #displayCell(col, row) {
    // Only drawing living cells boosts performance significantly
    if (this.cells[col][row].alive) {
      this.livingPath.rect(col, row, 1, 1);
    }
  }

  /**
   * Applies the rules of Conway's Game of Life to the grid and replaces the
   * current generation.
   * @param {number} col
   * @param {number} row
   */
  #updateCell(col, row) {
    let current = this.cells[col][row];
    let livingNeighbours = 0;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let colIndex = col + i;
        let rowIndex = row + j;

        // Make sure we're not counting ourselves
        if (!(i === 0 && j === 0)) {
          // Use modulo to wrap around to other edge of array
          // Referenced: https://stackoverflow.com/a/45397704
          let neighbour = this.cells[(colIndex % this.cols + this.cols) % this.cols]
            [(rowIndex % this.rows + this.rows) % this.rows];
          livingNeighbours += neighbour.alive;
        }
      }
    }

    // Make a copy to avoid concurrent modification
    let replacement = new Cell(current.alive);

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

    this.apply[col][row] = replacement; // TODO: See if Maps might save on some work here
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
    while (newCols > this.cells.length) {
      this.cells.push(new Array(newRows));
      this.apply.push(new Array(newRows));
    }
    // If there are fewer cols, reducing the length automatically removes them
    this.cells.length = newCols;
    this.apply.length = newCols;
    this.cols = newCols;

    for (let col = 0; col < this.cells.length; col++) {
      // Fill any empty rows
      for (let row = 0; row < this.cells[col].length; row++) {
        if (this.cells[col][row] === undefined) {
          let c = new Cell(Math.random() < 0.5);
          this.cells[col][row] = c;
          this.apply[col][row] = c;
        }
      }

      // Append new cells if rows are too short
      while (newRows > this.cells[col].length) {
        let c = new Cell(Math.random() < 0.5);
        this.cells[col].push(c);
        this.apply[col].push(c);
      }
      // Chop off any extras, like above
      this.cells[col].length = newRows;
      this.apply[col].length = newRows;
    }
    this.rows = newRows;
  }


  /**
   * Places an arrangement of living cells in the shape of "Howdy!".
   *
   * Bounding box of `31` by `9` cells, but a baseline height of only `7` cells.
   * @param {number} [colOffset=0] - Number of grid cells to offset in the X axis.
   * @param {number} [rowOffset=0] - Number of grid cells to offset in the Y axis.
   */
  placeHowdy(colOffset = 0, rowOffset = 0) {
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

    let col = colOffset;
    let row = rowOffset;


    // ---- H ---- //
    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 7; r++)
        letterH.push(this.cells[col + (4 * c)][row + r]);

    // Bar
    for (let c = 0; c < 3; c++)
      letterH.push(this.cells[col + 1 + c][row + 2]);


    // ---- o ---- /
    col += 6;
    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 3; r++)
        letterO.push(this.cells[col + (4 * c)][row + 3 + r]);

    // Top and Bottom
    for (let c = 0; c < 3; c++)
      for (let r = 0; r < 2; r++)
        letterO.push(this.cells[col + 1 + c][row + 2 + (4 * r)]);


    // ---- w ---- //
    col += 6;
    // Sides
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 4; r++)
        letterW.push(this.cells[col + (4 * c)][row + 2 + r]);

    // Middle
    for (let r = 0; r < 2; r++)
      letterW.push(this.cells[col + 2][row + 4 + r]);

    // Bottom
    for (let c = 0; c < 4; c++)
      letterW.push(this.cells[col + 1 + c][row + 6]);


    // ---- d ---- //
    col += 6;
    // Left side
    for (let r = 0; r < 3; r++)
      letterD.push(this.cells[col][row + 3 + r]);

    // Top
    for (let c = 0; c < 2; c++)
      letterD.push(this.cells[col + 1 + c][row + 2]);
    letterD.push(this.cells[col + 3][row + 3]);

    // Bottom
    for (let c = 0; c < 3; c++)
      letterD.push(this.cells[col + 1 + c][row + 6]);

    // Ascender
    for (let r = 0; r < 7; r++)
      letterD.push(this.cells[col + 4][row + r]);


    // ---- y ---- //
    col += 6;
    // Sides, right side is taller
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 4 + (2 * c); r++)
        letterY.push(this.cells[col + (4 * c)][row + 2 + r]);

    // Bottom
    for (let c = 0; c < 3; c++)
      letterY.push(this.cells[col + 1 + c][row + 6]);

    // Tail
    for (let c = 0; c < 4; c++)
      letterY.push(this.cells[col + c][row + 8]);


    // ---- ! ---- //
    col += 6;
    // Whole thing, skip a cell for the gap
    for (let r = 0; r < 7; r++)
      if (r !== 5)
        letterExclamation.push(this.cells[col][row + r]);


    // Final activation
    for (let letter of word)
      for (let cell of letter)
        cell.alive = true;
  }
}
