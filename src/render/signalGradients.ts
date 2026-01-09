/**
 * Signal Gradients Renderer
 * Bloc 1.4 : Gradients de signal + annotations pour cellules capturées
 */

import { GridCell } from '../game/gridManager';
import { COLORS } from '../types';

// =============================================================================
// GRADIENTS
// =============================================================================

/**
 * Dessine un gradient radial de signal pour une cellule
 */
export function drawSignalGradient(
  ctx: CanvasRenderingContext2D,
  cell: GridCell
): void {
  const { x, y, size, owner, signalStrength } = cell;

  if (owner === 'neutral' || signalStrength <= 0) return;

  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2;

  // Créer le gradient radial
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,           // Centre
    centerX, centerY, radius       // Bord
  );

  // Couleur selon le propriétaire
  const color = owner === 'player' ? COLORS.player : COLORS.enemy;
  
  // Opacité basée sur signal strength
  const maxOpacity = 0.3;
  const opacity = (signalStrength / 100) * maxOpacity;

  // Gradient : opaque au centre → transparent aux bords
  gradient.addColorStop(0, `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(0.7, `${color}${Math.floor(opacity * 128).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(1, `${color}00`); // Transparent

  // Dessiner le gradient
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, size, size);
  ctx.restore();
}

// =============================================================================
// ANNOTATIONS
// =============================================================================

/**
 * Dessine l'annotation [SIG: X%] au centre d'une cellule
 */
export function drawSignalAnnotation(
  ctx: CanvasRenderingContext2D,
  cell: GridCell
): void {
  const { x, y, size, owner, signalStrength, isHQ, isOutpost, isFortified } = cell;

  // Ne pas afficher l'annotation sur certaines cellules spéciales
  if (isHQ || isOutpost || isFortified) return;
  
  // Seulement pour cellules capturées
  if (owner === 'neutral' || signalStrength <= 0) return;

  const centerX = x + size / 2;
  const centerY = y + size / 2;

  ctx.save();
  ctx.font = '8px "IBM Plex Mono", monospace';
  ctx.fillStyle = COLORS.annotation;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.7;

  // Format : [SIG: 100%]
  const sigText = `[SIG: ${Math.floor(signalStrength)}%]`;
  ctx.fillText(sigText, centerX, centerY);

  ctx.restore();
}

/**
 * Rendu complet : gradient + annotation
 */
export function renderCellSignal(
  ctx: CanvasRenderingContext2D,
  cell: GridCell
): void {
  drawSignalGradient(ctx, cell);
  drawSignalAnnotation(ctx, cell);
}
