// The renderer: every pixel of Gobble Dash is drawn here on one canvas —
// the turkey, the farmer, the farmyard, the barn, the kitchen, the HUD and
// the title, pause and end screens. No images are loaded; it is all canvas.
import {
  ESCAPE_DISTANCE, FARMER, GROUND_Y, KIND_BRANCH, KIND_CORN, KIND_CRATE,
  KIND_FEATHER, KIND_FENCE, KIND_HAY, KIND_KNIFE, KIND_OVEN, KIND_PIE,
  KIND_POT, STAGES, VIEW_HEIGHT, VIEW_WIDTH,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The turkey: a plump brown bird with a fanned tail, red wattle, orange
// beak and legs that run. `phase` drives the leg cycle.
function drawTurkey(ctx, x, y, width, height, phase, ducking, stumbling) {
  const bodyRx = width * 0.42;
  const bodyRy = height * 0.42;
  const cx = x + width / 2;
  const cy = y + height / 2 + (ducking ? 6 : 0);
  const lean = stumbling ? -0.25 : 0.12;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(lean);
  ctx.translate(-cx, -cy);

  // Tail feathers, fanned behind.
  const tailColors = ['#b5651d', '#d2691e', '#8b4513', '#e08a2e', '#a0522d'];
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + (i - 2) * 0.38;
    const tx = cx - bodyRx * 0.7 + Math.cos(angle) * 26;
    const ty = cy - bodyRy * 0.4 + Math.sin(angle) * 26;
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(tx, ty, 9, 22, angle + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4e3c2';
    ctx.beginPath();
    ctx.ellipse(tx, ty, 4, 10, angle + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Legs, running — tucked up while the turkey is in the air.
  const legSwing = Math.sin(phase) * 9;
  const airborne = y + height < GROUND_Y - 4;
  const footY = airborne ? cy + bodyRy + 8 : GROUND_Y - 2;
  ctx.strokeStyle = '#ff8c1a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + bodyRy - 4);
  ctx.lineTo(cx - 8 + legSwing, footY);
  ctx.moveTo(cx + 8, cy + bodyRy - 4);
  ctx.lineTo(cx + 8 - legSwing, footY);
  ctx.stroke();

  // Body.
  ctx.fillStyle = '#8b5a2b';
  ellipse(ctx, cx, cy, bodyRx, bodyRy);
  ctx.fillStyle = '#a06a35';
  ellipse(ctx, cx + 4, cy + 4, bodyRx * 0.7, bodyRy * 0.6);

  // Wing.
  ctx.fillStyle = '#6e4423';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy + 2, bodyRx * 0.55, bodyRy * 0.45, -0.5 + Math.sin(phase * 0.5) * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Head and neck.
  const hx = cx + bodyRx * 0.75;
  const hy = cy - bodyRy * 0.75;
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(hx - 8, hy, 16, bodyRy * 0.8);
  ctx.fillStyle = '#5b8c5a';
  ellipse(ctx, hx + 4, hy - 2, 13, 12);
  // Beak and wattle.
  ctx.fillStyle = '#ff8c1a';
  ctx.beginPath();
  ctx.moveTo(hx + 14, hy - 4);
  ctx.lineTo(hx + 28, hy + 1);
  ctx.lineTo(hx + 14, hy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.ellipse(hx + 12, hy + 10, 4, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Eye — wide with panic.
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, hx + 8, hy - 6, 4.5, 4.5);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, hx + 9.5, hy - 6, 2.2, 2.2);
  ctx.restore();
}

// The farmer: overalls, straw hat, red shirt, a pitchfork and a very
// determined frown. He runs behind the turkey, never quite catching up.
function drawFarmer(ctx, x, y, phase, close) {
  const cx = x + FARMER.width / 2;
  const ground = y + FARMER.height;
  const legSwing = Math.sin(phase) * 12;
  ctx.save();
  // Legs.
  ctx.strokeStyle = '#3a5a8c';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, ground - 44);
  ctx.lineTo(cx - 8 + legSwing, ground - 2);
  ctx.moveTo(cx + 8, ground - 44);
  ctx.lineTo(cx + 8 - legSwing, ground - 2);
  ctx.stroke();
  // Overalls and shirt.
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(cx - 18, ground - 78, 36, 36);
  ctx.fillStyle = '#3a5a8c';
  ctx.fillRect(cx - 18, ground - 52, 36, 12);
  ctx.fillRect(cx - 16, ground - 44, 12, 14);
  ctx.fillRect(cx + 4, ground - 44, 12, 14);
  // Arms reaching forward.
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx + 10, ground - 72);
  ctx.lineTo(cx + 30, ground - 58 + Math.sin(phase) * 4);
  ctx.stroke();
  // Head.
  ctx.fillStyle = '#f2c89b';
  ellipse(ctx, cx + 4, ground - 88, 13, 13);
  // Straw hat.
  ctx.fillStyle = '#e8c15a';
  ctx.beginPath();
  ctx.ellipse(cx + 4, ground - 96, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 8, ground - 112, 24, 16);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(cx - 8, ground - 100, 24, 4);
  // Angry eyes and moustache.
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, cx + 10, ground - 90, 2, 2);
  ctx.fillStyle = '#7a4a1f';
  ctx.fillRect(cx + 8, ground - 82, 14, 4);
  // Pitchfork, held high when he is close.
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 24, ground - 10);
  ctx.lineTo(cx - 30, ground - (close ? 118 : 96));
  ctx.stroke();
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx - 30 + i * 6, ground - (close ? 118 : 96));
    ctx.lineTo(cx - 30 + i * 6, ground - (close ? 132 : 110));
    ctx.stroke();
  }
  ctx.restore();
}

