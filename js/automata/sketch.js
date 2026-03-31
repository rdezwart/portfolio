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
  const FRAMES_PER_SECOND = 24;
  /** @type number */
  const UPDATES_PER_SECOND = 5;
  /** @type number */
  let logicIntervalId;


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

    sketch.frameRate(FRAMES_PER_SECOND);
    sketch.describe("A grey rectangle with a grid of orange squares running a simulation of John Conway's Game of Life.")
    sketch.noStroke();
    sketch.fill(grid.aliveColor);

    logicIntervalId = setInterval(function () {
      grid.loop();
    }, 1000 / UPDATES_PER_SECOND);
  };

  /**
   * P5 function. Runs every frame.
   */
  sketch.draw = () => {
    sketch.background(grid.deadColor);
    sketch.scale(grid.scaleFactor);
    sketch.drawingContext.fill(grid.livingPath);
  };

  /**
   * P5 function. Runs when window is resized.
   */
  sketch.windowResized = () => {
    updateBounds();
    sketch.resizeCanvas(divWidth, divHeight);
    grid.resize();
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
let automata = new p5(s, undefined);
