// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between five screens:
// title, play, paused, caught and escaped.
//
// ?seed=N fixes the run's pattern. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, SCORE_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_CAUGHT, EVENT_ESCAPED, EVENT_HIT, EVENT_PICKUP, EVENT_SHOUT,
  EVENT_STAGE, EVENT_STUMBLE, createWorld,
} from './world.js';
import {
  ACTION_CONFIRM, ACTION_JUMP, ACTION_PAUSE, createInput,
} from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readNumber(key) {
  try {
    return Number.parseFloat(window.localStorage.getItem(key) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function saveNumber(key, value) {
  try {
    window.localStorage.setItem(key, String(Math.floor(value)));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readNumber(BEST_KEY);
  let bestScore = readNumber(SCORE_KEY);
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.startMusic();
    audio.gobble();
    announce('Playing. Run 1500 metres to the forest gate. 3 lives.');
  }

  function endRun(escaped) {
    const distance = world.state.distance;
    const score = world.state.score;
    if (distance > best) {
      best = distance;
      saveNumber(BEST_KEY, best);
    }
    if (score > bestScore) {
      bestScore = score;
      saveNumber(SCORE_KEY, bestScore);
    }
    audio.stopMusic();
    if (escaped) {
      screen = SCREEN_ESCAPED;
      audio.escaped();
      announce(`Escaped! You ran the full 1500 metres. Score ${Math.floor(score)}.`);
    } else {
      screen = SCREEN_OVER;
      audio.caught();
      announce(`Caught. You ran ${Math.floor(distance)} metres. Score ${Math.floor(score)}. Best ${Math.floor(best)}.`);
    }
  }

  function handleEvents(events) {
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_HIT) {
      audio.hit();
      announce(world.state.lives === 1 ? 'Hit by a knife. 1 life left.' : `Hit by a knife. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_STUMBLE) {
      audio.stumble();
      announce('Stumbled! The farmer is gaining.');
    }
    if (events & EVENT_SHOUT) audio.farmerShout();
    if (events & EVENT_STAGE) announce(`${world.state.stageLabel}`);
    if (events & EVENT_ESCAPED) endRun(true);
    else if (events & EVENT_CAUGHT) endRun(false);
  }

  function handleActions(actions) {
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopMusic();
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      audio.startMusic();
      announce('Playing.');
    } else if (actions & (ACTION_CONFIRM | ACTION_JUMP) && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_ESCAPED)) {
      startGame();
    }
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { jump: false, duck: false, speed: 0 }, true);
      return;
    }
    const jumped = Boolean(actions & ACTION_JUMP);
    const events = world.step(STEP, {
      jump: jumped,
      duck: input.ducking(),
      speed: input.speedWish(),
    }, false);
    if (jumped && world.state.player.vy < 0) audio.jump();
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    // One-shot actions are taken exactly once per frame and shared by the
    // screen handling and the world step, so a press is never lost or doubled.
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(actions);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch the turkey unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopMusic();
      announce('Paused.');
    }
  });

  // M mutes the music and effects.
  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyM') {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
  });

  announce('Gobble Dash. Press Space or click to run.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
