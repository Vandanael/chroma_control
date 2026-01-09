/**
 * AI System - Bio-Digital "Free-Form" Edition
 * IA avec placement libre et variation de timing
 */

import {
  getNodesByOwner,
  getDropPod,
  createNode,
  findClosestAllyNode,
  isInRange,
  calculatePlacementCost,
  type GameNode,
} from './nodeManager';
import { initiateSyringeAnimation } from '../render/syringeRenderer';
import { playNodeCapture } from '../audio/audioManager';
import {
  calculateAIActionDelay,
  calculateAIRangeBonus,
  findVulnerableNodes,
} from './gameBalance';
import { calculateSaturation } from './saturationSystem';

// =============================================================================
// CONSTANTS
// =============================================================================

import { AI_CONFIG } from '../config';

const AI_START_DELAY_MS = AI_CONFIG.startDelayMs;
const MAX_PLACEMENT_RANGE = AI_CONFIG.maxPlacementRange;
const EXPANSION_ANGLE_VARIANCE = AI_CONFIG.expansionAngleVariance;

// =============================================================================
// STATE
// =============================================================================

let lastThinkTime = 0;
let aiEnabled = false;
let aiStartTime = 0;  // Timestamp de démarrage de l'IA
let canvasWidth = 0;  // Initialisé à 0, mis à jour par updateAICanvasDimensions
let canvasHeight = 0; // Initialisé à 0, mis à jour par updateAICanvasDimensions

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Active/désactive l'IA
 */
export function setAIEnabled(enabled: boolean): void {
  aiEnabled = enabled;
  if (enabled) {
    const now = performance.now();
    aiStartTime = now;
    lastThinkTime = now;  // Initialiser pour le délai de démarrage
    console.log('[AI] AI enabled (will start after 5s delay)');
  } else {
    console.log('[AI] AI disabled');
  }
}

/**
 * Met à jour l'IA (à appeler dans la boucle de rendu)
 * L'IA est bloquée jusqu'à ce que le jeu soit en état PLAYING
 */
export function updateAI(): void {
  if (!aiEnabled) return;
  
  // Vérifier que le jeu est en état PLAYING (bloquer si START ou GAME_OVER)
  // Cette vérification est faite dans engine.ts, mais on double-vérifie ici

  const now = performance.now();
  
  // Délai de démarrage : l'IA ne fait rien pendant les 5 premières secondes
  if (now - aiStartTime < AI_START_DELAY_MS) {
    return;
  }

  // Délai adaptatif selon la saturation du joueur
  const playerSaturation = canvasWidth > 0 && canvasHeight > 0
    ? calculateSaturation('player', canvasWidth, canvasHeight)
    : 0;
  
  const adaptiveDelay = calculateAIActionDelay(playerSaturation);
  const timeSinceLastAction = now - lastThinkTime;
  
  if (timeSinceLastAction < adaptiveDelay) {
    return;
  }

  lastThinkTime = now;
  aiThink();
}

// =============================================================================
// AI LOGIC
// =============================================================================

