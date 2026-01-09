/**
 * Territory System - BLOC 5.1
 * Calcule les zones de contrôle du joueur et de l'ennemi
 */

import { getAllNodes, getNodesByOwner, type GameNode } from './nodeManager';
import { calculateSignalRange } from './signalPhysics';

// =============================================================================
// CONSTANTS
// =============================================================================

const TERRITORY_GRID_SIZE = 20; // Résolution de la grille (20px par cellule)

// =============================================================================
// TERRITORY INFLUENCE
// =============================================================================

/**
 * Calcule l'influence territoriale à une position donnée (BLOC 5.1)
 * @returns 'player' | 'enemy' | 'neutral'
 */
export function calculateTerritoryInfluence(x: number, y: number): 'player' | 'enemy' | 'neutral' {
  const playerNodes = getNodesByOwner('player');
  const enemyNodes = getNodesByOwner('enemy');
  
  // Calculer la portée du signal pour chaque camp
  const playerRange = calculateSignalRange('player');
  const enemyRange = calculateSignalRange('enemy');
  
  // Distance minimale aux nœuds joueur
  let minPlayerDist = Infinity;
  for (const node of playerNodes) {
    const dx = x - node.x;
    const dy = y - node.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minPlayerDist) {
      minPlayerDist = dist;
    }
  }
  
  // Distance minimale aux nœuds ennemis
  let minEnemyDist = Infinity;
  for (const node of enemyNodes) {
    const dx = x - node.x;
    const dy = y - node.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minEnemyDist) {
      minEnemyDist = dist;
    }
  }
  
  // Déterminer la zone de contrôle
  const inPlayerRange = minPlayerDist <= playerRange;
  const inEnemyRange = minEnemyDist <= enemyRange;
  
  if (inPlayerRange && !inEnemyRange) {
    return 'player';
  } else if (inEnemyRange && !inPlayerRange) {
    return 'enemy';
  } else if (inPlayerRange && inEnemyRange) {
    // Zone contestée : celui qui est le plus proche
    if (minPlayerDist < minEnemyDist) {
      return 'player';
    } else {
      return 'enemy';
    }
  } else {
    return 'neutral';
  }
}

/**
 * Calcule le pourcentage de territoire contrôlé (BLOC 5.4)
 */
export function calculateTerritoryPercentage(
  width: number,
  height: number
): { player: number; enemy: number; neutral: number } {
  const gridWidth = Math.ceil(width / TERRITORY_GRID_SIZE);
  const gridHeight = Math.ceil(height / TERRITORY_GRID_SIZE);
  
  let playerCells = 0;
  let enemyCells = 0;
  let neutralCells = 0;
  
  // Échantillonner la grille
  for (let gy = 0; gy < gridHeight; gy++) {
    for (let gx = 0; gx < gridWidth; gx++) {
      const x = gx * TERRITORY_GRID_SIZE;
      const y = gy * TERRITORY_GRID_SIZE;
      
      const influence = calculateTerritoryInfluence(x, y);
      
      if (influence === 'player') {
        playerCells++;
      } else if (influence === 'enemy') {
        enemyCells++;
      } else {
        neutralCells++;
      }
    }
  }
  
  const totalCells = gridWidth * gridHeight;
  
  return {
    player: (playerCells / totalCells) * 100,
    enemy: (enemyCells / totalCells) * 100,
    neutral: (neutralCells / totalCells) * 100,
  };
}

/**
 * Vérifie si deux zones sont proches (pour frontières contestées) (BLOC 5.3)
 */
export function areZonesContested(
  playerNodes: GameNode[],
  enemyNodes: GameNode[],
  threshold: number = 300
): boolean {
  for (const playerNode of playerNodes) {
    for (const enemyNode of enemyNodes) {
      const dx = playerNode.x - enemyNode.x;
      const dy = playerNode.y - enemyNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < threshold) {
        return true;
      }
    }
  }
  
  return false;
}
