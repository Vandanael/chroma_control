/**
 * Voronoi Renderer - Organic Territory System
 * Handles rendering of Voronoi cells with NASA-Punk aesthetic
 */

import { getCells, getCellState, getCellAnimationProgress } from '../game/voronoiManager';
import { createSignalGradient, drawCellReinforcement } from './effects';

// =============================================================================
// VORONOI RENDERING (Bloc 1.1)
// =============================================================================

/**
 * Render all Voronoi cells with plotter-style animation
 */
export function renderVoronoiCells(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const cells = getCells();

  if (cells.length === 0) {
    return;
  }

  ctx.save();

  // Clip to canvas bounds
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  // Render each cell
  for (const cell of cells) {
    const state = getCellState(cell.id);
    if (!state) continue;

    const progress = getCellAnimationProgress(cell.id);
    if (progress <= 0) continue;

    // Calculate approximate cell radius for gradient
    const xs = cell.polygon.map(p => p.x);
    const ys = cell.polygon.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const radius = Math.max(maxX - minX, maxY - minY) / 2;

    // Determine cell fill gradient based on owner
    let fillGradient: CanvasGradient | undefined;

    if (state.owner === 'player' && progress > 0.3) {
      fillGradient = createSignalGradient(
        ctx,
        cell.center,
        radius,
        'player',
        state.signalStrength
      );
    } else if (state.owner === 'enemy' && progress > 0.3) {
      fillGradient = createSignalGradient(
        ctx,
        cell.center,
        radius,
        'enemy',
        state.signalStrength
      );
    }

    // Draw cell with gradient fill
    if (fillGradient) {
      ctx.save();
      ctx.fillStyle = fillGradient;
      ctx.beginPath();
      ctx.moveTo(cell.polygon[0].x, cell.polygon[0].y);
      for (let i = 1; i < cell.polygon.length; i++) {
        ctx.lineTo(cell.polygon[i].x, cell.polygon[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw cell border - Style Table Traçante (0.5px, gris technique)
    ctx.save();
    ctx.strokeStyle = '#C8C4BC'; // Gris technique fin
    ctx.lineWidth = 0.5; // Très fin pour esthétique papier
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = progress;

    ctx.beginPath();
    ctx.moveTo(cell.polygon[0].x, cell.polygon[0].y);
    for (let i = 1; i < cell.polygon.length; i++) {
      ctx.lineTo(cell.polygon[i].x, cell.polygon[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Draw reinforcement hatching if cell is reinforced
    if (state.reinforced && state.owner !== 'neutral') {
      drawCellReinforcement(ctx, cell.polygon, state.owner, progress);
    }
  }

  ctx.restore();
}

/**
 * Render cell borders only (for debug/overlay)
 */
export function renderVoronoiBorders(
  ctx: CanvasRenderingContext2D,
  color: string = '#C8C4BC',
  lineWidth: number = 0.5
): void {
  const cells = getCells();

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (const cell of cells) {
    const progress = getCellAnimationProgress(cell.id);
    if (progress <= 0) continue;

    ctx.globalAlpha = progress;
    ctx.beginPath();
    ctx.moveTo(cell.polygon[0].x, cell.polygon[0].y);
    for (let i = 1; i < cell.polygon.length; i++) {
      ctx.lineTo(cell.polygon[i].x, cell.polygon[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}
