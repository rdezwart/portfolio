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
  let logicIntervalId = undefined;

  /** @type boolean */
  let simulationStarted = false;

  /** @type p5.Element */
  let pauseButton;


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
    sketch.noStroke();
    sketch.noLoop(); // start sketch paused

    pauseButton = sketch.createButton("Pause");
    pauseButton.position(0, 0);
    pauseButton.mouseClicked(togglePaused);

    // Manually update the cells ONCE so they display on load
    grid.loop();
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

  /**
   * Helper function to refresh parent div sizes.
   */
  function updateBounds() {
    bounds = wrapper.getBoundingClientRect();
    divWidth = bounds.width;
    divHeight = bounds.height;
  }

  /**
   * Toggles the logic interval as well as the draw loop of the sketch.
   */
  function togglePaused() {
    if (sketch.isLooping()) {
      sketch.noLoop();
    } else {
      sketch.loop();
      if (!simulationStarted) simulationStarted = true;
    }
    toggleLogicInterval();
  }

  /**
   * Toggles the logic interval responsible for running the simulation loop.
   */
  function toggleLogicInterval() {
    if (logicIntervalId !== undefined) {
      clearInterval(logicIntervalId);
      logicIntervalId = undefined;
    } else {
      logicIntervalId = setInterval(function () {
        if (sketch.isLooping()) grid.loop();
      }, 1000 / UPDATES_PER_SECOND);
    }
  }
};


// Pass wrapper to constructor to make sure the initial sizing is correct.
let automata = new p5(s, "automata-wrapper");
