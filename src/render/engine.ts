/**
 * Render Engine - Game Loop & Debug Overlay
 * Handles the main render loop, FPS tracking, and debug display
 */

import { CanvasContext, DebugState, TouchState, UnitType, COLORS, Nexus } from '../types';
import { clearCanvas, drawGrid } from './canvas';
import { drawUnitIndicator, drawProgressArc, drawCoordinates, drawCoordinatesWithLabel, getUnitColor, easeOutCubic } from './effects';
import { updateTouchState, getInputLatency, getUnitProgress } from '../input/touch';
import { addNexusPoints, getGameState, getScore } from '../game/state';

// =============================================================================
// STATE
// =============================================================================

const debugState: DebugState = {
  fps: 0,
  frameCount: 0,
  lastFpsUpdate: 0,
  pressTime: 0,
  detectedUnit: 'none',
  inputLatency: 0,
  state: 'IDLE',
};

// Animation state for released indicators
interface ReleasedAnimation {
  x: number;
  y: number;
  unitType: UnitType;
  startTime: number;
  duration: number;
}

let releasedAnimations: ReleasedAnimation[] = [];
const RELEASE_ANIMATION_DURATION = 800;  // ms

// =============================================================================
// SPRINT 1-3 - NEXUS + IA simple
// =============================================================================

const NEXUS_CAPTURE_TIME_MS = 3000;
const NEXUS_RADIUS = 26;

// Pour Sprint 2 : 5 nexus en croix autour du centre.
let nexusList: Nexus[] = [];
let lastRenderTimestamp: number | null = null;

// IA rouge très simple (Sprint 3)
interface EnemyAgent {
  targetId: string | null;
  timeOnTarget: number;
  captureDuration: number; // en secondes
  cooldown: number;        // temps entre deux décisions
  cooldownTimer: number;
}

const enemyAgent: EnemyAgent = {
  targetId: null,
  timeOnTarget: 0,
  captureDuration: NEXUS_CAPTURE_TIME_MS / 1000,
  cooldown: 2,
  cooldownTimer: 1,
};

// =============================================================================
// DEBUG OVERLAY UPDATE
// =============================================================================

function updateDebugOverlay(touchState: TouchState): void {
  // FPS
  const fpsEl = document.getElementById('debug-fps');
  if (fpsEl) {
    fpsEl.textContent = debugState.fps.toFixed(1);
    fpsEl.style.color = debugState.fps >= 55 ? COLORS.defender : COLORS.attacker;
  }

  // Press Time
  const pressTimeEl = document.getElementById('debug-press-time');
  if (pressTimeEl) {
    pressTimeEl.textContent = `${Math.floor(touchState.duration)} ms`;
  }

  // Detected Unit
  const unitEl = document.getElementById('debug-unit');
  if (unitEl) {
    const unitName = touchState.detectedUnit.toUpperCase();
    unitEl.textContent = unitName === 'NONE' ? '--' : unitName;
    unitEl.className = `value unit-${touchState.detectedUnit}`;
  }

  // Input Latency
  const latencyEl = document.getElementById('debug-latency');
  if (latencyEl) {
    latencyEl.textContent = `${debugState.inputLatency.toFixed(1)} ms`;
    latencyEl.style.color = debugState.inputLatency < 16 ? COLORS.defender : COLORS.attacker;
  }

  // State
  const stateEl = document.getElementById('debug-state');
  if (stateEl) {
    stateEl.textContent = debugState.state;
    stateEl.style.color = debugState.state === 'PRESSING' ? COLORS.attacker : COLORS.annotation;
  }
}

// =============================================================================
// FPS TRACKING
// =============================================================================

function updateFPS(timestamp: number): void {
  debugState.frameCount++;

  if (timestamp - debugState.lastFpsUpdate >= 1000) {
    debugState.fps = debugState.frameCount * 1000 / (timestamp - debugState.lastFpsUpdate);
    debugState.frameCount = 0;
    debugState.lastFpsUpdate = timestamp;
  }
}

// =============================================================================
// RENDER FUNCTIONS
// =============================================================================

function renderActiveTouch(
  ctx: CanvasRenderingContext2D,
  touchState: TouchState
): void {
  if (!touchState.active) return;

  const { x, y, duration, detectedUnit } = touchState;
  const progress = getUnitProgress(duration);

  // Draw progress arc around touch point
  const arcColor = getUnitColor(detectedUnit);
  drawProgressArc(ctx, x, y, Math.min(1, duration / 2000), 35, arcColor);

  // Draw unit indicator with animation progress
  drawUnitIndicator(ctx, x, y, detectedUnit, easeOutCubic(progress), true);

  // Draw coordinates
  const gridX = Math.floor(x / 40);
  const gridY = Math.floor(y / 40);
  drawCoordinates(ctx, x, y, gridX, gridY);
}

