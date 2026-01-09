/**
 * Render Engine - Game Loop & Debug Overlay
 * MACRO GRID System - 25x16 Tactical Grid
 */

import { CanvasContext, DebugState, TouchState, COLORS } from '../types';
import { clearCanvas, applyGrain } from './canvas';
import { updateTouchState, getInputLatency } from '../input/touch';
import { initGrid, getCells, getCellAtPosition, getCellsByOwner } from '../game/gridManager';
import { renderGrid } from './gridRenderer';
import { updateDeployments } from '../game/outpostDeployment';
import { renderDeployments } from './deploymentRenderer';
import { 
  regenEnergy, 
  getEnergy, 
  updateTimer, 
  getTimer, 
  updateTerritoryScore, 
  checkVictoryConditions,
  getScore,
  getGameState
} from '../game/state';
import { updateDeepClick, getDeepClickProgress } from '../input/gridInput';
import { renderLowPowerFeedback } from './lowPowerFeedback';
import { updateAI } from '../game/ai';
import { updateTerritoryIntegrity } from '../game/territoryIntegrity';

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

let animationFrameId: number | null = null;
let canvasContext: CanvasContext | null = null;
let lastTimestamp: number = 0;

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
// DEBUG OVERLAY
// =============================================================================

function updateDebugOverlay(touchState: TouchState): void {
  // FPS
  const fpsEl = document.getElementById('debug-fps');
  if (fpsEl) {
    fpsEl.textContent = debugState.fps.toFixed(1);
    fpsEl.style.color = debugState.fps >= 55 ? '#4A6B8A' : '#C98B7B';
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
    latencyEl.style.color = debugState.inputLatency < 16 ? '#4A6B8A' : '#C98B7B';
  }

  // State
  const stateEl = document.getElementById('debug-state');
  if (stateEl) {
    stateEl.textContent = debugState.state;
    stateEl.style.color = debugState.state === 'PRESSING' ? '#C98B7B' : '#4A6B8A';
  }
}

// =============================================================================
// MAIN RENDER LOOP
// =============================================================================

function render(timestamp: number): void {
  if (!canvasContext) return;

  const { ctx, width, height } = canvasContext;

  // Calculate delta time
  const deltaSeconds = lastTimestamp > 0 ? (timestamp - lastTimestamp) / 1000 : 0;
  lastTimestamp = timestamp;

  // Update FPS
  updateFPS(timestamp);

  // Only update game logic if PLAYING
  const gameState = getGameState();
  const isPlaying = gameState === 'PLAYING';

  if (isPlaying && deltaSeconds > 0 && deltaSeconds < 0.1) {
    // Regenerate energy (Bloc 4.1)
    regenEnergy(deltaSeconds);

    // Update timer (Bloc 5.3)
    updateTimer(timestamp);

    // Update territory integrity (Bloc 2.4)
    updateTerritoryIntegrity(deltaSeconds);

    // Update territory score (Bloc 5.4)
    const playerCells = getCellsByOwner('player');
    const enemyCells = getCellsByOwner('enemy');
    updateTerritoryScore(playerCells.length, enemyCells.length, deltaSeconds);

    // Check victory conditions (Bloc 5.3)
    checkVictoryConditions();
  }

  // Update touch state
  const touchState = updateTouchState();

  // Update debug state
  debugState.inputLatency = getInputLatency();
  debugState.pressTime = touchState.duration;
  debugState.detectedUnit = touchState.detectedUnit;
  debugState.state = touchState.active ? 'PRESSING' : 'IDLE';

  // Clear canvas with paper background
  clearCanvas(ctx, width, height);

  // Apply paper grain texture (Bloc 0.2)
  applyGrain(ctx, width, height, 0.03);

  // Initialize 25x16 grid if needed
  const cells = getCells();
  if (cells.length === 0) {
    initGrid(width, height);
  }

  // Update deployments (Bloc 2.2)
  updateDeployments();

  // Update AI (Bloc 5.2)
  if (isPlaying) {
    updateAI();
  }

  // Update deep click state (Bloc 4.2)
  const deepClickState = updateDeepClick();

  // Render tactical grid (400 cells)
  renderGrid(ctx);

  // Render active deployments (Bloc 2.2)
  renderDeployments(ctx);

  // Render HUDs
  renderEnergyHUD(ctx, width, height);      // Bloc 4.1
  renderTimerHUD(ctx, width, height);       // Bloc 5.3
  renderScoreHUD(ctx, width, height);       // Bloc 5.4

  // Render deep click indicator (Bloc 4.2)
  if (deepClickState.active) {
    renderDeepClickIndicator(ctx, deepClickState);
  }

  // Render LOW POWER feedback (Bloc 4.4)
  renderLowPowerFeedback(ctx, width, height);

  // Update debug overlay
  updateDebugOverlay(touchState);

  // Continue loop
  animationFrameId = requestAnimationFrame(render);
}

