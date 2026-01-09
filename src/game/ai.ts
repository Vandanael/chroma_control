/**
 * AI System - Bloc 5.2
 * IA Swarm : Capture cellules neutres et attaque le joueur
 */

import { getCells, getCellsByOwner } from './gridManager';
import { initiateOutpostDeployment } from './outpostDeployment';

// =============================================================================
// CONSTANTS
// =============================================================================

const AI_THINK_INTERVAL_MS = 3000; // L'IA "pense" toutes les 3 secondes
const AGGRESSIVE_THRESHOLD = 0.3;  // Si joueur contrôle >30%, IA devient agressive

// =============================================================================
// STATE
// =============================================================================

let lastThinkTime = 0;
let aiEnabled = false;

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Active/désactive l'IA
 */
export function setAIEnabled(enabled: boolean): void {
  aiEnabled = enabled;
  if (enabled) {
    lastThinkTime = performance.now();
    console.log('[AI] AI enabled');
  } else {
    console.log('[AI] AI disabled');
  }
}

/**
 * Met à jour l'IA (à appeler dans la boucle de rendu)
 */
export function updateAI(): void {
  if (!aiEnabled) return;

  const now = performance.now();
  if (now - lastThinkTime < AI_THINK_INTERVAL_MS) return;

  lastThinkTime = now;
  aiThink();
}

// =============================================================================
// AI LOGIC
// =============================================================================

function aiThink(): void {
  const playerCells = getCellsByOwner('player');
  const enemyCells = getCellsByOwner('enemy');
  const neutralCells = getCellsByOwner('neutral');

  // Si l'IA n'a aucune cellule, elle ne peut rien faire
  if (enemyCells.length === 0) {
    console.log('[AI] No cells owned, cannot deploy');
    return;
  }

  // Calculer le ratio de contrôle du joueur
  const totalControlled = playerCells.length + enemyCells.length;
  const playerRatio = totalControlled > 0 ? playerCells.length / totalControlled : 0;

  console.log(`[AI] Thinking... Player ratio: ${(playerRatio * 100).toFixed(1)}%`);

  // Décision stratégique
  let targetCell = null;

  // Stratégie agressive si le joueur contrôle beaucoup de territoire
  if (playerRatio > AGGRESSIVE_THRESHOLD && playerCells.length > 0) {
    // Attaquer une cellule joueur non-fortifiée
    const vulnerableCells = playerCells.filter(c => !c.isFortified && !c.isHQ);
    
    if (vulnerableCells.length > 0) {
      // Choisir une cellule aléatoire parmi les vulnérables
      targetCell = vulnerableCells[Math.floor(Math.random() * vulnerableCells.length)];
      console.log(`[AI] AGGRESSIVE: Attacking player cell (${targetCell.col}, ${targetCell.row})`);
    }
  }

  // Stratégie d'expansion : capturer des cellules neutres
  if (!targetCell && neutralCells.length > 0) {
    // Trouver la cellule neutre la plus proche d'une cellule ennemie
    let minDist = Infinity;
    let closestNeutral = null;

    for (const neutral of neutralCells) {
      for (const enemy of enemyCells) {
        const dist = Math.abs(neutral.col - enemy.col) + Math.abs(neutral.row - enemy.row);
        if (dist < minDist) {
          minDist = dist;
          closestNeutral = neutral;
        }
      }
    }

    targetCell = closestNeutral;
    if (targetCell) {
      console.log(`[AI] EXPANSION: Targeting neutral cell (${targetCell.col}, ${targetCell.row})`);
    }
  }

  // Exécuter le déploiement
  if (targetCell) {
    const deploymentId = initiateOutpostDeployment(
      targetCell.col,
      targetCell.row,
      'enemy'
    );

    if (deploymentId) {
      console.log(`[AI] Deployment initiated: ${deploymentId}`);
    } else {
      console.warn('[AI] Failed to initiate deployment');
    }
  } else {
    console.log('[AI] No valid target found');
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise l'IA avec une cellule de départ
 */
export function initAI(): void {
  const allCells = getCells();
  
  // Donner une cellule aléatoire à l'IA dans la moitié supérieure de la grille
  const topHalfCells = allCells.filter(c => c.row < 8 && c.owner === 'neutral');
  
  if (topHalfCells.length > 0) {
    const startCell = topHalfCells[Math.floor(Math.random() * topHalfCells.length)];
    startCell.owner = 'enemy';
    startCell.signalStrength = 100;
    console.log(`[AI] Starting cell: (${startCell.col}, ${startCell.row})`);
  }
}
