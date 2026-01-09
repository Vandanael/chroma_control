/**
 * Game Phases System - BLOC 6.1 & 6.2
 * Early/Mid/Late game avec rythme distinct et modificateurs
 */

import { getTimer } from './state';

// =============================================================================
// TYPES
// =============================================================================

export type GamePhase = 'early' | 'mid' | 'late';

export interface PhaseModifiers {
  energyRegenMultiplier: number;  // Multiplicateur de régénération d'énergie
  costMultiplier: number;          // Multiplicateur des coûts (1.0 = normal)
}

// =============================================================================
// CONSTANTS
// =============================================================================

const EARLY_PHASE_DURATION = 60;   // 0-60s = early
const MID_PHASE_DURATION = 180;    // 60-180s = mid
// 180-300s = late

// =============================================================================
// PHASE DETECTION (BLOC 6.1)
// =============================================================================

/**
 * Détermine la phase actuelle du jeu basée sur le timer (BLOC 6.1)
 */
export function getCurrentGamePhase(): GamePhase {
  const timer = getTimer();
  const elapsed = 300 - timer.remaining; // Temps écoulé depuis le début
  
  if (elapsed < EARLY_PHASE_DURATION) {
    return 'early';
  } else if (elapsed < MID_PHASE_DURATION) {
    return 'mid';
  } else {
    return 'late';
  }
}

/**
 * Récupère le temps écoulé depuis le début (en secondes)
 */
export function getElapsedTime(): number {
  const timer = getTimer();
  return 300 - timer.remaining;
}

// =============================================================================
// PHASE MODIFIERS (BLOC 6.2)
// =============================================================================

/**
 * Récupère les modificateurs selon la phase actuelle (BLOC 6.2)
 */
export function getPhaseModifiers(phase: GamePhase): PhaseModifiers {
  switch (phase) {
    case 'early':
      return {
        energyRegenMultiplier: 1.5,  // +50% énergie regen
        costMultiplier: 0.8,         // -20% coûts
      };
    
    case 'mid':
      return {
        energyRegenMultiplier: 1.0,  // Normal
        costMultiplier: 1.0,         // Normal
      };
    
    case 'late':
      return {
        energyRegenMultiplier: 0.7,  // -30% énergie
        costMultiplier: 1.3,         // +30% coûts
      };
  }
}

/**
 * Récupère les modificateurs de la phase actuelle
 */
export function getCurrentPhaseModifiers(): PhaseModifiers {
  const phase = getCurrentGamePhase();
  return getPhaseModifiers(phase);
}
