/**
 * Narrative System - Lore & World Building
 * Messages cohérents pour l'univers de Chroma Control
 */

import { PlayerColor } from '../game/constants';

// =============================================================================
// TERMINOLOGIE COHÉRENTE
// =============================================================================

/**
 * Termes canoniques de l'univers :
 * - Signal : L'énergie vitale qui traverse le réseau
 * - Chroma : La couleur/essence du joueur (Cyan, Green, Amber)
 * - Inertie : La résistance du vide (Grey) à la propagation du Signal
 * - Masse : La densité du réseau (nombre de nœuds interconnectés)
 */

// =============================================================================
// MESSAGES DE CHARGEMENT (LORE)
// =============================================================================

export const LOADING_MESSAGES: string[] = [
  'The Grey is not a color, it is a void. Restore the Signal.',
  'Chroma flows where Signal reaches. Expand the network.',
  'Inertia resists. Mass amplifies. Signal conquers.',
  'Each node strengthens the Signal. Each connection reduces Inertia.',
  'The void consumes what Signal cannot reach. Stay connected.',
  'Chroma is essence. Signal is life. Network is power.',
  'Distance weakens Signal. Density amplifies Chroma.',
  'The Grey waits. The Signal must flow. The Chroma must spread.',
];

/**
 * Retourne un message de chargement aléatoire
 */
export function getRandomLoadingMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

// =============================================================================
// MESSAGES DE VICTOIRE (70% SATURATION)
// =============================================================================

export interface VictoryMessage {
  title: string;
  message: string;
  color: string;
}

/**
 * Messages de victoire spécifiques à chaque Chroma
 */
export function getVictoryMessage(chroma: PlayerColor): VictoryMessage {
  switch (chroma) {
    case 'CYAN':
      return {
        title: 'CYAN DOMINION',
        message: 'The Azure Signal has saturated the void.<br />The Grey retreats. The network breathes.',
        color: '#00F3FF',
      };
    
    case 'GREEN':
      return {
        title: 'VERIDIAN CONQUEST',
        message: 'The Emerald Signal has claimed the void.<br />Life flows through every connection.',
        color: '#00FF88',
      };
    
    case 'AMBER':
      return {
        title: 'GOLDEN ASCENSION',
        message: 'The Amber Signal has illuminated the void.<br />The network burns eternal.',
        color: '#FFAA00',
      };
    
    default:
      return {
        title: 'SIGNAL DOMINION',
        message: 'The Signal has saturated the void.<br />The network is complete.',
        color: '#00F3FF',
      };
  }
}

// =============================================================================
// MESSAGES DE DÉFAITE
// =============================================================================

export const DEFEAT_MESSAGE = {
  title: 'SIGNAL LOST',
  message: 'The Grey consumed the network.<br />Inertia won. The Signal faded.',
  color: '#FF0055',
};

// =============================================================================
// MESSAGES CONTEXTUELS
// =============================================================================

export const CONTEXT_MESSAGES = {
  TOO_FAR: 'TOO FAR FROM SIGNAL',
  PLACE_NODE: 'PLACE NODE',
  NETWORK_GROWING: 'Network expanding...',
  SIGNAL_STRENGTHENING: 'Signal strengthening...',
  INERTIA_DECREASING: 'Inertia decreasing...',
};

// =============================================================================
// MESSAGES D'ORBIT VIEW
// =============================================================================

export function getOrbitViewMessage(chroma: PlayerColor): string {
  switch (chroma) {
    case 'CYAN':
      return 'The Azure Signal reaches beyond the planet.<br />The solar system awaits.';
    case 'GREEN':
      return 'The Emerald Signal extends to the stars.<br />Life spreads across the void.';
    case 'AMBER':
      return 'The Golden Signal illuminates the cosmos.<br />The network expands to infinity.';
    default:
      return 'The Signal reaches beyond the planet.<br />The solar system awaits.';
  }
}
