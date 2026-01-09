/**
 * Deployment Renderer - Bio-Digital Edition
 * Rendu organique du signal "seringue" : Point lumineux qui voyage avec trail
 */

import { getActiveDeployments, OutpostDeployment } from '../game/outpostDeployment';
import { COLORS } from '../game/constants';

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
// PHASE 1 - TRANSIT (Signal "Seringue" Organique)
// =============================================================================

function renderTransitPhase(ctx: CanvasRenderingContext2D, deployment: OutpostDeployment): void {
  const now = performance.now();
  const currentCell = deployment.path[deployment.currentIndex];
  const nextCell = deployment.path[deployment.currentIndex + 1];

  if (!currentCell) return;

  // Couleur selon le propriétaire
  const color = deployment.owner === 'player' ? COLORS.PLAYER : COLORS.ENEMY;

  // Calculer la position interpolée du point lumineux
  const currentCenterX = currentCell.x + currentCell.size / 2;
  const currentCenterY = currentCell.y + currentCell.size / 2;

  let signalX = currentCenterX;
  let signalY = currentCenterY;

  // Si on a une cellule suivante, interpoler la position
  if (nextCell) {
    const nextCenterX = nextCell.x + nextCell.size / 2;
    const nextCenterY = nextCell.y + nextCell.size / 2;
    
    // Progression dans la transition (0 = début cellule actuelle, 1 = fin)
    const progress = 1 - (deployment.nextCellTime - now) / 250;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    // Interpolation linéaire
    signalX = currentCenterX + (nextCenterX - currentCenterX) * clampedProgress;
    signalY = currentCenterY + (nextCenterY - currentCenterY) * clampedProgress;
  }

  // Dessiner le trail (traînée derrière le point)
  drawTrail(ctx, deployment, color);

  // Dessiner le point lumineux principal (effet "seringue")
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(signalX, signalY, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Cœur plus lumineux
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(signalX, signalY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Tracer le chemin restant (lignes pointillées)
  renderPathPreview(ctx, deployment);
}

/**
 * Dessine la traînée (trail) derrière le point lumineux
 */
function drawTrail(ctx: CanvasRenderingContext2D, deployment: OutpostDeployment, color: string): void {
  const currentIndex = deployment.currentIndex;
  
  if (currentIndex === 0) return; // Pas de trail au début

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Dessiner le trail depuis le début jusqu'à la position actuelle
  for (let i = 0; i <= currentIndex && i < deployment.path.length; i++) {
    const cell = deployment.path[i];
    const cellCenterX = cell.x + cell.size / 2;
    const cellCenterY = cell.y + cell.size / 2;
    
    // Opacité décroissante pour les cellules anciennes
    const age = currentIndex - i;
    const alpha = Math.max(0.1, 1 - age * 0.3);
    
    ctx.globalAlpha = alpha * 0.6;
    ctx.lineWidth = 4 - age * 0.5;
    
    // Si ce n'est pas la dernière cellule, tracer une ligne vers la suivante
    if (i < currentIndex && i < deployment.path.length - 1) {
      const nextCell = deployment.path[i + 1];
      const nextCenterX = nextCell.x + nextCell.size / 2;
      const nextCenterY = nextCell.y + nextCell.size / 2;
      
      ctx.beginPath();
      ctx.moveTo(cellCenterX, cellCenterY);
      ctx.lineTo(nextCenterX, nextCenterY);
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

// =============================================================================
// PATH PREVIEW (Aperçu du chemin)
// =============================================================================

function renderPathPreview(ctx: CanvasRenderingContext2D, deployment: OutpostDeployment): void {
  const color = deployment.owner === 'player' ? COLORS.PLAYER : COLORS.ENEMY;

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
