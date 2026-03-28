"use strict";

class Grid {
  /** @type int */
  cols;
  /** @type int */
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
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
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
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
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
}
