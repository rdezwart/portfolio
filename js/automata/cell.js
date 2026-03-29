"use strict";

class Cell {
  /** @type p5 */
  sketch;
  /** @type Grid */
  grid;

  /** @type number */
  x;
  /** @type number */
  y;

  /** @type boolean */
  alive = false;
  /** @type p5.Color */
  cellColor;

  /**
   * @param {p5} sketch
   * @param {Grid} grid
   * @param {number} x
   * @param {number} y
   * @param {number} chance
   * @param {boolean} alive
   */
  constructor(sketch, grid, x, y, chance = 0.5, alive = undefined) {
    this.sketch = sketch;
    this.grid = grid;
    this.x = x;
    this.y = y;

    // TODO: just have this be a boolean, do the chance when calling constructor

    if (alive === undefined) {
      this.alive = Math.random() < chance;
    }

    this.cellColor = this.alive ? grid.aliveColor : grid.deadColor;
  }

  clone() {
    return new Cell(this.sketch, this.grid, this.x, this.y, 0.5, this.alive);
  }

  display() {
    // TODO: Maybe handle this in the grid? dunno if it'd be faster
    this.cellColor = this.alive ? grid.aliveColor : grid.deadColor;

    // if (sketch.frameCount % 1 === 0 && Math.random() < 0.2) {
    //   let b = sketch.brightness(this.cellColor);
    //   b += this.alive ? sketch.random(-50, 100) : sketch.random(0, 50);
    //
    //   this.cellColor = sketch.color(
    //     sketch.hue(this.cellColor),
    //     sketch.saturation(this.cellColor),
    //     sketch.constrain(b, 0, 100)
    //   );
    // }

    // It's better for performance if we only draw the living cells. The sketch
    // calls background() which covers the rest.
    if (this.alive) {
      this.cellColor.setAlpha(grid.opacity);
      sketch.fill(this.cellColor);
      sketch.rect(this.x, this.y, 1, 1);
    }
  }

  /**
   *
   * @returns {Cell[]} - An array of all neighbours, direct and diagonal.
   */
  getNeighbours() {
    /** @type Cell[] */
    let neighbours = [];

    // Loop rows first, makes the neighbour array print in a much nicer way
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        let xIndex = this.x + i;
        let yIndex = this.y + j;

        // Make sure we're not counting ourself
        if (!(xIndex === this.x && yIndex === this.y)) {
          // Use modulo to wrap around to other edge of array
          // Referenced: https://stackoverflow.com/a/45397704
          neighbours.push(grid.cells[(xIndex % grid.cols + grid.cols) % grid.cols]
            [(yIndex % grid.rows + grid.rows) % grid.rows]);
        }
      }
    }
    return neighbours;
  }


  /**
   *
   * @returns {number}
   */
  livingNeighbours() {
    let living = 0;
    this.getNeighbours().forEach((neighbour) => {
      if (neighbour.alive) {
        living++;
      }
    });
    return living;
  }
}
