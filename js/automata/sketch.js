"use strict";

/**
 * Module for the actual p5.js sketch.
 * @module automata/sketch
 * @requires module:automata/grid
 * @requires module:automata/text/word
 * @requires module:{@link https://cdn.jsdelivr.net/npm/bezier-easing@3.0.0/+esm}
 */

import {Grid} from "./grid.js";
import {Word} from "./text/word.js";
import {default as BezierEasing} from
    "https://cdn.jsdelivr.net/npm/bezier-easing@3.0.0/+esm";

/**
 * Wraps the sketch in an object, enabling "instance mode".
 * @param {p5} sketch - The sketch loaded by p5.
 */
const automataSketch = (sketch) => {
  /**
   * The simulation grid, contains many [Cells]{@linkcode module:automata/cell}.
   * @type Grid
   */
  let grid;

  /**
   * The colour of dead [Cells]{@linkcode module:automata/cell}. Essentially,
   * the background.
   * @see [p5.Color]{@link https://p5js.org/reference/p5/p5.Color/}
   * @type p5.Color
   */
  let deadColor;
  /**
   * The colour of living [Cells]{@linkcode module:automata/cell}.
   * @see [p5.Color]{@link https://p5js.org/reference/p5/p5.Color/}
   * @type p5.Color
   */
  let aliveColor;
  /**
   * The colour of highlighted [Cells]{@linkcode module:automata/cell}.
   * @see [p5.Color]{@link https://p5js.org/reference/p5/p5.Color/}
   * @type p5.Color
   */
  let highlightColor;

  /**
   * The div element that will contain the canvas.
   * @type HTMLDivElement
   */
  let wrapper;
  /**
   * The text to be displayed on the canvas at startup and reset. Populated from
   * data attributes on {@linkcode wrapper}.
   * @type Word
   */
  let canvasWord;
  /**
   * The bounding box of {@linkcode wrapper}.
   * @type DOMRect
   */
  let bounds;
  /**
   * The dimensions of {@linkcode bounds}.
   * @type number
   */
  let divWidth, divHeight;

  /**
   * How many times per second the logic interval fires.
   * @readonly
   * @const {number}
   */
  const UPDATES_PER_SECOND = 10;
  /**
   * The ID of the logic interval.
   * @type number
   */
  let logicIntervalId = undefined;
  /**
   * If the simulation has started (moved pasted displaying
   * {@linkcode canvasWord}).
   * @type boolean
   */
  let simulationStarted = false;
  /**
   * If the sketch finished creating and loading everything.
   * @type boolean
   */
  let loaded = false;
  /**
   * If the sketch is currently running.
   * @type {boolean}
   */
  let sketchRunning = false;

  /**
   * Wrapper object for the `menu` element that will contain control buttons.
   * @see [p5.Element]{@link https://p5js.org/reference/p5/p5.Element/}
   * @type p5.Element
   */
  let menu;
  /**
   * Wrapper object for the pause button.
   * @see [p5.Element]{@link https://p5js.org/reference/p5/p5.Element/}
   * @type p5.Element
   */
  let pauseButton;
  /**
   * Wrapper object for the animation button.
   * @see [p5.Element]{@link https://p5js.org/reference/p5/p5.Element/}
   * @type p5.Element
   */
  let animButton;
  /**
   * Wrapper object for the reset button.
   * @see [p5.Element]{@link https://p5js.org/reference/p5/p5.Element/}
   * @type p5.Element
   */
  let resetButton;

  /**
   * Enum of strings to be used when describing various elements of the sketch
   * to screen readers.
   * @readonly
   * @enum {string}
   */
  let descriptions;

  /**
   * Live object containing the styles on `:root`, namely used to grab custom
   * CSS variables.
   * @type {CSSStyleDeclaration}
   */
  let documentStyles;

  /**
   * Namespace object for sketch color transitions.
   * @namespace
   * @prop {function(number): number} _easing - Easing function, declared once
   *     in `setup()` to save on object creations.
   * @prop {boolean} fallenBackToLinear - If something went wrong with the
   *     Bezier easing, and we have fallen back to linear interpolation.
   * @prop {function(number): number} easing - Cubic Bezier easing function
   *     identical to the `ease` keyword in CSS. Falls back to returning the
   *     same value as was passed in.
   * @prop {function(Error)} fallBackToLinear - Handle errors related to Bezier
   *     easing.
   * @prop {boolean} running - Is a transition currently running.
   * @prop {number} duration - Desired transition duration, in milliseconds.
   * @prop {number} timeElapsed - How long the current transition has been
   *     running.
   * @prop {boolean} wasSketchLooping - Was the sketch looping before starting
   *     this transition?
   * @prop {Object} colors - Collection of [Colors]{@linkcode p5.Color} to
   *     transition between.
   * @prop {p5.Color} colors.originDeadColor - The original value of
   *     {@linkcode deadColor}.
   * @prop {p5.Color} colors.targetDeadColor - The target value of
   *     {@linkcode deadColor}.
   * @prop {p5.Color} colors.originAliveColor - The original value of
   *     {@linkcode aliveColor}.
   * @prop {p5.Color} colors.targetAliveColor - The target value of
   *     {@linkcode aliveColor}.
   * @prop {p5.Color} colors.originHighlightColor - The original value of
   *     {@linkcode highlightColor}.
   * @prop {p5.Color} colors.targetHighlightColor - The target value of
   *     {@linkcode highlightColor}.
   */
  const transition = {
    _easing: null,
    fallenBackToLinear: false,
    easing: function (progress) {
      try {
        return this._easing(progress);
      } catch (e) {
        this.fallBackToLinear(e);
        return progress;
      }
    },
    fallBackToLinear: function (e) {
      transition.fallenBackToLinear = true;
      transition._easing = (progress) => progress;
      console.warn("Something went wrong with the BezierEasing " +
        "library, falling back to linear interpolation.");
      console.warn(e);
    },

    running: false,
    duration: 0,
    timeElapsed: 0,
    wasSketchLooping: false,

    colors: {
      originDeadColor: null,
      targetDeadColor: null,

      originAliveColor: null,
      targetAliveColor: null,

      originHighlightColor: null,
      targetHighlightColor: null,
    }
  }


  /**
   * Runs before the sketch starts.
   * @see [setup()]{@link https://p5js.org/reference/p5/setup/}
   */
  sketch.setup = () => {
    wrapper = document.getElementById("automata-wrapper");
    updateBounds();

    let canvas = sketch.createCanvas(divWidth, divHeight);
    canvas.id("automata-canvas");
    // Set parent a second time (makes sure the CSS starting transition plays)
    canvas.parent(wrapper);
    canvas.attribute("aria-live", "polite");

    sketch.noStroke();
    sketch.noLoop(); // Start sketch paused

    canvasWord = new Word(
      wrapper.dataset.canvasText,
      wrapper.dataset.canvasHighlight
    );
    grid = new Grid(sketch, canvasWord);

    // Try to use Bezier easing, but fall back to linear interpolation if
    // anything goes wrong.
    try {
      transition._easing = BezierEasing(0.25, 0.1, 0.25, 1);
    } catch (e) {
      transition.fallBackToLinear(e);
    }

    // Listen for theme changers
    /** @type {NodeListOf<HTMLFormElement>} */
    const themePickers = document.querySelectorAll("form.theme-picker");
    themePickers.forEach((themePicker) => {
      themePicker.addEventListener(
        "change", handleThemeChange
      );
    });

    // Listen for preferred color scheme changes
    window.matchMedia("(prefers-color-scheme: light)").addEventListener(
      "change", handleThemeChange
    );

    // Store a reference to body styles, especially custom CSS variables
    documentStyles = window.getComputedStyle(document.body);
    updateColorScheme();

    descriptions = {
      BASE: `A dark grey rectangle with a grid of small bright orange square \
        cells, running a cellular automaton simulation of John Conway's "Game \
        of Life".`,
      RUNNING: `The simulation is currently running.`,
      PAUSED: `The simulation is currently paused.`,
      TEXT: `In the center of the grid, bright orange cells spell out the text \
        "${canvasWord.regularText}", followed by \
        "${canvasWord.highlightedText}" in bright blue cells. Together, they \
        form "${canvasWord.allText}".`,
      CELLS_RUNNING: `Cells are appearing and disappearing several times per \
        second, moving around the grid and forming a variety of shapes and \
        patterns.`,
      CELLS_PAUSED: `Cells are frozen in a variety of shapes and patterns.`,
      ANIMATING: `Vertical lines of bright blue cells are sweeping \
        horizontally across the grid, left-to-right then right-to-left. Each \
        one is leaving new orange cells in its wake.`,
    };

    menu = sketch.createElement("menu");
    menu.attribute("aria-live", "polite");
    menu.addClass("canvas-menu");

    /** @type p5.Element */
    let pauseWrapper;
    [pauseWrapper, pauseButton] = createMenuButton(
      "Play",
      "pause-button",
      false,
      "fa-solid fa-play"
    );
    addToMenu(pauseWrapper);
    pauseButton.mouseClicked(togglePaused);

    /** @type p5.Element */
    let animWrapper;
    [animWrapper, animButton] = createMenuButton(
      "Trigger Wave",
      "anim-button",
      true,
      "fa-solid fa-shuffle"
    );
    addToMenu(animWrapper);
    animButton.mouseClicked(() => {
      if (animButton.attribute("aria-disabled") === "true")
        return;

      grid.startAnimations();
      updateInterface();
    });

    /** @type p5.Element */
    let resetWrapper;
    [resetWrapper, resetButton] = createMenuButton(
      "Reset",
      "reset-button",
      true,
      "fa-solid fa-arrow-rotate-left");
    addToMenu(resetWrapper);
    resetButton.mouseClicked(() => {
      // WebStorm thinks this is incorrect syntax, but it's wrong.
      if (resetButton.attribute("aria-disabled") === "true")
        return;

      loaded = false;

      // Stop logic interval
      if (logicIntervalId !== undefined) toggleLogicInterval();

      // Pause the draw loop, or wait until transition complete and then do so
      if (transition.running) {
        transition.wasSketchLooping = false;
      } else {
        sketch.noLoop();
      }

      // Reset sketch and grid state
      sketchRunning = false;
      simulationStarted = false;
      grid = new Grid(sketch, canvasWord);
      grid.loop();
      updateInterface();
      sketch.redraw();

      loaded = true;
    });

    updateInterface();

    // Manually draw the cells ONCE so they display on load
    // (this will not update the cells since sketch is not looping)
    grid.loop();

    loaded = true;
  };

  /**
   * Runs every frame, as long as the sketch has been allowed to loop.
   * @see [draw()]{@link https://p5js.org/reference/p5.Framebuffer/draw/}
   */
  sketch.draw = () => {
    updateDescriptions();
    if (transition.running)
      doColorTransition();
    sketch.background(deadColor);
    sketch.scale(grid.scaleFactor);
    sketch.fill(aliveColor);
    sketch.drawingContext.fill(grid.livingPath);
    sketch.fill(highlightColor);
    sketch.drawingContext.fill(grid.highlightPath);
  };

  /**
   * Runs when window is resized.
   * @see [windowResized()]{@link https://p5js.org/reference/p5/windowResized/}
   */
  sketch.windowResized = () => {
    handleResize()
  };

  /**
   * Runs when device is turned more than 90 degrees.
   *
   * Probably unnecessary, but better safe than sorry. This doesn't even get
   * called when rotating a device preview in Chrome DevTools.
   * @see [deviceTurned]{@link https://p5js.org/reference/p5/deviceTurned/}
   */
  sketch.deviceTurned = () => {
    handleResize();
  }


  /**
   * Updates grid to match new screen size/orientation. Returns early if sketch
   * has not finished loading.
   *
   * Keeps any text on the canvas centered if it's still visible (i.e.
   * simulation hasn't been started yet).
   */
  function handleResize() {
    if (!loaded) return;

    if (!simulationStarted) {
      // Remove current text by inverting the same pixels
      grid.placeWord();
    }

    updateBounds();
    sketch.resizeCanvas(divWidth, divHeight);
    grid.resize();

    if (!simulationStarted) {
      // Re-place text into the new centre
      grid.placeWord();
      grid.loop();
    }

    sketch.redraw();
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
   * Toggles the logic interval as well as the draw loop of the sketch.
   */
  function togglePaused() {
    if (sketchRunning) {
      sketchRunning = false;
      if (!transition.running) sketch.noLoop();
    } else {
      sketchRunning = true;
      if (!transition.running) sketch.loop();
      if (!simulationStarted) simulationStarted = true;
    }

    // Setting this to false will stop the sketch draw loop once it's done
    transition.wasSketchLooping = sketchRunning;
    toggleLogicInterval();
    updateInterface();
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
        if (sketchRunning) grid.loop();
      }, 1000 / UPDATES_PER_SECOND);
    }
  }

  /**
   * Updates the user interface of the sketch, such as screen reader
   * descriptions and canvas menu buttons.
   */
  function updateInterface() {
    updateDescriptions();
    updateButtons();
  }

  /**
   * Updates the screen reader descriptions depending on current sketch state.
   * @see [describe()]{@link https://p5js.org/reference/p5/describe/}
   * @see [describeElement()]{@link https://p5js.org/reference/p5/describeElement/}
   */
  function updateDescriptions() {
    sketch.describe(
      `${descriptions.BASE} \
        ${sketchRunning ? descriptions.RUNNING : descriptions.PAUSED}`
    );

    let desc =
      sketchRunning
        ? descriptions.CELLS_RUNNING
        : descriptions.CELLS_PAUSED;
    if (!simulationStarted)
      desc = descriptions.TEXT;
    if (grid.isAnimating)
      desc += ` ${descriptions.ANIMATING}`;

    sketch.describeElement("Cells", desc);
  }

  /**
   * Refreshes the properties of canvas menu buttons.
   */
  function updateButtons() {
    updatePauseButton();
    updateAnimButton();
    updateResetButton();

    /**
     * Updates the pause button.
     */
    function updatePauseButton() {
      /** @type HTMLElement */
      let pauseIcon = document.getElementById("pause-button-icon");
      /** @type HTMLDivElement */
      let pauseTooltip = document.getElementById("pause-button-tooltip");
      if (pauseIcon == null || pauseTooltip == null)
        return;

      if (sketchRunning) {
        pauseIcon.classList.replace("fa-play", "fa-pause");
        pauseTooltip.textContent = "Pause";
      } else {
        pauseIcon.classList.replace("fa-pause", "fa-play");
        pauseTooltip.textContent = "Play";
      }
    }

    /**
     * Updates the animation button.
     */
    function updateAnimButton() {
      animButton.attribute("aria-disabled", `${!sketchRunning}`);
    }

    /**
     * Updates the reset button.
     */
    function updateResetButton() {
      resetButton.attribute("aria-disabled", `${!simulationStarted}`);
    }
  }

  /**
   * Creates a wrapper and new button element with additional attributes suited
   * for the canvas menu controls.
   *
   * If `iconClasses` is provided, a FontAwesome icon will be used instead of
   * text and include extra markup for accessibility.
   * @see [FontAwesome v6 Accessibility]{@link
   *     https://docs-v6.fontawesome.com/web/dig-deeper/accessibility#making-icons-accessible-manually}
   * @param {string} label - The text to be used for the button label, or the
   *     screen-reader-only label and tooltip if `iconClasses` are provided.
   * @param {string} id - The base ID for this button and children.
   * @param {boolean} disabled - Whether this button should be disabled by
   *     default.
   * @param {string} [iconClasses=undefined] - Space separated string of class
   *     names to apply to the icon.
   * @returns {[p5.Element, p5.Element]} - [0] the wrapping div of: [1] the
   *     button.
   */
  function createMenuButton(
    label,
    id,
    disabled = false,
    iconClasses = undefined
  ) {
    /** @type p5.Element */
    let buttonWrapper = sketch.createDiv();
    buttonWrapper.addClass("button-tooltip-wrapper");

    /** @type p5.Element */
    let button = sketch.createButton("");
    button.id(id);
    button.attribute("type", "button");
    button.attribute("aria-controls", "automata-canvas");
    button.attribute("aria-disabled", `${disabled}`);
    button.addClass("button");
    button.parent(buttonWrapper);

    if (iconClasses === undefined) {
      button.html(label);
    } else {
      /** @type p5.Element */
      let icon = sketch.createElement("i");
      icon.id(`${id}-icon`);
      icon.attribute("aria-hidden", "true");
      icon.addClass("fa-fw"); // fixed width
      icon.addClass(iconClasses);

      /** @type p5.Element */
      let tooltip = sketch.createDiv(label);
      tooltip.id(`${id}-tooltip`);
      tooltip.attribute("role", "tooltip");
      tooltip.parent(buttonWrapper);

      button.attribute("aria-labelledby", `${id}-tooltip`);
      button.child(icon);
    }

    return [buttonWrapper, button];
  }

  /**
   * Adds an element (such as a button wrapper) to the canvas menu.
   * @param {p5.Element} element - The element to be added as a list item to the
   *     canvas menu.
   */
  function addToMenu(element) {
    /** @type p5.Element */
    let li = sketch.createElement("li");
    li.parent(menu);

    element.parent(li);
  }

  /**
   * Callback function for theme-related change listeners.
   */
  function handleThemeChange() {
    startColorTransition();
  }

  /**
   * Updates the sketch colours based on site-wide colour scheme, from CSS
   * variables.
   */
  function updateColorScheme() {
    deadColor = sketch.color(
      documentStyles.getPropertyValue("--banner")
    );
    aliveColor = sketch.color(
      documentStyles.getPropertyValue("--link")
    );
    highlightColor = sketch.color(
      documentStyles.getPropertyValue("--highlight")
    );
  }

  /**
   * Start the color transition. Enables the sketch drawing loop if it has to,
   * but {@linkcode finishColorTransition} will set it back to the correct state
   * once the transition is complete.
   */
  function startColorTransition() {
    // Cut off the "ms" from the CSS value
    transition.duration = parseInt(
      documentStyles.getPropertyValue("--duration").slice(0, -2));
    transition.timeElapsed = 0;

    // Keep track of starting color
    transition.colors.originDeadColor = deadColor;
    transition.colors.originAliveColor = aliveColor;
    transition.colors.originHighlightColor = highlightColor;

    // Get target colors from CSS
    transition.colors.targetDeadColor = sketch.color(
      documentStyles.getPropertyValue("--banner"));
    transition.colors.targetAliveColor = sketch.color(
      documentStyles.getPropertyValue("--link"));
    transition.colors.targetHighlightColor = sketch.color(
      documentStyles.getPropertyValue("--highlight"));

    if (!transition.running && !transition.wasSketchLooping) {
      // Start looping so that the transition can actually be drawn
      sketch.loop();
      // Need to reset deltaTime since the sketch may have been paused, leading
      // to inflated deltaTime values.
      sketch.deltaTime = 0;
    }

    transition.running = true;
  }

  /**
   * Finish the color transition. Returns the sketch drawing loop to the correct
   * state.
   */
  function finishColorTransition() {
    // Make sure we always end up with the target color.
    deadColor = transition.colors.targetDeadColor;
    aliveColor = transition.colors.targetAliveColor;
    highlightColor = transition.colors.targetHighlightColor;

    transition.running = false;
    if (!transition.wasSketchLooping) {
      sketch.noLoop();
    }
  }

  /**
   * Apply the color transition for this frame, using a cubic Bezier easing
   * function identical to CSS's `ease` value.
   */
  function doColorTransition() {
    // Calculate eased progress
    transition.timeElapsed += sketch.deltaTime;
    let easedProgress = transition.easing(
      Math.max(0, Math.min(transition.timeElapsed / transition.duration, 1))
    );

    // Set colors
    deadColor = sketch.lerpColor(
      transition.colors.originDeadColor,
      transition.colors.targetDeadColor,
      easedProgress
    );
    aliveColor = sketch.lerpColor(
      transition.colors.originAliveColor,
      transition.colors.targetAliveColor,
      easedProgress
    );
    highlightColor = sketch.lerpColor(
      transition.colors.originHighlightColor,
      transition.colors.targetHighlightColor,
      easedProgress
    );

    if (transition.timeElapsed >= transition.duration) {
      finishColorTransition();
    }
  }
};

export {automataSketch};
