/**
 * Flux System - Ressource de combat pour actions tactiques
 * Le FLUX est généré par les nœuds et consommé pour les actions de combat
 */

import { RESOURCES_CONFIG } from '../config';

// =============================================================================
// CONSTANTS
// =============================================================================

const FLUX_MAX = RESOURCES_CONFIG.fluxMax;
const FLUX_INITIAL = RESOURCES_CONFIG.fluxInitial;
const FLUX_REGEN_PER_SECOND = RESOURCES_CONFIG.fluxRegenPerSecond;
const FLUX_PER_NODE = RESOURCES_CONFIG.fluxPerNode;

// =============================================================================
// STATE
// =============================================================================

interface FluxState {
  current: number;
  max: number;
}

const flux: FluxState = {
  current: FLUX_INITIAL,
  max: FLUX_MAX,
};

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Obtient l'état actuel du FLUX
 */
export function getFlux(): FluxState {
  return { ...flux };
}

/**
 * Régénère le FLUX (appelé chaque frame)
 */
export function regenFlux(deltaSeconds: number, nodeCount: number): void {
  if (deltaSeconds <= 0) return;
  
  const passiveRegen = FLUX_REGEN_PER_SECOND * deltaSeconds;
  const nodeRegen = nodeCount * FLUX_PER_NODE * deltaSeconds;
  const totalRegen = passiveRegen + nodeRegen;
  
  flux.current = Math.min(flux.max, flux.current + totalRegen);
}

/**
 * Consomme du FLUX pour une action
 */
export function spendFlux(amount: number): boolean {
  if (amount <= 0) return true;
  if (flux.current < amount) return false;
  flux.current -= amount;
  return true;
}

/**
 * Réinitialise le FLUX
 */
export function resetFlux(): void {
  flux.current = FLUX_INITIAL;
}
