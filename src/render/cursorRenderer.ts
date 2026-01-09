/**
 * Cursor Renderer - Smart Context Cursor
 * Affiche un curseur contextuel (Rond/Carré/Triangle) selon l'action disponible
 * + Fantôme de nœud pour prévisualisation
 */

import { getActionAtPosition } from '../input/gridInput';
import { getEnergy } from '../game/state';
import { getCellAtPosition } from '../game/gridManager';
import { COLORS } from '../game/constants';

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Rend le curseur contextuel
 * @param ctx - Contexte de rendu
 * @param mouseX - Position X de la souris
 * @param mouseY - Position Y de la souris
 * @param isMouseOverCanvas - Si la souris est sur le canvas
 */
export function renderCursor(
  ctx: CanvasRenderingContext2D,
  mouseX: number,
  mouseY: number,
  isMouseOverCanvas: boolean
): void {
  if (!isMouseOverCanvas) return;

  // Obtenir l'action à la position de la souris
  const action = getActionAtPosition(mouseX, mouseY);
  const energy = getEnergy();

  // Vérifier si l'action est valide (assez d'énergie)
  const isValid = energy.current >= action.cost;

  // Couleur du curseur
  const color = isValid ? '#FFFFFF' : '#C98B7B'; // Blanc si valide, rouge si insuffisant
  const alpha = isValid ? 0.9 : 0.5;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  // Dessiner la forme selon le type d'action
  switch (action.cursorShape) {
    case 'circle':
      drawCircleCursor(ctx, mouseX, mouseY);
      break;
    
    case 'square':
      drawSquareCursor(ctx, mouseX, mouseY);
      break;
    
    case 'triangle':
      drawTriangleCursor(ctx, mouseX, mouseY);
      break;
  }

  ctx.restore();

  // Dessiner le fantôme de nœud si action SCOUT valide
  if (action.type === 'SCOUT' && isValid) {
    drawNodeGhost(ctx, mouseX, mouseY);
  }
}

/**
 * Dessine un fantôme de nœud à la position de la cellule survolée
 */
function drawNodeGhost(ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number): void {
  const cell = getCellAtPosition(mouseX, mouseY);
  
  if (!cell || cell.owner !== 'neutral') return;
  
  const centerX = cell.x + cell.size / 2;
  const centerY = cell.y + cell.size / 2;
  const radius = cell.size * 0.3; // 30% de la taille de la cellule
  
  ctx.save();
  ctx.fillStyle = COLORS.PLAYER;
  ctx.globalAlpha = 0.3; // Fantôme transparent
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Bordure plus visible
  ctx.strokeStyle = COLORS.PLAYER;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Dessine un curseur circulaire (SCOUT)
 */
function drawCircleCursor(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const radius = 8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Point central
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Dessine un curseur carré (DEFEND)
 */
function drawSquareCursor(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const size = 12;
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);
  
  // Croix centrale
  const crossSize = 4;
  ctx.beginPath();
  ctx.moveTo(x - crossSize / 2, y);
  ctx.lineTo(x + crossSize / 2, y);
  ctx.moveTo(x, y - crossSize / 2);
  ctx.lineTo(x, y + crossSize / 2);
  ctx.stroke();
}

/**
 * Dessine un curseur triangulaire (ATTACK)
 */
function drawTriangleCursor(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const size = 10;
  ctx.beginPath();
  ctx.moveTo(x, y - size); // Haut
  ctx.lineTo(x - size, y + size / 2); // Bas gauche
  ctx.lineTo(x + size, y + size / 2); // Bas droit
  ctx.closePath();
  ctx.stroke();
  
  // Point central
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}
