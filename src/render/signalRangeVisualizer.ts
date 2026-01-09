/**
 * Signal Range Visualizer - BLOC 1.6
 * Visualise la portée du signal avec bonus amplifiers
 */

import { getPointerPosition } from '../input/unifiedInput';
import { findClosestAllyNode, getSignalRangeBonusAt } from '../game/nodeManager';
import { calculateSignalRange } from '../game/signalPhysics';
import { getPlayerColorValue } from '../game/playerColor';

/**
 * Rend le cercle de portée autour du nœud survolé (avec bonus amplifiers)
 */
export function renderSignalRange(ctx: CanvasRenderingContext2D): void {
  const pointer = getPointerPosition();
  if (!pointer.isOverCanvas) return;
  
  const closestNode = findClosestAllyNode(pointer.x, pointer.y, 'player');
  if (!closestNode) return;
  
  const baseRange = calculateSignalRange('player');
  const amplifierBonus = getSignalRangeBonusAt(pointer.x, pointer.y, 'player');
  const effectiveRange = baseRange + amplifierBonus;
  
  ctx.save();
  
  // Cercle de portée (gradient radial)
  const gradient = ctx.createRadialGradient(
    closestNode.x, closestNode.y, 0,
    closestNode.x, closestNode.y, effectiveRange
  );
  
  const playerColor = getPlayerColorValue();
  gradient.addColorStop(0, `${playerColor}00`); // Transparent au centre
  gradient.addColorStop(0.7, `${playerColor}15`); // Légèrement visible
  gradient.addColorStop(0.95, `${playerColor}40`); // Plus opaque au bord
  gradient.addColorStop(1, `${playerColor}00`); // Fade out
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(closestNode.x, closestNode.y, effectiveRange, 0, Math.PI * 2);
  ctx.fill();
  
  // Bordure en pointillés
  ctx.strokeStyle = playerColor;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.arc(closestNode.x, closestNode.y, effectiveRange, 0, Math.PI * 2);
  ctx.stroke();
  
  // Si bonus amplifier actif, afficher un cercle supplémentaire pour la portée de base
  if (amplifierBonus > 0) {
    ctx.strokeStyle = playerColor;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(closestNode.x, closestNode.y, baseRange, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();
}
