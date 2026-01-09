/**
 * Grid Renderer - 25x16 Tactical Grid
 * NASA-Punk style: Thin borders, paper grain, technical annotations
 */

import { COLORS } from '../types';
import { getCells, GridCell } from '../game/gridManager';

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Render all grid cells
 */
export function renderGrid(ctx: CanvasRenderingContext2D): void {
  const cells = getCells();
  
  for (const cell of cells) {
    drawCell(ctx, cell);
  }
}

/**
 * Draw a single cell
 */
function drawCell(ctx: CanvasRenderingContext2D, cell: GridCell): void {
  const { x, y, size, owner, isHQ } = cell;
  
  // Fill color based on owner
  if (owner === 'player') {
    ctx.fillStyle = COLORS.player;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = 1.0;
  } else if (owner === 'enemy') {
    ctx.fillStyle = COLORS.enemy;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = 1.0;
  }
  
  // Border (0.5px technical grey)
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, size, size);
  
  // HQ label
  if (isHQ) {
    ctx.fillStyle = COLORS.annotation;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[HQ]', x + size / 2, y + size / 2);
  }
}
