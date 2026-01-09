/**
 * Double-Tap Burst System
 * Double-clic sur un nœud : onde de choc qui repousse l'influence ennemie
 * et désactive les nœuds adverses touchés pendant 3 secondes
 */

import { type GameNode, getAllNodes, getNodesByOwner, getNodeById } from './nodeManager';
import { spendFlux, getFlux } from './fluxSystem';

// =============================================================================
// CONSTANTS
// =============================================================================

const DOUBLE_TAP_WINDOW = 400; // 400ms pour détecter le double-tap
const BURST_COST = 30; // Coût en FLUX
const BURST_RADIUS = 250; // Rayon de l'onde de choc
const DISABLE_DURATION = 3000; // 3 secondes de désactivation
const BURST_SPEED = 800; // Vitesse de propagation (px/s)

// =============================================================================
// STATE
// =============================================================================

interface DoubleTapState {
  nodeId: string | null;
  timestamp: number;
}

let doubleTapState: DoubleTapState = {
  nodeId: null,
  timestamp: 0,
};

interface DisabledNode {
  nodeId: string;
  disabledUntil: number;
}

const disabledNodes: DisabledNode[] = [];

interface BurstWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  timestamp: number;
}

const activeBursts: BurstWave[] = [];

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Gère un clic sur un nœud (détecte le double-tap)
 * Retourne true si un double-tap a été détecté et traité
 */
export function handleNodeClick(nodeId: string, owner: 'player' | 'enemy'): boolean {
  const now = performance.now();
  
  // Vérifier si c'est un double-tap sur le même nœud
  if (
    doubleTapState.nodeId === nodeId &&
    now - doubleTapState.timestamp < DOUBLE_TAP_WINDOW &&
    owner === 'player'
  ) {
    // Double-tap détecté !
    triggerBurst(nodeId);
    doubleTapState = { nodeId: null, timestamp: 0 }; // Reset
    
    // Marquer le tutoriel comme complété
    import('../ui/doubleTapTutorial').then(({ markTutorialCompleted }) => {
      markTutorialCompleted();
    });
    
    return true;
  }
  
  // Enregistrer le premier tap
  doubleTapState = { nodeId, timestamp: now };
  return false;
}

/**
 * Déclenche une onde de choc depuis un nœud
 */
function triggerBurst(nodeId: string): void {
  // Vérifier le coût en FLUX
  if (!spendFlux(BURST_COST)) {
    console.warn(`[DoubleTapBurst] Insufficient FLUX: ${getFlux().current}/${BURST_COST}`);
    // Afficher feedback visuel FLUX insuffisant
    import('../ui/fluxUI').then(({ showInsufficientFluxFeedback }) => {
      showInsufficientFluxFeedback();
    });
    return;
  }
  
  const node = getNodeById(nodeId);
  if (!node || node.owner !== 'player') return;
  
  const now = performance.now();
  
  // Créer l'onde de choc
  activeBursts.push({
    x: node.x,
    y: node.y,
    radius: 0,
    maxRadius: BURST_RADIUS,
    timestamp: now,
  });
  
  // Désactiver les nœuds ennemis touchés
  const enemyNodes = getNodesByOwner('enemy');
  for (const enemyNode of enemyNodes) {
    const dx = enemyNode.x - node.x;
    const dy = enemyNode.y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= BURST_RADIUS) {
      // Désactiver le nœud
      const existing = disabledNodes.find(d => d.nodeId === enemyNode.id);
      if (existing) {
        existing.disabledUntil = now + DISABLE_DURATION;
      } else {
        disabledNodes.push({
          nodeId: enemyNode.id,
          disabledUntil: now + DISABLE_DURATION,
        });
      }
    }
  }
  
  console.log(`[DoubleTapBurst] Burst triggered from node ${nodeId}, ${disabledNodes.length} enemies disabled`);
}

/**
 * Met à jour les ondes de choc actives
 */
export function updateBurstWaves(deltaSeconds: number): void {
  const now = performance.now();
  
  for (let i = activeBursts.length - 1; i >= 0; i--) {
    const burst = activeBursts[i];
    
    // Propager l'onde
    burst.radius += BURST_SPEED * deltaSeconds;
    
    // Supprimer si l'onde a atteint son rayon max
    if (burst.radius >= burst.maxRadius) {
      activeBursts.splice(i, 1);
    }
  }
  
  // Nettoyer les désactivations expirées
  for (let i = disabledNodes.length - 1; i >= 0; i--) {
    if (now >= disabledNodes[i].disabledUntil) {
      disabledNodes.splice(i, 1);
    }
  }
}

/**
 * Vérifie si un nœud est désactivé
 */
export function isNodeDisabled(nodeId: string): boolean {
  return disabledNodes.some(d => d.nodeId === nodeId);
}

/**
 * Obtient les ondes de choc actives (pour le rendu)
 */
export function getActiveBursts(): BurstWave[] {
  return [...activeBursts];
}

/**
 * Nettoie toutes les ondes et désactivations (pour reset)
 */
export function clearBursts(): void {
  activeBursts.length = 0;
  disabledNodes.length = 0;
  doubleTapState = { nodeId: null, timestamp: 0 };
}
