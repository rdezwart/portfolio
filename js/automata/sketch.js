"use strict";

/** @type Grid */
let grid;

/**
 * Wraps the sketch in an object, enabling "instance mode".
 * @param {p5} sketch - The sketch loaded by p5.
 */
const s = (sketch) => {

  /** @type p5.Color */
  let deadColor = sketch.color(42, 42, 47, 255);
  /** @type p5.Color */
  let aliveColor = sketch.color(255, 153, 51, 255);
  /** @type p5.Color */
  let highlightColor = sketch.color(0, 238, 255, 255);

  /** @type HTMLElement */
  let wrapper;
  /** @type DOMRect */
  let bounds;
  /** @type number */
  let divWidth, divHeight;

  /** @const {number} */
  const UPDATES_PER_SECOND = 10;
  /** @const {number} */
  const FRAMES_PER_SECOND = UPDATES_PER_SECOND * 4;
  /** @type number */
  let logicIntervalId;

  /** @type boolean */
  let simulationStarted = false;


  /**
   * P5 function. Runs before the sketch starts.
   */
  sketch.setup = () => {
    wrapper = document.getElementById("automata-wrapper");
    updateBounds();

    let canvas = sketch.createCanvas(divWidth, divHeight);
    canvas.id("automata-canvas");
    // Set parent a second time, this makes sure the CSS starting transition plays
    canvas.parent(wrapper);

    grid = new Grid(sketch);

    sketch.frameRate(FRAMES_PER_SECOND);
    sketch.describe("A grey rectangle with a grid of orange squares running a simulation of John Conway's Game of Life.")
    sketch.cursor(sketch.HAND);
    sketch.noStroke();

    logicIntervalId = setInterval(function () {
      grid.loop();
    }, 1000 / UPDATES_PER_SECOND);
  };

  /**
   * P5 function. Runs every frame.
   */
  sketch.draw = () => {
    sketch.background(deadColor);
    sketch.scale(grid.scaleFactor);
    sketch.fill(aliveColor);
    sketch.drawingContext.fill(grid.livingPath);
    sketch.fill(highlightColor);
    sketch.drawingContext.fill(grid.highlightPath);
  };

  /**
   * P5 function. Runs when window is resized.
   */
  sketch.windowResized = () => {
    /** @type boolean */
    let moveHowdy = !simulationStarted && Grid.PLACE_HOWDY;
    if (moveHowdy) {
      // Remove current howdy by inverting the same pixels
      grid.placeHowdy();
    }

    updateBounds();
    sketch.resizeCanvas(divWidth, divHeight);
    grid.resize();

    if (moveHowdy) {
      // Re-place howdy into the new centre
      grid.placeHowdy();
    }
  };

  sketch.mousePressed = () => {
    if (coordIsInBounds(sketch.mouseX, sketch.mouseY)) {
      if (!simulationStarted) {
        simulationStarted = true;
        grid.paused = !grid.paused;
      } else {
        grid.startAnimations();
      }
    }
  }

  /**
   * Helper function to refresh parent div sizes.
   */
  function updateBounds() {
    bounds = wrapper.getBoundingClientRect();
    divWidth = bounds.width;
    divHeight = bounds.height;
  }


  /**
   * Checks if the given coordinates are within the bounding box of the canvas,
   * relative to its top-left corner.
   * @param {number} x - The position on the x-axis to check.
   * @param {number} y - The position on the y-axis to check.
   * @return {boolean} - `true` if the pair of coordinates falls within the canvas.
   */
  function coordIsInBounds(x, y) {
    updateBounds();
    return (x >= 0 && x <= divWidth) && (y >= 0 && y <= divHeight);
  }
};


// Pass wrapper to constructor to make sure the initial sizing is correct.
let automata = new p5(s, "automata-wrapper");
