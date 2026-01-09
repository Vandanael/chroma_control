/**
 * Grid Renderer - Bio-Network Edition
 * Rendu organique : Nœuds (cercles) + Synapses (lignes épaisses)
 */

import { COLORS } from '../game/constants';
import { getCells, type GridCell, getCellAt } from '../game/gridManager';

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Render all grid cells in Bio-Network style
 * Pipeline: Fond subtil → Synapses → Nœuds
 */
export function renderGrid(ctx: CanvasRenderingContext2D): void {
  const cells = getCells();
  
  if (cells.length === 0) return;

  // ÉTAPE A : LE FOND (Subtil)
  // Dessine un tout petit point au centre de chaque cellule vide
  ctx.save();
  ctx.fillStyle = '#333333';
  for (const cell of cells) {
    if (cell.owner === 'neutral') {
      const centerX = cell.x + cell.size / 2;
      const centerY = cell.y + cell.size / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // ÉTAPE B : LES SYNAPSES (Connexions) - DESSINER EN PREMIER
  // Dessine les lignes épaisses entre voisins de même couleur
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Synapses pour le joueur (Cyan)
  ctx.strokeStyle = COLORS.PLAYER;
  ctx.lineWidth = 0; // Sera défini par cellule
  drawSynapses(ctx, cells, 'player');
  
  // Synapses pour l'ennemi (Magenta)
  ctx.strokeStyle = COLORS.ENEMY;
  drawSynapses(ctx, cells, 'enemy');
  
  ctx.restore();

  // ÉTAPE C : LES NŒUDS (Cellules) - DESSINER AU-DESSUS
  // Dessine les cercles au centre de chaque cellule active
  ctx.save();
  
  for (const cell of cells) {
    if (cell.owner !== 'neutral') {
      drawNode(ctx, cell);
    }
  }
  
  ctx.restore();
}

/**
 * Dessine les synapses (lignes) entre voisins de même couleur
 */
function drawSynapses(
  ctx: CanvasRenderingContext2D,
  cells: GridCell[],
  owner: 'player' | 'enemy'
): void {
  const activeCells = cells.filter(c => c.owner === owner);
  
  for (const cell of activeCells) {
    const centerX = cell.x + cell.size / 2;
    const centerY = cell.y + cell.size / 2;
    const synapseWidth = cell.size * 0.4; // 40% de la taille de la cellule
    
    ctx.lineWidth = synapseWidth;
    
    // Vérifier les 4 voisins (Haut, Bas, Gauche, Droite)
    const neighbors = [
      getCellAt(cell.col, cell.row - 1), // Haut
      getCellAt(cell.col, cell.row + 1), // Bas
      getCellAt(cell.col - 1, cell.row), // Gauche
      getCellAt(cell.col + 1, cell.row), // Droite
    ];
    
    for (const neighbor of neighbors) {
      if (neighbor && neighbor.owner === owner) {
        const neighborCenterX = neighbor.x + neighbor.size / 2;
        const neighborCenterY = neighbor.y + neighbor.size / 2;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(neighborCenterX, neighborCenterY);
        ctx.stroke();
      }
    }
  }
}

/**
 * Easing function pour animation spring (rebond avec overshoot)
 * easeOutBack avec overshoot de 1.5
 */
function easeOutBack(t: number): number {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Dessine un nœud (cercle) au centre d'une cellule avec animation spring
 */
function drawNode(ctx: CanvasRenderingContext2D, cell: GridCell): void {
  const centerX = cell.x + cell.size / 2;
  const centerY = cell.y + cell.size / 2;
  const baseRadius = cell.size * 0.3; // 30% de la taille de la cellule
  
  // Animation spring si la cellule vient d'être créée
  let scale = 1;
  if (cell.creationTime) {
    const now = performance.now();
    const age = now - cell.creationTime;
    const duration = 300; // 300ms d'animation
    
    if (age < duration) {
      const progress = age / duration;
      scale = easeOutBack(progress);
    } else {
      // Nettoyer creationTime après l'animation
      delete cell.creationTime;
    }
  }
  
  const radius = baseRadius * scale;
  
  // Couleur selon le propriétaire
  const color = cell.owner === 'player' ? COLORS.PLAYER : COLORS.ENEMY;
  
  // Effet Néon (shadowBlur) - plus intense pendant l'animation
  ctx.shadowBlur = 15 + (scale > 1 ? (scale - 1) * 10 : 0);
  ctx.shadowColor = color;
  
  // Cercle rempli
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Réinitialiser shadow pour ne pas affecter les autres éléments
  ctx.shadowBlur = 0;
}
