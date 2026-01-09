/**
 * Game Constants - Bio-Digital Edition
 * Couleurs et constantes pour le rendu "Bio-Network"
 */

export const COLORS = {
  // Background
  BACKGROUND: '#121214', // Deep Space
  
  // Players (couleurs sélectionnables)
  PLAYER_CYAN: '#00F3FF',   // Cyan Électrique
  PLAYER_GREEN: '#00FF88',  // Vert Électrique
  PLAYER_AMBER: '#FFAA00',  // Ambre Électrique
  PLAYER: '#00F3FF',        // Par défaut (Cyan)
  ENEMY: '#FF0055',         // Magenta Vif
  NEUTRAL: '#2A2A2E',       // Gris neutre
  
  // UI
  HUD_BACKGROUND: '#222222', // Gris Technique
  ENERGY: '#FFD700',     // Jaune Solaire
} as const;

export type PlayerColor = 'CYAN' | 'GREEN' | 'AMBER';

export function getPlayerColor(color: PlayerColor): string {
  switch (color) {
    case 'CYAN':
      return COLORS.PLAYER_CYAN;
    case 'GREEN':
      return COLORS.PLAYER_GREEN;
    case 'AMBER':
      return COLORS.PLAYER_AMBER;
    default:
      return COLORS.PLAYER_CYAN;
  }
}
