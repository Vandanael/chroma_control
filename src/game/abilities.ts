/**
 * Abilities System - BLOC 3.1
 * Système de cooldown pour les capacités actives (disruptor pulse)
 */

import { type GameNode } from './nodeManager';

// =============================================================================
// CONSTANTS
// =============================================================================

const DISRUPTOR_PULSE_COOLDOWN = 30000; // 30 secondes
const DISRUPTOR_PULSE_RANGE = 200; // Portée du pulse en px

// =============================================================================
// STATE
// =============================================================================

interface AbilityState {
  lastUsed: number; // Timestamp de la dernière utilisation
  cooldown: number; // Cooldown en ms
}

const abilityStates = new Map<string, AbilityState>(); // nodeId -> AbilityState

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Vérifie si une capacité est disponible (cooldown terminé)
 */
export function isAbilityReady(nodeId: string): boolean {
  const state = abilityStates.get(nodeId);
  if (!state) return true; // Première utilisation
  
  const elapsed = performance.now() - state.lastUsed;
  return elapsed >= state.cooldown;
}

/**
 * Utilise une capacité (déclenche le cooldown)
 */
export function useAbility(nodeId: string, cooldown: number = DISRUPTOR_PULSE_COOLDOWN): void {
  abilityStates.set(nodeId, {
    lastUsed: performance.now(),
    cooldown,
  });
}

/**
 * Récupère le progrès du cooldown (0-1)
 */
export function getCooldownProgress(nodeId: string): number {
  const state = abilityStates.get(nodeId);
  if (!state) return 1; // Prêt
  
  const elapsed = performance.now() - state.lastUsed;
  const progress = Math.min(1, elapsed / state.cooldown);
  return progress;
}

/**
 * Récupère le temps restant en secondes
 */
export function getCooldownRemaining(nodeId: string): number {
  const state = abilityStates.get(nodeId);
  if (!state) return 0;
  
  const elapsed = performance.now() - state.lastUsed;
  const remaining = Math.max(0, (state.cooldown - elapsed) / 1000);
  return remaining;
}

/**
 * Réinitialise le cooldown d'un nœud (quand il est supprimé)
 */
export function resetAbility(nodeId: string): void {
  abilityStates.delete(nodeId);
}

/**
 * Récupère la portée du pulse disruptor
 */
export function getDisruptorPulseRange(): number {
  return DISRUPTOR_PULSE_RANGE;
}