function aiThink(): void {
  const playerNodes = getNodesByOwner('player');
  const dropPod = getDropPod('enemy');

  // Si l'IA n'a pas de Drop-Pod, elle ne peut rien faire
  if (!dropPod) {
    console.log('[AI] No Drop-Pod, cannot deploy');
    return;
  }

  // Calculer la saturation du joueur pour l'adaptation
  const playerSaturation = canvasWidth > 0 && canvasHeight > 0
    ? calculateSaturation('player', canvasWidth, canvasHeight)
    : 0;

  // Stratégie intelligente : Cibler les nœuds vulnérables après 40% de saturation
  let targetX = 0;
  let targetY = 0;
  let strategy = '';

  // Après le seuil de saturation, l'IA devient agressive et cible les points faibles
  if (playerSaturation >= AI_CONFIG.aggressiveThreshold && playerNodes.length > 0) {
    const vulnerableNodes = findVulnerableNodes('player', AI_CONFIG.vulnerableNodesToConsider);
    
    if (vulnerableNodes.length > 0) {
      // Cibler le nœud le plus vulnérable
      const target = vulnerableNodes[0];
      
      // Placer un nœud près du nœud vulnérable pour le menacer
      const angle = Math.atan2(target.y - dropPod.y, target.x - dropPod.x);
      const distance = AI_CONFIG.vulnerableTargetMinDistance + Math.random() * (AI_CONFIG.vulnerableTargetMaxDistance - AI_CONFIG.vulnerableTargetMinDistance);
      
      targetX = dropPod.x + Math.cos(angle) * distance;
      targetY = dropPod.y + Math.sin(angle) * distance;
      
      strategy = 'TARGET_VULNERABLE_NODE';
    } else {
      // Fallback : expansion normale
      const closestPlayerNode = playerNodes[0];
      const angle = Math.atan2(
        closestPlayerNode.y - dropPod.y,
        closestPlayerNode.x - dropPod.x
      );
      const angleVariance = (Math.random() - 0.5) * EXPANSION_ANGLE_VARIANCE;
      const finalAngle = angle + angleVariance;
      const distance = AI_CONFIG.expansionMinDistance + Math.random() * (AI_CONFIG.expansionMaxDistance - AI_CONFIG.expansionMinDistance);
      
      targetX = dropPod.x + Math.cos(finalAngle) * distance;
      targetY = dropPod.y + Math.sin(finalAngle) * distance;
      
      strategy = 'EXPANSION_TOWARDS_PLAYER';
    }
  } else {
    // Avant le seuil : expansion normale vers le joueur
    let closestPlayerNode: GameNode | null = null;
    let minDistToPlayer = Infinity;

    for (const playerNode of playerNodes) {
      const dist = Math.sqrt(
        (playerNode.x - dropPod.x) ** 2 + (playerNode.y - dropPod.y) ** 2
      );
      if (dist < minDistToPlayer) {
        minDistToPlayer = dist;
        closestPlayerNode = playerNode;
      }
    }

    if (closestPlayerNode) {
      const angle = Math.atan2(
        closestPlayerNode.y - dropPod.y,
        closestPlayerNode.x - dropPod.x
      );
      const angleVariance = (Math.random() - 0.5) * EXPANSION_ANGLE_VARIANCE;
      const finalAngle = angle + angleVariance;
      const distance = AI_CONFIG.expansionMinDistance + Math.random() * (AI_CONFIG.expansionMaxDistance - AI_CONFIG.expansionMinDistance);
      
      targetX = dropPod.x + Math.cos(finalAngle) * distance;
      targetY = dropPod.y + Math.sin(finalAngle) * distance;
      
      strategy = 'EXPANSION_TOWARDS_PLAYER';
    } else {
      // Pas de joueur visible, expansion aléatoire
      const angle = Math.random() * Math.PI * 2;
      const distance = AI_CONFIG.expansionMinDistance + Math.random() * (AI_CONFIG.expansionMaxDistance - AI_CONFIG.expansionMinDistance);
      
      targetX = dropPod.x + Math.cos(angle) * distance;
      targetY = dropPod.y + Math.sin(angle) * distance;
      
      strategy = 'RANDOM_EXPANSION';
    }
  }

  // Vérifier que la position est valide (dans le canvas et à portée)
  if (targetX < 0 || targetY < 0) {
    console.log('[AI] Target position out of bounds, skipping');
    return;
  }

  // Calculer la portée avec bonus adaptatif
  const rangeBonus = calculateAIRangeBonus(playerSaturation);
  const effectiveRange = MAX_PLACEMENT_RANGE + rangeBonus;

  if (!isInRange(targetX, targetY, 'enemy')) {
    // Ajuster la position pour être à portée
    const closest = findClosestAllyNode(targetX, targetY, 'enemy');
    if (!closest) {
      console.log('[AI] No ally node in range, skipping');
      return;
    }
    
    // Placer à portée maximale (avec bonus) depuis le nœud allié le plus proche
    const angle = Math.atan2(targetY - closest.y, targetX - closest.x);
    targetX = closest.x + Math.cos(angle) * effectiveRange;
    targetY = closest.y + Math.sin(angle) * effectiveRange;
  }

  // Calculer le coût
  const cost = calculatePlacementCost(targetX, targetY, 'enemy');
  
  // L'IA a une énergie illimitée (pour simplifier)
  // En production, on pourrait ajouter une gestion d'énergie pour l'IA

  // Trouver le nœud allié le plus proche pour la ligne prédictive
  const closest = findClosestAllyNode(targetX, targetY, 'enemy');
  if (!closest) {
    console.log('[AI] No closest ally node found, skipping');
    return;
  }

  console.log(`[AI] ${strategy}: Placing node at (${targetX.toFixed(0)}, ${targetY.toFixed(0)}) for ${cost} energy`);

  // Lancer l'animation "Seringue"
  initiateSyringeAnimation(closest.x, closest.y, targetX, targetY, 'enemy', () => {
    // Callback : créer le nœud à l'impact
    const newNode = createNode(targetX, targetY, 'enemy');
    if (!newNode) {
      console.warn('[AI] Failed to create node');
    } else {
      console.log(`[AI] Node created at (${targetX.toFixed(0)}, ${targetY.toFixed(0)})`);
      
      // Jouer le son de capture si le nœud est proche d'un nœud joueur
      const playerNodes = getNodesByOwner('player');
      const nearbyPlayerNode = playerNodes.find(n => {
        const dx = n.x - targetX;
        const dy = n.y - targetY;
        return Math.sqrt(dx * dx + dy * dy) < AI_CONFIG.captureSoundDistance;
      });
      
      if (nearbyPlayerNode) {
        playNodeCapture(); // Son de capture si proche d'un nœud joueur
      }
    }
  });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise l'IA (le Drop-Pod est déjà créé par initNodeSystem)
 */
export function initAI(): void {
  const dropPod = getDropPod('enemy');
  if (dropPod) {
    console.log(`[AI] Drop-Pod initialized at (${dropPod.x.toFixed(0)}, ${dropPod.y.toFixed(0)})`);
  } else {
    console.warn('[AI] Drop-Pod not found');
  }
}

/**
 * Met à jour les dimensions du canvas pour l'IA (pour calcul saturation)
 */
export function updateAICanvasDimensions(width: number, height: number): void {
  canvasWidth = width;
  canvasHeight = height;
}