function drawFence(ctx, hazard) {
  ctx.fillStyle = '#7a4a1f';
  ctx.fillRect(hazard.x, hazard.y + 8, hazard.width, 8);
  ctx.fillRect(hazard.x, hazard.y + 32, hazard.width, 8);
  ctx.fillRect(hazard.x + 2, hazard.y, 7, hazard.height);
  ctx.fillRect(hazard.x + hazard.width - 9, hazard.y, 7, hazard.height);
  ctx.fillStyle = '#5e3a17';
  ctx.beginPath();
  ctx.moveTo(hazard.x + 2, hazard.y);
  ctx.lineTo(hazard.x + 5.5, hazard.y - 7);
  ctx.lineTo(hazard.x + 9, hazard.y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hazard.x + hazard.width - 9, hazard.y);
  ctx.lineTo(hazard.x + hazard.width - 5.5, hazard.y - 7);
  ctx.lineTo(hazard.x + hazard.width - 2, hazard.y);
  ctx.closePath();
  ctx.fill();
}

function drawHay(ctx, hazard, time) {
  ctx.fillStyle = '#e8b64c';
  ellipse(ctx, hazard.x + hazard.width / 2, hazard.y + hazard.height / 2, hazard.width / 2, hazard.height / 2);
  ctx.strokeStyle = '#c98a2e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(
      hazard.x + hazard.width / 2, hazard.y + hazard.height / 2,
      hazard.width / 2 - 6 - i * 2, hazard.height / 2 - 5 - i * 2, 0, 0, Math.PI * 2,
    );
    ctx.stroke();
  }
  // A straw or two, waving.
  ctx.strokeStyle = '#f2d06b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hazard.x + 12, hazard.y + 6);
  ctx.quadraticCurveTo(hazard.x + 16, hazard.y - 8 + Math.sin(time * 3) * 3, hazard.x + 22, hazard.y - 10);
  ctx.stroke();
}

function drawCrate(ctx, hazard) {
  ctx.fillStyle = '#a06a35';
  ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
  ctx.strokeStyle = '#6e4423';
  ctx.lineWidth = 3;
  ctx.strokeRect(hazard.x + 2, hazard.y + 2, hazard.width - 4, hazard.height - 4);
  ctx.beginPath();
  ctx.moveTo(hazard.x, hazard.y);
  ctx.lineTo(hazard.x + hazard.width, hazard.y + hazard.height);
  ctx.moveTo(hazard.x + hazard.width, hazard.y);
  ctx.lineTo(hazard.x, hazard.y + hazard.height);
  ctx.stroke();
}

