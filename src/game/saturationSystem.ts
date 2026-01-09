/**
 * Saturation System - "Planetary Saturation"
 * Calcule la couverture visuelle (aire cumulée des cercles d'influence)
 */

import { getNodesByOwner, type GameNode } from './nodeManager';

// =============================================================================
// CONSTANTS
// =============================================================================

import { NODE_CONFIG, VICTORY_CONFIG } from '../config';

const BASE_NODE_RADIUS = NODE_CONFIG.baseRadius;
const DROP_POD_RADIUS = NODE_CONFIG.dropPodRadius;
const SATURATION_THRESHOLD = VICTORY_CONFIG.saturationThreshold;

// =============================================================================
// SATURATION CALCULATION
// =============================================================================

/**
 * Calcule l'aire d'un nœud (cercle)
 */
function getNodeArea(node: GameNode): number {
  const radius = node.isDropPod ? DROP_POD_RADIUS : (node.radius || BASE_NODE_RADIUS);
  return Math.PI * radius * radius;
}

/**
 * Calcule la saturation planétaire (couverture visuelle) pour un propriétaire
 * @param owner - Propriétaire (player/enemy)
 * @param canvasWidth - Largeur du canvas
 * @param canvasHeight - Hauteur du canvas
 * @returns Pourcentage de couverture (0-1)
 */
export function calculateSaturation(
  owner: 'player' | 'enemy',
  canvasWidth: number,
  canvasHeight: number
): number {
  const nodes = getNodesByOwner(owner);
  const totalCanvasArea = canvasWidth * canvasHeight;

  // Calculer l'aire cumulée des nœuds
  let totalNodeArea = 0;
  for (const node of nodes) {
    totalNodeArea += getNodeArea(node);
  }

  // Pourcentage de couverture
  const saturation = totalNodeArea / totalCanvasArea;
  return Math.min(1, saturation); // Cap à 100%
}

/**
 * Vérifie si un propriétaire a atteint la saturation planétaire (victoire)
 */
export function hasReachedSaturation(
  owner: 'player' | 'enemy',
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const saturation = calculateSaturation(owner, canvasWidth, canvasHeight);
  return saturation >= SATURATION_THRESHOLD;
}

/**
 * Récupère les saturations pour les deux propriétaires
 */
export function getSaturations(canvasWidth: number, canvasHeight: number): {
  player: number;
  enemy: number;
} {
  return {
    player: calculateSaturation('player', canvasWidth, canvasHeight),
    enemy: calculateSaturation('enemy', canvasWidth, canvasHeight),
  };
}
