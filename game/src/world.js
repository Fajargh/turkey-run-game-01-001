// The world: the turkey, the farmer, hazards, pickups, particles and the
// rules that move them. The turkey runs right; the farmer chases from the
// left; stumbling lets the farmer close in, sprinting opens the gap. Reach
// the forest gate at 1500 m and the turkey escapes.
import {
  ESCAPE_DISTANCE, FARMER, GROUND_Y, KIND_BRANCH, KIND_CORN, KIND_CRATE,
  KIND_FEATHER, KIND_FENCE, KIND_HAY, KIND_KNIFE, KIND_OVEN, KIND_PIE,
  KIND_POT, LIVES_START, STAGES, TURKEY, stageIndexFor,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_HIT = 2;
export const EVENT_STUMBLE = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_STAGE = 32;
export const EVENT_SHOUT = 64;

const GRAVITY = TURKEY.gravity;
const METERS_PER_PIXEL = 0.045;

function hazardForStage(stageIndex, random) {
  const farm = [KIND_FENCE, KIND_HAY, KIND_FENCE, KIND_HAY, KIND_BRANCH];
  const barn = [KIND_FENCE, KIND_CRATE, KIND_HAY, KIND_KNIFE, KIND_BRANCH, KIND_CRATE];
  const kitchen = [KIND_OVEN, KIND_KNIFE, KIND_POT, KIND_CRATE, KIND_KNIFE, KIND_OVEN];
  const tables = [farm, barn, kitchen];
  const table = tables[Math.min(stageIndex, tables.length - 1)];
  return random.pick(table);
}

function makeHazard(kind, x, random) {
  const base = { kind, x, active: true, passed: false, bobPhase: random.range(0, Math.PI * 2) };
  if (kind === KIND_FENCE) return { ...base, width: 26, height: 64, y: GROUND_Y - 64 };
  if (kind === KIND_HAY) return { ...base, width: 64, height: 48, y: GROUND_Y - 48 };
  if (kind === KIND_CRATE) return { ...base, width: 52, height: 52, y: GROUND_Y - 52 };
  if (kind === KIND_BRANCH) return { ...base, width: 70, height: 26, y: GROUND_Y - 118 };
  if (kind === KIND_OVEN) return { ...base, width: 74, height: 96, y: GROUND_Y - 96 };
  if (kind === KIND_POT) return { ...base, width: 56, height: 42, y: GROUND_Y - 42 };
  // A thrown carving knife: it flies at head height (duck under it) or at
  // knee height (jump over it).
  const high = random.next() < 0.5;
  return {
    ...base, width: 58, height: 14,
    y: high ? GROUND_Y - 62 : GROUND_Y - 18,
    thrown: true, spin: 0,
  };
}

function makePickup(kind, x, y, random) {
  return { kind, x, y, width: 34, height: 34, active: true, bobPhase: random.range(0, Math.PI * 2) };
}

export function createWorld(random) {
  const state = {
    time: 0,
    distance: 0,
    score: 0,
    lives: LIVES_START,
    speed: TURKEY.runSpeed,
    farmerGap: FARMER.startGap,
    farmerMood: 'chase',
    stageIndex: 0,
    stageFlash: 0,
    stageLabel: '',
    player: {
      x: TURKEY.x, y: GROUND_Y - TURKEY.height,
      width: TURKEY.width, height: TURKEY.height,
      vy: 0, grounded: true, ducking: false,
      stumble: 0, invulnerable: 0, runPhase: 0,
    },
    hazards: [],
    pickups: [],
    particles: [],
    floaters: [],
    nextSpawnX: 700,
    cornStreak: 0,
    escaped: false,
    caught: false,
    caughtBy: '',
  };

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = random.range(0, Math.PI * 2);
      const power = random.range(speed * 0.3, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power - 60,
        life: random.range(0.4, 0.9),
        maxLife: 0.9,
        size: random.range(3, 8),
        color,
        gravity: 500,
      });
    }
  }

  function addFloater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 1.1 });
  }

  function spawnAhead() {
    const stageIndex = stageIndexFor(state.distance);
    const kind = hazardForStage(stageIndex, random);
    // nextSpawnX is a world coordinate; convert to screen x by subtracting
    // how far the world has already scrolled.
    const scrolled = state.distance / METERS_PER_PIXEL;
    const hazard = makeHazard(kind, state.nextSpawnX - scrolled, random);
    state.hazards.push(hazard);
    // A trail of corn often leads over or under the hazard.
    if (random.next() < 0.65) {
      const count = 3 + Math.floor(random.next() * 3);
      for (let i = 0; i < count; i += 1) {
        const cx = hazard.x - 40 + i * 34;
        const over = kind === KIND_FENCE || kind === KIND_HAY || kind === KIND_CRATE
          || kind === KIND_OVEN || kind === KIND_POT;
        const cy = over ? GROUND_Y - 150 : GROUND_Y - 40;
        state.pickups.push(makePickup(KIND_CORN, cx, cy, random));
      }
    }
    if (random.next() < 0.12) {
      state.pickups.push(makePickup(KIND_FEATHER, hazard.x + 140, GROUND_Y - 170, random));
    }
    if (random.next() < 0.08) {
      state.pickups.push(makePickup(KIND_PIE, hazard.x + 200, GROUND_Y - 60, random));
    }
    const gap = 300 + random.range(0, 180) - Math.min(120, state.distance * 0.04);
    state.nextSpawnX += Math.max(240, gap);
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x
      && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function stumblePlayer(reason) {
    const player = state.player;
    player.stumble = 0.55;
    player.invulnerable = 1.1;
    state.farmerGap = Math.max(FARMER.catchGap + 30, state.farmerGap - 45);
    state.cornStreak = 0;
    burst(player.x + 20, player.y + 10, '#ffffff', 14, 260);
    burst(player.x + 20, player.y + 10, '#c98a3d', 8, 200);
    return reason === 'knife' ? EVENT_HIT : EVENT_STUMBLE;
  }

  function reset() {
    state.time = 0;
    state.distance = 0;
    state.score = 0;
    state.lives = LIVES_START;
    state.speed = TURKEY.runSpeed;
    state.farmerGap = FARMER.startGap;
    state.farmerMood = 'chase';
    state.stageIndex = 0;
    state.stageFlash = 0;
    state.stageLabel = '';
    state.player.x = TURKEY.x;
    state.player.y = GROUND_Y - TURKEY.height;
    state.player.vy = 0;
    state.player.grounded = true;
    state.player.ducking = false;
    state.player.stumble = 0;
    state.player.invulnerable = 0;
    state.player.runPhase = 0;
    state.hazards.length = 0;
    state.pickups.length = 0;
    state.particles.length = 0;
    state.floaters.length = 0;
    state.nextSpawnX = 700;
    state.cornStreak = 0;
    state.escaped = false;
    state.caught = false;
    state.caughtBy = '';
    for (let i = 0; i < 3; i += 1) spawnAhead();
  }

  function step(dt, input, attract) {
    let events = EVENT_NONE;
    state.time += dt;
    const player = state.player;

    // Speed: sprint on the open road, slow to time a jump, stumble to a crawl.
    let targetSpeed = TURKEY.runSpeed;
    if (!attract) {
      if (input.speed === 1) targetSpeed = TURKEY.sprintSpeed;
      else if (input.speed === -1) targetSpeed = TURKEY.slowSpeed;
    }
    if (player.stumble > 0) targetSpeed = 120;
    state.speed += (targetSpeed - state.speed) * Math.min(1, dt * 6);

    // The turkey's jump and duck.
    if (!attract && input.jump && player.grounded && player.stumble <= 0) {
      player.vy = TURKEY.jumpVelocity;
      player.grounded = false;
      burst(player.x + 28, GROUND_Y, '#d9c9a8', 6, 120);
    }
    player.ducking = !attract && input.duck && player.grounded;
    player.height = player.ducking ? TURKEY.duckHeight : TURKEY.height;
    if (player.ducking) player.y = GROUND_Y - player.height;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.y >= GROUND_Y - player.height) {
      player.y = GROUND_Y - player.height;
      player.vy = 0;
      player.grounded = true;
    } else {
      player.grounded = false;
    }
    if (player.stumble > 0) player.stumble -= dt;
    if (player.invulnerable > 0) player.invulnerable -= dt;
    player.runPhase += dt * (state.speed / 28);

    // The world scrolls past; distance and score grow with it.
    const scroll = state.speed * dt;
    state.distance += scroll * METERS_PER_PIXEL;
    state.score += scroll * 0.02;
    if (state.stageFlash > 0) state.stageFlash -= dt;

    const stageIndex = stageIndexFor(state.distance);
    if (stageIndex !== state.stageIndex) {
      state.stageIndex = stageIndex;
      state.stageFlash = 2.2;
      state.stageLabel = STAGES[stageIndex].label;
      events |= EVENT_STAGE;
    }

    // Spawn ahead, retire behind.
    while (state.nextSpawnX < state.distance / METERS_PER_PIXEL + 1100) spawnAhead();
    const leftEdge = -160;
    state.hazards = state.hazards.filter((h) => h.x + h.width > leftEdge);
    state.pickups = state.pickups.filter((p) => p.x + p.width > leftEdge);

    // Move everything left at scroll speed; knives also fly left.
    for (const hazard of state.hazards) {
      hazard.x -= scroll;
      if (hazard.kind === KIND_KNIFE) {
        hazard.x -= 260 * dt;
        hazard.spin += dt * 14;
      }
    }
    for (const pickup of state.pickups) pickup.x -= scroll;

    // Collisions with hazards.
    if (!attract && player.invulnerable <= 0) {
      for (const hazard of state.hazards) {
        if (!hazard.active) continue;
        const hitbox = {
          x: hazard.x + 6, y: hazard.y + 6,
          width: hazard.width - 12, height: hazard.height - 12,
        };
        if (hazard.kind === KIND_BRANCH && !player.ducking) {
          // A low branch only catches a standing turkey.
          if (overlaps(player, hitbox)) {
            hazard.active = false;
            events |= stumblePlayer('branch');
          }
        } else if (hazard.kind === KIND_BRANCH) {
          // Ducking under it clears it.
          if (hazard.x + hazard.width < player.x && !hazard.passed) {
            hazard.passed = true;
            state.score += 15;
          }
        } else if (overlaps(player, hitbox)) {
          hazard.active = false;
          if (hazard.kind === KIND_KNIFE) {
            state.lives -= 1;
            addFloater(player.x, player.y - 30, '-1 ❤', '#ff5a5a');
            events |= stumblePlayer('knife');
            if (state.lives <= 0) {
              state.caught = true;
              state.caughtBy = 'knife';
              events |= EVENT_CAUGHT;
            }
          } else {
            events |= stumblePlayer('hazard');
          }
        } else if (hazard.x + hazard.width < player.x && !hazard.passed) {
          hazard.passed = true;
          state.score += 10;
        }
      }
    }

    // Pickups: corn for points, a golden feather for a bonus, pie for a life.
    if (!attract) {
      for (const pickup of state.pickups) {
        if (!pickup.active) continue;
        const box = { x: pickup.x - 6, y: pickup.y - 6, width: pickup.width + 12, height: pickup.height + 12 };
        if (overlaps(player, box)) {
          pickup.active = false;
          if (pickup.kind === KIND_CORN) {
            state.cornStreak += 1;
            const points = 25 + Math.min(50, (state.cornStreak - 1) * 5);
            state.score += points;
            addFloater(pickup.x, pickup.y - 14, `+${points}`, '#ffd94a');
            burst(pickup.x + 17, pickup.y + 17, '#ffd94a', 6, 140);
            events |= EVENT_PICKUP;
          } else if (pickup.kind === KIND_FEATHER) {
            state.score += 100;
            addFloater(pickup.x, pickup.y - 14, '+100 GOLDEN FEATHER!', '#ffb347');
            burst(pickup.x + 17, pickup.y + 17, '#ffb347', 12, 200);
            events |= EVENT_PICKUP;
          } else {
            state.lives = Math.min(5, state.lives + 1);
            addFloater(pickup.x, pickup.y - 14, '+1 ❤ PIE!', '#ff8fa3');
            burst(pickup.x + 17, pickup.y + 17, '#ff8fa3', 12, 200);
            events |= EVENT_PICKUP;
          }
        }
      }
    }

    // The farmer: he gains on every stumble and loses ground when the turkey
    // sprints; when the gap closes he grabs the turkey.
    if (!attract) {
      const chaseRate = 14 + state.stageIndex * 4;
      state.farmerGap -= chaseRate * dt;
      // The speed term only counts while the turkey is running freely: a
      // stumble already costs the gap once, it should not cost it twice.
      if (player.stumble <= 0) {
        state.farmerGap += (state.speed - TURKEY.runSpeed) * dt * 0.35;
      }
      state.farmerGap = Math.min(FARMER.safeGap, Math.max(FARMER.catchGap, state.farmerGap));
      if (state.farmerGap < 70 && state.farmerMood !== 'close') {
        state.farmerMood = 'close';
        events |= EVENT_SHOUT;
      } else if (state.farmerGap >= 70) {
        state.farmerMood = 'chase';
      }
      if (state.farmerGap <= FARMER.catchGap + 1) {
        state.caught = true;
        state.caughtBy = 'farmer';
        events |= EVENT_CAUGHT;
      }
    }

    // Running dust, and the forest gate at the end of the road.
    if (player.grounded && state.speed > 200 && Math.random() < 0.35) {
      state.particles.push({
        x: player.x + 6, y: GROUND_Y - 2,
        vx: -random.range(20, 70), vy: -random.range(10, 50),
        life: 0.5, maxLife: 0.5, size: random.range(3, 6),
        color: '#d9c9a8', gravity: -40,
      });
    }

    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const floater of state.floaters) {
      floater.life -= dt;
      floater.y -= 34 * dt;
    }
    state.floaters = state.floaters.filter((f) => f.life > 0);

    if (!attract && state.distance >= ESCAPE_DISTANCE && !state.escaped) {
      state.escaped = true;
      events |= EVENT_ESCAPED;
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
