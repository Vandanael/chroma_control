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
      });
    }
  }

  console.log(`[GridManager] Initialized ${cells.length} cells (${COLS}x${ROWS})`);
  console.log(`[GridManager] Cell size: ${cellSize}px, Padding: ${PADDING}px`);
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
