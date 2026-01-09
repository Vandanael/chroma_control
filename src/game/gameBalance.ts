/**
 * Game Balance - Équilibrage mathématique
 * Courbes de progression, difficulté adaptative, scoring
 */

import { getNodesByOwner, getSignalRangeBonusAt, type GameNode } from './nodeManager';
import { calculateSaturation } from './saturationSystem';
import { SIGNAL_CONFIG, AI_CONFIG, SCORING_CONFIG, VICTORY_CONFIG } from '../config';

// =============================================================================
// SIGNAL RANGE CURVE (Pression Chromatique)
// =============================================================================

/**
 * Calcule la densité du maillage autour d'un nœud
 * Plus le maillage est dense, plus la pression chromatique augmente
 */
function calculateMeshDensity(owner: 'player' | 'enemy'): number {
  const nodes = getNodesByOwner(owner);
  if (nodes.length === 0) return 0;

  let totalConnections = 0;
  for (const node of nodes) {
    totalConnections += node.connections.length;
  }

  // Densité = nombre moyen de connexions par nœud
  const avgConnections = totalConnections / nodes.length;
  
  // Normaliser entre 0 et 1 (max connexions par nœud = densité max)
  return Math.min(1, avgConnections / SIGNAL_CONFIG.maxDensityForNormalization);
}

/**
 * Calcule la portée du signal avec pression chromatique
 * Plus le maillage est dense, plus la portée augmente (courbe exponentielle)
 */
export function calculateSignalRangeWithPressure(owner: 'player' | 'enemy'): number {
  const nodes = getNodesByOwner(owner);
  const nodeCount = nodes.length;
  const meshDensity = calculateMeshDensity(owner);

  const BASE_RANGE = SIGNAL_CONFIG.baseRange;
  const nodeBonus = nodeCount * SIGNAL_CONFIG.rangeBonusPerNode;
  const pressureBonus = Math.pow(meshDensity, SIGNAL_CONFIG.pressureExponent) * SIGNAL_CONFIG.maxPressureBonus;
  const totalRange = BASE_RANGE + nodeBonus + pressureBonus;
  return Math.min(SIGNAL_CONFIG.maxRange, totalRange);
}

// =============================================================================
// AI DIFFICULTY SCALING
// =============================================================================

/**
 * Calcule le délai d'action de l'IA selon la saturation du joueur
 * Plus le joueur progresse, plus l'IA devient agressive
 */
export function calculateAIActionDelay(playerSaturation: number): number {
  const BASE_DELAY = AI_CONFIG.baseActionDelay;
  const MIN_DELAY = AI_CONFIG.minActionDelay;
  
  // Après le seuil de saturation, l'IA accélère progressivement
  if (playerSaturation < AI_CONFIG.aggressiveThreshold) {
    return BASE_DELAY;
  }
  
  // Courbe d'accélération : saturation seuil → 1.0 = délai BASE → MIN
  const saturationAboveThreshold = (playerSaturation - AI_CONFIG.aggressiveThreshold) / (1 - AI_CONFIG.aggressiveThreshold);
  const delayReduction = saturationAboveThreshold * (BASE_DELAY - MIN_DELAY);
  
  return BASE_DELAY - delayReduction;
}

/**
 * Calcule le bonus de portée pour l'IA selon la saturation du joueur
 * L'IA devient plus agressive et peut placer plus loin
 */
export function calculateAIRangeBonus(playerSaturation: number): number {
  if (playerSaturation < AI_CONFIG.aggressiveThreshold) {
    return 0;
  }
  
  // Bonus progressif selon saturation
  const saturationAboveThreshold = (playerSaturation - AI_CONFIG.aggressiveThreshold) / (1 - AI_CONFIG.aggressiveThreshold);
  return saturationAboveThreshold * AI_CONFIG.maxRangeBonus;
}

// =============================================================================
// NODE VULNERABILITY (Pour ciblage IA)
// =============================================================================

/**
 * Calcule la vulnérabilité d'un nœud (faible = peu de connexions)
 * Utilisé par l'IA pour cibler les points faibles
 */
export function calculateNodeVulnerability(node: GameNode): number {
  // Vulnérabilité = 1 / (nombre de connexions + 1)
  // Moins de connexions = plus vulnérable
  const connectionCount = node.connections.length;
  return 1 / (connectionCount + 1);
}

