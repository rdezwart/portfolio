"use strict";

/** @type Grid */
let grid;

/**
 * Wraps the sketch in an object, enabling "instance mode".
 * @param {p5} sketch - The sketch loaded by p5.
 */
const s = (sketch) => {

  /** @type HTMLElement */
  let wrapper;
  /** @type DOMRect */
  let bounds;
  /** @type number */
  let divWidth, divHeight;

  /** @type number */
  let resizeTimeoutId;
  /** @type number */
  let resizeDelay = 1000;

  /**
   * P5 function. Runs before the sketch starts.
   */
  sketch.setup = () => {
    wrapper = document.getElementById("automata-wrapper");
    updateBounds();

    let canvas = sketch.createCanvas(divWidth, divHeight);
    canvas.id("automata-canvas");
    canvas.parent(wrapper);

    grid = new Grid(sketch);
    sketch.frameRate(60);

    sketch.describe("A grey rectangle with a grid of orange squares running a simulation of John Conway's Game of Life.")

    resizeTimeoutId = window.setTimeout(function () {
      grid.resize();
    }, resizeDelay);
    window.clearTimeout(resizeTimeoutId);
  };

  /**
   * P5 function. Runs every frame.
   */
  sketch.draw = () => {
    sketch.scale(grid.scaleFactor);
    sketch.background(grid.deadColor);
    grid.display();
  };

  /**
   * P5 function. Runs when window is resized.
   */
  sketch.windowResized = () => {
    updateBounds();
    sketch.resizeCanvas(divWidth, divHeight);
    grid.resize();

    // window.clearTimeout(resizeTimeoutId);
    // resizeTimeoutId = window.setTimeout(function () {
    // }, resizeDelay);
  };

  /**
   * Helper function to refresh parent div sizes.
   */
  function updateBounds() {
    bounds = wrapper.getBoundingClientRect();
    divWidth = bounds.width;
    divHeight = bounds.height;
  }
};

// Pass an undefined node, we're setting the parent in setup()
let sketch = new p5(s, undefined);
