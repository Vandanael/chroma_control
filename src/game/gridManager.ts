/**
 * Grid Manager - 25x16 Tactical Grid (400 cells)
 * MACRO GRID System - High Density
 */

// =============================================================================
// TYPES
// =============================================================================

export type CellOwner = 'neutral' | 'player' | 'enemy';

export interface GridCell {
  col: number;      // 0-24
  row: number;      // 0-15
  x: number;        // Screen position (top-left corner)
  y: number;        // Screen position (top-left corner)
  size: number;     // Cell size (square)
  owner: CellOwner;
  isHQ: boolean;    // Headquarters flag
  isOutpost: boolean; // Avant-Poste flag
  isFortified: boolean; // Fortified flag
  signalStrength: number; // 0-100
  isConnected: boolean; // Connecté au HQ via flood fill
  creationTime?: number; // Timestamp de création pour animation spring (ms)
}

// =============================================================================
// STATE
// =============================================================================

const COLS = 25;
const ROWS = 16;
const PADDING = 1; // px between cells

let cells: GridCell[] = [];
let cellSize = 0;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the 25x16 grid, fitting to canvas dimensions
 */
export function initGrid(canvasWidth: number, canvasHeight: number): void {
  cells = [];

  // Calculate cell size to fit canvas with padding
  const availableWidth = canvasWidth - (COLS + 1) * PADDING;
  const availableHeight = canvasHeight - (ROWS + 1) * PADDING;
  
  const cellWidthFit = availableWidth / COLS;
  const cellHeightFit = availableHeight / ROWS;
  
  // Use smallest dimension to ensure all cells fit
  cellSize = Math.floor(Math.min(cellWidthFit, cellHeightFit));

  // Calculate offset to center grid
  const totalGridWidth = COLS * cellSize + (COLS + 1) * PADDING;
  const totalGridHeight = ROWS * cellSize + (ROWS + 1) * PADDING;
  const offsetX = (canvasWidth - totalGridWidth) / 2;
  const offsetY = (canvasHeight - totalGridHeight) / 2;

  // Generate all 400 cells
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = offsetX + PADDING + col * (cellSize + PADDING);
      const y = offsetY + PADDING + row * (cellSize + PADDING);
      
      // HQ is at bottom center: col 12, row 15
      const isHQ = (col === 12 && row === 15);
      
      cells.push({
        col,
        row,
        x,
        y,
        size: cellSize,
        owner: isHQ ? 'player' : 'neutral',
        isHQ,
        isOutpost: false,
        isFortified: false,
        signalStrength: isHQ ? 100 : 0,
        isConnected: isHQ, // HQ toujours connecté au départ
      });
    }
  }

  console.log(`[GridManager] Initialized ${cells.length} cells (${COLS}x${ROWS})`);
  console.log(`[GridManager] Cell size: ${cellSize}px, Padding: ${PADDING}px`);
}

/**
 * Reset the grid (clear all cells - will be reinitialized automatically)
 */
export function resetGrid(): void {
  cells = [];
  console.log('[GridManager] Grid reset');
}

// =============================================================================
// ACCESSORS
// =============================================================================

/**
 * Get all cells
 */
export function getCells(): GridCell[] {
  return cells;
}

/**
 * Get cell at specific column/row
 */
export function getCellAt(col: number, row: number): GridCell | null {
  return cells.find(c => c.col === col && c.row === row) || null;
}

/**
 * Get cell at screen position
 */
export function getCellAtPosition(x: number, y: number): GridCell | null {
  return cells.find(c => 
    x >= c.x && x <= c.x + c.size &&
    y >= c.y && y <= c.y + c.size
  ) || null;
}

/**
 * Update cell owner
 */
export function setCellOwner(col: number, row: number, owner: CellOwner): void {
  const cell = getCellAt(col, row);
  if (cell) {
    cell.owner = owner;
  }
}

/**
 * Capture a cell and mark it as outpost
 */
export function captureAsOutpost(col: number, row: number, owner: CellOwner): void {
  const cell = getCellAt(col, row);
  if (cell) {
    cell.owner = owner;
    cell.isOutpost = true;
    cell.signalStrength = 100;
    cell.creationTime = performance.now(); // Pour animation spring
  }
}

/**
 * Fortify a cell
 */
export function fortifyCell(col: number, row: number): boolean {
  const cell = getCellAt(col, row);
  if (cell && cell.owner === 'player' && !cell.isFortified) {
    cell.isFortified = true;
    console.log(`[GridManager] Cell (${col}, ${row}) fortified`);
    return true;
  }
  return false;
}

/**
 * Unfortify a cell
 */
export function unfortifyCell(col: number, row: number): void {
  const cell = getCellAt(col, row);
  if (cell) {
    cell.isFortified = false;
  }
}

/**
 * Get all fortified cells
 */
export function getFortifiedCells(): GridCell[] {
  return cells.filter(c => c.isFortified);
}

/**
 * Get all cells owned by a specific owner
 */
export function getCellsByOwner(owner: CellOwner): GridCell[] {
  return cells.filter(c => c.owner === owner);
}

/**
 * Get the 4 orthogonal neighbors (cross pattern)
 */
export function getCrossNeighbors(col: number, row: number): GridCell[] {
  const neighbors: GridCell[] = [];
  
  // Haut
  const top = getCellAt(col, row - 1);
  if (top) neighbors.push(top);
  
  // Bas
  const bottom = getCellAt(col, row + 1);
  if (bottom) neighbors.push(bottom);
  
  // Gauche
  const left = getCellAt(col - 1, row);
  if (left) neighbors.push(left);
  
  // Droite
  const right = getCellAt(col + 1, row);
  if (right) neighbors.push(right);
  
  return neighbors;
}

/**
 * Capture cross neighbors (expansion phase)
 */
export function captureCrossNeighbors(col: number, row: number, owner: CellOwner): GridCell[] {
  const neighbors = getCrossNeighbors(col, row);
  const captured: GridCell[] = [];
  const now = performance.now();
  
  for (const neighbor of neighbors) {
    if (neighbor.owner !== owner) {
      neighbor.owner = owner;
      neighbor.isOutpost = false; // Les voisins capturés ne sont pas des avant-postes
      neighbor.signalStrength = 100;
      neighbor.creationTime = now; // Pour animation spring
      captured.push(neighbor);
    }
  }
  
  console.log(`[GridManager] Captured ${captured.length} cross neighbors at (${col}, ${row})`);
  return captured;
}

/**
 * Attack/Sabotage an enemy cell (converts it to neutral)
 */
export function attackEnemyCell(col: number, row: number): boolean {
  const cell = getCellAt(col, row);
  if (cell && cell.owner === 'enemy') {
    // Convertir la cellule ennemie en neutre (sabotage)
    cell.owner = 'neutral';
    cell.isOutpost = false;
    cell.isFortified = false;
    cell.signalStrength = 0;
    console.log(`[GridManager] Enemy cell (${col}, ${row}) sabotaged → neutral`);
    return true;
  }
  return false;
}
