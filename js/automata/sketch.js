"use strict";

/**
 * Wraps the sketch in an object, enabling "instance mode".
 * @param {p5} sketch - The sketch loaded by p5.
 */
const s = (sketch) => {
  /** @type Grid */
  let grid;

  /** @type p5.Color */
  const deadColor = sketch.color(42, 42, 47, 255);
  /** @type p5.Color */
  const aliveColor = sketch.color(255, 153, 51, 255);
  /** @type p5.Color */
  const highlightColor = sketch.color(0, 238, 255, 255);

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
  let simulationStarted;

  /** @type p5.Element */
  let menu;
  /** @type p5.Element */
  let pauseButton;
  /** @type p5.Element */
  let animButton;
  /** @type p5.Element */
  let resetButton;

  /**
   * Enum of strings to be used when describing various elements of the sketch
   * to screen readers.
   * @readonly
   * @enum {string}
   */
  const DESCRIPTIONS = {
    BASE: `A dark grey rectangle with a grid of small bright orange square \
      cells, running a cellular automaton simulation of John Conway's "Game of \
      Life".`,
    RUNNING: `The simulation is currently running.`,
    PAUSED: `The simulation is currently paused.`,
    HOWDY: `In the center of the grid, bright orange cells spell out the word \
      "Howdy", followed by an exclamation mark in bright blue cells.`,
    CELLS_RUNNING: `Cells are appearing and disappearing several times per second, \
      moving around the grid and forming a variety of shapes and patterns.`,
    CELLS_PAUSED: `Cells are frozen in a variety of shapes and patterns.`,
    ANIMATING: `Vertical lines of bright blue cells are sweeping horizontally \
      across the grid, left-to-right then right-to-left. Each one is leaving \
      new orange cells in its wake.`,
  };

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

    sketch.frameRate(FRAMES_PER_SECOND);
    sketch.noStroke();
    sketch.noLoop(); // start sketch paused

    simulationStarted = false;
    grid = new Grid(sketch);

    menu = sketch.createElement("menu");
    menu.addClass("canvas-menu");

    pauseButton = createAndAddMenuButton("Play", "pause-button", false, "fa-solid fa-play");
    pauseButton.mouseClicked(togglePaused);

    animButton = createAndAddMenuButton("Trigger Wave", "anim-button", true, "fa-solid fa-shuffle");
    animButton.mouseClicked(() => {
      if (animButton.attribute("aria-disabled") === "true")
        return;

      grid.startAnimations();
      updateInterface();
    });

    resetButton = createAndAddMenuButton("Reset", "reset-button", true, "fa-solid fa-arrow-rotate-left");
    resetButton.mouseClicked(() => {
      if (resetButton.attribute("aria-disabled") === "true")
        return;

      if (logicIntervalId !== undefined) toggleLogicInterval();
      sketch.noLoop();
      grid = new Grid(sketch);
      simulationStarted = false;
      grid.loop();
      updateInterface();
      sketch.redraw();
    });

    updateInterface();

    // Manually draw the cells ONCE so they display on load
    // (this will not update the cells since sketch is not looping)
    grid.loop();
  };

  /**
   * P5 function. Runs every frame.
   */
  sketch.draw = () => {
    updateDescriptions();
    sketch.background(deadColor);
    sketch.scale(Grid.SCALE_FACTOR);
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
    let moveHowdy = !simulationStarted;
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
      grid.loop();
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
        if (sketch.isLooping()) grid.loop();
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
   */
  function updateDescriptions() {
    sketch.describe(
      `${DESCRIPTIONS.BASE} \
        ${sketch.isLooping() ? DESCRIPTIONS.RUNNING : DESCRIPTIONS.PAUSED}`
    );

    let desc =
      sketch.isLooping()
        ? DESCRIPTIONS.CELLS_RUNNING
        : DESCRIPTIONS.CELLS_PAUSED;
    if (!simulationStarted)
      desc = DESCRIPTIONS.HOWDY;
    if (grid.isAnimating)
      desc += ` ${DESCRIPTIONS.ANIMATING}`;

    sketch.describeElement("Cells", desc);
  }

  /**
   * Refreshes the properties of canvas menu buttons.
   */
  function updateButtons() {
    updatePauseButton();
    updateAnimButton();
    updateResetButton();

    function updatePauseButton() {
      /** @type HTMLElement */
      let pauseIcon = document.getElementById("pause-button-icon");
      /** @type HTMLSpanElement */
      let pauseSpan = document.getElementById("pause-button-span");
      if (pauseIcon == null || pauseSpan == null)
        return;

      if (sketch.isLooping()) {
        pauseIcon.classList.replace("fa-play", "fa-pause");
        pauseSpan.innerHTML = "Pause";
      } else {
        pauseIcon.classList.replace("fa-pause", "fa-play");
        pauseSpan.innerHTML = "Play";
      }
    }

    function updateAnimButton() {
      animButton.attribute("aria-disabled", `${!sketch.isLooping()}`);
    }

    function updateResetButton() {
      resetButton.attribute("aria-disabled", `${!simulationStarted}`);
    }
  }

  /**
   * Creates a new button element with additional attributes suited for the
   * canvas menu controls, then adds it to the canvas menu.
   *
   * If `iconClasses` is provided, a FontAwesome icon will be used instead of
   * text and include extra markup for accessibility.
   * @see https://docs-v6.fontawesome.com/web/dig-deeper/accessibility#making-icons-accessible-manually
   *      FontAwesome v6 Docs
   *
   * @param {string} label - The text to be used for the button label, or the
   *     screen-reader-only label and tooltip if `iconClasses` are provided.
   * @param {string} id - The base ID for this button and children.
   * @param {boolean} disabled - Whether this button should be disabled by default.
   * @param {string} [iconClasses=undefined] - Space separated string of class names to
   *        apply to the icon.
   * @return {p5.Element} - The button that was added to the menu as a list item child.
   */
  function createAndAddMenuButton(label, id, disabled = false, iconClasses = undefined) {
    /** @type p5.Element */
    let li = sketch.createElement("li");
    li.parent(menu);

    /** @type p5.Element */
    let buttonWrapper = sketch.createDiv();
    buttonWrapper.addClass("button-tooltip-wrapper");
    buttonWrapper.parent(li);

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
      let span = sketch.createSpan(label);
      span.id(`${id}-span`);
      span.addClass("fa-sr-only");

      /** @type p5.Element */
      let tooltip = sketch.createDiv(label);
      tooltip.id(`${id}-tooltip`);
      tooltip.attribute("role", "tooltip");
      tooltip.parent(buttonWrapper);

      button.child(icon);
      button.child(span);
    }

    return button;
  }
};


// Pass wrapper to constructor to make sure the initial sizing is correct.
let automata = new p5(s, "automata-wrapper");
