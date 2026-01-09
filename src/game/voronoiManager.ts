/**
 * Voronoi Grid Manager
 * Manages the organic territory system with Voronoi cells
 * Replaces the old fixed grid system
 */

import { VoronoiDiagram, VoronoiCell, generateVoronoi, generateSeeds } from '../utils/voronoi';
import { Point, pointInPolygon } from '../utils/math';

// =============================================================================
// TYPES
// =============================================================================

export interface CellState {
  id: string;
  owner: 'neutral' | 'player' | 'enemy';
  signalStrength: number; // 0-100
  reinforced: boolean;
  contestedBy: 'player' | 'enemy' | null;
}

// =============================================================================
// STATE
// =============================================================================

let diagram: VoronoiDiagram | null = null;
let cellStates: Map<string, CellState> = new Map();

// Animation state for initial drawing
let cellAnimations: Map<string, number> = new Map(); // cellId -> progress (0-1)
const CELL_ANIMATION_DURATION = 1200; // ms
const CELL_ANIMATION_STAGGER = 60; // ms between each cell start

// =============================================================================
// INITIALIZATION (Bloc 1.1)
// =============================================================================

/**
 * Initialize the Voronoi grid with cells covering the entire canvas
 */
export function initVoronoiGrid(width: number, height: number, cellCount: number = 25): void {
  // Generate seed points - 25 sites bien répartis
  const seeds = generateSeeds(cellCount, width, height, 60);
  
  // Generate Voronoi diagram
  diagram = generateVoronoi(seeds, width, height);
  
  // Initialize cell states
  cellStates.clear();
  cellAnimations.clear();
  
  diagram.cells.forEach((cell, index) => {
    cellStates.set(cell.id, {
      id: cell.id,
      owner: 'neutral',
      signalStrength: 0,
      reinforced: false,
      contestedBy: null,
    });
    
    // Stagger animation start times
    cellAnimations.set(cell.id, -index * CELL_ANIMATION_STAGGER);
  });
}

/**
 * Update cell animations (called each frame)
 */
export function updateCellAnimations(deltaMs: number): void {
  cellAnimations.forEach((progress, cellId) => {
    if (progress < 1) {
      const newProgress = progress + (deltaMs / CELL_ANIMATION_DURATION);
      cellAnimations.set(cellId, Math.min(1, newProgress));
    }
  });
}

/**
 * Get animation progress for a cell (0-1)
 */
export function getCellAnimationProgress(cellId: string): number {
  const progress = cellAnimations.get(cellId) ?? 1;
  return Math.max(0, progress);
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get the current Voronoi diagram
 */
export function getDiagram(): VoronoiDiagram | null {
  return diagram;
}

/**
 * Get all cells
 */
export function getCells(): VoronoiCell[] {
  return diagram?.cells ?? [];
}

/**
 * Get state for a specific cell
 */
export function getCellState(cellId: string): CellState | undefined {
  return cellStates.get(cellId);
}

/**
 * Find which cell contains a point
 */
export function findCellAtPoint(point: Point): VoronoiCell | null {
  if (!diagram) return null;
  
  for (const cell of diagram.cells) {
    if (pointInPolygon(point, cell.polygon)) {
      return cell;
    }
  }
  
  return null;
}

// =============================================================================
// MUTATIONS (Sprint 2+)
// =============================================================================

/**
 * Update cell owner and signal strength
 */
export function setCellOwner(cellId: string, owner: 'neutral' | 'player' | 'enemy', signalStrength: number = 50): void {
  const state = cellStates.get(cellId);
  if (state) {
    state.owner = owner;
    state.signalStrength = signalStrength;
    state.contestedBy = null;
  }
}

/**
 * Mark a cell as reinforced (Deep Click - Sprint 4)
 */
export function reinforceCell(cellId: string): void {
  const state = cellStates.get(cellId);
  if (state && state.owner !== 'neutral') {
    state.reinforced = true;
    state.signalStrength = Math.min(100, state.signalStrength + 30);
  }
}
