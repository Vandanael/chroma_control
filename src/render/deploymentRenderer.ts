/**
 * Deployment Renderer
 * Bloc 2.2 : Rendu visuel des déploiements d'avant-poste
 * 
 * - Phase 1 (Transit) : Effet flash éphémère sur cellules traversées
 * - Phase 2 (Impact) : Avant-poste avec annotation [OUTPOST]
 * - Phase 3 (Expansion) : Animation expansion cross
 */

import { getActiveDeployments, OutpostDeployment } from '../game/outpostDeployment';
import { COLORS } from '../types';

// =============================================================================
// MAIN RENDER
// =============================================================================

/**
 * Rend tous les déploiements actifs
 */
export function renderDeployments(ctx: CanvasRenderingContext2D): void {
  const deployments = getActiveDeployments();

  for (const deployment of deployments) {
    switch (deployment.phase) {
      case 'transit':
        renderTransitPhase(ctx, deployment);
        break;

      case 'impact':
      case 'expansion':
      case 'complete':
        // L'avant-poste et l'expansion sont déjà rendus par gridRenderer
        // (changement de owner dans les cellules)
        break;
    }
  }
}

// =============================================================================
// PHASE 1 - TRANSIT (Signal Éphémère)
// =============================================================================

function renderTransitPhase(ctx: CanvasRenderingContext2D, deployment: OutpostDeployment): void {
  const now = performance.now();
  const currentCell = deployment.path[deployment.currentIndex];

  if (!currentCell) return;

  // Effet flash sur la cellule actuelle
  const flashProgress = 1 - (deployment.nextCellTime - now) / 250;
  const alpha = Math.max(0, Math.min(1, flashProgress));

  // Couleur selon le propriétaire
  const color = deployment.owner === 'player' ? COLORS.player : COLORS.enemy;

  // Flash blanc/couleur
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.4; // Flash à 40% max d'opacité
  ctx.fillRect(currentCell.x, currentCell.y, currentCell.size, currentCell.size);

  // Bordure plus visible
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha * 0.8;
  ctx.strokeRect(currentCell.x, currentCell.y, currentCell.size, currentCell.size);

  ctx.restore();

  // Tracer le chemin restant (lignes pointillées)
  renderPathPreview(ctx, deployment);
}

// =============================================================================
// PATH PREVIEW (Aperçu du chemin)
// =============================================================================

function renderPathPreview(ctx: CanvasRenderingContext2D, deployment: OutpostDeployment): void {
  const color = deployment.owner === 'player' ? COLORS.player : COLORS.enemy;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.setLineDash([4, 4]); // Pointillés

  // Tracer une ligne entre les centres des cellules du chemin
  for (let i = deployment.currentIndex; i < deployment.path.length - 1; i++) {
    const cell1 = deployment.path[i];
    const cell2 = deployment.path[i + 1];

    const x1 = cell1.x + cell1.size / 2;
    const y1 = cell1.y + cell1.size / 2;
    const x2 = cell2.x + cell2.size / 2;
    const y2 = cell2.y + cell2.size / 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}
