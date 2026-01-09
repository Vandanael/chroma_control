/**
 * Signal Physics - Force Cumulative & Attenuation
 * La portée augmente avec la densité du réseau
 * L'opacité/épaisseur diminue avec la distance du Drop-Pod
 */

import { getNodesByOwner, getDistanceFromDropPod, getSignalRangeBonusAt, type GameNode } from './nodeManager';
import { calculateSignalRangeWithPressure } from './gameBalance';
import { SIGNAL_CONFIG } from '../config';

// =============================================================================
// CONSTANTS
// =============================================================================

const SIGNAL_ATTENUATION_RATE = SIGNAL_CONFIG.attenuationRate;

// =============================================================================
// FORCE CUMULATIVE
// =============================================================================

/**
 * Calcule la portée du signal basée sur la densité du réseau
 * Plus le réseau est dense, plus la portée augmente
 * Utilise maintenant la pression chromatique (densité du maillage)
 */
export function calculateSignalRange(owner: 'player' | 'enemy'): number {
  // Utiliser le nouveau système avec pression chromatique
  return calculateSignalRangeWithPressure(owner);
}

/**
 * Vérifie si une position est dans la portée du signal (avec bonus amplifiers) (BLOC 1.6)
 */
export function isWithinSignalRange(x: number, y: number, owner: 'player' | 'enemy'): boolean {
  const nodes = getNodesByOwner(owner);
  const baseRange = calculateSignalRange(owner);
  
  for (const node of nodes) {
    const dx = x - node.x;
    const dy = y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculer le bonus amplifier à cette position (BLOC 1.6)
    const amplifierBonus = getSignalRangeBonusAt(x, y, owner);
    const effectiveRange = baseRange + amplifierBonus;
    
    if (distance <= effectiveRange) {
      return true;
    }
  }
  
  return false;
}

// =============================================================================
// DÉGRADÉ DE SIGNAL (ATTENUATION)
// =============================================================================

/**
 * Calcule l'opacité d'un nœud basée sur sa distance du Drop-Pod
 * Distance mesurée en nombre de hops (sauts dans le graphe)
 */
export function calculateNodeOpacity(node: GameNode): number {
  if (node.isDropPod) {
    return 1.0; // Drop-Pod toujours à opacité maximale
  }
  
  const distanceInfo = getDistanceFromDropPod(node);
  
  if (!distanceInfo) {
    return SIGNAL_CONFIG.minIsolatedOpacity;
  }
  
  // Atténuation exponentielle basée sur les hops
  const opacity = Math.max(SIGNAL_CONFIG.minIsolatedOpacity, 1.0 - (distanceInfo.hops * SIGNAL_ATTENUATION_RATE));
  
  return opacity;
}

/**
 * Calcule l'épaisseur d'un lien basée sur la distance moyenne des deux nœuds
 */
export function calculateLinkThickness(node1: GameNode, node2: GameNode, basePower: number): number {
  const opacity1 = calculateNodeOpacity(node1);
  const opacity2 = calculateNodeOpacity(node2);
  const avgOpacity = (opacity1 + opacity2) / 2;
  
  // Épaisseur proportionnelle à l'opacité moyenne
  const thickness = basePower * avgOpacity;
  
  return Math.max(SIGNAL_CONFIG.minLinkThickness, thickness);
}

/**
 * Retourne les stats du réseau pour l'affichage HUD
 */
export function getNetworkStats(owner: 'player' | 'enemy'): {
  range: number;
  nodeCount: number;
  density: number;
} {
  const nodes = getNodesByOwner(owner);
  const range = calculateSignalRange(owner);
  
  // Densité = nombre de connexions totales / nombre de nœuds
  let totalConnections = 0;
  for (const node of nodes) {
    totalConnections += node.connections.length;
  }
  const density = nodes.length > 0 ? totalConnections / nodes.length : 0;
  
  return {
    range: Math.round(range),
    nodeCount: nodes.length,
    density: Math.round(density * 10) / 10, // 1 décimale
  };
}
