/**
 * Security Utilities - Sanitisation et validation des entrées
 * Protection contre XSS, injection et manipulation de données
 */

// =============================================================================
// VALIDATION DES ENTRÉES
// =============================================================================

/**
 * Liste blanche des couleurs de joueur autorisées
 */
const VALID_PLAYER_COLORS: readonly string[] = ['CYAN', 'GREEN', 'AMBER'] as const;

/**
 * Valide et sanitise le choix de couleur du joueur
 * @param color - Couleur à valider
 * @returns Couleur validée ou null si invalide
 */
export function validatePlayerColor(color: unknown): 'CYAN' | 'GREEN' | 'AMBER' | null {
  if (typeof color !== 'string') return null;
  
  // Vérifier que la couleur est dans la liste blanche
  if (!VALID_PLAYER_COLORS.includes(color as any)) {
    console.warn('[Security] Invalid player color:', color);
    return null;
  }
  
  return color as 'CYAN' | 'GREEN' | 'AMBER';
}

/**
 * Valide et sanitise les coordonnées de clic/touch
 * @param x - Coordonnée X
 * @param y - Coordonnée Y
 * @param maxX - Largeur maximale du canvas
 * @param maxY - Hauteur maximale du canvas
 * @returns Coordonnées validées ou null si invalides
 */
export function validateCoordinates(
  x: unknown,
  y: unknown,
  maxX: number,
  maxY: number
): { x: number; y: number } | null {
  // Vérifier que les valeurs sont des nombres
  if (typeof x !== 'number' || typeof y !== 'number') {
    console.warn('[Security] Invalid coordinate types:', typeof x, typeof y);
    return null;
  }
  
  // Vérifier que les valeurs sont finies (pas NaN, Infinity, etc.)
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    console.warn('[Security] Non-finite coordinates:', x, y);
    return null;
  }
  
  // Vérifier que les coordonnées sont dans les limites du canvas
  if (x < 0 || y < 0 || x > maxX || y > maxY) {
    console.warn('[Security] Coordinates out of bounds:', x, y, maxX, maxY);
    return null;
  }
  
  return { x, y };
}

/**
 * Valide un état de jeu
 * @param state - État à valider
 * @returns État validé ou null si invalide
 */
export function validateGameState(state: unknown): 'START' | 'PLAYING' | 'GAME_OVER' | 'REPLAY' | null {
  const validStates = ['START', 'PLAYING', 'GAME_OVER', 'REPLAY'] as const;
  
  if (typeof state !== 'string') return null;
  
  if (!validStates.includes(state as any)) {
    console.warn('[Security] Invalid game state:', state);
    return null;
  }
  
  return state as 'START' | 'PLAYING' | 'GAME_OVER' | 'REPLAY';
}

/**
 * Valide un montant d'énergie (doit être positif et fini)
 * @param amount - Montant à valider
 * @returns Montant validé ou null si invalide
 */
export function validateEnergyAmount(amount: unknown): number | null {
  if (typeof amount !== 'number') return null;
  
  if (!Number.isFinite(amount) || amount < 0) {
    console.warn('[Security] Invalid energy amount:', amount);
    return null;
  }
  
  return amount;
}

/**
 * Valide un delta de temps (doit être positif et fini)
 * @param delta - Delta à valider
 * @returns Delta validé ou null si invalide
 */
export function validateDeltaTime(delta: unknown): number | null {
  if (typeof delta !== 'number') return null;
  
  if (!Number.isFinite(delta) || delta < 0 || delta > 1) {
    // Delta ne peut pas être > 1 seconde (protection contre manipulation)
    console.warn('[Security] Invalid delta time:', delta);
    return null;
  }
  
  return delta;
}

// =============================================================================
// SANITISATION HTML/TEXT
// =============================================================================

/**
 * Échappe les caractères HTML pour prévenir XSS
 * @param text - Texte à échapper
 * @returns Texte échappé
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitise un attribut HTML (pour data-* attributes)
 * @param value - Valeur à sanitiser
 * @returns Valeur sanitée
 */
export function sanitizeAttribute(value: unknown): string {
  if (typeof value !== 'string') return '';
  
  // Supprimer les caractères dangereux
  return value.replace(/[<>'"&]/g, '');
}

/**
 * Valide et sanitise un ID de nœud
 * @param nodeId - ID à valider
 * @returns ID validé ou null si invalide
 */
export function validateNodeId(nodeId: unknown): string | null {
  if (typeof nodeId !== 'string') return null;
  
  // Format attendu : "node_123" (lettres, chiffres, underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(nodeId)) {
    console.warn('[Security] Invalid node ID format:', nodeId);
    return null;
  }
  
  return nodeId;
}

// =============================================================================
// PROTECTION CONTRE LA MANIPULATION
// =============================================================================

/**
 * Vérifie si une valeur numérique a été modifiée de manière suspecte
 * @param value - Valeur à vérifier
 * @param min - Valeur minimale attendue
 * @param max - Valeur maximale attendue
 * @returns true si la valeur est valide
 */
export function isValueInRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Clamp une valeur dans une plage donnée (protection contre overflow)
 * @param value - Valeur à clamp
 * @param min - Minimum
 * @param max - Maximum
 * @returns Valeur clampée
 */
export function clampValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
