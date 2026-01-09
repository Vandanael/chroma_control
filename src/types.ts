/**
 * Chroma Control - Type Definitions
 * Bio-Digital Edition
 */

// =============================================================================
// UNIT TYPES
// =============================================================================

export type UnitType = 'scout' | 'defender' | 'attacker' | 'none';

export interface UnitThresholds {
  scout: number;      // < 300ms
  defender: number;   // 300ms - 1500ms
  attacker: number;   // > 1500ms
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface TouchState {
  active: boolean;
  startTime: number;
  currentTime: number;
  duration: number;
  x: number;
  y: number;
  detectedUnit: UnitType;
}

export interface InputLatency {
  lastEventTime: number;
  lastProcessTime: number;
  latency: number;
}

// =============================================================================
// RENDER TYPES
// =============================================================================

export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;  // Device Pixel Ratio for Retina
}

// =============================================================================
// DEBUG TYPES
// =============================================================================

export interface DebugState {
  fps: number;
  frameCount: number;
  lastFpsUpdate: number;
  pressTime: number;
  detectedUnit: UnitType;
  inputLatency: number;
  state: 'IDLE' | 'PRESSING' | 'RELEASED';
}

// =============================================================================
// TIMING CONSTANTS
// =============================================================================

export const TIMING = {
  // Unit detection thresholds (ms)
  SCOUT_MAX: 300,
  DEFENDER_MAX: 1500,

  // Animation durations (ms)
  PLOTTER_DRAW: 400,
  FADE_OUT: 300,

  // Game loop
  TARGET_FPS: 60,
  FRAME_TIME: 1000 / 60,
} as const;
