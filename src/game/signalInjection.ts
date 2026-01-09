/**
 * Signal Injection System - Injection de signal au clic sur nœud allié
 * L'aura gonfle et devient plus opaque, grignotant le territoire ennemi
 */

import { type GameNode, getAllNodes, getNodesByOwner } from './nodeManager';
import { getPlayerColorValue } from './playerColor';
import { COLORS } from './game/constants';

// =============================================================================
// CONSTANTS
// =============================================================================

const INJECTION_DURATION = 2000; // 2 secondes d'effet
const AURA_BOOST_MULTIPLIER = 1.5; // L'aura gonfle de 50%
const OPACITY_BOOST = 0.3; // Augmentation d'opacité
const TERRITORY_ERASE_RADIUS = 150; // Rayon d'effacement du territoire ennemi

// =============================================================================
// STATE
// =============================================================================

interface SignalInjection {
  nodeId: string;
  timestamp: number;
  initialAuraRadius: number;
}

const activeInjections: SignalInjection[] = [];

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Injecte du signal dans un nœud allié
 * L'aura gonfle et devient plus opaque
 */
export function injectSignal(nodeId: string): void {
  const now = performance.now();
  
  // Vérifier si une injection est déjà active sur ce nœud
  const existing = activeInjections.find(inj => inj.nodeId === nodeId);
  if (existing) {
    // Réinitialiser le timestamp pour prolonger l'effet
    existing.timestamp = now;
    return;
  }
  
  // Trouver le nœud
  const nodes = getAllNodes();
  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.owner !== 'player') return;
  
  // Enregistrer l'injection
  activeInjections.push({
    nodeId,
    timestamp: now,
    initialAuraRadius: 120, // Rayon de base de l'aura
  });
  
  console.log(`[SignalInjection] Signal injected into node ${nodeId}`);
}

/**
 * Obtient le multiplicateur d'aura pour un nœud (si injection active)
 */
export function getAuraMultiplier(nodeId: string, now: number): number {
  const injection = activeInjections.find(inj => inj.nodeId === nodeId);
  if (!injection) return 1.0;
  
  const age = now - injection.timestamp;
  if (age >= INJECTION_DURATION) {
    // Nettoyer l'injection expirée
    const index = activeInjections.indexOf(injection);
    if (index > -1) {
      activeInjections.splice(index, 1);
    }
    return 1.0;
  }
  
  // Fade-out progressif sur les 500 dernières ms
  const fadeStart = INJECTION_DURATION - 500;
  if (age > fadeStart) {
    const fadeProgress = (age - fadeStart) / 500;
    return 1.0 + (AURA_BOOST_MULTIPLIER - 1.0) * (1 - fadeProgress);
  }
  
  return AURA_BOOST_MULTIPLIER;
}

/**
 * Obtient le boost d'opacité pour un nœud (si injection active)
 */
export function getOpacityBoost(nodeId: string, now: number): number {
  const injection = activeInjections.find(inj => inj.nodeId === nodeId);
  if (!injection) return 0;
  
  const age = now - injection.timestamp;
  if (age >= INJECTION_DURATION) return 0;
  
  // Fade-out progressif
  const fadeStart = INJECTION_DURATION - 500;
  if (age > fadeStart) {
    const fadeProgress = (age - fadeStart) / 500;
    return OPACITY_BOOST * (1 - fadeProgress);
  }
  
  return OPACITY_BOOST;
}

/**
 * Nettoie les injections expirées
 */
export function cleanupInjections(now: number): void {
  for (let i = activeInjections.length - 1; i >= 0; i--) {
    const injection = activeInjections[i];
    const age = now - injection.timestamp;
    if (age >= INJECTION_DURATION) {
      activeInjections.splice(i, 1);
    }
  }
}

/**
 * Nettoie toutes les injections (pour reset)
 */
export function clearInjections(): void {
  activeInjections.length = 0;
}
