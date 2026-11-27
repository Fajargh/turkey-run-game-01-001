// The screenshot scenes behind ?shot=start|play|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (jump the fences and low knives, duck the high
// knives and branches, sprint when the farmer closes in), so the frame is
// what a short game really looks like and the same seed always gives the
// same frame.
import { GROUND_Y, KIND_BRANCH, KIND_KNIFE, STEP } from './config.js';
import {
  EVENT_CAUGHT, EVENT_ESCAPED,
} from './world.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 14;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/** The autopilot's input for one step: jump, duck and sprint, or none. */
function autopilot(state) {
  const player = state.player;
  const input = { jump: false, duck: false, speed: 0 };
  if (state.farmerGap < 90) input.speed = 1;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const hazard of state.hazards) {
    if (!hazard.active) continue;
    const distance = hazard.x - (player.x + player.width);
    if (distance < -10 || distance > 420) continue;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = hazard;
    }
  }
  if (!nearest) return input;
  // Knives fly at the turkey, so they close faster than the scroll speed.
  const approach = nearest.kind === KIND_KNIFE ? state.speed + 260 : state.speed;
  const closing = nearestDistance / Math.max(120, approach);
  if (nearest.kind === KIND_KNIFE) {
    const high = nearest.y < GROUND_Y - 40;
    if (high) input.duck = true;
    else if (player.grounded && closing < 0.5) input.jump = true;
  } else if (nearest.kind === KIND_BRANCH) {
    input.duck = true;
  } else if (player.grounded && closing < 0.32) {
    // Jump late: the jump's arc carries about 275 px, and the turkey must
    // still be above the obstacle when its far edge slides out from under
    // the turkey — jumping any earlier lands the turkey on top of it.
    input.jump = true;
  }
  return input;
}

/**
 * Set `world` to the named scene (start, play or end; any other name is
 * start) and return the screen to draw over it and the best distance to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { jump: false, duck: false, speed: 0 }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  for (let index = 0; index < limit / STEP; index += 1) {
    const events = world.step(STEP, autopilot(world.state), false);
    if (events & (EVENT_CAUGHT | EVENT_ESCAPED)) break;
  }
  if (world.state.escaped) return { screen: SCREEN_ESCAPED, best: world.state.distance };
  if (world.state.caught) return { screen: SCREEN_OVER, best: world.state.distance };
  return { screen: SCREEN_PLAY, best: world.state.distance };
}
