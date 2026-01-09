/**
 * Spatial Grid - Optimisation O(1) pour requêtes de proximité
 * Grille spatiale pour réduire la complexité de l'auto-mesh de O(n²) à O(n)
 */

import { type GameNode } from './nodeManager';

// =============================================================================
// CONSTANTS
// =============================================================================

const GRID_CELL_SIZE = 200; // Taille d'une cellule (doit être >= AUTO_MESH_RANGE)

// =============================================================================
// TYPES
// =============================================================================

type GridKey = string; // Format: "x,y"

interface SpatialGrid {
  cells: Map<GridKey, GameNode[]>;
  cellSize: number;
}

// =============================================================================
// STATE
// =============================================================================

let spatialGrid: SpatialGrid = {
  cells: new Map(),
  cellSize: GRID_CELL_SIZE,
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Convertit une position (x, y) en clé de cellule
 */
function getGridKey(x: number, y: number): GridKey {
  const cellX = Math.floor(x / GRID_CELL_SIZE);
  const cellY = Math.floor(y / GRID_CELL_SIZE);
  return `${cellX},${cellY}`;
}

/**
 * Récupère toutes les cellules voisines (9 cellules : centre + 8 autour)
 */
function getNeighborCells(x: number, y: number): GridKey[] {
  const centerX = Math.floor(x / GRID_CELL_SIZE);
  const centerY = Math.floor(y / GRID_CELL_SIZE);
  
  const keys: GridKey[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      keys.push(`${centerX + dx},${centerY + dy}`);
    }
  }
  
  return keys;
}

// =============================================================================
// API
// =============================================================================

/**
 * Initialise la grille spatiale
 */
export function initSpatialGrid(): void {
  spatialGrid.cells.clear();
  console.log('[SpatialGrid] Initialized');
}

/**
 * Ajoute un nœud à la grille spatiale
 */
export function addNodeToGrid(node: GameNode): void {
  const key = getGridKey(node.x, node.y);
  
  if (!spatialGrid.cells.has(key)) {
    spatialGrid.cells.set(key, []);
  }
  
  const cell = spatialGrid.cells.get(key)!;
  if (!cell.includes(node)) {
    cell.push(node);
  }
}

/**
 * Retire un nœud de la grille spatiale
 */
export function removeNodeFromGrid(node: GameNode): void {
  const key = getGridKey(node.x, node.y);
  const cell = spatialGrid.cells.get(key);
  
  if (cell) {
    const index = cell.indexOf(node);
    if (index !== -1) {
      cell.splice(index, 1);
    }
    
    // Nettoyer les cellules vides (optionnel, pour économiser mémoire)
    if (cell.length === 0) {
      spatialGrid.cells.delete(key);
    }
  }
}

/**
 * Met à jour la position d'un nœud dans la grille
 * (si le nœud a bougé, le déplacer vers la bonne cellule)
 */
export function updateNodeInGrid(node: GameNode, oldX: number, oldY: number): void {
  const oldKey = getGridKey(oldX, oldY);
  const newKey = getGridKey(node.x, node.y);
  
  if (oldKey === newKey) {
    return; // Même cellule, pas besoin de déplacer
  }
  
  // Retirer de l'ancienne cellule
  const oldCell = spatialGrid.cells.get(oldKey);
  if (oldCell) {
    const index = oldCell.indexOf(node);
    if (index !== -1) {
      oldCell.splice(index, 1);
    }
    if (oldCell.length === 0) {
      spatialGrid.cells.delete(oldKey);
    }
  }
  
  // Ajouter à la nouvelle cellule
  addNodeToGrid(node);
}

/**
 * Récupère tous les nœuds dans un rayon donné (optimisé avec grille spatiale)
 * Complexité : O(k) où k est le nombre de nœuds dans les cellules voisines
 */
export function getNodesInRadius(
  x: number,
  y: number,
  radius: number,
  owner?: 'player' | 'enemy'
): GameNode[] {
  const neighborKeys = getNeighborCells(x, y);
  const candidates: GameNode[] = [];
  const radiusSquared = radius * radius;
  
  // Parcourir les 9 cellules voisines
  for (const key of neighborKeys) {
    const cell = spatialGrid.cells.get(key);
    if (!cell) continue;
    
    for (const node of cell) {
      // Filtrer par propriétaire si spécifié
      if (owner && node.owner !== owner) continue;
      
      // Vérifier la distance (éviter sqrt avec distance²)
      const dx = node.x - x;
      const dy = node.y - y;
      const distSquared = dx * dx + dy * dy;
      
      if (distSquared <= radiusSquared) {
        candidates.push(node);
      }
    }
  }
  
  return candidates;
}

/**
 * Réinitialise complètement la grille (pour reset du jeu)
 */
export function clearSpatialGrid(): void {
  spatialGrid.cells.clear();
  console.log('[SpatialGrid] Cleared');
}
