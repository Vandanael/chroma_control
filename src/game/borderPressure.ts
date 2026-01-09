/**
 * Border Pressure System - Calcule la pression et le rapport de force sur les frontières
 * Utilisé pour intensifier le feedback visuel et audio selon la tension
 */

import { type GameNode, getNodesByOwner } from './nodeManager';
import { isNodeDisabled } from './doubleTapBurst';

// =============================================================================
// TYPES
// =============================================================================

export interface BorderSegment {
  x: number;
  y: number;
  pressure: number; // 0.0 à 1.0 (intensité du conflit)
  forceRatio: number; // -1.0 (on perd) à +1.0 (on gagne)
  distance: number; // Distance entre les nœuds
}

// =============================================================================
// CONSTANTS
// =============================================================================

const AURA_RADIUS = 120;
const MAX_PRESSURE_DISTANCE = 300; // Distance max pour considérer une frontière active

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Calcule les segments de frontière avec pression et rapport de force
 */
export function calculateBorderSegments(): BorderSegment[] {
  const playerNodes = getNodesByOwner('player');
  const enemyNodes = getNodesByOwner('enemy');
  const segments: BorderSegment[] = [];
  
  for (const playerNode of playerNodes) {
    for (const enemyNode of enemyNodes) {
      // Ignorer les nœuds ennemis désactivés
      if (isNodeDisabled(enemyNode.id)) continue;
      
      const dx = playerNode.x - enemyNode.x;
      const dy = playerNode.y - enemyNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Si les auras se chevauchent ou sont proches
      if (distance < AURA_RADIUS * 2 + MAX_PRESSURE_DISTANCE) {
        // Calculer la pression (1.0 = auras qui se chevauchent, 0.0 = très loin)
        const overlapDistance = AURA_RADIUS * 2;
        let pressure = 0;
        
        if (distance < overlapDistance) {
          // Chevauchement direct : pression maximale
          pressure = 1.0;
        } else {
          // Pression décroissante avec la distance
          const excessDistance = distance - overlapDistance;
          pressure = Math.max(0, 1.0 - (excessDistance / MAX_PRESSURE_DISTANCE));
        }
        
        // Calculer le rapport de force local
        // Basé sur la puissance des nœuds et leur nombre de connexions
        const playerPower = playerNode.power + (playerNode.connections.length * 5);
        const enemyPower = enemyNode.power + (enemyNode.connections.length * 5);
        const totalPower = playerPower + enemyPower;
        
        // Force ratio : -1.0 (on perd) à +1.0 (on gagne)
        const forceRatio = totalPower > 0 
          ? (playerPower - enemyPower) / totalPower 
          : 0;
        
        // Position sur la frontière (milieu entre les deux nœuds)
        const t = 0.5; // Milieu pour le moment
        const borderX = playerNode.x + (enemyNode.x - playerNode.x) * t;
        const borderY = playerNode.y + (enemyNode.y - playerNode.y) * t;
        
        segments.push({
          x: borderX,
          y: borderY,
          pressure,
          forceRatio,
          distance,
        });
      }
    }
  }
  
  return segments;
}

/**
 * Calcule la longueur totale de frontière active
 */
export function calculateActiveBorderLength(): number {
  const segments = calculateBorderSegments();
  let totalLength = 0;
  
  for (const segment of segments) {
    // Longueur approximative basée sur la distance et la pression
    totalLength += segment.distance * segment.pressure;
  }
  
  return totalLength;
}

/**
 * Calcule la pression moyenne sur toutes les frontières
 */
export function calculateAveragePressure(): number {
  const segments = calculateBorderSegments();
  if (segments.length === 0) return 0;
  
  const totalPressure = segments.reduce((sum, seg) => sum + seg.pressure, 0);
  return totalPressure / segments.length;
}