/**
 * Trouve les nœuds les plus vulnérables (cibles prioritaires pour l'IA)
 */
export function findVulnerableNodes(owner: 'player' | 'enemy', maxResults: number = 5): GameNode[] {
  const nodes = getNodesByOwner(owner);
  
  // Filtrer les Drop-Pods (toujours protégés)
  const regularNodes = nodes.filter(n => !n.isDropPod);
  
  // Trier par vulnérabilité (plus vulnérable en premier)
  const sorted = regularNodes.sort((a, b) => {
    const vulnA = calculateNodeVulnerability(a);
    const vulnB = calculateNodeVulnerability(b);
    return vulnB - vulnA; // Descendant
  });
  
  return sorted.slice(0, maxResults);
}

// =============================================================================
// SCORING SYSTEM
// =============================================================================

export interface DetailedScore {
  // Points de base
  nodesOwned: number;           // Nombre de nœuds possédés
  networkDensity: number;       // Densité du réseau (connexions/nœud)
  territoryCoverage: number;    // Pourcentage de couverture (0-1)
  
  // Bonus
  densityBonus: number;         // Bonus pour réseau dense
  coverageBonus: number;         // Bonus pour couverture élevée
  survivalBonus: number;        // Bonus si tous les nœuds connectés
  
  // Score total
  totalScore: number;
  
  // Raison de défaite (si applicable)
  defeatReason?: string;
}

/**
 * Calcule un score détaillé pour le joueur
 */
export function calculateDetailedScore(
  owner: 'player' | 'enemy',
  canvasWidth: number,
  canvasHeight: number
): DetailedScore {
  const nodes = getNodesByOwner(owner);
  const coverage = calculateSaturation(owner, canvasWidth, canvasHeight);
  
  // Densité du réseau
  let totalConnections = 0;
  for (const node of nodes) {
    totalConnections += node.connections.length;
  }
  const density = nodes.length > 0 ? totalConnections / nodes.length : 0;
  
  // Points de base
  const nodesOwned = nodes.length;
  const networkDensity = density;
  
  // Bonus densité (réseau bien connecté)
  const densityBonus = Math.floor(density * SCORING_CONFIG.densityScoreMultiplier);
  
  // Bonus couverture (territoire contrôlé)
  const coverageBonus = Math.floor(coverage * SCORING_CONFIG.maxCoverageScore);
  
  // Bonus survie (tous les nœuds connectés au Drop-Pod)
  const isolatedNodes = nodes.filter(n => n.isIsolated && !n.isDropPod).length;
  const survivalBonus = isolatedNodes === 0 ? SCORING_CONFIG.survivalBonus : 0;
  
  // Score total
  const totalScore = nodesOwned * SCORING_CONFIG.pointsPerNode + densityBonus + coverageBonus + survivalBonus;
  
  return {
    nodesOwned,
    networkDensity: Math.round(networkDensity * 10) / 10,
    territoryCoverage: Math.round(coverage * 100), // Utilisé dans le return
    densityBonus,
    coverageBonus,
    survivalBonus,
    totalScore,
  };
}

/**
 * Détermine la raison de la défaite
 */
export function getDefeatReason(
  playerNodes: number,
  _enemyNodes: number,
  playerSaturation: number,
  enemySaturation: number,
  playerIsolated: number
): string {
  // Plus de nœuds joueur
  if (playerNodes === 0) {
    return 'Tous vos nœuds ont été détruits. Le Signal a été perdu.';
  }
  
  // Saturation ennemie
  if (enemySaturation >= VICTORY_CONFIG.saturationThreshold) {
    return `L'ennemi a saturé la planète à ${VICTORY_CONFIG.saturationThreshold * 100}%. Le Signal a été submergé.`;
  }
  
  // Trop de nœuds isolés
  if (playerIsolated > playerNodes * 0.5) {
    return 'Plus de 50% de vos nœuds ont été isolés. Le Cordon a été rompu.';
  }
  
  // Saturation inférieure
  if (playerSaturation < enemySaturation * 0.5) {
    return 'Votre territoire est trop faible face à l\'expansion ennemie.';
  }
  
  // Par défaut
  return 'Le Signal a été perdu. Analysez votre stratégie et réessayez.';
}
