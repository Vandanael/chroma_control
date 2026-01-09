/**
 * Chroma Control - Type Definitions
 * Sprint 0: Core types for game feel validation
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

export interface DrawCommand {
  type: 'point' | 'circle' | 'cross' | 'arc';
  x: number;
  y: number;
  progress: number;  // 0-1 for animation
  color: string;
  size: number;
  label?: string;
}

// =============================================================================
// ANIMATION TYPES
// =============================================================================

export interface PlotterAnimation {
  commands: DrawCommand[];
  startTime: number;
  duration: number;
  complete: boolean;
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
// NEXUS TYPES (à partir du Sprint 1)
// =============================================================================

export type NexusOwner = 'neutral' | 'player' | 'enemy';
export type NexusState = 'idle' | 'capturing' | 'owned' | 'contested';

export interface Nexus {
  id: string;
  x: number;
  y: number;
  radius: number;
  owner: NexusOwner;
  state: NexusState;
  /**
   * Qui est en train de capturer (player/enemy).
   */
  capturingBy: NexusOwner;
  /**
   * Progression de capture 0-1 (3 secondes pour capture complète).
   */
  captureProgress: number;
}

// =============================================================================
// LIENS (Sprint 4+)
// =============================================================================

export interface NexusLink {
  id: string;
  fromId: string;
  toId: string;
  owner: NexusOwner;
  /**
   * Timestamp de création (ms, via performance.now()) pour l’animation “plotter”.
   */
  createdAt: number;
  /**
   * Durée de l’animation de tracé (ms).
   */
  animationDuration: number;
}

// =============================================================================
// COLOR PALETTE - Pastel NASA-Punk
// =============================================================================

export const COLORS = {
  // Background
  paper: '#F5F2E8',
  paperAlt: '#E8EDF2',

  // Game elements
  player: '#7BA3C9',
  enemy: '#C98B7B',
  neutral: '#9A9590',

  // UI & Lines
  ink: '#5C4A3D',
  grid: '#D5D0C8',
  annotation: '#4A6B8A',

  // Unit feedback colors
  scout: '#7BA3C9',
  defender: '#4A6B8A',
  attacker: '#C98B7B',
} as const;

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
