/**
 * Player Color Management
 * Gère la couleur sélectionnée par le joueur
 */

import { PlayerColor, getPlayerColor } from './constants';

// =============================================================================
// STATE
// =============================================================================

let selectedColor: PlayerColor = 'CYAN'; // Par défaut

// =============================================================================
// API
// =============================================================================

/**
 * Définit la couleur du joueur
 */
export function setPlayerColor(color: PlayerColor): void {
  selectedColor = color;
  console.log(`[PlayerColor] Color set to ${color}`);
}

/**
 * Récupère la couleur du joueur
 */
export function getPlayerColorValue(): string {
  return getPlayerColor(selectedColor);
}

/**
 * Récupère le type de couleur sélectionné
 */
export function getSelectedColorType(): PlayerColor {
  return selectedColor;
}
