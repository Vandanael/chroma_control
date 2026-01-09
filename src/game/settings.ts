/**
 * Settings System - Gestion des paramètres utilisateur
 * Toggle pour afficher/masquer les lignes de connexion
 */

// =============================================================================
// STATE
// =============================================================================

interface GameSettings {
  showConnections: boolean; // Afficher les lignes de connexion permanentes
}

const defaultSettings: GameSettings = {
  showConnections: true, // Activé par défaut pour clarté
};

let currentSettings: GameSettings = { ...defaultSettings };

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Obtient les paramètres actuels
 */
export function getSettings(): GameSettings {
  return { ...currentSettings };
}

/**
 * Met à jour un paramètre
 */
export function setSetting<K extends keyof GameSettings>(
  key: K,
  value: GameSettings[K]
): void {
  currentSettings[key] = value;
  
  // Sauvegarder dans localStorage
  try {
    localStorage.setItem('chromaControl_settings', JSON.stringify(currentSettings));
  } catch (e) {
    console.warn('[Settings] Failed to save to localStorage:', e);
  }
  
  console.log(`[Settings] ${key} = ${value}`);
}

/**
 * Charge les paramètres depuis localStorage
 */
export function loadSettings(): void {
  try {
    const saved = localStorage.getItem('chromaControl_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      currentSettings = { ...defaultSettings, ...parsed };
      console.log('[Settings] Loaded from localStorage:', currentSettings);
    }
  } catch (e) {
    console.warn('[Settings] Failed to load from localStorage:', e);
    currentSettings = { ...defaultSettings };
  }
}

/**
 * Réinitialise les paramètres aux valeurs par défaut
 */
export function resetSettings(): void {
  currentSettings = { ...defaultSettings };
  try {
    localStorage.removeItem('chromaControl_settings');
  } catch (e) {
    console.warn('[Settings] Failed to clear localStorage:', e);
  }
}

// Charger les paramètres au démarrage
if (typeof window !== 'undefined') {
  loadSettings();
}
