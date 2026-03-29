"use strict";

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

  isResizing = false;

  /**
   *
   * @param {p5} sketch
   */
  constructor(sketch) {
    this.deadColor = sketch.color(42, 42, 47);
    this.aliveColor = sketch.color(255, 153, 51);

    this.cols = Math.floor(sketch.width / this.scaleFactor);
    this.rows = Math.floor(sketch.height / this.scaleFactor);

    this.cells = new Array(this.cols);
    this.apply = new Array(this.cols);

    // Create proper 2D array
    for (let i = 0; i < this.cols; i++) {
      this.cells[i] = new Array(this.rows);
      this.apply[i] = new Array(this.rows);

      for (let j = 0; j < this.rows; j++) {
        this.cells[i][j] = new Cell(sketch, this, i, j, 0.5);
        this.apply[i][j] = this.cells[i][j].clone();
      }
    }

    this.animTriggers = [];
    for (let i = 0; i < 4; i++) {
      this.animTriggers.push(this.leadIn + (this.waveDelay * i));
    }

    this.animY = this.rows - 1;

    sketch.noStroke();
  }

  display() {
    if (this.isResizing)
      return;

    for (let i = 0; i < this.cells.length; i++) {
      for (let j = 0; j < this.cells[i].length; j++) {
        this.cells[i][j].display();
      }
    }

    if (!this.paused) {
      if (sketch.frameCount % this.updateRate === 0) {
        this.updateCells();
      }
    }
  }

  updateCells() {
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = 0; j < this.cells[i].length; j++) {
        let current = this.cells[i][j];
        let living = current.livingNeighbours();

        // Make a copy to avoid concurrent modification
        /** @type Cell */
        let replacement = this.cells[i][j].clone();

        // Rule 1: Any live cell with fewer than two live neighbours dies, as if by underpopulation.
        if (current.alive && living < 2) {
          replacement.alive = false;
        }

        // Rule 2: Any live cell with two or three live neighbours lives on to the next generation.
        if (current.alive && (living === 2 || living === 3)) {
          replacement.alive = true;
        }

        // Rule 3: Any live cell with more than three live neighbours dies, as if by overpopulation.
        if (current.alive && living > this.rule3Threshold) {
          replacement.alive = false;
        }

        // Rule 4: Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
        if (!current.alive && living === 3) {
          replacement.alive = true;
        }

        this.apply[i][j] = replacement;
      }
    }
    let temp = this.apply;
    this.apply = this.cells;
    this.cells = temp;
  }

  /**
   * Referenced: {@link https://stackoverflow.com/a/54726138/27162946 StackOverflow}
   */
  resize() {
    let newCols = Math.floor(sketch.width / this.scaleFactor);
    let newRows = Math.floor(sketch.height / this.scaleFactor);
    this.isResizing = true;

    console.log("New:", newCols, newRows);

    // Add new columns to base array
    while (newCols > this.cells.length) {
      this.cells.push(new Array(newRows));
      this.apply.push(new Array(newRows));
    }
    this.cells.length = newCols;


    // loop through all columns
    for (let i = 0; i < this.cells.length; i++) {
      // fill new columns with enough cells
      for (let j = 0; j < newRows; j++) {
        if (this.cells[i][j] === undefined) {
          this.cells[i][j] = new Cell(sketch, this, i, j, 0.5, false);
          this.apply[i][j] = this.cells[i][j].clone();
        }
        if (j >= this.cells[i].length - 1) {
          this.cells[i].push(new Cell(sketch, this, i, j, 0.5, false));
          this.apply[i].push(this.cells[i][j].clone());
        }
      }
      this.cells[i].length = newRows;
    }
    this.cols = newCols;
    this.rows = newRows;

    // this.apply = this.cells; // breaks things, but looks really cool
    console.log("Cells:", this.cells.length, this.cells[0].length);
    console.log("Apply:", this.apply.length, this.apply[0].length);
    this.isResizing = false;
  }
}
