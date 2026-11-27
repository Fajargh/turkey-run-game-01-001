// Keyboard and mouse input: jump, duck, sprint, pause and confirm. The game
// is played with keyboard and mouse; a click or tap jumps, just like Space.
export const ACTION_JUMP = 1;
export const ACTION_DUCK = 2;
export const ACTION_SPRINT = 4;
export const ACTION_SLOW = 8;
export const ACTION_CONFIRM = 16;
export const ACTION_PAUSE = 32;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const SPRINT_KEYS = new Set(['ArrowRight', 'KeyD']);
const SLOW_KEYS = new Set(['ArrowLeft', 'KeyA']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();

  function onKeyDown(event) {
    if (JUMP_KEYS.has(event.code) || DUCK_KEYS.has(event.code) || SPRINT_KEYS.has(event.code)
      || SLOW_KEYS.has(event.code) || PAUSE_KEYS.has(event.code) || event.code === 'Enter') {
      event.preventDefault();
    }
    if (event.repeat) return;
    held.add(event.code);
    pressed.add(event.code);
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onPointerDown(event) {
    event.preventDefault();
    pressed.add('Pointer');
    held.add('Pointer');
  }

  function onPointerUp() {
    held.delete('Pointer');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  function has(keys) {
    for (const code of keys) if (held.has(code)) return true;
    return false;
  }

  function pressedAny(keys) {
    for (const code of keys) if (pressed.has(code)) return true;
    return false;
  }

  return {
    // Held state, read every frame: -1 slow, 0 normal, 1 sprint.
    speedWish() {
      if (has(SPRINT_KEYS)) return 1;
      if (has(SLOW_KEYS)) return -1;
      return 0;
    },
    ducking() {
      return has(DUCK_KEYS);
    },
    // One-shot actions since the last call; clears the pressed set.
    takeActions() {
      let actions = 0;
      if (pressedAny(JUMP_KEYS) || pressed.has('Pointer')) actions |= ACTION_JUMP;
      if (pressedAny(DUCK_KEYS)) actions |= ACTION_DUCK;
      if (pressedAny(PAUSE_KEYS)) actions |= ACTION_PAUSE;
      if (pressedAny(new Set(['Enter'])) || pressed.has('Pointer')) actions |= ACTION_CONFIRM;
      pressed.clear();
      return actions;
    },
  };
}
