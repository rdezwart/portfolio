"use strict";

import {automata} from "./automata/sketch.js";

// Pass wrapper to constructor to make sure the initial sizing is correct.
new p5(automata, "automata-wrapper");
