/**
 * Touch Input Handler
 * Detects hold duration to determine unit type:
 * - Scout: < 300ms (tap)
 * - Defender: 300ms - 1500ms (hold)
 * - Attacker: > 1500ms (long hold)
 */

import { TouchState, UnitType, InputLatency, TIMING } from '../types';

// =============================================================================
// STATE
// =============================================================================

const touchState: TouchState = {
  active: false,
  startTime: 0,
  currentTime: 0,
  duration: 0,
  x: 0,
  y: 0,
  detectedUnit: 'none',
};

const latencyTracker: InputLatency = {
  lastEventTime: 0,
  lastProcessTime: 0,
  latency: 0,
};

type TouchCallback = (state: TouchState) => void;

let onTouchStartCallback: TouchCallback | null = null;
let onTouchMoveCallback: TouchCallback | null = null;
let onTouchEndCallback: TouchCallback | null = null;
let onUnitChangeCallback: ((unit: UnitType, duration: number) => void) | null = null;

// =============================================================================
// UNIT DETECTION
// =============================================================================

/**
 * Determine unit type based on hold duration
 */
export function getUnitFromDuration(durationMs: number): UnitType {
  if (durationMs < TIMING.SCOUT_MAX) {
    return 'scout';
  } else if (durationMs < TIMING.DEFENDER_MAX) {
    return 'defender';
  } else {
    return 'attacker';
  }
}

/**
 * Get progress within current unit threshold (0-1)
 */
export function getUnitProgress(durationMs: number): number {
  if (durationMs < TIMING.SCOUT_MAX) {
    // Scout: 0-300ms maps to 0-1
    return durationMs / TIMING.SCOUT_MAX;
  } else if (durationMs < TIMING.DEFENDER_MAX) {
    // Defender: 300-1500ms maps to 0-1
    return (durationMs - TIMING.SCOUT_MAX) / (TIMING.DEFENDER_MAX - TIMING.SCOUT_MAX);
  } else {
    // Attacker: beyond 1500ms, cap at 1
    const attackerDuration = durationMs - TIMING.DEFENDER_MAX;
    return Math.min(1, attackerDuration / 500);  // 500ms to full attacker
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

function handleTouchStart(e: TouchEvent | MouseEvent): void {
  e.preventDefault();

  const now = performance.now();
  latencyTracker.lastEventTime = e.timeStamp;
  latencyTracker.lastProcessTime = now;
  latencyTracker.latency = now - e.timeStamp;

  // Get coordinates
  let x: number, y: number;
  if ('touches' in e) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  touchState.active = true;
  touchState.startTime = now;
  touchState.currentTime = now;
  touchState.duration = 0;
  touchState.x = x;
  touchState.y = y;
  touchState.detectedUnit = 'scout';

  onTouchStartCallback?.(touchState);
}

function handleTouchMove(e: TouchEvent | MouseEvent): void {
  if (!touchState.active) return;
  e.preventDefault();

  // Get coordinates
  let x: number, y: number;
  if ('touches' in e) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  touchState.x = x;
  touchState.y = y;

  onTouchMoveCallback?.(touchState);
}

function handleTouchEnd(e: TouchEvent | MouseEvent): void {
  if (!touchState.active) return;
  e.preventDefault();

  const now = performance.now();
  latencyTracker.lastProcessTime = now;
  latencyTracker.latency = now - e.timeStamp;

  touchState.active = false;
  touchState.currentTime = now;
  touchState.duration = now - touchState.startTime;
  touchState.detectedUnit = getUnitFromDuration(touchState.duration);

  onTouchEndCallback?.(touchState);
}

// =============================================================================
// UPDATE LOOP
// =============================================================================

/**
 * Update touch state - call this in game loop
 * Returns current state for debug display
 */
export function updateTouchState(): TouchState {
  if (touchState.active) {
    const now = performance.now();
    touchState.currentTime = now;
    touchState.duration = now - touchState.startTime;

    const newUnit = getUnitFromDuration(touchState.duration);
    if (newUnit !== touchState.detectedUnit) {
      touchState.detectedUnit = newUnit;
      onUnitChangeCallback?.(newUnit, touchState.duration);
    }
  }

  return { ...touchState };
}

/**
 * Get current input latency
 */
export function getInputLatency(): number {
  return latencyTracker.latency;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Initialize touch handling on an element
 */
export function initTouchInput(element: HTMLElement): void {
  // Touch events
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: false });
  element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  // Mouse events (for desktop testing)
  element.addEventListener('mousedown', handleTouchStart);
  element.addEventListener('mousemove', handleTouchMove);
  element.addEventListener('mouseup', handleTouchEnd);
  element.addEventListener('mouseleave', handleTouchEnd);
}

/**
 * Set callback for touch start
 */
export function onTouchStart(callback: TouchCallback): void {
  onTouchStartCallback = callback;
}

/**
 * Set callback for touch move
 */
export function onTouchMove(callback: TouchCallback): void {
  onTouchMoveCallback = callback;
}

/**
 * Set callback for touch end
 */
export function onTouchEnd(callback: TouchCallback): void {
  onTouchEndCallback = callback;
}

/**
 * Set callback for unit type change during hold
 */
export function onUnitChange(callback: (unit: UnitType, duration: number) => void): void {
  onUnitChangeCallback = callback;
}

/**
 * Get current touch state (read-only copy)
 */
export function getTouchState(): TouchState {
  return { ...touchState };
}

/**
 * Check if currently touching
 */
export function isActive(): boolean {
  return touchState.active;
}