// =============================================================================
// ENERGY HUD (Bloc 4.1)
// =============================================================================

function renderEnergyHUD(ctx: CanvasRenderingContext2D, _width: number, height: number): void {
  const energy = getEnergy();
  const percentage = (energy.current / energy.max) * 100;

  // Position en bas à gauche
  const x = 20;
  const y = height - 30;

  // Texte
  ctx.save();
  ctx.font = '16px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#4A6B8A'; // Bleu technique
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  const energyText = `⚡ ${Math.floor(energy.current)} / ${energy.max}`;
  ctx.fillText(energyText, x, y);

  // Barre d'énergie
  const barWidth = 150;
  const barHeight = 8;
  const barX = x + 120;
  const barY = y - barHeight / 2;

  // Fond de la barre
  ctx.fillStyle = '#D5D0C8';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Remplissage de la barre
  const fillWidth = (barWidth * percentage) / 100;
  ctx.fillStyle = energy.current < 20 ? '#C98B7B' : '#7BA3C9'; // Rouge si < 20, bleu sinon
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  // Bordure
  ctx.strokeStyle = '#5C4A3D';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  ctx.restore();
}

// =============================================================================
// DEEP CLICK INDICATOR (Bloc 4.2)
// =============================================================================

function renderDeepClickIndicator(ctx: CanvasRenderingContext2D, deepClickState: any): void {
  const cell = getCellAtPosition(deepClickState.startX, deepClickState.startY);
  if (!cell) return;

  const progress = getDeepClickProgress();
  const centerX = cell.x + cell.size / 2;
  const centerY = cell.y + cell.size / 2;
  const radius = cell.size / 2 - 4;

  ctx.save();

  // Cercle de fond
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Arc de progression
  ctx.strokeStyle = progress >= 1 ? COLORS.player : COLORS.annotation;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();

  // Texte central
  if (progress < 1) {
    ctx.fillStyle = COLORS.annotation;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 1;
    ctx.fillText('HOLD', centerX, centerY);
  }

  ctx.restore();
}

// =============================================================================
// TIMER HUD (Bloc 5.3)
// =============================================================================

function renderTimerHUD(ctx: CanvasRenderingContext2D, width: number, _height: number): void {
  const timer = getTimer();
  const minutes = timer.minutes.toString().padStart(2, '0');
  const seconds = timer.seconds.toString().padStart(2, '0');

  // Position en haut au centre
  const x = width / 2;
  const y = 30;

  ctx.save();
  ctx.font = '20px "IBM Plex Mono", monospace';
  ctx.fillStyle = timer.remaining < 60 ? COLORS.enemy : COLORS.annotation;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${minutes}:${seconds}`, x, y);
  ctx.restore();
}

// =============================================================================
// SCORE HUD (Bloc 5.4)
// =============================================================================

function renderScoreHUD(ctx: CanvasRenderingContext2D, width: number, _height: number): void {
  const score = getScore();

  // Position en haut à droite
  const x = width - 20;
  const y = 30;

  ctx.save();
  ctx.font = '16px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Score joueur
  ctx.fillStyle = COLORS.player;
  ctx.fillText(`YOU: ${Math.floor(score.territoryScore)}`, x, y - 15);

  // Score ennemi
  ctx.fillStyle = COLORS.enemy;
  ctx.fillText(`AI: ${Math.floor(score.enemyScore)}`, x, y + 10);

  ctx.restore();
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