function drawKnife(ctx, hazard) {
  ctx.save();
  ctx.translate(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2);
  ctx.rotate(hazard.spin || 0);
  ctx.fillStyle = '#dfe6ea';
  ctx.beginPath();
  ctx.moveTo(-28, -4);
  ctx.lineTo(14, -4);
  ctx.lineTo(28, 0);
  ctx.lineTo(14, 4);
  ctx.lineTo(-28, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(-34, -5, 10, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-20, -2, 26, 1.5);
  ctx.restore();
}

function drawOven(ctx, hazard, time) {
  // A big kitchen oven, door glowing with fire — the turkey's worst fear.
  ctx.fillStyle = '#3a3a3a';
  roundRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, 8);
  ctx.fill();
  ctx.fillStyle = '#555555';
  ctx.fillRect(hazard.x + 6, hazard.y + 6, hazard.width - 12, 18);
  const flicker = 0.7 + Math.sin(time * 9 + hazard.x) * 0.3;
  ctx.fillStyle = `rgba(255, ${Math.floor(120 + 80 * flicker)}, 30, 0.95)`;
  roundRect(ctx, hazard.x + 12, hazard.y + 34, hazard.width - 24, hazard.height - 46, 6);
  ctx.fill();
  ctx.fillStyle = '#7a1e1e';
  ctx.fillRect(hazard.x + 12, hazard.y + 34, hazard.width - 24, 8);
  // Knobs.
  ctx.fillStyle = '#dfe6ea';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(hazard.x + 18 + i * 20, hazard.y + 15, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Flames licking out of the door.
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.moveTo(hazard.x + 20, hazard.y + 40);
  ctx.quadraticCurveTo(hazard.x + 30, hazard.y + 22 - flicker * 8, hazard.x + 38, hazard.y + 40);
  ctx.quadraticCurveTo(hazard.x + 48, hazard.y + 26 - flicker * 6, hazard.x + 56, hazard.y + 40);
  ctx.closePath();
  ctx.fill();
}

function drawPot(ctx, hazard) {
  ctx.fillStyle = '#2f3a4a';
  ctx.beginPath();
  ctx.ellipse(hazard.x + hazard.width / 2, hazard.y + hazard.height - 6, hazard.width / 2, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hazard.x, hazard.y + 8, hazard.width, hazard.height - 14);
  ctx.fillStyle = '#4a5a6e';
  ctx.fillRect(hazard.x, hazard.y, hazard.width, 8);
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(hazard.x - 6, hazard.y + 10, 8, 6);
  ctx.fillRect(hazard.x + hazard.width - 2, hazard.y + 10, 8, 6);
  // Steam.
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hazard.x + 16, hazard.y - 2);
  ctx.quadraticCurveTo(hazard.x + 20, hazard.y - 12, hazard.x + 16, hazard.y - 20);
  ctx.moveTo(hazard.x + 34, hazard.y - 2);
  ctx.quadraticCurveTo(hazard.x + 30, hazard.y - 12, hazard.x + 34, hazard.y - 20);
  ctx.stroke();
}

function drawBranch(ctx, hazard) {
  ctx.fillStyle = '#5e3a17';
  ctx.fillRect(hazard.x, hazard.y + 10, hazard.width, 8);
  ctx.fillStyle = '#4e7a3a';
  for (let i = 0; i < 5; i += 1) {
    ellipse(ctx, hazard.x + 8 + i * 14, hazard.y + 4, 12, 7);
  }
  ctx.fillStyle = '#6e4423';
  ctx.fillRect(hazard.x + 4, hazard.y + 18, 4, 10);
}