function renderReleasedAnimations(
  ctx: CanvasRenderingContext2D,
  timestamp: number
): void {
  // Filter out completed animations
  releasedAnimations = releasedAnimations.filter(anim => {
    const elapsed = timestamp - anim.startTime;
    return elapsed < anim.duration;
  });

  // Render remaining animations
  for (const anim of releasedAnimations) {
    const elapsed = timestamp - anim.startTime;
    const progress = elapsed / anim.duration;

    // Fade out
    ctx.save();
    ctx.globalAlpha = 1 - easeOutCubic(progress);

    // Scale up slightly as it fades
    const scale = 1 + progress * 0.3;
    ctx.translate(anim.x, anim.y);
    ctx.scale(scale, scale);
    ctx.translate(-anim.x, -anim.y);

    drawUnitIndicator(ctx, anim.x, anim.y, anim.unitType, 1, false);

    ctx.restore();
  }
}

// =============================================================================
// MAIN RENDER LOOP
// =============================================================================

let animationFrameId: number | null = null;
let canvasContext: CanvasContext | null = null;

function ensureNexusLayout(width: number, height: number): void {
  if (nexusList.length === 0) {
    const cx = width / 2;
    const cy = height / 2;
    const offset = 120;

    nexusList = [
      { id: 'center', x: cx, y: cy, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
      { id: 'top', x: cx, y: cy - offset, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
      { id: 'bottom', x: cx, y: cy + offset, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
      { id: 'left', x: cx - offset, y: cy, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
      { id: 'right', x: cx + offset, y: cy, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
    ];
  } else {
    // Recentrer la croix si la taille d'écran change
    const cx = width / 2;
    const cy = height / 2;
    const offset = 120;
    for (const nexus of nexusList) {
      if (nexus.id === 'center') {
        nexus.x = cx;
        nexus.y = cy;
      } else if (nexus.id === 'top') {
        nexus.x = cx;
        nexus.y = cy - offset;
      } else if (nexus.id === 'bottom') {
        nexus.x = cx;
        nexus.y = cy + offset;
      } else if (nexus.id === 'left') {
        nexus.x = cx - offset;
        nexus.y = cy;
      } else if (nexus.id === 'right') {
        nexus.x = cx + offset;
        nexus.y = cy;
      }
      nexus.radius = NEXUS_RADIUS;
    }
  }
}

function updateAndRenderNexus(
  ctx: CanvasRenderingContext2D,
  nexus: Nexus,
  touchState: TouchState,
  gameState: string,
  deltaSeconds: number,
  enemyCapturing: boolean
): void {
  const { x, y, radius } = nexus;

  const isTouching =
    touchState.active &&
    Math.hypot(touchState.x - x, touchState.y - y) <= radius + 20 &&
    gameState === 'PLAYING';

  // Mise à jour de la progression de capture côté joueur (tap & hold)
  if (gameState === 'PLAYING') {
    if (isTouching) {
      nexus.state = 'capturing';
      nexus.capturingBy = 'player';
      nexus.captureProgress = Math.min(
        1,
        touchState.duration / NEXUS_CAPTURE_TIME_MS,
      );
      if (nexus.captureProgress >= 1) {
        nexus.owner = 'player';
        nexus.state = 'owned';
        nexus.capturingBy = 'player';
      }
    } else if (nexus.capturingBy === 'player' && nexus.owner === 'neutral') {
      // Le joueur lâche avant la fin : retour à neutre
      nexus.state = 'idle';
      nexus.capturingBy = 'neutral';
      nexus.captureProgress = 0;
    }
  }

  // État "contested" si l'IA essaye de voler un nexus déjà possédé
  const isContested =
    enemyCapturing &&
    nexus.owner === 'player' &&
    gameState === 'PLAYING';
  if (isContested) {
    nexus.state = 'contested';
  } else if (nexus.owner === 'player' && nexus.state !== 'capturing') {
    nexus.state = 'owned';
    nexus.capturingBy = 'player';
  } else if (nexus.owner === 'enemy' && nexus.state !== 'capturing') {
    nexus.state = 'owned';
    nexus.capturingBy = 'enemy';
  }

  // Dessin
  ctx.save();

  // Base : style neutre / joueur / ennemi
  let baseColor = COLORS.neutral;
  if (nexus.owner === 'player') baseColor = COLORS.player;
  if (nexus.owner === 'enemy') baseColor = COLORS.enemy;

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, radius - 6, 0, Math.PI * 2);
  ctx.stroke();

  // Arc de progression pendant la capture (joueur)
  if (nexus.state === 'capturing' && nexus.capturingBy === 'player') {
    const progress = nexus.captureProgress;
    const color = COLORS.player;
    drawProgressArc(ctx, x, y, progress, radius + 10, color);
  }

  // Remplissage progressif une fois capturé
  if (nexus.owner === 'player') {
    ctx.fillStyle = `${COLORS.player}CC`;
    ctx.beginPath();
    ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (nexus.owner === 'enemy') {
    ctx.fillStyle = `${COLORS.enemy}CC`;
    ctx.beginPath();
    ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Indication visuelle de contestation : anneau externe rouge terre-cuite
  if (isContested) {
    ctx.strokeStyle = COLORS.enemy;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Annotation coordonnées
  const gridX = Math.floor(x / 40);
  const gridY = Math.floor(y / 40);
  let label = 'TARGET';
  if (nexus.owner === 'player') label = 'CAPTURED';
  if (nexus.owner === 'enemy') label = 'ENEMY';
  if (isContested) label = 'CONTESTED';
  drawCoordinatesWithLabel(ctx, x, y, gridX, gridY, label);

  ctx.restore();
}

function render(timestamp: number): void {
  if (!canvasContext) return;

  const { ctx, width, height } = canvasContext;

  // Delta temps (pour le score 1 pt/seconde)
  let deltaSeconds = 0;
  if (lastRenderTimestamp !== null) {
    deltaSeconds = (timestamp - lastRenderTimestamp) / 1000;
  }
  lastRenderTimestamp = timestamp;

  // Update FPS
  updateFPS(timestamp);

  // Update touch state
  const touchState = updateTouchState();

  // Update debug state
  debugState.inputLatency = getInputLatency();
  debugState.pressTime = touchState.duration;
  debugState.detectedUnit = touchState.detectedUnit;
  debugState.state = touchState.active ? 'PRESSING' : 'IDLE';

  // Clear and draw background
  clearCanvas(ctx, width, height);

  // Draw grid
  drawGrid(ctx, width, height);
  ensureNexusLayout(width, height);

  const gameState = getGameState();

  // Mise à jour de l'IA ennemie (Sprint 3)
  if (gameState !== 'PLAYING') {
    enemyAgent.targetId = null;
    enemyAgent.timeOnTarget = 0;
    enemyAgent.cooldownTimer = enemyAgent.cooldown;
  } else {
    // Choix de cible si nécessaire
    if (!enemyAgent.targetId) {
      enemyAgent.cooldownTimer -= deltaSeconds;
      if (enemyAgent.cooldownTimer <= 0) {
        const neutralOrPlayer = nexusList.filter(
          (n) => n.owner === 'neutral' || n.owner === 'player',
        );
        if (neutralOrPlayer.length > 0) {
          const idx = Math.floor(Math.random() * neutralOrPlayer.length);
          enemyAgent.targetId = neutralOrPlayer[idx].id;
          enemyAgent.timeOnTarget = 0;
        } else {
          enemyAgent.cooldownTimer = enemyAgent.cooldown;
        }
      }
    } else {
      const target = nexusList.find((n) => n.id === enemyAgent.targetId);
      if (!target) {
        enemyAgent.targetId = null;
        enemyAgent.timeOnTarget = 0;
        enemyAgent.cooldownTimer = enemyAgent.cooldown;
      } else {
        enemyAgent.timeOnTarget += deltaSeconds;
        if (enemyAgent.timeOnTarget >= enemyAgent.captureDuration) {
          target.owner = 'enemy';
          target.state = 'owned';
          target.capturingBy = 'enemy';
          target.captureProgress = 1;
          enemyAgent.targetId = null;
          enemyAgent.timeOnTarget = 0;
          enemyAgent.cooldownTimer = enemyAgent.cooldown;
        }
      }
    }
  }

  // NEXUS (Sprint 1-2) : mise à jour + rendu + score par nombre de nexus capturés
  let ownedCount = 0;
  for (const nexus of nexusList) {
    const enemyCapturing = enemyAgent.targetId === nexus.id && gameState === 'PLAYING';
    updateAndRenderNexus(ctx, nexus, touchState, gameState, deltaSeconds, enemyCapturing);
    if (nexus.owner === 'player') {
      ownedCount += 1;
    }
  }

  // Score = +1 point/seconde par nexus possédé
  if (gameState === 'PLAYING' && deltaSeconds > 0 && ownedCount > 0) {
    addNexusPoints(deltaSeconds * ownedCount);
  }

  // Draw released animations
  renderReleasedAnimations(ctx, timestamp);

  // Draw active touch
  renderActiveTouch(ctx, touchState);

  // Update debug overlay
  updateDebugOverlay(touchState);

  // HUD Score (Sprint 1)
  const scoreHud = document.getElementById('score-hud');
  if (scoreHud) {
    const total = Math.round(getScore().nexusPoints || 0);
    scoreHud.textContent = total.toString().padStart(3, '0');
  }

  // Continue loop
  animationFrameId = requestAnimationFrame(render);
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Start the render engine
 */
export function startEngine(context: CanvasContext): void {
  canvasContext = context;
  debugState.lastFpsUpdate = performance.now();
  animationFrameId = requestAnimationFrame(render);
}

/**
 * Stop the render engine
 */
export function stopEngine(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Add a released animation (called when touch ends)
 */
export function addReleasedAnimation(x: number, y: number, unitType: UnitType): void {
  if (unitType === 'none') return;

  releasedAnimations.push({
    x,
    y,
    unitType,
    startTime: performance.now(),
    duration: RELEASE_ANIMATION_DURATION,
  });
}

/**
 * Get current debug state
 */
export function getDebugState(): DebugState {
  return { ...debugState };
}
