/**
 * Render Engine - Game Loop & Debug Overlay
 * Voronoi organic system (Blocs 0.2 + 1.1)
 */

import { CanvasContext, DebugState, TouchState } from '../types';
import { clearCanvas, applyGrain } from './canvas';
import { updateTouchState, getInputLatency } from '../input/touch';
import { initVoronoiGrid, updateCellAnimations, getDiagram } from '../game/voronoiManager';
import { renderVoronoiCells } from './voronoiRenderer';

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

let lastRenderTimestamp: number | null = null;
let animationFrameId: number | null = null;
let canvasContext: CanvasContext | null = null;

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

  // Delta time
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

  // Clear canvas with paper background
  clearCanvas(ctx, width, height);

  // Apply paper grain texture (Bloc 0.2)
  applyGrain(ctx, width, height, 0.03);

  // Initialize Voronoi grid if needed (Bloc 1.1 - Sprint 1)
  if (!getDiagram()) {
    initVoronoiGrid(width, height, 25);
  }

  // Update Voronoi cell animations
  const deltaMs = deltaSeconds * 1000;
  updateCellAnimations(deltaMs);

  // Render Voronoi cells
  renderVoronoiCells(ctx, width, height);

  // Update debug overlay
  updateDebugOverlay(touchState);

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
