let wrapper, bounds;
let divWidth, divHeight;

/** @type HTMLCanvasElement */
let canvas;

/**
 * P5 function. Run before the sketch starts.
 */
function setup() {
  wrapper = document.getElementById("automata-wrapper");
  // canvas = document.getElementById("automata-canvas");
  updateBounds();

  // Tell which Canvas P5 to use.
  let canvas = createCanvas(divWidth, divHeight);
  canvas.parent(wrapper);
  canvas.id("automata-canvas");
}

/**
 * P5 function. Run every frame.
 */
function draw() {
  background(220);
  textAlign(CENTER);
  text("Hi, I'm Robin", width / 2, height / 2);
}

/**
 * P5 function. Run when window is resized.
 */
function windowResized() {
  updateBounds();
  resizeCanvas(divWidth, divHeight);
}

/**
 * Helper function to refresh parent div sizes.
 */
function updateBounds() {
  bounds = wrapper.getBoundingClientRect();
  divWidth = bounds.width;
  divHeight = bounds.height;
}
