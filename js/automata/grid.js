"use strict";

/**
 * Represents the game grid for
 * {@link https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life|Conway's Game of Life}.
 */
class Grid {
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
  paused = false;
  /** @type number */
  scaleFactor = 8;

  /** @type number */
  leadIn = 30;
  /** @type number */
  waveDelay = 800;
  /** @type number */
  updateRate = 3;
  /** @type number */
  rule3Threshold = 3;

  /** @type number[] */
  animTriggers;


  /**
   * @param {p5} sketch - A p5 object passed from the main Processing sketch.
   */
  constructor(sketch) {
    this.deadColor = sketch.color(42, 42, 47, 255);
    this.aliveColor = sketch.color(255, 153, 51, 255);

    this.cols = Math.floor(sketch.width / this.scaleFactor) + 1;
    this.rows = Math.floor(sketch.height / this.scaleFactor) + 1;

    // Create filled 2D arrays
    this.cells = new Array(this.cols);
    this.apply = new Array(this.cols);

    for (let col = 0; col < this.cols; col++) {
      this.cells[col] = new Array(this.rows);
      this.apply[col] = new Array(this.rows);

      for (let row = 0; row < this.rows; row++) {
        let c = new Cell(Math.random() < 0.5);
        this.cells[col][row] = c;
        this.apply[col][row] = c;
      }
    }

    // TODO: Implement horizontal anim
    this.animTriggers = [];
    for (let i = 0; i < 4; i++) {
      this.animTriggers.push(this.leadIn + (this.waveDelay * i));
    }

    this.animY = this.rows - 1;

    sketch.noStroke();
  }


  /**
   * Draw the game grid to the canvas.
   */
  display() {
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        // Only drawing living cells boosts performance significantly
        if (this.cells[col][row].alive) {
          sketch.fill(this.aliveColor);
          sketch.rect(col, row, 1, 1);
        }
      }
    }

    if (!this.paused) {
      if (sketch.frameCount % this.updateRate === 0) {
        this.updateCells(); // TODO: Consider making this a separate call in sketch
      }
    }
  }


  /**
   * Applies the rules of Conway's Game of Life to the grid and replaces the
   * current generation.
   */
  updateCells() {
    for (let col = 0; col < this.cells.length; col++) {
      for (let row = 0; row < this.cells[col].length; row++) {
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

        this.apply[col][row] = replacement;
      }
    }

    let temp = this.apply;
    this.apply = this.cells;
    this.cells = temp;
  }


  /**
   * Resizes the game grid based on the size of the canvas, adding and removing
   * rows/columns as necessary.
   *
   * Referenced: https://stackoverflow.com/a/32055229/27162946
   */
  resize() {
    let newCols = Math.floor(sketch.width / this.scaleFactor) + 1;
    let newRows = Math.floor(sketch.height / this.scaleFactor) + 1;

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
}
