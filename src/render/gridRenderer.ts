/**
 * Grid Renderer - 25x16 Tactical Grid
 * NASA-Punk style: Thin borders, paper grain, technical annotations
 */

import { COLORS } from '../types';
import { getCells, type GridCell, getCellAt } from '../game/gridManager';
import { renderCellSignal } from './signalGradients';

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
  const { x, y, size, isHQ, owner, isConnected } = cell;
  
  // === FEEDBACK VISUEL : Cellules isolées (Bloc 2.4) ===
  if (owner !== 'neutral' && !isConnected) {
    // Teinte grisâtre pour cellules en train de mourir
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x, y, size, size);
    
    // Clignotement (pulse)
    const pulse = Math.sin(Date.now() / 300) * 0.5 + 0.5; // 0-1
    ctx.fillStyle = `rgba(200, 50, 50, ${pulse * 0.3})`; // Rouge pulsé
    ctx.fillRect(x, y, size, size);
  }
  
  // Gradient de signal (Bloc 1.4)
  renderCellSignal(ctx, cell);
  
  // === BORDURES ORGANIQUES (Bloc 2.4 - Effet Mousse) ===
  // Ne dessiner que les bordures extérieures (pas les frontières internes)
  if (owner !== 'neutral') {
    drawOrganicBorders(ctx, cell);
  } else {
    // Cellules neutres : bordures normales fines
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, size, size);
  }
  
  // Hachures pour cellules fortifiées (Bloc 4.2)
  if (cell.isFortified) {
    drawFortificationHatching(ctx, cell);
  }

  // Labels
  ctx.fillStyle = COLORS.annotation;
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (isHQ) {
    ctx.fillText('[HQ]', x + size / 2, y + size / 2);
  } else if (cell.isOutpost) {
    ctx.fillText('[OUTPOST]', x + size / 2, y + size / 2);
  } else if (cell.isFortified) {
    ctx.fillText('[FORTIFIED]', x + size / 2, y + size / 2);
  }
}

/**
 * Draw fortification hatching (technical style, 45°)
 */
function drawFortificationHatching(ctx: CanvasRenderingContext2D, cell: GridCell): void {
  const { x, y, size } = cell;
  const spacing = 6; // Espacement entre les lignes

  ctx.save();
  ctx.strokeStyle = COLORS.ink; // Encre sépia
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.6;

  // Hachures diagonales 45°
  ctx.beginPath();
  for (let i = -size; i < size * 2; i += spacing) {
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + size, y + size);
  }
  ctx.stroke();

  ctx.restore();
}

// =============================================================================
// ORGANIC BORDERS (Bloc 2.4 - Effet Mousse)
// =============================================================================

/**
 * Dessine uniquement les bordures extérieures du territoire
 * (fusion des cellules du même owner)
 */
function drawOrganicBorders(ctx: CanvasRenderingContext2D, cell: GridCell): void {
  const { x, y, size, owner, col, row } = cell;
  
  // Couleur du contour selon owner
  const borderColor = owner === 'player' ? COLORS.player : COLORS.enemy;
  
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5; // Plus épais pour bien délimiter le territoire
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Vérifier les 4 voisins
  const top = getCellAt(col, row - 1);
  const bottom = getCellAt(col, row + 1);
  const left = getCellAt(col - 1, row);
  const right = getCellAt(col + 1, row);

  ctx.beginPath();

  // TOP : Dessiner si pas de voisin OU voisin différent owner
  if (!top || top.owner !== owner) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y);
  }

  // RIGHT : Dessiner si pas de voisin OU voisin différent owner
  if (!right || right.owner !== owner) {
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size, y + size);
  }

  // BOTTOM : Dessiner si pas de voisin OU voisin différent owner
  if (!bottom || bottom.owner !== owner) {
    ctx.moveTo(x + size, y + size);
    ctx.lineTo(x, y + size);
  }

  // LEFT : Dessiner si pas de voisin OU voisin différent owner
  if (!left || left.owner !== owner) {
    ctx.moveTo(x, y + size);
    ctx.lineTo(x, y);
  }

  ctx.stroke();
}
