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

  /** @type HTMLCanvasElement */
  let bufferCanvas;
  /** @type p5.Graphics */
  let buffer;

  /**
   * P5 function. Runs before the sketch starts.
   */
  sketch.setup = () => {
    sketch.frameRate(30);
    sketch.describe("A grey rectangle with a grid of orange squares running a simulation of John Conway's Game of Life.")

    wrapper = document.getElementById("automata-wrapper");
    updateBounds();

    let canvas = sketch.createCanvas(divWidth, divHeight);
    canvas.id("automata-canvas");
    canvas.parent(wrapper);

    bufferCanvas = document.getElementById("automata-buffer");
    buffer = sketch.createGraphics(divWidth, divHeight, sketch.P2D, bufferCanvas);

    grid = new Grid(sketch, buffer);
  };

  /**
   * P5 function. Runs every frame.
   */
  sketch.draw = () => {
    buffer.noStroke();
    buffer.fill(grid.aliveColor);
    buffer.background(grid.deadColor);
    grid.display();
    sketch.image(buffer, 0, 0);
  };

  /**
   * P5 function. Runs when window is resized.
   * 1. Resize graphics buffer to keep it in sync with the visible sketch.
   */
  sketch.windowResized = () => {
    updateBounds();
    sketch.resizeCanvas(divWidth, divHeight);
    buffer.resizeCanvas(divWidth, divHeight); /* 1 */
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
