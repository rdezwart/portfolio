"use strict";

/**
 * Launcher for the entire `automata` module.
 * @module automata
 * @requires module:automata/sketch.automataSketch
 */

import {automataSketch} from "./automata/sketch.js";

/**
 * Object from the p5.js library, used to start the sketch in "instance mode".
 *
 * We're also passing the wrapper ID to the constructor to make sure the initial
 * sizing is correct.
 * @see [p5.js]{@link https://p5js.org/}
 * @see [Global and instance mode]{@link https://github.com/processing/p5.js/wiki/Global-and-instance-mode}
 * @readonly
 * @const {p5}
 */
const automata = new p5(automataSketch, "automata-wrapper");
