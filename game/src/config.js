// Gobble Dash — tuning, stages and shared constants. One file, one job:
// every number the world and the renderer agree on lives here.
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
export const GROUND_Y = 452;
export const STEP = 1 / 60;
export const BEST_KEY = 'gobble-dash-best-distance';
export const SCORE_KEY = 'gobble-dash-best-score';

export const TURKEY = {
  x: 170,
  width: 58,
  height: 54,
  duckHeight: 34,
  jumpVelocity: -850,
  gravity: 1850,
  runSpeed: 300,
  sprintSpeed: 430,
  slowSpeed: 210,
};

export const FARMER = {
  width: 64,
  height: 92,
  // How far behind the turkey the farmer starts, in pixels.
  startGap: 240,
  // The farmer closes in when the turkey stumbles; sprinting opens the gap.
  catchGap: 8,
  safeGap: 330,
};

export const ESCAPE_DISTANCE = 1500;
export const LIVES_START = 3;

// Stages the run passes through as the distance grows: the farmyard, the
// barn, then the kitchen. Each stage names its palette, its ground and the
// hazards it throws at the turkey.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    from: 0,
    skyTop: '#f7b733',
    skyBottom: '#fde8a8',
    hillFar: '#c98a3d',
    hillNear: '#a86a2c',
    ground: '#8a5a2b',
    groundTop: '#b5773a',
    fence: '#7a4a1f',
    label: 'Escape the farmyard!',
  },
  {
    name: 'THE BARN',
    from: 500,
    skyTop: '#e2703a',
    skyBottom: '#f9c784',
    hillFar: '#8a4b2d',
    hillNear: '#6e3a22',
    ground: '#5f3a1e',
    groundTop: '#8a5a2b',
    fence: '#4a2c14',
    label: 'Through the barn — keep running!',
  },
  {
    name: 'THE KITCHEN',
    from: 1000,
    skyTop: '#c94b4b',
    skyBottom: '#f2a65a',
    hillFar: '#7a2e2e',
    hillNear: '#5e2222',
    ground: '#4a2c20',
    groundTop: '#7a4a30',
    fence: '#33201a',
    label: 'The kitchen! Dodge the oven!',
  },
];

// Hazard kinds. Every hazard knows whether the turkey jumps it or ducks it.
export const KIND_FENCE = 'fence';
export const KIND_HAY = 'hay';
export const KIND_CRATE = 'crate';
export const KIND_KNIFE = 'knife';
export const KIND_OVEN = 'oven';
export const KIND_POT = 'pot';
export const KIND_BRANCH = 'branch';

// Pickup kinds.
export const KIND_CORN = 'corn';
export const KIND_FEATHER = 'feather';
export const KIND_PIE = 'pie';

export function stageFor(distance) {
  let stage = STAGES[0];
  for (const candidate of STAGES) {
    if (distance >= candidate.from) stage = candidate;
  }
  return stage;
}

export function stageIndexFor(distance) {
  return STAGES.indexOf(stageFor(distance));
}