function drawCorn(ctx, pickup, time) {
  const bob = Math.sin(time * 4 + pickup.bobPhase) * 4;
  const x = pickup.x + pickup.width / 2;
  const y = pickup.y + pickup.height / 2 + bob;
  ctx.fillStyle = 'rgba(255, 217, 74, 0.25)';
  ellipse(ctx, x, y, 24, 24);
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.ellipse(x, y, 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8a800';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 8 + i * 6);
    ctx.lineTo(x + 5, y - 8 + i * 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#7ac74f';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 8);
  ctx.lineTo(x, y + 18);
  ctx.lineTo(x + 8, y + 8);
  ctx.closePath();
  ctx.fill();
}

function drawFeather(ctx, pickup, time) {
  const bob = Math.sin(time * 4 + pickup.bobPhase) * 5;
  const x = pickup.x + pickup.width / 2;
  const y = pickup.y + pickup.height / 2 + bob;
  ctx.fillStyle = 'rgba(255, 179, 71, 0.3)';
  ellipse(ctx, x, y, 26, 26);
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.ellipse(x, y, 7, 16, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.ellipse(x + 2, y - 2, 3, 9, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPie(ctx, pickup, time) {
  const bob = Math.sin(time * 4 + pickup.bobPhase) * 4;
  const x = pickup.x + pickup.width / 2;
  const y = pickup.y + pickup.height / 2 + bob;
  ctx.fillStyle = 'rgba(255, 143, 163, 0.3)';
  ellipse(ctx, x, y, 26, 26);
  ctx.fillStyle = '#d2691e';
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 6);
  ctx.lineTo(x + 14, y + 6);
  ctx.lineTo(x + 10, y + 12);
  ctx.lineTo(x - 10, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8fa3';
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 6);
  ctx.lineTo(x + 14, y + 6);
  ctx.lineTo(x, y - 10);
  ctx.closePath();
  ctx.fill();
}

function drawHazard(ctx, hazard, time) {
  if (!hazard.active) return;
  if (hazard.kind === KIND_FENCE) drawFence(ctx, hazard);
  else if (hazard.kind === KIND_HAY) drawHay(ctx, hazard, time);
  else if (hazard.kind === KIND_CRATE) drawCrate(ctx, hazard);
  else if (hazard.kind === KIND_KNIFE) drawKnife(ctx, hazard);
  else if (hazard.kind === KIND_OVEN) drawOven(ctx, hazard, time);
  else if (hazard.kind === KIND_POT) drawPot(ctx, hazard);
  else if (hazard.kind === KIND_BRANCH) drawBranch(ctx, hazard);
}

function drawPickup(ctx, pickup, time) {
  if (!pickup.active) return;
  if (pickup.kind === KIND_CORN) drawCorn(ctx, pickup, time);
  else if (pickup.kind === KIND_FEATHER) drawFeather(ctx, pickup, time);
  else if (pickup.kind === KIND_PIE) drawPie(ctx, pickup, time);
}

// Parallax scenery: sun, clouds, hills, and the stage's own landmarks.
function drawScenery(ctx, state, stage) {
  const scroll = state.distance / 0.045;
  const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  gradient.addColorStop(0, stage.skyTop);
  gradient.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_WIDTH, GROUND_Y);

  // Sun.
  ctx.fillStyle = '#fff3b0';
  ellipse(ctx, 830, 70, 34, 34);
  ctx.fillStyle = 'rgba(255, 243, 176, 0.35)';
  ellipse(ctx, 830, 70, 52, 52);

  // Clouds drift slowly.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 3; i += 1) {
    const cx = ((i * 340 - scroll * 0.1) % 1100 + 1100) % 1100 - 80;
    const cy = 70 + i * 46;
    ellipse(ctx, cx, cy, 42, 16);
    ellipse(ctx, cx + 28, cy + 4, 30, 13);
    ellipse(ctx, cx - 28, cy + 5, 28, 12);
  }

  // Far hills.
  ctx.fillStyle = stage.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_WIDTH; x += 40) {
    const hillX = x + scroll * 0.15;
    ctx.lineTo(x, GROUND_Y - 70 - Math.sin(hillX * 0.008) * 36);
  }
  ctx.lineTo(VIEW_WIDTH, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // The barn in the farmyard, the kitchen window in the kitchen.
  if (state.stageIndex === 0) {
    const bx = 620 - (scroll * 0.3 % 1400);
    if (bx > -200 && bx < VIEW_WIDTH) {
      ctx.fillStyle = '#a83226';
      ctx.fillRect(bx, GROUND_Y - 150, 150, 150);
      ctx.fillStyle = '#7a241b';
      ctx.beginPath();
      ctx.moveTo(bx - 10, GROUND_Y - 150);
      ctx.lineTo(bx + 75, GROUND_Y - 205);
      ctx.lineTo(bx + 160, GROUND_Y - 150);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx + 75, GROUND_Y - 150);
      ctx.lineTo(bx + 75, GROUND_Y - 60);
      ctx.moveTo(bx + 30, GROUND_Y - 105);
      ctx.lineTo(bx + 120, GROUND_Y - 105);
      ctx.stroke();
    }
  }
  if (state.stageIndex === 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(60, 60, 180, 120);
    ctx.strokeStyle = '#5e2222';
    ctx.lineWidth = 6;
    ctx.strokeRect(60, 60, 180, 120);
    ctx.beginPath();
    ctx.moveTo(150, 60);
    ctx.lineTo(150, 180);
    ctx.moveTo(60, 120);
    ctx.lineTo(240, 120);
    ctx.stroke();
    ctx.fillStyle = '#7a2e2e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('🍂 THANKSGIVING EVE', 270, 100);
  }

  // Near hills.
  ctx.fillStyle = stage.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_WIDTH; x += 40) {
    const hillX = x + scroll * 0.3;
    ctx.lineTo(x, GROUND_Y - 26 - Math.sin(hillX * 0.01) * 18);
  }
  ctx.lineTo(VIEW_WIDTH, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Fence posts and autumn trees scrolling past.
  ctx.fillStyle = stage.fence;
  for (let i = 0; i < 8; i += 1) {
    const fx = ((i * 160 - scroll) % 1280 + 1280) % 1280 - 40;
    ctx.fillRect(fx, GROUND_Y - 44, 8, 44);
  }
  ctx.fillRect(0, GROUND_Y - 34, VIEW_WIDTH, 5);
  for (let i = 0; i < 3; i += 1) {
    const tx = ((i * 420 + 200 - scroll * 0.55) % 1300 + 1300) % 1300 - 80;
    ctx.fillStyle = '#6e4423';
    ctx.fillRect(tx - 5, GROUND_Y - 70, 10, 70);
    ctx.fillStyle = i % 2 ? '#c96a2e' : '#e08a2e';
    ellipse(ctx, tx, GROUND_Y - 92, 42, 34);
    ellipse(ctx, tx - 24, GROUND_Y - 72, 24, 18);
    ellipse(ctx, tx + 24, GROUND_Y - 72, 24, 18);
  }

  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);
  ctx.fillStyle = stage.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 10);
  // Scuffed dirt lines rushing past.
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i += 1) {
    const dx = ((i * 190 - scroll * 1.4) % 1200 + 1200) % 1200 - 60;
    ctx.beginPath();
    ctx.moveTo(dx, GROUND_Y + 30 + (i % 3) * 18);
    ctx.lineTo(dx + 46, GROUND_Y + 30 + (i % 3) * 18);
    ctx.stroke();
  }
}

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ellipse(ctx, particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx, state) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px sans-serif';
  for (const floater of state.floaters) {
    ctx.globalAlpha = Math.min(1, floater.life);
    ctx.fillStyle = floater.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(floater.text, floater.x, floater.y);
    ctx.fillText(floater.text, floater.x, floater.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawHearts(ctx, lives, x, y) {
  for (let i = 0; i < Math.max(3, lives); i += 1) {
    const hx = x + i * 30;
    ctx.fillStyle = i < lives ? '#ff4d6d' : 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx + 10, y + 18);
    ctx.bezierCurveTo(hx, y + 8, hx + 4, y, hx + 10, y + 5);
    ctx.bezierCurveTo(hx + 16, y, hx + 20, y + 8, hx + 10, y + 18);
    ctx.fill();
  }
}

function drawHud(ctx, state, best) {
  // Top bar.
  ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
  roundRect(ctx, 12, 10, 470, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${Math.floor(state.score)}`, 26, 38);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#ffd94a';
  ctx.fillText(`DISTANCE ${Math.floor(state.distance)} m / ${ESCAPE_DISTANCE} m`, 26, 62);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`BEST ${Math.floor(best)} m`, 330, 38);
  drawHearts(ctx, state.lives, 330, 44);

  // Stage and the escape progress bar.
  const stage = STAGES[state.stageIndex];
  ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
  roundRect(ctx, VIEW_WIDTH - 262, 10, 250, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(stage.name, VIEW_WIDTH - 248, 36);
  const progress = Math.min(1, state.distance / ESCAPE_DISTANCE);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, VIEW_WIDTH - 248, 46, 222, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#7ac74f';
  roundRect(ctx, VIEW_WIDTH - 248, 46, 222 * progress, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('🌲', VIEW_WIDTH - 248 + 222 * progress - 7, 58);

  // Farmer proximity meter: how close the farmer is behind the turkey.
  const closeness = 1 - (state.farmerGap - FARMER.catchGap) / (FARMER.safeGap - FARMER.catchGap);
  const barX = 12;
  const barY = VIEW_HEIGHT - 44;
  ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
  roundRect(ctx, barX, barY - 8, 250, 36, 10);
  ctx.fill();
  ctx.fillStyle = closeness > 0.75 ? '#ff4d4d' : closeness > 0.45 ? '#ffb347' : '#7ac74f';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(state.farmerMood === 'close' ? '⚠️ THE FARMER IS RIGHT BEHIND YOU!' : '🧑‍🌾 FARMER', barX + 10, barY + 16);
  // The meter itself: the bar fills as the farmer closes in.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, barX + 10, barY + 22, 230, 8, 4);
  ctx.fill();
  ctx.fillStyle = closeness > 0.75 ? '#ff4d4d' : closeness > 0.45 ? '#ffb347' : '#7ac74f';
  roundRect(ctx, barX + 10, barY + 22, 230 * Math.min(1, Math.max(0, closeness)), 8, 4);
  ctx.fill();
  // Sprint hint.
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Hold → to sprint · Space to jump · ↓ to duck · P pause', VIEW_WIDTH - 14, VIEW_HEIGHT - 16);
  ctx.textAlign = 'left';

  // Stage banner flash.
  if (state.stageFlash > 0 && state.stageLabel) {
    ctx.globalAlpha = Math.min(1, state.stageFlash);
    ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
    roundRect(ctx, VIEW_WIDTH / 2 - 260, 110, 520, 56, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.stageLabel, VIEW_WIDTH / 2, 147);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

function panel(ctx, x, y, width, height) {
  ctx.fillStyle = 'rgba(24, 14, 6, 0.82)';
  roundRect(ctx, x, y, width, height, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffd94a';
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, width, height, 18);
  ctx.stroke();
}

function drawTitle(ctx, state, best) {
  panel(ctx, 130, 62, 700, 416);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('GOBBLE DASH', VIEW_WIDTH / 2, 140);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('🦃 The Great Turkey Escape 🦃', VIEW_WIDTH / 2, 178);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', VIEW_WIDTH / 2, 214);
  ctx.fillText('Run 1500 m to the forest gate — dodge fences, hay bales,', VIEW_WIDTH / 2, 240);
  ctx.fillText('the carving knife and the oven. Grab corn, mind the farmer!', VIEW_WIDTH / 2, 266);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('SPACE / CLICK — jump      ↓ — duck      → — sprint', VIEW_WIDTH / 2, 308);
  ctx.fillText('P — pause      M — mute', VIEW_WIDTH / 2, 332);
  ctx.fillStyle = '#7ac74f';
  ctx.font = 'bold 24px sans-serif';
  const blink = Math.floor(state.time * 2) % 2 === 0;
  if (blink) ctx.fillText('▶ PRESS SPACE OR CLICK TO RUN', VIEW_WIDTH / 2, 380);
  ctx.fillStyle = '#ffd94a';
  ctx.font = '16px sans-serif';
  if (best > 0) ctx.fillText(`Best escape so far: ${Math.floor(best)} m`, VIEW_WIDTH / 2, 416);
  else ctx.fillText('No escape yet — the oven is preheating…', VIEW_WIDTH / 2, 416);
  ctx.fillText('3 lives · corn = points · golden feather = +100 · pie = +1 life', VIEW_WIDTH / 2, 446);
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  panel(ctx, 280, 190, 400, 160);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('PAUSED', VIEW_WIDTH / 2, 258);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P or Space to keep running.', VIEW_WIDTH / 2, 296);
  ctx.textAlign = 'left';
}

function drawOver(ctx, state, best) {
  ctx.fillStyle = 'rgba(40, 6, 6, 0.45)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  panel(ctx, 150, 80, 660, 380);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('CAUGHT!', VIEW_WIDTH / 2, 158);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px sans-serif';
  const byFarmer = state.caughtBy === 'farmer';
  ctx.fillText(
    byFarmer
      ? 'The farmer grabbed you by the tail feathers…'
      : 'A carving knife did you in — the farmer is delighted.',
    VIEW_WIDTH / 2, 198,
  );
  ctx.fillText('Thanksgiving dinner is served. Almost.', VIEW_WIDTH / 2, 228);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`You ran ${Math.floor(state.distance)} m of ${ESCAPE_DISTANCE} m`, VIEW_WIDTH / 2, 280);
  ctx.fillText(`Score ${Math.floor(state.score)}  ·  Best ${Math.floor(best)} m`, VIEW_WIDTH / 2, 314);
  ctx.fillStyle = '#7ac74f';
  ctx.font = 'bold 22px sans-serif';
  const blink = Math.floor(state.time * 2) % 2 === 0;
  if (blink) ctx.fillText('▶ PRESS SPACE OR CLICK TO TRY AGAIN', VIEW_WIDTH / 2, 372);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '16px sans-serif';
  ctx.fillText('Tip: hold → to sprint when the farmer gets close.', VIEW_WIDTH / 2, 414);
  ctx.textAlign = 'left';
}

function drawEscaped(ctx, state, best) {
  ctx.fillStyle = 'rgba(6, 40, 12, 0.35)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  panel(ctx, 150, 80, 660, 380);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7ac74f';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('ESCAPED! 🎉', VIEW_WIDTH / 2, 158);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px sans-serif';
  ctx.fillText('You burst through the forest gate — free at last!', VIEW_WIDTH / 2, 198);
  ctx.fillText('The farmer is still running. The oven stays cold.', VIEW_WIDTH / 2, 228);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`You ran the full ${ESCAPE_DISTANCE} m!`, VIEW_WIDTH / 2, 280);
  ctx.fillText(`Score ${Math.floor(state.score)}  ·  Best ${Math.floor(best)} m`, VIEW_WIDTH / 2, 314);
  ctx.fillStyle = '#7ac74f';
  ctx.font = 'bold 22px sans-serif';
  const blink = Math.floor(state.time * 2) % 2 === 0;
  if (blink) ctx.fillText('▶ PRESS SPACE OR CLICK TO RUN AGAIN', VIEW_WIDTH / 2, 372);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '16px sans-serif';
  ctx.fillText('Gobble gobble. You earned that corn.', VIEW_WIDTH / 2, 414);
  ctx.textAlign = 'left';
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const scale = { x: 1, y: 1 };

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(VIEW_WIDTH * devicePixelRatio);
    canvas.height = Math.round(VIEW_HEIGHT * devicePixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    scale.x = canvas.width / VIEW_WIDTH;
    scale.y = canvas.height / VIEW_HEIGHT;
  }

  resize();
  window.addEventListener('resize', resize);

  function draw(state, screen, best) {
    ctx.setTransform(scale.x, 0, 0, scale.y, 0, 0);
    const stage = STAGES[state.stageIndex];
    drawScenery(ctx, state, stage);

    // The forest gate at the end of the road, when the turkey is close.
    const gateDistance = ESCAPE_DISTANCE - state.distance;
    if (gateDistance < 120 && screen === SCREEN_PLAY) {
      const gateX = VIEW_WIDTH - 120 + gateDistance * 4;
      ctx.fillStyle = '#4e7a3a';
      ctx.fillRect(gateX - 8, GROUND_Y - 150, 16, 150);
      ctx.fillRect(gateX + 90, GROUND_Y - 150, 16, 150);
      ctx.fillStyle = '#6e4423';
      ctx.fillRect(gateX - 14, GROUND_Y - 158, 130, 14);
      ctx.fillStyle = '#ffd94a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌲 FREEDOM 🌲', gateX + 45, GROUND_Y - 168);
      ctx.textAlign = 'left';
    }

    for (const pickup of state.pickups) drawPickup(ctx, pickup, state.time);
    for (const hazard of state.hazards) drawHazard(ctx, hazard, state.time);

    // The farmer, chasing from the left.
    const farmerX = state.player.x - FARMER.width - state.farmerGap + 60;
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawFarmer(ctx, farmerX, GROUND_Y - FARMER.height, state.time * 11, state.farmerMood === 'close');
    }

    // The turkey — flashing while invulnerable after a hit.
    const player = state.player;
    if (screen !== SCREEN_OVER || state.caughtBy !== 'farmer') {
      const flash = player.invulnerable > 0 && Math.floor(state.time * 12) % 2 === 0;
      if (!flash) {
        drawTurkey(ctx, player.x, player.y, player.width, player.height, player.runPhase, player.ducking, player.stumble > 0);
      }
    }

    drawParticles(ctx, state);
    drawFloaters(ctx, state);

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, state, best);
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
    if (screen === SCREEN_PAUSED) drawPaused(ctx);
    if (screen === SCREEN_OVER) drawOver(ctx, state, best);
    if (screen === SCREEN_ESCAPED) drawEscaped(ctx, state, best);
  }

  return { draw, resize };
}
